function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body, cache = 's-maxage=60, stale-while-revalidate=300') {
  setCors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.status(status).json(body);
}

async function fetchJson(url, init = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EYE-Taiwan/0.5 zero-key-public-data-client',
        ...(init.headers || {}),
      },
    });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    if (!r.ok) throw new Error(body?.message || `Upstream HTTP ${r.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, init = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: '*/*',
        'User-Agent': 'EYE-Taiwan/0.5 zero-key-public-data-client',
        ...(init.headers || {}),
      },
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBuffer(url, init = {}, timeoutMs = 10000, maxBytes = 20 * 1024 * 1024) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: '*/*',
        'User-Agent': 'EYE-Taiwan/0.27 zero-key-public-data-client',
        ...(init.headers || {}),
      },
    });
    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);
    const declared = Number(r.headers?.get?.('content-length') || 0);
    if (declared > maxBytes) throw new Error('Upstream payload too large');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > maxBytes) throw new Error('Upstream payload too large');
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const rad = (v) => v * Math.PI / 180;
  const R = 6371;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function stripCdata(v = '') {
  return String(v).replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
}

function tag(block, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = String(block).match(new RegExp(`<(?:\\w+:)?${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`, 'i'));
  return m ? stripCdata(m[1]) : '';
}

function xmlBlocks(xml, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(xml).match(new RegExp(`<(?:\\w+:)?${escaped}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:\\w+:)?${escaped}>`, 'gi')) || [];
}

function parseWktLineString(value) {
  const raw = stripCdata(value);
  const m = raw.match(/LINESTRING(?:\s+Z|\s+M|\s+ZM)?\s*\(([^)]+)\)/i);
  if (!m) return [];
  return m[1].split(',').map((pair) => {
    const nums = pair.trim().split(/\s+/).map(Number);
    return nums.length >= 2 && Number.isFinite(nums[0]) && Number.isFinite(nums[1]) ? [nums[1], nums[0]] : null;
  }).filter(Boolean);
}

function midpoint(coords) {
  if (!Array.isArray(coords) || !coords.length) return null;
  const p = coords[Math.floor(coords.length / 2)];
  return p ? { lat: Number(p[0]), lon: Number(p[1]) } : null;
}

function simplifyCoords(coords, max = 28) {
  if (!Array.isArray(coords) || coords.length <= max) return coords || [];
  const step = (coords.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(coords[Math.round(i * step)]);
  return out;
}

module.exports = { json, fetchJson, fetchText, fetchBuffer, distanceKm, setCors, tag, xmlBlocks, parseWktLineString, midpoint, simplifyCoords };
