const { Readable } = require('node:stream');
const { resolveCamera } = require('../server/cctv-registry');

const mediaCache = new Map();

function safeHttpUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported CCTV protocol');
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(url.hostname)) {
    throw new Error('Private CCTV host rejected');
  }
  return url;
}

function agencySite(hostname = '') {
  const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length >= 3 && parts.slice(-2).join('.') === 'gov.tw') return parts.slice(-3).join('.');
  return host;
}

function registrableLike(hostname = '') {
  const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
  const parts = host.split('.').filter(Boolean);
  return parts.length >= 2 ? parts.slice(-2).join('.') : host;
}

function sameStreamHost(base, candidate) {
  const a = base.hostname.toLowerCase();
  const b = candidate.hostname.toLowerCase();
  if (a === b) return true;
  const aa = agencySite(a), bb = agencySite(b);
  if (aa === bb && aa.endsWith('.gov.tw')) return true;
  return registrableLike(a) === registrableLike(b);
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
    const trimmed = line.trim();
    if (!trimmed) return line;
    return proxyUrl(id, new URL(trimmed, base).toString());
  }).join('\n');
}

function mediaKind(contentType = '', url = '') {
  const type = String(contentType).toLowerCase();
  const target = String(url).toLowerCase();
  if (/mpegurl|m3u8/.test(type) || /\.m3u8(?:\?|$)/.test(target)) return 'hls';
  if (/multipart\/x-mixed-replace/.test(type) || /\.(?:mjpg|mjpeg)(?:\?|$)/.test(target)) return 'mjpeg';
  if (/^image\//.test(type) || /\.(?:jpg|jpeg|png|webp)(?:\?|$)/.test(target)) return 'image';
  if (/^video\//.test(type) || /\.(?:mp4|webm)(?:\?|$)/.test(target)) return 'video';
  if (/text\/html|application\/xhtml/.test(type)) return 'html';
  return 'unknown';
}

function sniffKind(bytes) {
  if (!bytes || !bytes.length) return 'unknown';
  const head = Buffer.from(bytes).subarray(0, 1024);
  const text = head.toString('utf8');
  if (/^#EXTM3U/m.test(text)) return 'hls';
  if (head[0] === 0xff && head[1] === 0xd8) return 'image';
  if (head[0] === 0x89 && head.subarray(1, 4).toString('ascii') === 'PNG') return 'image';
  if (head.length > 12 && head.subarray(4, 8).toString('ascii') === 'ftyp') return 'video';
  return 'unknown';
}

function responseCookies(response) {
  try {
    const rows = response?.headers?.getSetCookie?.() || [];
    if (rows.length) return rows.map((x) => String(x).split(';')[0]).filter(Boolean).join('; ');
  } catch (_) {}
  try {
    const raw = response?.headers?.get?.('set-cookie') || '';
    return raw ? raw.split(/,(?=[^;,]+=)/).map((x) => x.split(';')[0].trim()).filter(Boolean).join('; ') : '';
  } catch (_) {
    return '';
  }
}

function mergeCookie(a = '', b = '') {
  const map = new Map();
  for (const raw of [a, b]) {
    for (const part of String(raw || '').split(';')) {
      const p = part.trim();
      if (!p || !p.includes('=')) continue;
      const i = p.indexOf('=');
      map.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
    }
  }
  return [...map].map(([k, v]) => `${k}=${v}`).join('; ');
}

function discoverCandidatesFromHtml(html, baseUrl) {
  const base = new URL(baseUrl);
  const normalized = String(html || '')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/&#x2F;/gi, '/');
  const raw = [];
  const push = (value, hint = '') => {
    if (!value) return;
    raw.push({ value: String(value).trim(), hint });
  };
  let m;
  const patterns = [
    ['source', /<source\b[^>]*\bsrc=["']([^"']+)["']/ig],
    ['iframe', /<iframe\b[^>]*\bsrc=["']([^"']+)["']/ig],
    ['media', /(?:src|href|data-src|data-url|data-stream|data-video|data-file|poster)\s*=\s*["']([^"']+)["']/ig],
    ['script', /(?:loadSource|setSource|file|src|streamUrl|stream_url|videoUrl|video_url|hlsUrl|hls_url|snapshotUrl|imageUrl|url)\s*\(?\s*[:=,]?\s*["']([^"']+)["']/ig],
    ['script', /["'](https?:\\?\/\\?\/[^"'<>\s]+)["']/ig],
  ];
  for (const [hint, re] of patterns) while ((m = re.exec(normalized))) push(m[1], hint);

  const seen = new Set();
  const out = [];
  for (const item of raw) {
    try {
      const cleaned = item.value
        .replace(/\\\//g, '/')
        .replace(/\\u0026/gi, '&')
        .replace(/&amp;/gi, '&')
        .trim();
      if (!cleaned || /^(?:javascript:|data:|blob:|#)/i.test(cleaned)) continue;
      const abs = safeHttpUrl(new URL(cleaned, base).toString());
      const key = abs.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      const u = key.toLowerCase();
      let score = 0;
      if (/\.m3u8(?:\?|$)/.test(u)) score += 600;
      else if (/\.(?:mp4|webm)(?:\?|$)/.test(u)) score += 520;
      else if (/\.(?:mjpg|mjpeg)(?:\?|$)/.test(u)) score += 500;
      else if (/\.(?:jpg|jpeg|webp|png)(?:\?|$)/.test(u)) score += 420;
      if (/(?:hls|cctv|camera|cam|stream|snapshot|live|traffic|video|mjpg|mjpeg)/.test(u)) score += 150;
      if (item.hint === 'source') score += 100;
      if (item.hint === 'iframe') score += 60;
      if (/(?:player|embed|viewer|api)/.test(u)) score += 35;
      if (/\.(?:css|js|woff2?|ttf|svg)(?:\?|$)/.test(u)) score -= 500;
      if (/(?:logo|icon|favicon|avatar|banner|ads?|sprite|brand|comment|guestbook|board|message|forum|reply|chat)/.test(u)) score -= 700;
      out.push({ url: abs, score, hint: item.hint });
    } catch (_) {}
  }
  return out.sort((a, b) => b.score - a.score);
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

async function fetchProbeTarget(url, timeout = 6500, context = {}) {
  const headers = {
    Accept: '*/*',
    Range: 'bytes=0-65535',
    'User-Agent': 'SENTINEL-Taiwan/1.1.0 public-cctv-probe',
    ...(context.referer ? { Referer: context.referer } : {}),
    ...(context.cookie ? { Cookie: context.cookie } : {}),
  };
  let response = await fetchWithTimeout(url, { headers }, timeout);
  if (!response.ok && [400, 403, 405, 416].includes(response.status)) {
    try { await response.body?.cancel?.(); } catch (_) {}
    delete headers.Range;
    response = await fetchWithTimeout(url, { headers }, timeout);
  }
  return response;
}

async function resolveUrlToMedia(url, context = {}, depth = 0, visited = new Set()) {
  if (depth > 3) throw new Error('CCTV wrapper depth exceeded');
  const requested = safeHttpUrl(url);
  const key = requested.toString();
  if (visited.has(key)) throw new Error('CCTV wrapper loop');
  visited.add(key);

  const obviousKind = mediaKind('', key);
  if (obviousKind !== 'unknown' && obviousKind !== 'html') {
    return {
      url: requested,
      kind: obviousKind,
      contentType: '',
      referer: context.referer || '',
      cookie: context.cookie || '',
    };
  }

  const response = await fetchProbeTarget(key, depth ? 5600 : 7200, context);
  if (!response.ok) throw new Error(`CCTV upstream HTTP ${response.status}`);
  const finalUrl = safeHttpUrl(response.url || key);
  const contentType = response.headers.get('content-type') || '';
  let kind = mediaKind(contentType, finalUrl.toString());
  const cookie = mergeCookie(context.cookie || '', responseCookies(response));

  if (kind === 'html' || (kind === 'unknown' && /(?:text\/|javascript|json)/i.test(contentType))) {
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 1_800_000) throw new Error('CCTV wrapper page too large');
    const html = await response.text();
    const candidates = discoverCandidatesFromHtml(html, finalUrl).slice(0, 16);
    if (!candidates.length) throw new Error('No direct media candidates in CCTV wrapper');
    let lastError;
    for (const candidate of candidates) {
      try {
        const next = await resolveUrlToMedia(
          candidate.url.toString(),
          { referer: finalUrl.toString(), cookie },
          depth + 1,
          new Set(visited),
        );
        if (['hls', 'image', 'mjpeg', 'video'].includes(next.kind)) return next;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('No playable media found in CCTV wrapper');
  }

  if (kind === 'unknown') {
    try {
      const bytes = new Uint8Array(await response.arrayBuffer());
      kind = sniffKind(bytes);
    } catch (_) {}
  } else {
    try { await response.body?.cancel?.(); } catch (_) {}
  }

  if (!['hls', 'image', 'mjpeg', 'video'].includes(kind)) {
    throw new Error(`Unsupported CCTV media ${contentType || kind}`);
  }
  return {
    url: finalUrl,
    kind,
    contentType,
    referer: context.referer || '',
    cookie,
  };
}

async function resolveMediaTarget(camera) {
  const cached = mediaCache.get(camera.id);
  if (cached && cached.expiresAt > Date.now()) return cached;
  if (camera?.requiresAuthorization && !camera?.resolverBridge) {
    throw new Error('Official CCTV interface authorization required');
  }
  if (!camera?.streamUrl) throw new Error('No public CCTV stream URL');
  const result = await resolveUrlToMedia(camera.streamUrl, {}, 0, new Set());
  const out = { ...result, expiresAt: Date.now() + 30 * 60 * 1000 };
  mediaCache.set(camera.id, out);
  return out;
}

async function proxySnapshot(camera, res) {
  if (!camera?.imageUrl) return false;
  const target = safeHttpUrl(camera.imageUrl);
  const upstream = await fetchWithTimeout(target.toString(), {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent': 'SENTINEL-Taiwan/1.1.0 public-cctv-snapshot',
      'Cache-Control': 'no-cache',
    },
  }, 9000);
  if (!upstream.ok || !upstream.body) throw new Error(`CCTV snapshot HTTP ${upstream.status}`);
  const finalUrl = safeHttpUrl(upstream.url || target.toString());
  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  if (!/^image\//i.test(contentType) && mediaKind(contentType, finalUrl.toString()) !== 'image') {
    throw new Error(`CCTV snapshot returned ${contentType || 'unknown format'}`);
  }
  res.setHeader('Content-Type', /^image\//i.test(contentType) ? contentType : 'image/jpeg');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  Readable.fromWeb(upstream.body).pipe(res);
  return true;
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
    if (camera?.requiresAuthorization && !camera?.resolverBridge) {
      if (String(req.query.probe || '') === '1') {
        return sendJson(res, 403, {
          id,
          kind: 'authorization-required',
          authorizationUrl: camera.authorizationUrl || '',
          officialViewerUrl: camera.officialViewerUrl || '',
        });
      }
      return res.status(403).send('Official CCTV image interface requires provider authorization');
    }

    if (String(req.query.snapshot || '') === '1') {
      if (!camera?.imageUrl) return res.status(404).send('No official CCTV snapshot URL');
      await proxySnapshot(camera, res);
      return;
    }

    if (!camera?.streamUrl) {
      if (camera?.imageUrl) {
        if (String(req.query.probe || '') === '1') {
          return sendJson(res, 200, {
            id,
            kind: 'image',
            contentType: 'image/*',
            proxied: true,
            snapshotAvailable: true,
            imageRefreshRate: Math.max(1, Number(camera.imageRefreshRate) || 5),
            fallback: 'official-snapshot',
          });
        }
        await proxySnapshot(camera, res);
        return;
      }
      if (String(req.query.probe || '') === '1') {
        return sendJson(res, 409, { id, kind: 'point-only' });
      }
      return res.status(409).send('CCTV point has no public direct media URL');
    }

    let resolved;
    try {
      resolved = await resolveMediaTarget(camera);
    } catch (streamError) {
      if (camera?.imageUrl) {
        if (String(req.query.probe || '') === '1') {
          return sendJson(res, 200, {
            id,
            kind: 'image',
            contentType: 'image/*',
            proxied: true,
            snapshotAvailable: true,
            imageRefreshRate: Math.max(1, Number(camera.imageRefreshRate) || 5),
            fallback: 'official-snapshot',
            streamError: String(streamError?.message || streamError).slice(0, 160),
          });
        }
        await proxySnapshot(camera, res);
        return;
      }
      throw streamError;
    }

    const base = safeHttpUrl(resolved.url.toString());
    if (String(req.query.probe || '') === '1') {
      return sendJson(res, 200, {
        id,
        kind: resolved.kind,
        contentType: resolved.contentType,
        proxied: true,
        directInline: true,
        snapshotAvailable: Boolean(camera.imageUrl),
        imageRefreshRate: Math.max(1, Number(camera.imageRefreshRate) || 5),
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
      'User-Agent': 'SENTINEL-Taiwan/1.1.0 public-cctv-inline-proxy',
      ...(resolved.referer ? { Referer: resolved.referer } : {}),
      ...(resolved.cookie ? { Cookie: resolved.cookie } : {}),
    };
    if (resolved.referer) {
      try { headers.Origin = new URL(resolved.referer).origin; } catch (_) {}
    }
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
