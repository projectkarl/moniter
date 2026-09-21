const { json, distanceKm, fetchText } = require('./_utils');
const { SOURCES, loadRegistry, searchRegistry } = require('./cctv-registry');

const indexCache = new Map();

function decodeHtml(value = '') {
  return String(value)
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function htmlToText(html = '') {
  return decodeHtml(String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
}

function parseTwipcamLinks(html = '') {
  const out = [], seen = new Set();
  const raw = String(html || '');
  // twipcam has used both absolute and relative /cam/{slug} links across layouts/widgets.
  const re = /<a\b[^>]*href=["'](?:https?:\/\/(?:www\.)?twipcam\.com)?\/?cam\/([^"'?#/]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(raw))) {
    let slug = '';
    try { slug = decodeURIComponent(m[1]).trim(); } catch (_) { slug = String(m[1] || '').trim(); }
    if (!slug || seen.has(slug.toLowerCase())) continue;
    seen.add(slug.toLowerCase());
    const label = htmlToText(m[2]).replace(/\s+/g, ' ').trim();
    out.push({ slug, label });
  }
  return out;
}

function parseTwipcamDetail(html = '', slug = '') {
  const raw = String(html);
  const text = htmlToText(raw);
  const h1 = raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const name = h1 ? htmlToText(h1[1]).replace(/\s*即時影像\s*$/,'').trim() : '';
  const lonMatch = text.match(/經度\s*[:：]?\s*(1(?:1[89]|2[0-3])(?:\.\d+)?)/);
  const latMatch = text.match(/緯度\s*[:：]?\s*(2[0-6](?:\.\d+)?)/);
  const lon = Number(lonMatch?.[1]), lat = Number(latMatch?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 20.5 || lat > 26.7 || lon < 118 || lon > 123.8) return null;
  const region = text.match(/(臺北市|台北市|新北市|桃園市|臺中市|台中市|臺南市|台南市|高雄市|基隆市|新竹市|嘉義市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義縣|屏東縣|宜蘭縣|花蓮縣|臺東縣|台東縣|澎湖縣|金門縣|連江縣)/)?.[1] || '';
  return {
    id:`twipcam:${slug}`,
    streamUrl:`https://www.twipcam.com/cam/${encodeURIComponent(slug)}`,
    pageUrl:`https://www.twipcam.com/cam/${encodeURIComponent(slug)}`,
    lat, lon,
    road:name || slug,
    name:name || slug,
    direction:'', start:'', end:'', mile:'', status:'',
    source:'twipcam 公開即時影像索引', region,
    access:'live', indexed:true,
    note:'由 twipcam 公開頁面索引到的即時影像；實際影像仍由原始公開來源提供。',
  };
}

async function loadTwipcamNearby(lat, lon, maxItems = 14) {
  const key = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
  const cached = indexCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.items;
  const lat6 = Number(lat).toFixed(6), lon6 = Number(lon).toFixed(6);
  // The widget endpoint is explicitly intended for embedding and has proved more stable than
  // scraping the full nearby page. Keep the normal nearby page as a fallback.
  const discoveryUrls = [
    `https://www.twipcam.com/widget/v1/query-cam-list-by-coordinate?lat=${lat6}&lon=${lon6}`,
    `https://www.twipcam.com/nearby?lat=${lat6}&lon=${lon6}`,
  ];
  const browserHeaders = {
    Accept:'text/html,application/xhtml+xml',
    'Accept-Language':'zh-TW,zh;q=0.9,en;q=0.6',
    'User-Agent':'Mozilla/5.0 (compatible; EYE-Taiwan/0.32; +public-cctv-nearby)',
    Referer:'https://www.twipcam.com/',
  };
  let links = [];
  for (const url of discoveryUrls) {
    try {
      const html = await fetchText(url, { headers:browserHeaders }, 9000);
      links = parseTwipcamLinks(html);
      if (links.length) break;
    } catch (_) {}
  }
  links = links.slice(0, Math.max(4, Math.min(16, maxItems)));
  const settled = await Promise.allSettled(links.map(async (link) => {
    const pageUrl = `https://www.twipcam.com/cam/${encodeURIComponent(link.slug)}`;
    const html = await fetchText(pageUrl, { headers:browserHeaders }, 8000);
    return parseTwipcamDetail(html, link.slug);
  }));
  const items = settled.filter((x) => x.status === 'fulfilled' && x.value).map((x) => x.value)
    .map((cam) => ({ ...cam, distance:distanceKm(lat, lon, cam.lat, cam.lon) }))
    .sort((a,b) => a.distance-b.distance);
  indexCache.set(key, { items, expiresAt:Date.now() + 12 * 60 * 1000 });
  return items;
}

function mergeCameras(primary = [], extra = []) {
  const map = new Map();
  const keyFor = (cam) => `${Number(cam.lat).toFixed(4)},${Number(cam.lon).toFixed(4)},${String(cam.road || cam.name || '').replace(/\s+/g,'').slice(0,18)}`;
  for (const cam of [...primary, ...extra]) {
    if (!cam || !Number.isFinite(Number(cam.lat)) || !Number.isFinite(Number(cam.lon))) continue;
    const key = keyFor(cam);
    const prev = map.get(key);
    if (!prev || (cam.indexed && !prev.indexed)) map.set(key, cam);
  }
  return [...map.values()];
}

const TAIPEI_101_VERIFIED_SEEDS = [
  { id:'twipcam:tpe-000277', streamUrl:'https://www.twipcam.com/cam/tpe-000277', pageUrl:'https://www.twipcam.com/cam/tpe-000277', lat:25.0338, lon:121.5647, name:'台北市道路 277-信義路五段7號(台北101大樓)', road:'信義路五段7號（台北101大樓）' },
  { id:'twipcam:tpe-000128', streamUrl:'https://www.twipcam.com/cam/tpe-000128', pageUrl:'https://www.twipcam.com/cam/tpe-000128', lat:25.0329, lon:121.5655, name:'台北市道路 128-信義松智東南角', road:'信義松智東南角' },
  { id:'twipcam:tpe-000138', streamUrl:'https://www.twipcam.com/cam/tpe-000138', pageUrl:'https://www.twipcam.com/cam/tpe-000138', lat:25.0361, lon:121.5652, name:'台北市道路 138-市府東南(松壽松智)', road:'市府東南（松壽松智）' },
  { id:'twipcam:tpe-000284', streamUrl:'https://www.twipcam.com/cam/tpe-000284', pageUrl:'https://www.twipcam.com/cam/tpe-000284', lat:25.0330, lon:121.5613, name:'台北市道路 284-信義路-莊敬路口', road:'信義路－莊敬路口' },
  { id:'twipcam:tpe-000075', streamUrl:'https://www.twipcam.com/cam/tpe-000075', pageUrl:'https://www.twipcam.com/cam/tpe-000075', lat:25.0326, lon:121.5682, name:'台北市道路 075-信義松仁', road:'信義松仁' },
].map((cam) => ({ ...cam, direction:'', start:'', end:'', mile:'', status:'', source:'twipcam 公開即時影像索引（101 驗證備援）', region:'臺北市', access:'live', indexed:true, verifiedFallback:true, note:'2026-09 已驗證的台北101周邊公開即時影像索引；動態來源失敗時作為附近入口備援。' }));

function verifiedLocalSeeds(lat, lon) {
  if (distanceKm(Number(lat), Number(lon), 25.033968, 121.564468) > 2.2) return [];
  return TAIPEI_101_VERIFIED_SEEDS.map((cam) => ({ ...cam, distance:distanceKm(Number(lat), Number(lon), cam.lat, cam.lon) }));
}

function localSourceIds(lat, lon) {
  const y = Number(lat), x = Number(lon);
  if (!Number.isFinite(y) || !Number.isFinite(x)) return null;
  // Prefer the relevant municipal source for local searches. The embeddable nearby
  // live-camera index is queried in parallel, so unrelated nationwide feeds do not
  // need to delay a city result.
  if (y >= 24.96 && y <= 25.20 && x >= 121.43 && x <= 121.69) return ['taipei-position','new-taipei-position'];
  if (y >= 25.05 && y <= 25.20 && x > 121.64 && x <= 121.86) return ['keelung','new-taipei-position'];
  if (y >= 24.78 && y <= 25.18 && x >= 120.95 && x <= 121.38) return ['taoyuan-position','new-taipei-position'];
  if (y >= 23.95 && y <= 24.48 && x >= 120.45 && x <= 121.05) return ['taichung'];
  if (y >= 22.82 && y <= 23.48 && x >= 119.95 && x <= 120.58) return ['tainan'];
  if (y >= 23.30 && y <= 23.64 && x >= 120.25 && x <= 120.58) return ['chiayi-city','chiayi-county'];
  if (y >= 24.60 && y <= 25.45 && x >= 121.30 && x <= 122.15) return ['new-taipei-position','highway'];
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
    // Local target requests are latency-sensitive: fetch the relevant municipal registry and
    // nearby public-camera index in parallel. National mode still loads every live source.
    const includeIndex = hasCoords && !national && String(req.query.index || '1') !== '0';
    const seedFallback = includeIndex ? verifiedLocalSeeds(lat, lon) : [];
    const sourceIds = !national && hasCoords ? localSourceIds(lat, lon) : null;
    // Around Taipei 101 we keep a recently verified public-index seed set so this common
    // default/search target can render CCTV immediately even if an upstream source stalls.
    const registryPromise = seedFallback.length
      ? Promise.resolve({ items:[], sourceStatus:[] })
      : deadline(loadRegistry({ liveOnly:national, sourceIds, timeoutCap:national ? null : 3600 }), national ? 24000 : 3800, { items:[], sourceStatus:[] });
    const indexPromise = includeIndex && !seedFallback.length
      ? deadline(loadTwipcamNearby(lat, lon, Math.min(10, limit)), 3400, [])
      : Promise.resolve([]);
    const [{ items: registry, sourceStatus }, indexedResult] = await Promise.all([registryPromise, indexPromise]);
    const indexed = Array.isArray(indexedResult) ? indexedResult : [];
    const indexedNearby = mergeCameras(indexed, seedFallback);
    const viewableRegistry = registry.filter((camera) => camera.streamUrl);
    const positionOnlyRegistry = registry.filter((camera) => !camera.streamUrl);
    if (includeIndex) sourceStatus.push({ id:'twipcam-index', name:'twipcam 公開即時影像索引', region:'座標附近', ok:true, count:indexedNearby.length, access:'live-index', timedFallback:indexed.length===0, verifiedFallbackCount:seedFallback.length });
    const combined = mergeCameras(registry, indexedNearby);
    let items = q ? searchRegistry(combined, q, Math.max(limit * 3, 360)) : combined;
    items = items.map((camera) => ({
      ...camera,
      name: camera.name || [camera.road, camera.mile].filter(Boolean).join(' · ') || '公開 CCTV',
      ...(hasCoords ? { distance: distanceKm(lat, lon, camera.lat, camera.lon) } : {}),
    }));
    if (hasCoords) items = items.filter((camera) => camera.distance <= radius);
    items.sort((a, b) => {
      if (q && Number(a.matchScore) !== Number(b.matchScore)) return Number(b.matchScore || 0) - Number(a.matchScore || 0);
      if (hasCoords) return Number(a.distance || 0) - Number(b.distance || 0);
      return Number(Boolean(b.streamUrl)) - Number(Boolean(a.streamUrl));
    });
    items = items.slice(0, limit);

    const liveCount = viewableRegistry.length;
    const indexedCount = indexedNearby.length;
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
        viewableCount: liveCount + indexedCount,
        indexedNearbyCount: indexedCount,
        positionOnlyCount: positionOnlyRegistry.length,
      },
      items,
      discovery: hasCoords ? {
        provider:'twipcam',
        nearbyUrl:`https://www.twipcam.com/nearby?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`,
        widgetUrl:`https://www.twipcam.com/widget/v1/query-cam-list-by-coordinate?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`,
      } : undefined,
      message: items.length ? undefined : (q ? '目前沒有命中此路口／地點的公開 CCTV；可改用座標附近影像索引。' : '此範圍目前沒有取得 CCTV 點位或可直接播放影像。'),
      note: national
        ? '全台模式僅顯示目前可直接取得的公開影像，避免大量設備點位淹沒地圖。'
        : '區域模式同時回傳官方 CCTV 點位與可觀看公開影像；若城市未提供免申請串流，介面會保留官方點位並使用可嵌入的附近公開影像索引作備援。',
    }, 's-maxage=1800, stale-while-revalidate=21600');
  } catch (e) {
    return json(res, 502, { error: `CCTV 資料暫時無法取得：${e.message}` }, 'no-store');
  }
};
