const { json, fetchJson } = require('./_utils');

const memoryCache = new Map();
let lastNominatimAt = 0;

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache) if (now - value.time > 24 * 60 * 60 * 1000) memoryCache.delete(key);
}

function unique(list = []) {
  return [...new Set(list.map((x) => String(x || '').trim().replace(/\s+/g, ' ')).filter(Boolean))];
}

function queryCandidates(raw = '') {
  const q = String(raw || '').trim().replace(/\s+/g, ' ');
  const noNoise = q.replace(/(?:附近|這附近|目前|位置|地點)$/g, '').trim();
  const intersection = noNoise
    .replace(/(?:交叉口|路口)/g, ' ')
    .replace(/\s*(?:與|和|及|&|＆|\+|＋)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const metroCore = noNoise
    .replace(/^捷運\s*/,'')
    .replace(/捷運站$/,'')
    .replace(/站$/,'')
    .trim();
  const station = /捷運/.test(noNoise) || /站$/.test(noNoise) ? `${metroCore}站` : '';
  const metroStation = station ? `捷運${station}` : '';
  const roadPair = /(?:路口|交叉口|(?:路|街|大道|巷|道).*(?:與|和|及|&|＆|\+|＋).*(?:路|街|大道|巷|道))/.test(noNoise);
  const metroLike = Boolean(station);
  const early = [q, noNoise];
  if (metroLike) early.push(station, metroStation);
  if (roadPair) early.push(intersection);
  early.push(q.replace(/臺/g, '台'), q.replace(/台/g, '臺'));
  if (!roadPair) early.push(intersection);
  return unique(early).slice(0, 7);
}

function inTaiwan(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 21.7 && lat <= 25.7 && lon >= 119.0 && lon <= 122.3;
}

function rankWithBias(results, biasLat, biasLon, hasBias) {
  const clean = results.filter((x) => inTaiwan(Number(x.lat), Number(x.lon)));
  if (!hasBias) return clean;
  return clean.map((x) => ({
    ...x,
    biasDistance: Math.hypot((Number(x.lat)-biasLat)*111, (Number(x.lon)-biasLon)*101),
  })).sort((a,b) => Number(a.biasDistance) - Number(b.biasDistance));
}

async function searchNominatim(q, hasBias, biasLat, biasLon) {
  const wait = Math.max(0, 1050 - (Date.now() - lastNominatimAt));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimAt = Date.now();
  const viewbox = hasBias ? `&viewbox=${(biasLon-0.9).toFixed(4)},${(biasLat+0.7).toFixed(4)},${(biasLon+0.9).toFixed(4)},${(biasLat-0.7).toFixed(4)}` : '';
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=tw&limit=8&accept-language=zh-TW${viewbox}&q=${encodeURIComponent(q)}`;
  const rows = await fetchJson(url, {}, 10000);
  return (Array.isArray(rows) ? rows : []).map((x) => ({
    name: x.display_name,
    lat: Number(x.lat),
    lon: Number(x.lon),
    type: x.type,
    category: x.category,
    provider: 'Nominatim',
  }));
}

async function searchPhoton(q) {
  const url = `https://photon.komoot.io/api/?limit=8&lang=zh&q=${encodeURIComponent(`${q} Taiwan`)}`;
  const data = await fetchJson(url, {}, 9000);
  return (Array.isArray(data?.features) ? data.features : []).map((f) => {
    const p = f?.properties || {};
    const coords = f?.geometry?.coordinates || [];
    const label = [p.name, p.street, p.district, p.city, p.county, p.state].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
    return {
      name: label || p.name || q,
      lat: Number(coords[1]),
      lon: Number(coords[0]),
      type: p.type || p.osm_value || '',
      category: p.osm_key || 'place',
      provider: 'Photon',
    };
  });
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

  const candidates = queryCandidates(q);
  let results = [];
  const tried = [];
  try {
    // Primary source: Nominatim. Keep requests serial and cached to respect the public service policy.
    tried.push(`Nominatim:${candidates[0]}`);
    results = await searchNominatim(candidates[0], hasBias, biasLat, biasLon);

    // Free fallback for terms Nominatim misses (common station / landmark / alternate-script cases).
    if (!results.length) {
      for (const candidate of candidates.slice(0, 5)) {
        try {
          tried.push(`Photon:${candidate}`);
          const alt = await searchPhoton(candidate);
          if (alt.length) { results = alt; break; }
        } catch (_) {}
      }
    }

    // One normalized Nominatim retry at most; do not spam the public endpoint.
    if (!results.length) {
      const retry = candidates.find((candidate, i) => i > 0 && candidate !== candidates[0]);
      if (retry) {
        tried.push(`Nominatim:${retry}`);
        results = await searchNominatim(retry, hasBias, biasLat, biasLon);
      }
    }

    results = rankWithBias(results, biasLat, biasLon, hasBias).slice(0, 8);
    const providers = [...new Set(results.map((x) => x.provider).filter(Boolean))];
    const body = {
      zeroKey: true,
      source: providers.length ? providers.join(' + ') : 'OpenStreetMap Nominatim + Photon fallback',
      query: q,
      normalizedQueries: candidates,
      results,
    };
    memoryCache.set(key, { time: Date.now(), body });
    return json(res, 200, body, 's-maxage=86400, stale-while-revalidate=604800');
  } catch (e) {
    return json(res, 502, { error: `地點查詢失敗：${e.message}`, query: q, tried }, 'no-store');
  }
};
