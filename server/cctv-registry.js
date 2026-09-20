const zlib = require('node:zlib');
const { fetchText, fetchBuffer, tag, xmlBlocks } = require('./_utils');

const CACHE_MS = 6 * 60 * 60 * 1000;
const registryCache = new Map();

const SOURCES = [
  {
    id: 'freeway', name: '交通部高速公路局', region: '全台國道', access: 'live', kind: 'xml-standard',
    url: 'https://tisvcloud.freeway.gov.tw/history/motc20/CCTV.xml', timeout: 18000,
  },
  {
    id: 'highway', name: '交通部公路局省道', region: '全台省道', access: 'live', kind: 'xml-standard',
    url: 'https://cctv-maintain.thb.gov.tw/opendataCCTVs.xml', timeout: 20000,
  },
  {
    id: 'chiayi-city', name: '嘉義市政府交通處', region: '嘉義市', access: 'live', kind: 'xml-standard',
    url: 'https://data.chiayi.gov.tw/opendata/api/getResource?oid=452283a9-bb9f-40fd-b748-228dd5c3fb1e&rid=c353736b-c126-4652-bc33-951423d73431', timeout: 16000,
  },
  {
    id: 'chiayi-county', name: '嘉義縣政府即時路況 CCTV', region: '嘉義縣', access: 'live', kind: 'ods-generic',
    url: 'https://ws-tm.cyhg.gov.tw/Download.ashx?n=Y2N0dmxpc3QtdjEub2Rz&u=LzAwMS9VcGxvYWQvMTM0Mi9yZWxmaWxlLzEyNTU4LzE5NjM5NS81ZTYwMzg5Zi0yZmE5LTQ3ZGQtYWY2NS0zYzZkMDc2ZWVmNDYub2Rz', timeout: 22000,
    fields: {
      id: ['CCTVID','cctvid','id','ID'], name: ['RoadName','roadname','Location','location','name'],
      lat: ['PositionLat','latitude','Latitude','lat'], lon: ['PositionLon','longitude','Longitude','lon','lng'],
      stream: ['VideoStreamURL','url','URL','streamUrl'], direction: ['RoadDirection','direction','Direction'],
    },
    note: '嘉義縣政府公開即時路況 CCTV；上游以 ODS 發布，本專案於伺服器端直接解析，不需 API 金鑰。',
  },
  {
    id: 'tainan', name: '臺南市政府交通局', region: '臺南市', access: 'live', kind: 'json-generic',
    url: 'https://trafficopendata.tainan.gov.tw/opendata/json/cctv/latest', timeout: 16000,
    fields: {
      id: ['CCTVID','cctvid','id','ID'], name: ['Location','location','RoadName','roadname','name'],
      lat: ['wgsy','WGSY','PositionLat','latitude','Latitude','lat'], lon: ['wgsx','WGSX','PositionLon','longitude','Longitude','lon','lng'],
      stream: ['url','URL','VideoStreamURL','videoStreamURL','streamUrl'], direction: ['RoadDirection','direction','Direction'],
    },
  },
  {
    id: 'taichung', name: '臺中市政府交通局', region: '臺中市', access: 'live', kind: 'json-generic',
    url: 'https://newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=6c9f5fd5-d74c-4450-9339-1a00e6cda2e6', timeout: 16000,
    fields: {
      id: ['cctvid','CCTVID','id','ID'], name: ['roadsection','RoadSection','location','Location','roadname','RoadName'],
      lat: ['py','PY','PositionLat','latitude','Latitude','lat'], lon: ['px','PX','PositionLon','longitude','Longitude','lon','lng'],
      stream: ['url','URL','VideoStreamURL','streamUrl'], direction: ['direction','Direction','RoadDirection'], status: ['status','Status'],
    },
  },
  {
    id: 'taipei-position', name: '臺北市交通管制工程處 CCTV 設施', region: '臺北市', access: 'position-only', kind: 'csv-generic',
    url: 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=d317a3c4-ff08-48af-894e-31dfb5155de3', timeout: 16000,
    fields: {
      id: ['流水號','序號','編號','id','Serial number'], name: ['攝影機編號位置','攝影機編號','攝影機位置','位置','路口','camera','Camera number'],
      lat: ['WGSYWGS84緯度座標','WGSY','WGS84Y','緯度','latitude'], lon: ['WGSXWGS84經度座標','WGSX','WGS84X','經度','longitude'],
    },
    note: '官方公開 CCTV 設施位置；即時交通影像需依臺北市授權規範介接。',
  },
  {
    id: 'new-taipei-position', name: '新北市政府交通局 CCTV 點位', region: '新北市', access: 'position-only', kind: 'json-generic',
    url: 'https://data.ntpc.gov.tw/api/datasets/157501bf-f1cd-4838-92a7-612770351e43/json?page=0&size=2000', timeout: 16000,
    fields: {
      id: ['id','ID','cctv_id','CCTVID','項次','編號'], name: ['equipment','location','Location','address','Address','位置','設備位置','路口'],
      lat: ['lat','latitude','Latitude','緯度','PositionLat'], lon: ['lon','lng','longitude','Longitude','經度','PositionLon'],
    },
    note: '官方公開 CCTV 點位；未提供可直接免授權播放的串流時僅顯示位置。',
  },
  {
    id: 'keelung', name: '基隆市政府公開 CCTV', region: '基隆市', access: 'live', kind: 'csv-generic',
    url: 'https://www.klcg.gov.tw/wSite/public/Attachment/016/f1728008895657.csv', timeout: 16000,
    fields: {
      id: ['CCTVID','cctvid','編號','id'], name: ['RoadName','路名','位置','SurveillanceDescription','location'],
      lat: ['PositionLat','緯度','latitude','lat'], lon: ['PositionLon','經度','longitude','lon'],
      stream: ['VideoStreamURL','URL','url','影像網址'], direction: ['RoadDirection','方向','direction'],
    },
  },
  {
    id: 'taoyuan-position', name: '桃園市政府警察局路口監視器', region: '桃園市', access: 'position-only', kind: 'csv-generic',
    url: 'https://opendata.tycg.gov.tw/api/dataset/07c81524-7e13-4cc7-a1bf-286ea86b0778/resource/376a0cfd-ae39-4a6c-afa2-30b561033f09/download', timeout: 16000,
    fields: {
      id: ['編號','序號','id'], name: ['監控點名稱','攝影機名稱','設置地點','位置','路口'],
      lat: ['緯度','latitude','lat'], lon: ['經度','longitude','lon','lng'], direction: ['管轄分局','分局'],
    },
    note: '官方公開路口監視器位置；資料集未提供可直接播放影像網址。',
  },
];

