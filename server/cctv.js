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
  const re = /<a\b[^>]*href=["'](?:https?:\/\/(?:www\.)?twipcam\.com)?\/cam\/([^"'?#/]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(String(html)))) {
    const slug = decodeURIComponent(m[1]).trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
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
  const nearbyUrl = `https://www.twipcam.com/nearby?lat=${Number(lat).toFixed(6)}&lon=${Number(lon).toFixed(6)}`;
  const nearbyHtml = await fetchText(nearbyUrl, { headers:{ Accept:'text/html,application/xhtml+xml' } }, 9000);
  const links = parseTwipcamLinks(nearbyHtml).slice(0, Math.max(4, Math.min(20, maxItems)));
  const settled = await Promise.allSettled(links.map(async (link) => {
    const pageUrl = `https://www.twipcam.com/cam/${encodeURIComponent(link.slug)}`;
    const html = await fetchText(pageUrl, { headers:{ Accept:'text/html,application/xhtml+xml' } }, 8000);
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
    const { items: registry, sourceStatus } = await loadRegistry({ liveOnly:true });
    const viewableRegistry = registry.filter((camera) => camera.streamUrl);
    let indexed = [];
    const includeIndex = hasCoords && !national && String(req.query.index || '1') !== '0';
    if (includeIndex) {
      try {
        indexed = await loadTwipcamNearby(lat, lon, Math.min(16, limit));
        sourceStatus.push({ id:'twipcam-index', name:'twipcam 公開即時影像索引', region:'座標附近', ok:true, count:indexed.length, access:'live-index' });
      } catch (err) {
        sourceStatus.push({ id:'twipcam-index', name:'twipcam 公開即時影像索引', region:'座標附近', ok:false, count:0, access:'live-index', error:String(err?.message || err).slice(0,140) });
      }
    }
    const combined = mergeCameras(viewableRegistry, indexed);
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
    const indexedCount = indexed.length;
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
        positionOnlyCount: 0,
      },
      items,
      discovery: hasCoords ? { provider:'twipcam', nearbyUrl:`https://www.twipcam.com/nearby?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}` } : undefined,
      message: items.length ? undefined : (q ? '目前可觀看的公開 CCTV 沒有命中此路口／地點，可再使用周邊公開影像查詢。' : '此範圍內目前沒有可直接播放的公開交通 CCTV。'),
      note: '只回傳可觀看公開影像 CCTV。搜尋地點時會在同一介面內補入 twipcam 公開索引的附近鏡頭；全台模式顯示所有目前可直接取得的官方公開影像，不再做地理抽樣。',
    }, 's-maxage=1800, stale-while-revalidate=21600');
  } catch (e) {
    return json(res, 502, { error: `CCTV 資料暫時無法取得：${e.message}` }, 'no-store');
  }
};
