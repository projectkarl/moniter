const { json, fetchText, distanceKm, tag, xmlBlocks } = require('./_utils');

const SOURCES = [
  {
    id: 'freeway',
    name: '交通部高速公路局',
    url: 'https://tisvcloud.freeway.gov.tw/history/motc20/CCTV.xml',
    kind: 'xml',
  },
  {
    id: 'highway',
    name: '交通部公路局省道',
    url: 'https://cctv-maintain.thb.gov.tw/opendataCCTVs.xml',
    kind: 'xml',
  },
  {
    id: 'chiayi-city',
    name: '嘉義市政府',
    url: 'https://117.56.103.67/MOTC_XML/XML/CCTV2_Info.ashx',
    kind: 'xml',
  },
  {
    id: 'taipei-position',
    name: '臺北市交通管制工程處 CCTV 設施',
    url: 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=d317a3c4-ff08-48af-894e-31dfb5155de3',
    kind: 'csv-position',
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
    access: 'live',
  })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lon));
}

function csvRows(text) {
  const rows = [];
  let row = [], cur = '', quote = false;
  for (let i=0;i<String(text).length;i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quote && text[i+1] === '"') { cur += '"'; i++; }
      else quote = !quote;
    } else if (ch === ',' && !quote) { row.push(cur); cur=''; }
    else if ((ch === '\n' || ch === '\r') && !quote) {
      if (ch === '\r' && text[i+1] === '\n') i++;
      row.push(cur); cur='';
      if (row.some((v)=>String(v).trim())) rows.push(row);
      row=[];
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); if (row.some((v)=>String(v).trim())) rows.push(row); }
  return rows;
}

function keyNorm(v='') { return String(v).replace(/^\ufeff/,'').replace(/[\s_\-()（）]/g,'').toLowerCase(); }
function findCol(headers, candidates) {
  const normalized = headers.map(keyNorm);
  for (const c of candidates) {
    const k = keyNorm(c);
    const exact = normalized.indexOf(k); if (exact >= 0) return exact;
    const partial = normalized.findIndex((x)=>x.includes(k) || k.includes(x)); if (partial >= 0) return partial;
  }
  return -1;
}

function parseTaipeiCsv(text, source) {
  const rows = csvRows(text);
  if (rows.length < 2) return [];
  const h = rows[0];
  const idI = findCol(h, ['流水號','序號','id']);
  const nameI = findCol(h, ['攝影機編號位置','攝影機位置','位置','camera']);
  const lonI = findCol(h, ['WGSXWGS84經度座標','WGSX','經度','longitude']);
  const latI = findCol(h, ['WGSYWGS84緯度座標','WGSY','緯度','latitude']);
  return rows.slice(1).map((r, idx) => {
    const lon = Number(r[lonI]); const lat = Number(r[latI]);
    const location = nameI >= 0 ? String(r[nameI] || '').trim() : '';
    return {
      id: `${source.id}:${idI >= 0 ? String(r[idI]||idx).trim() : idx}`,
      streamUrl: '',
      lon, lat,
      road: location || '臺北市路口 CCTV',
      direction: '', start:'', end:'', mile:'',
      source: source.name,
      access: 'position-only',
      note: '官方公開 CCTV 設施位置；臺北市即時交通影像需另行申請授權介接。',
    };
  }).filter((x)=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&x.lat>24.8&&x.lat<25.3&&x.lon>121.2&&x.lon<121.9);
}

async function fetchSource(source) {
  const text = await fetchText(source.url, {}, source.id === 'highway' ? 18000 : 15000);
  return source.kind === 'csv-position' ? parseTaipeiCsv(text, source) : parseStandardXml(text, source);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {}, 'no-store');
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(260, Math.max(2, Number(req.query.radius || 40)));
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
      .slice(0, 520);

    const activeSources = SOURCES.filter((_, i) => settled[i]?.status === 'fulfilled').map((s) => s.name);
    return json(res, 200, {
      zeroKey: true,
      activeSources,
      failedSources: SOURCES.filter((_, i) => settled[i]?.status !== 'fulfilled').map((s) => s.name),
      items,
      message: items.length ? undefined : '此範圍內目前沒有可用的公開交通 CCTV，或資料來源暫時離線。',
      note: '含可直接播放的公開交通影像與部分地方政府公開 CCTV 設施位置。位置公開不等於影像串流免授權。',
    }, 's-maxage=21600, stale-while-revalidate=86400');
  } catch (e) {
    return json(res, 502, { error: `CCTV 資料暫時無法取得：${e.message}` }, 'no-store');
  }
};