function decodeXmlUrl(v = '') {
  return String(v).replace(/&amp;/g, '&').replace(/&#38;/g, '&').trim();
}

function csvRows(text) {
  const rows = [];
  let row = [], cur = '', quote = false;
  const input = String(text || '').replace(/^\ufeff/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quote && input[i + 1] === '"') { cur += '"'; i++; }
      else quote = !quote;
    } else if (ch === ',' && !quote) { row.push(cur); cur = ''; }
    else if ((ch === '\n' || ch === '\r') && !quote) {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((v) => String(v).trim())) rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); if (row.some((v) => String(v).trim())) rows.push(row); }
  return rows;
}

function keyNorm(v = '') {
  return String(v).replace(/^\ufeff/, '').replace(/[\s_\-()（）【】\[\]\/\\.:：]/g, '').toLowerCase();
}

function fieldValue(obj = {}, candidates = []) {
  const keys = Object.keys(obj);
  const normalized = keys.map((k) => keyNorm(k));
  for (const candidate of candidates || []) {
    const n = keyNorm(candidate);
    const exact = normalized.indexOf(n);
    if (exact >= 0 && obj[keys[exact]] != null) return obj[keys[exact]];
  }
  for (const candidate of candidates || []) {
    const n = keyNorm(candidate);
    const partial = normalized.findIndex((k) => k && n && (k.includes(n) || n.includes(k)));
    if (partial >= 0 && obj[keys[partial]] != null) return obj[keys[partial]];
  }
  return '';
}

function findCol(headers, candidates) {
  const normalized = headers.map(keyNorm);
  for (const c of candidates || []) {
    const k = keyNorm(c);
    const exact = normalized.indexOf(k); if (exact >= 0) return exact;
  }
  for (const c of candidates || []) {
    const k = keyNorm(c);
    const partial = normalized.findIndex((x) => x && k && (x.includes(k) || k.includes(x)));
    if (partial >= 0) return partial;
  }
  return -1;
}

