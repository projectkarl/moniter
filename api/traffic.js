const { json, fetchJson, distanceKm } = require('./_utils');

function normalizePbs(x) {
  return {
    id: String(x.UID || `pbs-${x.y1}-${x.x1}-${x.happendate}-${x.happentime}`),
    lat: Number(x.y1),
    lon: Number(x.x1),
    title: x.roadtype || '警廣即時路況',
    road: x.road || x.areaNm || '',
    direction: x.direction || '',
    description: x.comment || x.srcdetail || '',
    time: [x.happendate, x.happentime].filter(Boolean).join(' '),
    source: '警察廣播電臺公開資料',
  };
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(250, Math.max(10, Number(req.query.radius || 60)));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json(res, 400, { error: 'Invalid coordinates' });

  try {
    const d = await fetchJson('https://rtr.pbs.gov.tw/NMP103_PbsWS/resources/roadData/opendata', {}, 14000);
    const rows = Array.isArray(d) ? d : (d.data || d.Data || d.result || []);
    const dedup = new Map();
    (Array.isArray(rows) ? rows : [])
      .map(normalizePbs)
      .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lon))
      .forEach((x) => dedup.set(x.id, x));

    const items = [...dedup.values()]
      .map((x) => ({ ...x, distance: distanceKm(lat, lon, x.lat, x.lon) }))
      .filter((x) => x.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 180);

    return json(res, 200, {
      zeroKey: true,
      source: 'Police Broadcasting Service open data',
      items,
      message: items.length ? undefined : '附近目前沒有取得警廣即時路況事件。',
    }, 's-maxage=60, stale-while-revalidate=180');
  } catch (e) {
    return json(res, 502, { error: `即時路況暫時無法取得：${e.message}` }, 'no-store');
  }
};
