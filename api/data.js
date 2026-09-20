const handlers = {
  geocode: require('../server/geocode'),
  weather: require('../server/weather'),
  route: require('../server/route'),
  cctv: require('../server/cctv'),
  traffic: require('../server/traffic'),
  flow: require('../server/flow'),
  'city-flow': require('../server/city-flow'),
  'lane-flow': require('../server/lane-flow'),
  news: require('../server/news'),
  'speed-cameras': require('../server/speed-cameras'),
  flights: require('../server/flights'),
  earthquakes: require('../server/earthquakes'),
  health: require('../server/health'),
  'air-quality': require('../server/air-quality'),
  parking: require('../server/parking'),
  construction: require('../server/construction'),
  flood: require('../server/flood'),
};

module.exports = async (req, res) => {
  const action = String(req.query?.action || '').trim().toLowerCase();
  if (!action) {
    res.status(400).json({ error: 'Missing action', available: Object.keys(handlers) });
    return;
  }
  const handler = handlers[action];
  if (!handler) {
    res.status(404).json({ error: 'Unknown action', action, available: Object.keys(handlers) });
    return;
  }
  return handler(req, res);
};
