const { json, fetchJson } = require('./_utils');

const memoryCache = new Map();
let lastUpstreamAt = 0;

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache) if (now - value.time > 24 * 60 * 60 * 1000) memoryCache.delete(key);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const q = String(req.query.q || '').trim().replace(/\s+/g, ' ');
  if (!q) return json(res, 400, { error: 'Missing q' });
  if (q.length > 120) return json(res, 400, { error: 'Query too long' });

  const biasLat = Number(req.query.lat);
  const biasLon = Number(req.query.lon);
  const hasBias = Number.isFinite(biasLat) && Number.isFinite(biasLon);
  const key = `${q.toLowerCase()}|${hasBias ? `${biasLat.toFixed(2)},${biasLon.toFixed(2)}` : 'nobias'}`;
  cleanCache();
  const cached = memoryCache.get(key);
  if (cached) return json(res, 200, cached.body, 's-maxage=86400, stale-while-revalidate=604800');

  try {
    // Nominatim public policy: no autocomplete, max ~1 request/second, cache results.
    const wait = Math.max(0, 1050 - (Date.now() - lastUpstreamAt));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastUpstreamAt = Date.now();
    const viewbox = hasBias ? `&viewbox=${(biasLon-0.9).toFixed(4)},${(biasLat+0.7).toFixed(4)},${(biasLon+0.9).toFixed(4)},${(biasLat-0.7).toFixed(4)}` : '';
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=tw&limit=8&accept-language=zh-TW${viewbox}&q=${encodeURIComponent(q)}`;
    const rows = await fetchJson(url, {}, 10000);
    let results = (Array.isArray(rows) ? rows : []).map((x) => ({
      name: x.display_name,
      lat: Number(x.lat),
      lon: Number(x.lon),
      type: x.type,
      category: x.category,
    })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lon));
    if (hasBias) results = results.map((x) => ({ ...x, biasDistance: Math.hypot((x.lat-biasLat)*111, (x.lon-biasLon)*101) })).sort((a,b) => a.biasDistance-b.biasDistance);
    const body = { zeroKey: true, source: 'OpenStreetMap Nominatim', query: q, results };
    memoryCache.set(key, { time: Date.now(), body });
    return json(res, 200, body, 's-maxage=86400, stale-while-revalidate=604800');
  } catch (e) {
    return json(res, 502, { error: `地點查詢失敗：${e.message}` }, 'no-store');
  }
};
