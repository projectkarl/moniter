const { Readable } = require('node:stream');
const { fetchText, tag, xmlBlocks } = require('../server/_utils');

const registryCache = new Map();

const SOURCES = {
  freeway: { id: 'freeway', url: 'https://tisvcloud.freeway.gov.tw/history/motc20/CCTV.xml' },
  highway: { id: 'highway', url: 'https://cctv-maintain.thb.gov.tw/opendataCCTVs.xml' },
  'chiayi-city': { id: 'chiayi-city', url: 'https://117.56.103.67/MOTC_XML/XML/CCTV2_Info.ashx' },
};

function decodeXmlUrl(v = '') {
  return String(v).replace(/&amp;/g, '&').replace(/&#38;/g, '&').trim();
}

function parseStandardXml(xml, source) {
  return xmlBlocks(xml, 'CCTV').map((block, index) => ({
    id: `${source.id}:${tag(block, 'CCTVID') || index}`,
    streamUrl: decodeXmlUrl(tag(block, 'VideoStreamURL') || tag(block, 'videostreamurl') || tag(block, 'URL')),
  })).filter((x) => x.streamUrl);
}

async function resolveCamera(id) {
  const prefix = String(id || '').split(':')[0];
  const source = SOURCES[prefix];
  if (!source) throw new Error('Unknown CCTV source');
  const now = Date.now();
  let cached = registryCache.get(prefix);
  if (!cached || cached.expiresAt < now) {
    const xml = await fetchText(source.url, {}, 15000);
    cached = { items: parseStandardXml(xml, source), expiresAt: now + 6 * 60 * 60 * 1000 };
    registryCache.set(prefix, cached);
  }
  const camera = cached.items.find((x) => x.id === id);
  if (!camera) throw new Error('CCTV not found');
  return camera;
}

function safeHttpUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported CCTV protocol');
  return url;
}

function sameStreamHost(base, candidate) {
  return base.hostname.toLowerCase() === candidate.hostname.toLowerCase();
}

function proxyUrl(id, value) {
  return `/api/cctv-feed?id=${encodeURIComponent(id)}&resource=${encodeURIComponent(value)}`;
}

function rewritePlaylist(text, sourceUrl, id) {
  const base = new URL(sourceUrl);
  return String(text).split(/\r?\n/).map((line) => {
    if (!line) return line;
    if (line.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (_, uri) => {
        const abs = new URL(uri, base).toString();
        return `URI="${proxyUrl(id, abs)}"`;
      });
    }
    const abs = new URL(line.trim(), base).toString();
    return proxyUrl(id, abs);
  }).join('\n');
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(204).end();
    return;
  }
  const id = String(req.query.id || '');
  if (!id) return res.status(400).send('Missing CCTV id');

  try {
    const camera = await resolveCamera(id);
    const base = safeHttpUrl(camera.streamUrl);
    let target = base;
    if (req.query.resource) {
      const requested = safeHttpUrl(String(req.query.resource));
      if (!sameStreamHost(base, requested)) return res.status(403).send('CCTV resource host rejected');
      target = requested;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let upstream;
    try {
      upstream = await fetch(target.toString(), {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: {
          Accept: '*/*',
          'User-Agent': 'EYE-Taiwan/0.13 public-cctv-inline-proxy',
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if (!upstream.ok || !upstream.body) return res.status(502).send(`CCTV upstream HTTP ${upstream.status}`);

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const finalUrl = upstream.url || target.toString();
    const isPlaylist = /mpegurl|m3u8/i.test(contentType) || /\.m3u8(?:\?|$)/i.test(finalUrl);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (isPlaylist) {
      const text = await upstream.text();
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.status(200).send(rewritePlaylist(text, finalUrl, id));
      return;
    }

    res.setHeader('Content-Type', contentType);
    const length = upstream.headers.get('content-length');
    if (length) res.setHeader('Content-Length', length);
    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    res.statusCode = 200;
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    res.status(502).send(`CCTV inline feed unavailable: ${err.message}`);
  }
};
