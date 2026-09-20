const { json, fetchJson } = require('./_utils');
function parsePair(v) {
  const p = String(v || '').split(',').map(Number);
  return p.length === 2 && p.every(Number.isFinite) ? p : null;
}
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const from = parsePair(req.query.from), to = parsePair(req.query.to);
  if (!from || !to) return json(res, 400, { error: 'Invalid from/to' });
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson&alternatives=3&steps=false&continue_straight=false`;
    const d = await fetchJson(url, {}, 15000);
    return json(res, 200, {
      zeroKey: true,
      source: 'OSRM public demo server',
      routes: (d.routes || []).slice(0, 3).map((r) => ({ distance: r.distance, duration: r.duration, geometry: r.geometry })),
    }, 's-maxage=300, stale-while-revalidate=900');
  } catch (e) {
    return json(res, 502, { error: `路線服務暫時無法使用：${e.message}` }, 'no-store');
  }
};
