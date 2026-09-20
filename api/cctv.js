const { json, fetchText, distanceKm, tag, xmlBlocks } = require('./_utils');

const SOURCES = [
  {
    id: 'freeway',
    name: '交通部高速公路局',
    url: 'https://tisvcloud.freeway.gov.tw/history/motc20/CCTV.xml',
  },
  {
    id: 'highway',
    name: '交通部公路局省道',
    url: 'https://cctv-maintain.thb.gov.tw/opendataCCTVs.xml',
  },
  {
    id: 'chiayi-city',
    name: '嘉義市政府',
    url: 'https://117.56.103.67/MOTC_XML/XML/CCTV2_Info.ashx',
  },
];

function parseStandardXml(xml, source) {
  return xmlBlocks(xml, 'CCTV').map((block, index) => ({
    id: `${source.id}:${tag(block, 'CCTVID') || index}`,
    streamUrl: tag(block, 'VideoStreamURL') || tag(block, 'videostreamurl') || tag(block, 'URL'),
    lon: Number(tag(block, 'PositionLon') || tag(block, 'positionlon') || tag(block, 'Longitude')),
    lat: Number(tag(block, 'PositionLat') || tag(block, 'positionlat') || tag(block, 'Latitude')),
    road: tag(block, 'RoadName') || tag(block, 'roadname') || tag(block, 'RoadID'),
    direction: tag(block, 'RoadDirection') || tag(block, 'roaddirection'),
    start: tag(block, 'Start'),
    end: tag(block, 'End'),
    mile: tag(block, 'LocationMile'),
    source: source.name,
  })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lon));
}

async function fetchSource(source) {
  const xml = await fetchText(source.url, {}, source.id === 'highway' ? 18000 : 15000);
  return parseStandardXml(xml, source);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(180, Math.max(5, Number(req.query.radius || 40)));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json(res, 400, { error: 'Invalid coordinates' });

  try {
    const settled = await Promise.allSettled(SOURCES.map(fetchSource));
    const all = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const dedup = new Map();
    for (const camera of all) {
      const key = camera.streamUrl || `${camera.lat.toFixed(5)},${camera.lon.toFixed(5)},${camera.road}`;
      if (!dedup.has(key)) dedup.set(key, camera);
    }

    const items = [...dedup.values()]
      .map((x) => ({
        ...x,
        name: [x.road, x.mile].filter(Boolean).join(' · ') || '公開 CCTV',
        distance: distanceKm(lat, lon, x.lat, x.lon),
      }))
      .filter((x) => x.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 260);

    const activeSources = SOURCES.filter((_, i) => settled[i]?.status === 'fulfilled').map((s) => s.name);
    return json(res, 200, {
      zeroKey: true,
      activeSources,
      failedSources: SOURCES.filter((_, i) => settled[i]?.status !== 'fulfilled').map((s) => s.name),
      items,
      message: items.length ? undefined : '此範圍內目前沒有可用的公開交通 CCTV，或資料來源暫時離線。',
    }, 's-maxage=21600, stale-while-revalidate=86400');
  } catch (e) {
    return json(res, 502, { error: `CCTV 資料暫時無法取得：${e.message}` }, 'no-store');
  }
};