function normalizeCoordinate(value) {
  if (value == null) return NaN;
  const raw = String(value).trim().replace(/,/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function plausibleTaiwan(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 20.5 && lat <= 26.7 && lon >= 118 && lon <= 123.8;
}

function cameraRecord(source, raw, index) {
  const f = source.fields || {};
  const rawId = fieldValue(raw, f.id || ['CCTVID','id','編號','序號']);
  let lat = normalizeCoordinate(fieldValue(raw, f.lat || ['PositionLat','Latitude','latitude','緯度','lat']));
  let lon = normalizeCoordinate(fieldValue(raw, f.lon || ['PositionLon','Longitude','longitude','經度','lon','lng']));
  // Defensive swap for providers that publish X/Y with inverted labels.
  if (!plausibleTaiwan(lat, lon) && plausibleTaiwan(lon, lat)) [lat, lon] = [lon, lat];
  const road = String(fieldValue(raw, f.name || ['RoadName','Location','位置','路口','name']) || '').trim();
  const streamUrl = source.access === 'position-only' ? '' : decodeXmlUrl(fieldValue(raw, f.stream || ['VideoStreamURL','URL','url','streamUrl']));
  const direction = String(fieldValue(raw, f.direction || ['RoadDirection','Direction','direction','方向']) || '').trim();
  const status = String(fieldValue(raw, f.status || ['status','Status','狀態']) || '').trim();
  const item = {
    id: `${source.id}:${String(rawId || index).trim()}`,
    streamUrl,
    lon, lat,
    road: road || `${source.region || source.name} CCTV`,
    direction,
    start: '', end: '', mile: '', status,
    source: source.name,
    region: source.region || '',
    access: streamUrl ? 'live' : 'position-only',
    note: source.note || (streamUrl ? '政府公開交通 CCTV 影像來源。' : '政府公開 CCTV 位置；未提供可直接免授權播放的串流。'),
  };
  return plausibleTaiwan(item.lat, item.lon) ? item : null;
}

function parseStandardXml(xml, source) {
  let blocks = xmlBlocks(xml, 'CCTV');
  if (!blocks.length) blocks = xmlBlocks(xml, 'Camera');
  return blocks.map((block, index) => {
    const raw = {
      CCTVID: tag(block, 'CCTVID') || tag(block, 'ID'),
      VideoStreamURL: tag(block, 'VideoStreamURL') || tag(block, 'videostreamurl') || tag(block, 'URL') || tag(block, 'Url'),
      PositionLon: tag(block, 'PositionLon') || tag(block, 'positionlon') || tag(block, 'Longitude') || tag(block, 'X'),
      PositionLat: tag(block, 'PositionLat') || tag(block, 'positionlat') || tag(block, 'Latitude') || tag(block, 'Y'),
      RoadName: tag(block, 'RoadName') || tag(block, 'roadname') || tag(block, 'RoadID') || tag(block, 'Location'),
      RoadDirection: tag(block, 'RoadDirection') || tag(block, 'roaddirection') || tag(block, 'Direction'),
      Start: tag(block, 'Start'), End: tag(block, 'End'), LocationMile: tag(block, 'LocationMile'),
    };
    const rec = cameraRecord({ ...source, fields: {
      id:['CCTVID'], stream:['VideoStreamURL'], lon:['PositionLon'], lat:['PositionLat'], name:['RoadName'], direction:['RoadDirection'],
    } }, raw, index);
    if (rec) {
      rec.start = raw.Start || '';
      rec.end = raw.End || '';
      rec.mile = raw.LocationMile || '';
    }
    return rec;
  }).filter(Boolean);
}

function jsonRows(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const preferred = ['data','Data','result','Result','records','Records','items','Items','retVal','response','Response','CCTVs','cctvs'];
  for (const key of preferred) {
    if (!(key in value)) continue;
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    const rows = jsonRows(nested);
    if (rows.length) return rows;
  }
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested) && nested.length && typeof nested[0] === 'object') return nested;
  }
  return [];
}

function parseJsonGeneric(text, source) {
  const clean = String(text || '').replace(/^\ufeff/, '').trim();
  const body = JSON.parse(clean);
  return jsonRows(body).map((raw, index) => cameraRecord(source, raw, index)).filter(Boolean);
}

