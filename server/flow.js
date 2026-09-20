const { json, fetchText, distanceKm, tag, xmlBlocks, parseWktLineString, midpoint, simplifyCoords } = require('./_utils');

const BASE = 'https://tisvcloud.freeway.gov.tw/history/motc20';

function parseLive(xml) {
  const map = new Map();
  for (const block of xmlBlocks(xml, 'LiveTraffic')) {
    const sectionId = tag(block, 'SectionID');
    if (!sectionId) continue;
    map.set(sectionId, {
      sectionId,
      travelTime: Number(tag(block, 'TravelTime')),
      travelSpeed: Number(tag(block, 'TravelSpeed')),
      congestionLevelId: tag(block, 'CongestionLevelID'),
      congestionLevel: tag(block, 'CongestionLevel'),
      dataCollectTime: tag(block, 'DataCollectTime'),
    });
  }
  return map;
}

function endpointFromBlock(block = '') {
  const lat = Number(tag(block, 'PositionLat') || tag(block, 'Latitude'));
  const lon = Number(tag(block, 'PositionLon') || tag(block, 'Longitude'));
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
}

function parseSections(xml) {
  const map = new Map();
  for (const block of xmlBlocks(xml, 'Section')) {
    const sectionId = tag(block, 'SectionID');
    if (!sectionId) continue;
    const startBlock = tag(block, 'SectionStart') || tag(block, 'Start');
    const endBlock = tag(block, 'SectionEnd') || tag(block, 'End');
    const startPoint = endpointFromBlock(startBlock);
    const endPoint = endpointFromBlock(endBlock);
    const geometryFallback = startPoint && endPoint ? [startPoint, endPoint] : [];
    map.set(sectionId, {
      sectionId,
      name: tag(block, 'SectionName'),
      road: tag(block, 'RoadName') || tag(block, 'RoadID'),
      direction: tag(block, 'RoadDirection'),
      start: tag(startBlock, 'LocationName') || tag(startBlock, 'Name') || '',
      end: tag(endBlock, 'LocationName') || tag(endBlock, 'Name') || '',
      speedLimit: Number(tag(block, 'SpeedLimit')),
      geometryFallback,
    });
  }
  return map;
}

function parseShapes(xml) {
  const map = new Map();
  for (const block of xmlBlocks(xml, 'SectionShape')) {
    const sectionId = tag(block, 'SectionID');
    const geometry = parseWktLineString(tag(block, 'Geometry'));
    if (sectionId && geometry.length) map.set(sectionId, geometry);
  }
  return map;
}

function inferStatus(item) {
  const text = String(item.congestionLevel || '').toLowerCase();
  const id = Number(item.congestionLevelId);
  const speed = Number(item.travelSpeed);
  if (/嚴重|壅塞|congest|jam/.test(text) || id >= 4 || (Number.isFinite(speed) && speed < 30)) return 'congested';
  if (/車多|緩慢|heavy|slow/.test(text) || id >= 2 || (Number.isFinite(speed) && speed < 60)) return 'slow';
  return 'normal';
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(220, Math.max(10, Number(req.query.radius || 70)));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json(res, 400, { error: 'Invalid coordinates' });

  try {
    const settled = await Promise.allSettled([
      fetchText(`${BASE}/LiveTraffic.xml`, {}, 16000),
      fetchText(`${BASE}/Section.xml`, {}, 16000),
      fetchText(`${BASE}/SectionShape.xml`, {}, 20000),
    ]);
    if (settled[0].status !== 'fulfilled') throw settled[0].reason;

    const live = parseLive(settled[0].value);
    const sections = settled[1].status === 'fulfilled' ? parseSections(settled[1].value) : new Map();
    const shapes = settled[2].status === 'fulfilled' ? parseShapes(settled[2].value) : new Map();

    const items = [];
    for (const [sectionId, dynamic] of live) {
      const meta = sections.get(sectionId) || {};
      const geometry = shapes.get(sectionId) || meta.geometryFallback || [];
      if (!geometry?.length) continue;
      const center = midpoint(geometry);
      if (!center) continue;
      const distance = distanceKm(lat, lon, center.lat, center.lon);
      if (distance > radius) continue;
      const item = {
        ...meta,
        ...dynamic,
        lat: center.lat,
        lon: center.lon,
        distance,
        geometry: simplifyCoords(geometry, 32),
      };
      item.status = inferStatus(item);
      items.push(item);
    }

    items.sort((a, b) => a.distance - b.distance);
    const visible = items.slice(0, 220);
    const speeds = visible.map((x) => x.travelSpeed).filter(Number.isFinite).filter((x) => x >= 0);
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : null;
    const worst = visible.some((x) => x.status === 'congested') ? 'congested' : visible.some((x) => x.status === 'slow') ? 'slow' : visible.length ? 'normal' : 'unknown';

    return json(res, 200, {
      zeroKey: true,
      source: 'Freeway Bureau LiveTraffic.xml + SectionShape.xml + Section endpoint fallback',
      shapeAvailable: shapes.size > 0,
      shapeFallbackAvailable: [...sections.values()].some((x) => x.geometryFallback?.length >= 2),
      metadataAvailable: sections.size > 0,
      avgSpeed,
      status: worst,
      items: visible,
      message: visible.length ? undefined : '此範圍目前沒有可定位的國道路段即時流速資料。',
    }, 's-maxage=60, stale-while-revalidate=180');
  } catch (e) {
    return json(res, 502, { error: `國道即時流速暫時無法取得：${e.message}` }, 'no-store');
  }
};
