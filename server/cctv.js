const { json, distanceKm } = require('./_utils');
const { loadRegistry, searchRegistry, resolveCameraRegion } = require('./cctv-registry');
const { loadScenicForQuery, shouldSearchScenic } = require('./scenic-cctv');

function mergeCameras(primary = [], extra = []) {
  const map = new Map();
  const keyFor = (cam) => {
    if (cam?.streamUrl) return `stream:${String(cam.streamUrl).replace(/^http:/i,'https:')}`;
    return `${Number(cam.lat).toFixed(4)},${Number(cam.lon).toFixed(4)},${String(cam.road || cam.name || '').replace(/\s+/g,'').slice(0,24)}`;
  };
  for (const cam of [...primary, ...extra]) {
    if (!cam || !Number.isFinite(Number(cam.lat)) || !Number.isFinite(Number(cam.lon))) continue;
    const key = keyFor(cam);
    const prev = map.get(key);
    if (!prev || (cam.scenic && !prev.scenic) || (cam.originalSource && !prev.originalSource)) map.set(key, cam);
  }
  return [...map.values()];
}

function localSourceIds(lat, lon) {
  const y = Number(lat), x = Number(lon);
  if (!Number.isFinite(y) || !Number.isFinite(x)) return null;
  if (y >= 24.96 && y <= 25.20 && x >= 121.43 && x <= 121.69) return ['taipei-position','new-taipei-position','freeway','highway'];
  if (y >= 25.05 && y <= 25.20 && x > 121.64 && x <= 121.86) return ['keelung','new-taipei-position','freeway','highway'];
  if (y >= 24.78 && y <= 25.18 && x >= 120.95 && x <= 121.38) return ['taoyuan-position','new-taipei-position','freeway','highway'];
  if (y >= 23.95 && y <= 24.48 && x >= 120.45 && x <= 121.05) return ['taichung','freeway','highway'];
  if (y >= 22.82 && y <= 23.48 && x >= 119.95 && x <= 120.58) return ['tainan','freeway','highway'];
  if (y >= 23.30 && y <= 23.64 && x >= 120.25 && x <= 120.58) return ['chiayi-city','chiayi-county','freeway','highway'];
  if (y >= 24.60 && y <= 25.45 && x >= 121.30 && x <= 122.15) return ['new-taipei-position','freeway','highway'];
  return ['freeway','highway'];
}

function deadline(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); }),
  ]);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const q = String(req.query.q || '').trim();
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const radius = Math.min(520, Math.max(0.2, Number(req.query.radius || (q ? 280 : 40))));
  const national = String(req.query.national || '') === '1';
  const limit = Math.min(8000, Math.max(1, Number(req.query.limit || (q ? 240 : national ? 8000 : 620))));
  if (!hasCoords && !q) return json(res, 400, { error: 'Coordinates or q is required' });

  try {
    const sourceIds = !national && hasCoords ? localSourceIds(lat, lon) : null;
    const registryPromise = deadline(
      loadRegistry({ liveOnly:national, sourceIds, timeoutCap:national ? null : 4400 }),
      national ? 24000 : 4700,
      { items:[], sourceStatus:[] },
    );
    const scenicPromise = hasCoords && q && !national && shouldSearchScenic(q)
      ? deadline(loadScenicForQuery(q, lat, lon, 5), 5200, [])
      : Promise.resolve([]);

    const [{ items:registry, sourceStatus }, scenicResult] = await Promise.all([registryPromise, scenicPromise]);
    const scenic = Array.isArray(scenicResult) ? scenicResult : [];
    if (q && hasCoords && !national && shouldSearchScenic(q)) {
      sourceStatus.push({
        id:'scenic-original', name:'景點原始公開即時影像', region:'搜尋景點', ok:true,
        count:scenic.length, access:'original-source',
        note:'參考目錄只用於辨識來源；播放器不嵌入參考站。',
      });
    }

    const combined = mergeCameras(registry, scenic);
    let items = q ? combined.map((camera) => ({
      ...camera,
      matchScore: camera.scenic ? 1800 : (searchRegistry([camera], q, 1)[0]?.matchScore || 0),
    })) : combined;

    items = items.map((camera) => {
      const corrected = resolveCameraRegion(camera);
      return {
        ...camera,
        region: camera.region && !/^(?:Taiwan|臺灣|全台)/i.test(camera.region) ? camera.region : corrected.region,
        regionResolvedBy: camera.regionResolvedBy || corrected.by,
        regionConfidence: camera.regionConfidence || corrected.confidence,
        name: camera.name || [camera.road, camera.mile].filter(Boolean).join(' · ') || '公開 CCTV',
        ...(hasCoords ? { distance: distanceKm(lat, lon, camera.lat, camera.lon) } : {}),
      };
    });
    if (hasCoords) items = items.filter((camera) => camera.distance <= radius || camera.scenic);
    items.sort((a, b) => {
      if (Boolean(a.scenic) !== Boolean(b.scenic)) return Number(Boolean(b.scenic)) - Number(Boolean(a.scenic));
      if (q && Number(a.matchScore) !== Number(b.matchScore)) return Number(b.matchScore || 0) - Number(a.matchScore || 0);
      if (hasCoords) return Number(a.distance || 0) - Number(b.distance || 0);
      return Number(Boolean(b.streamUrl)) - Number(Boolean(a.streamUrl));
    });
    items = items.slice(0, limit);

    const liveCount = items.filter((x) => x.streamUrl).length;
    const scenicCount = items.filter((x) => x.scenic).length;
    const positionOnlyCount = items.filter((x) => !x.streamUrl).length;
    return json(res, 200, {
      zeroKey:true,
      query:q || undefined,
      activeSources:sourceStatus.filter((x)=>x.ok).map((x)=>x.name),
      failedSources:sourceStatus.filter((x)=>!x.ok).map((x)=>x.name),
      sourceStatus,
      coverage:{
        sourceCount:sourceStatus.length,
        activeSourceCount:sourceStatus.filter((x)=>x.ok).length,
        registryCount:registry.length,
        liveCount,
        viewableCount:liveCount,
        scenicCount,
        positionOnlyCount,
        referencePlaybackCount:0,
      },
      items,
      discovery: hasCoords ? { provider:'official-original', referencePlayback:false } : undefined,
      message: items.length ? undefined : (q
        ? '目前未找到此景點／路口可直接使用的原始公開 CCTV；只保留官方可驗證來源，不嵌入第三方參考站。'
        : '此範圍目前沒有取得 CCTV 點位或可直接播放影像。'),
      note: national
        ? '全台模式使用高速公路局、公路局與已整合地方政府原始公開來源。'
        : '區域模式融合道路 CCTV 與景點官方直播；第三方網站只作來源辨識參考，實際播放一律連原始公開來源。',
    }, 's-maxage=900, stale-while-revalidate=7200');
  } catch (e) {
    return json(res, 502, { error:`CCTV 資料暫時無法取得：${e.message}` }, 'no-store');
  }
};