function parseCsvGeneric(text, source) {
  const rows = csvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((x) => String(x).trim());
  const f = source.fields || {};
  const indices = {};
  for (const [key, candidates] of Object.entries(f)) indices[key] = findCol(headers, candidates);
  return rows.slice(1).map((row, index) => {
    const raw = {};
    for (const [key, idx] of Object.entries(indices)) if (idx >= 0) raw[key] = row[idx];
    const mapped = {
      id: raw.id, name: raw.name, lat: raw.lat, lon: raw.lon, stream: raw.stream, direction: raw.direction, status: raw.status,
    };
    return cameraRecord({ ...source, fields: {
      id:['id'], name:['name'], lat:['lat'], lon:['lon'], stream:['stream'], direction:['direction'], status:['status'],
    } }, mapped, index);
  }).filter(Boolean);
}

function decodeXmlText(value = '') {
  return String(value)
    .replace(/<text:line-break\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, ' ').trim();
}

function extractZipEntry(buffer, wantedName) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (buf.length < 22) throw new Error('Invalid ODS/ZIP payload');
  let eocd = -1;
  const start = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= start; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ODS central directory not found');
  const entries = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < entries && ptr + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
    const method = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const fileNameLength = buf.readUInt16LE(ptr + 28);
    const extraLength = buf.readUInt16LE(ptr + 30);
    const commentLength = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const fileName = buf.subarray(ptr + 46, ptr + 46 + fileNameLength).toString('utf8');
    if (fileName === wantedName) {
      if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('ODS local file header invalid');
      const localNameLength = buf.readUInt16LE(localOffset + 26);
      const localExtraLength = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > buf.length) throw new Error('ODS entry truncated');
      const packed = buf.subarray(dataStart, dataEnd);
      if (method === 0) return packed;
      if (method === 8) return zlib.inflateRawSync(packed, { maxOutputLength: 12 * 1024 * 1024 });
      throw new Error(`Unsupported ODS compression method ${method}`);
    }
    ptr += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`ODS entry ${wantedName} not found`);
}

function odsRowsFromContentXml(xml) {
  const rows = [];
  const rowBlocks = String(xml).match(/<table:table-row(?:\s[^>]*)?>[\s\S]*?<\/table:table-row>/gi) || [];
  for (const rowBlock of rowBlocks) {
    const row = [];
    const cellRe = /<table:table-cell([^>]*)>([\s\S]*?)<\/table:table-cell>|<table:table-cell([^>]*)\/>/gi;
    let m;
    while ((m = cellRe.exec(rowBlock))) {
      const attrs = m[1] || m[3] || '';
      const body = m[2] || '';
      const repeatMatch = attrs.match(/table:number-columns-repeated="(\d+)"/i);
      const repeat = Math.min(64, Math.max(1, Number(repeatMatch?.[1] || 1)));
      const paragraphs = [...body.matchAll(/<text:p(?:\s[^>]*)?>([\s\S]*?)<\/text:p>/gi)].map((x) => decodeXmlText(x[1]));
      const valueAttr = attrs.match(/office:(?:string-value|value)="([^"]*)"/i)?.[1] || '';
      const value = paragraphs.filter(Boolean).join(' ').trim() || decodeXmlText(valueAttr);
      for (let i = 0; i < repeat; i++) row.push(value);
    }
    if (row.some((x) => String(x).trim())) rows.push(row);
  }
  return rows;
}

function parseOdsGeneric(buffer, source) {
  const content = extractZipEntry(buffer, 'content.xml').toString('utf8');
  const rows = odsRowsFromContentXml(content);
  if (rows.length < 2) return [];
  const headers = rows[0].map((x) => String(x).trim());
  const f = source.fields || {};
  const indices = {};
  for (const [key, candidates] of Object.entries(f)) indices[key] = findCol(headers, candidates);
  return rows.slice(1).map((row, index) => {
    const raw = {};
    for (const [key, idx] of Object.entries(indices)) if (idx >= 0) raw[key] = row[idx];
    const mapped = { id:raw.id, name:raw.name, lat:raw.lat, lon:raw.lon, stream:raw.stream, direction:raw.direction, status:raw.status };
    return cameraRecord({ ...source, fields:{ id:['id'], name:['name'], lat:['lat'], lon:['lon'], stream:['stream'], direction:['direction'], status:['status'] } }, mapped, index);
  }).filter(Boolean);
}

