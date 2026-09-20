const { json, fetchJson } = require('./_utils');
function parsePair(v) {
  const p = String(v || '').split(',').map(Number);
  return p.length === 2 && p.every(Number.isFinite) ? p : null;
}
function compactStep(step = {}) {
  const m = step.maneuver || {};
  return {
    distance: Number(step.distance || 0),
    duration: Number(step.duration || 0),
    name: String(step.name || ''),
    ref: String(step.ref || ''),
    destinations: String(step.destinations || ''),
    drivingSide: String(step.driving_side || ''),
    maneuver: {
      location: Array.isArray(m.location) ? m.location.slice(0, 2).map(Number) : null,
      type: String(m.type || ''),
      modifier: String(m.modifier || ''),
      bearingBefore: Number.isFinite(Number(m.bearing_before)) ? Number(m.bearing_before) : null,
      bearingAfter: Number.isFinite(Number(m.bearing_after)) ? Number(m.bearing_after) : null,
      exit: Number.isFinite(Number(m.exit)) ? Number(m.exit) : null,
    },
  };
}
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const from = parsePair(req.query.from), to = parsePair(req.query.to);
  if (!from || !to) return json(res, 400, { error: 'Invalid from/to' });
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson&alternatives=3&steps=true&continue_straight=false`;
    const d = await fetchJson(url, {}, 15000);
    return json(res, 200, {
      zeroKey: true,
      source: 'OSRM public demo server',
      routes: (d.routes || []).slice(0, 3).map((r) => ({
        distance: r.distance,
        duration: r.duration,
        geometry: r.geometry,
        steps: (r.legs || []).flatMap((leg) => (leg.steps || []).map(compactStep)),
      })),
    }, 's-maxage=120, stale-while-revalidate=360');
  } catch (e) {
    return json(res, 502, { error: `路線服務暫時無法使用：${e.message}` }, 'no-store');
  }
};
