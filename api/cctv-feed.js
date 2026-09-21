const { Readable } = require('node:stream');
const { resolveCamera } = require('../server/cctv-registry');

const mediaCache = new Map();

function safeHttpUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported CCTV protocol');
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(url.hostname)) throw new Error('Private CCTV host rejected');
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

function mediaKind(contentType = '', url = '') {
  const type = String(contentType).toLowerCase();
  const target = String(url).toLowerCase();
  if (/mpegurl|m3u8/.test(type) || /\.m3u8(?:\?|$)/.test(target)) return 'hls';
  if (/multipart\/x-mixed-replace/.test(type) || /\.(?:mjpg|mjpeg)(?:\?|$)/.test(target)) return 'mjpeg';
  if (/^image\//.test(type) || /\.(?:jpg|jpeg|png|webp)(?:\?|$)/.test(target)) return 'image';
  if (/^video\//.test(type) || /\.(?:mp4|webm)(?:\?|$)/.test(target)) return 'video';
  if (/text\/html/.test(type)) return 'html';
  return 'unknown';
}


function sniffKind(bytes) {
  if (!bytes || !bytes.length) return 'unknown';
  const head = Buffer.from(bytes).subarray(0, 512);
  const text = head.toString('utf8');
  if (/^#EXTM3U/m.test(text)) return 'hls';
  if (head[0] === 0xff && head[1] === 0xd8) return 'image';
  if (head.length > 12 && head.subarray(4, 8).toString('ascii') === 'ftyp') return 'video';
  return 'unknown';
}

function discoverMediaFromHtml(html, baseUrl) {
  const base = new URL(baseUrl);
  const candidates = [];
  const attrRe = /(?:src|href|data-src|data-url|data-stream|poster)\s*=\s*["']([^"']+)["']/ig;
  let m;
  while ((m = attrRe.exec(html))) candidates.push(m[1]);
  const rawRe = /(https?:\/\/[^"'\s<>\\]+(?:\.m3u8|\.mp4|\.webm|\.mjpg|\.mjpeg|\.jpg|\.jpeg|\.png)(?:\?[^"'\s<>\\]*)?)/ig;
  while ((m = rawRe.exec(html))) candidates.push(m[1]);
  const scored = [];
  for (const item of candidates) {
    try {
      const abs = new URL(String(item).replace(/&amp;/g, '&'), base);
      if (!['http:', 'https:'].includes(abs.protocol)) continue;
      const url = abs.toString();
      if (!/\.(?:m3u8|mp4|webm|mjpg|mjpeg|jpg|jpeg|png)(?:\?|$)/i.test(url)) continue;
      let score = 0;
      if (/\.m3u8(?:\?|$)/i.test(url)) score += 120;
      else if (/\.(?:mp4|webm)(?:\?|$)/i.test(url)) score += 100;
      else if (/\.(?:mjpg|mjpeg)(?:\?|$)/i.test(url)) score += 90;
      else if (/\.(?:jpg|jpeg)(?:\?|$)/i.test(url)) score += 55;
      else if (/\.png(?:\?|$)/i.test(url)) score += 25;
      if (/(?:cctv|camera|cam|stream|snapshot|live|traffic|video)/i.test(url)) score += 45;
      if (/(?:logo|icon|favicon|avatar|banner|ads?|sprite|brand)/i.test(url)) score -= 120;
      scored.push({ abs, score });
    } catch (_) {}
  }
  scored.sort((a,b) => b.score-a.score);
  return scored[0]?.score > 0 ? scored[0].abs : null;
}

async function fetchWithTimeout(url, opts = {}, timeout = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

async function resolveMediaTarget(camera) {
  const cached = mediaCache.get(camera.id);
  if (cached && cached.expiresAt > Date.now()) return cached;
  const original = safeHttpUrl(camera.streamUrl);
  const obviousKind = mediaKind('', original.toString());
  if (obviousKind !== 'unknown' && obviousKind !== 'html') {
    const direct = { url: original, kind: obviousKind, contentType:'', expiresAt: Date.now() + 30 * 60 * 1000 };
    mediaCache.set(camera.id, direct);
    return direct;
  }
  let response = await fetchWithTimeout(original.toString(), {
    headers: { Accept: '*/*', Range: 'bytes=0-65535', 'User-Agent': 'EYE-Taiwan/0.38 public-cctv-probe' },
  }, 6500);
  if (!response.ok) throw new Error(`CCTV upstream HTTP ${response.status}`);
  const finalUrl = safeHttpUrl(response.url || original.toString());
  const contentType = response.headers.get('content-type') || '';
  let kind = mediaKind(contentType, finalUrl.toString());
  let target = finalUrl;

  if (kind === 'html') {
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 1_500_000) throw new Error('CCTV wrapper page too large');
    const html = await response.text();
    const discovered = discoverMediaFromHtml(html, finalUrl);
    if (!discovered) throw new Error('No playable media found in CCTV wrapper');
    target = safeHttpUrl(discovered.toString());
    response = await fetchWithTimeout(target.toString(), {
      headers: { Accept: '*/*', Range: 'bytes=0-4095', 'User-Agent': 'EYE-Taiwan/0.38 public-cctv-probe' },
    }, 6000);
    if (!response.ok) throw new Error(`CCTV media HTTP ${response.status}`);
    kind = mediaKind(response.headers.get('content-type') || '', response.url || target.toString());
    target = safeHttpUrl(response.url || target.toString());
  } else if (kind === 'unknown') {
    try {
      const bytes = new Uint8Array(await response.arrayBuffer());
      kind = sniffKind(bytes);
    } catch (_) {}
  }

  try { await response.body?.cancel?.(); } catch (_) {}
  const out = { url: target, kind, contentType: response.headers.get('content-type') || contentType, expiresAt: Date.now() + 30 * 60 * 1000 };
  mediaCache.set(camera.id, out);
  return out;
}

function sendJson(res, code, value) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).send(JSON.stringify(value));
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
    const resolved = await resolveMediaTarget(camera);
    const base = safeHttpUrl(resolved.url.toString());

    if (String(req.query.probe || '') === '1') {
      return sendJson(res, 200, {
        id,
        kind: resolved.kind,
        contentType: resolved.contentType,
        proxied: true,
      });
    }

    let target = base;
    if (req.query.resource) {
      const requested = safeHttpUrl(String(req.query.resource));
      if (!sameStreamHost(base, requested)) return res.status(403).send('CCTV resource host rejected');
      target = requested;
    }

    const headers = {
      Accept: '*/*',
      'User-Agent': 'EYE-Taiwan/0.38 public-cctv-inline-proxy',
    };
    if (req.headers?.range) headers.Range = req.headers.range;
    const upstream = await fetchWithTimeout(target.toString(), { headers }, 12000);
    if (!upstream.ok || !upstream.body) return res.status(502).send(`CCTV upstream HTTP ${upstream.status}`);

    const finalUrl = safeHttpUrl(upstream.url || target.toString());
    if (!sameStreamHost(target, finalUrl)) return res.status(403).send('CCTV redirect host rejected');
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const isPlaylist = /mpegurl|m3u8/i.test(contentType) || /\.m3u8(?:\?|$)/i.test(finalUrl.toString());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (isPlaylist) {
      const text = await upstream.text();
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.status(200).send(rewritePlaylist(text, finalUrl.toString(), id));
      return;
    }

    res.setHeader('Content-Type', contentType);
    for (const h of ['content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
      const value = upstream.headers.get(h);
      if (value) res.setHeader(h.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join('-'), value);
    }
    res.statusCode = upstream.status;
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    res.status(502).send(`CCTV inline feed unavailable: ${err.message}`);
  }
};