function parseSourceText(text, source) {
  if (source.kind === 'xml-standard') return parseStandardXml(text, source);
  if (source.kind === 'json-generic') return parseJsonGeneric(text, source);
  if (source.kind === 'csv-generic') return parseCsvGeneric(text, source);
  return [];
}

async function fetchSource(source, { force = false } = {}) {
  const now = Date.now();
  const cached = registryCache.get(source.id);
  if (!force && cached && cached.expiresAt > now) return cached.items;
  const items = source.kind === 'ods-generic'
    ? parseOdsGeneric(await fetchBuffer(source.url, {}, source.timeout || 22000, 16 * 1024 * 1024), source)
    : parseSourceText(await fetchText(source.url, {}, source.timeout || 16000), source);
  registryCache.set(source.id, { items, expiresAt: now + CACHE_MS });
  return items;
}

async function loadRegistry(options = {}) {
  const sourceList = options.liveOnly ? SOURCES.filter((source) => source.access !== 'position-only') : SOURCES;
  const settled = await Promise.allSettled(sourceList.map((source) => fetchSource(source, options)));
  const dedup = new Map();
  const sourceStatus = [];
  settled.forEach((result, index) => {
    const source = sourceList[index];
    if (result.status === 'fulfilled') {
      sourceStatus.push({ id:source.id, name:source.name, region:source.region, ok:true, count:result.value.length, access:source.access });
      result.value.forEach((camera) => {
        const streamKey = camera.streamUrl ? String(camera.streamUrl).replace(/^http:/i, 'https:') : '';
        const key = streamKey || `${camera.lat.toFixed(5)},${camera.lon.toFixed(5)},${keyNorm(camera.road)}`;
        if (!dedup.has(key)) dedup.set(key, camera);
      });
    } else {
      sourceStatus.push({ id:source.id, name:source.name, region:source.region, ok:false, count:0, access:source.access, error:String(result.reason?.message || result.reason || 'SOURCE OFFLINE').slice(0,140) });
    }
  });
  const items = [...dedup.values()];
  return { items, sourceStatus };
}

function normalizeSearch(value = '') {
  return String(value)
    .toLowerCase().replace(/臺/g, '台')
    .replace(/(?:cctv|監視器|監視攝影機|攝影機|即時影像|路況影像|查看|查詢|附近|目前)/gi, ' ')
    .replace(/[與和及]/g, ' ')
    .replace(/[、，,。．.\-_/／\\()（）【】\[\]]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function searchScore(camera, query) {
  const q = normalizeSearch(query);
  if (!q) return 0;
  const nameRaw = [camera.road, camera.name, camera.direction, camera.region, camera.source, camera.start, camera.end, camera.mile].filter(Boolean).join(' ');
  const name = normalizeSearch(nameRaw);
  if (!name) return -1;
  if (name === q) return 1000;
  if (name.startsWith(q)) return 800;
  if (name.includes(q)) return 650;
  const tokens = q.split(' ').filter(Boolean);
  if (!tokens.length) return -1;
  const hits = tokens.filter((token) => name.includes(token)).length;
  if (!hits) return -1;
  return hits === tokens.length ? 500 + hits * 35 : hits * 60;
}

function searchRegistry(items, query, limit = 120) {
  const max = Math.min(500, Math.max(1, Number(limit) || 120));
  return items.map((camera) => ({ camera, score: searchScore(camera, query) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.camera.streamUrl)) - Number(Boolean(a.camera.streamUrl)))
    .slice(0, max).map((x) => ({ ...x.camera, matchScore:x.score }));
}

async function resolveCamera(id) {
  const prefix = String(id || '').split(':')[0];
  const source = SOURCES.find((item) => item.id === prefix);
  if (!source) throw new Error('Unknown CCTV source');
  const items = await fetchSource(source);
  const camera = items.find((x) => String(x.id) === String(id));
  if (!camera) throw new Error('CCTV not found');
  return camera;
}

module.exports = {
  SOURCES,
  csvRows,
  jsonRows,
  parseSourceText,
  parseStandardXml,
  parseJsonGeneric,
  parseCsvGeneric,
  parseOdsGeneric,
  odsRowsFromContentXml,
  extractZipEntry,
  normalizeSearch,
  searchRegistry,
  loadRegistry,
  resolveCamera,
};
