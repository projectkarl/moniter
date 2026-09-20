const { json, distanceKm } = require('./_utils');
const { SOURCES, loadRegistry, searchRegistry } = require('./cctv-registry');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const q = String(req.query.q || '').trim();
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const radius = Math.min(520, Math.max(0.2, Number(req.query.radius || (q ? 280 : 40))));
  const national = String(req.query.national || '') === '1';
  const limit = Math.min(8000, Math.max(1, Number(req.query.limit || (q ? 180 : national ? 900 : 520))));
  if (!hasCoords && !q) return json(res, 400, { error: 'Coordinates or q is required' });

  try {
    const { items: registry, sourceStatus } = await loadRegistry({ liveOnly:true });
    const viewableRegistry = registry.filter((camera) => camera.streamUrl);
    let items = q ? searchRegistry(viewableRegistry, q, Math.max(limit * 3, 300)) : viewableRegistry;
    items = items.map((camera) => ({
      ...camera,
      name: [camera.road, camera.mile].filter(Boolean).join(' · ') || '公開 CCTV',
      ...(hasCoords ? { distance: distanceKm(lat, lon, camera.lat, camera.lon) } : {}),
    }));
    if (hasCoords) items = items.filter((camera) => camera.distance <= radius);
    if (national && !q) {
      const cells = new Map();
      for (const camera of items) {
        const cell = `${Math.round(Number(camera.lat) / .045)}:${Math.round(Number(camera.lon) / .045)}`;
        const prev = cells.get(cell);
        if (!prev || (camera.streamUrl && !prev.streamUrl)) cells.set(cell, camera);
      }
      items = [...cells.values()];
    }
    items.sort((a, b) => {
      if (q && Number(a.matchScore) !== Number(b.matchScore)) return Number(b.matchScore || 0) - Number(a.matchScore || 0);
      if (hasCoords) return Number(a.distance || 0) - Number(b.distance || 0);
      return Number(Boolean(b.streamUrl)) - Number(Boolean(a.streamUrl));
    });
    items = items.slice(0, limit);

    const liveCount = viewableRegistry.length;
    const activeSources = sourceStatus.filter((x) => x.ok).map((x) => x.name);
    return json(res, 200, {
      zeroKey: true,
      query: q || undefined,
      activeSources,
      failedSources: sourceStatus.filter((x) => !x.ok).map((x) => x.name),
      sourceStatus,
      coverage: {
        sourceCount: sourceStatus.length,
        activeSourceCount: sourceStatus.filter((x) => x.ok).length,
        registryCount: registry.length,
        liveCount,
        viewableCount: liveCount,
        positionOnlyCount: 0,
      },
      items,
      discovery: hasCoords ? { provider:'twipcam', nearbyUrl:`https://www.twipcam.com/nearby?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}` } : undefined,
      message: items.length ? undefined : (q ? '目前可觀看的公開 CCTV 沒有命中此路口／地點，可再使用周邊公開影像查詢。' : '此範圍內目前沒有可直接播放的公開交通 CCTV。'),
      note: '只回傳可取得公開影像的 CCTV；純位置、沒有可觀看影像的資料不顯示。另提供 twipcam 座標周邊查詢連結作為全台公開影像探索入口。',
    }, 's-maxage=1800, stale-while-revalidate=21600');
  } catch (e) {
    return json(res, 502, { error: `CCTV 資料暫時無法取得：${e.message}` }, 'no-store');
  }
};
