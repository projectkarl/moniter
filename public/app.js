(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DEFAULT_CENTER = Object.freeze({ lat: 25.033968, lon: 121.564468, name: '台北 101' });
  const NATIONAL_CENTER = Object.freeze({ lat: 23.72, lon: 120.97, name: '台灣全域' });
  const state = {
    map: null,
    user: null,
    target: null,
    routeLayer: null,
    routeAltLayer: null,
    cameraLayer: null,
    cctvPreviewLayer: null,
    cctvPreviewCards: [],
    cctvCanvasRenderer: null,
    incidentLayer: null,
    flowLayer: null,
    cityFlowLayer: null,
    sentinelLayer: null,
    speedLayer: null,
    airLayer: null,
    quakeLayer: null,
    threatLayer: null,
    nationalHotspotLayer: null,
    annotationLayer: null,
    trackTrailLayer: null,
    currentWeather: null,
    latestCctv: [],
    cctvCoverage: null,
    targetRequestSeq: 0,
    mapProgrammaticUntil: 0,
    mapUserMovedAt: 0,
    locationWatchId: null,
    locationFollowing: false,
    locationAccuracyLayer: null,
    locationLastRefreshAt: 0,
    mapPointRequestSeq: 0,
    latestTraffic: [],
    latestFlow: [],
    latestCityFlow: [],
    latestNews: [],
    latestSpeedCameras: [],
    latestFlights: [],
    latestQuakes: [],
    latestAqi: null,
    latestParking: [],
    latestConstruction: [],
    latestFlood: [],
    currentSituation: null,
    nationalMode: true,
    freewayMode: false,
    nationalHotspots: [],
    nationalPreviewKey: '',
    nationalTimer: null,
    watchedZones: [],
    routeCandidates: [],
    newsLocation: null,
    currentRoute: null,
    originMode: 'taipei',
    inlineCamera: null,
    weatherAuto: true,
    speech: false,
    mapFx: false,
    deferredInstall: null,
    intelOpen: false,
    vehicleIntel: true,
    visionModel: null,
    visionModelPromise: null,
    visionAnalysis: null,
    visionRunning: false,
    visionBusy: false,
    visionLoopTimer: null,
    visionFrameCallbackId: null,
    visionLastDurationMs: 0,
    visionCadenceMs: 1400,
    visionLastRunAt: 0,
    visionTracks: new Map(),
    visionTrackSeq: 1,
    visionTrackCameraId: null,
    visionPlateShield: true,
    visionLastFrameAt: 0,
    anprWorker: null,
    anprWorkerPromise: null,
    anprRunning: false,
    anprBusy: false,
    anprCameraId: null,
    anprReads: new Map(),
    anprVotes: new Map(),
    anprLastAt: 0,
    anprTelemetry: { mode:'IDLE', lastAngle:0, attempts:0 },
    privacyShield: false,
    speedAlerts: true,
    cameraHandoff: true,
    transferFx: true,
    sensorMode: 'normal',
    detectionOverlay: false,
    voiceMarkup: true,
    cockpitActive: false,
    trackedContact: null,
    annotations: [],
    cesium: { viewer:null, entity:null, loadPromise:null },
    mapSource: 'satellite',
    searchMode: 'monitor',
    overlayVisibility: { flow:true, cctv:true, event:true, speed:false },
    baseMapLayer: null,
    lastThreatSignature: '',
    activeCamera: null,
    navigation: {
      active: false,
      watchId: null,
      lastPoint: null,
      heading: null,
      sensorHeading: null,
      activeCameraId: null,
      announced: new Set(),
      lastUiAt: 0,
      flowTimer: null,
      lastInstructionKey: '',
      offRouteHits: 0,
      rerouting: false,
      lastRerouteAt: 0,
      lastRouteProgress: 0,
      viewMode: 'map',
      immersiveCameraId: null,
      turnImageKey: '',
      turnImagePending: false,
    },
    motion: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  };

  const aliases = {
    '華南總行': { name: '華南商業銀行總行', lat: 25.0343, lon: 121.5692, address:'臺北市信義區松仁路123號' },
    '華南銀行總行': { name: '華南商業銀行總行', lat: 25.0343, lon: 121.5692, address:'臺北市信義區松仁路123號' },
    '華南商銀總行': { name: '華南商業銀行總行', lat: 25.0343, lon: 121.5692, address:'臺北市信義區松仁路123號' },
    '華南商業銀行總行': { name: '華南商業銀行總行', lat: 25.0343, lon: 121.5692, address:'臺北市信義區松仁路123號' },
    '台北101': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    '101': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    '信義101': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    '台北一零一': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    '世貿101': { name: '台北 101/世貿站', lat: 25.032971, lon: 121.563772 },
    '台北101世貿': { name: '台北 101/世貿站', lat: 25.032971, lon: 121.563772 },
    '台北101世貿站': { name: '台北 101/世貿站', lat: 25.032971, lon: 121.563772 },
    '市政府站': { name: '捷運市政府站', lat: 25.040850, lon: 121.567904 },
    '捷運市政府': { name: '捷運市政府站', lat: 25.040850, lon: 121.567904 },
    '象山站': { name: '捷運象山站', lat: 25.032766, lon: 121.570132 },
    '捷運象山': { name: '捷運象山站', lat: 25.032766, lon: 121.570132 },
    'a11': { name:'新光三越 台北信義新天地 A11', lat:25.03661, lon:121.56725, address:'110台北市信義區松壽路11號' }, '新光a11': { name:'新光三越 台北信義新天地 A11', lat:25.03661, lon:121.56725, address:'110台北市信義區松壽路11號' }, '信義a11': { name:'新光三越 台北信義新天地 A11', lat:25.03661, lon:121.56725, address:'110台北市信義區松壽路11號' }, '新光三越a11': { name:'新光三越 台北信義新天地 A11', lat:25.03661, lon:121.56725, address:'110台北市信義區松壽路11號' }, '新光三越信義a11': { name:'新光三越 台北信義新天地 A11', lat:25.03661, lon:121.56725, address:'110台北市信義區松壽路11號' }, '新光三越台北信義新天地a11': { name:'新光三越 台北信義新天地 A11', lat:25.03661, lon:121.56725, address:'110台北市信義區松壽路11號' },
    'a8': '新光三越 台北信義新天地 A8', '新光a8': '新光三越 台北信義新天地 A8',
    'a9': '新光三越 台北信義新天地 A9', '新光a9': '新光三越 台北信義新天地 A9',
    'a13': '遠東百貨 信義A13', '遠百a13': '遠東百貨 信義A13', '信義a13': '遠東百貨 信義A13',
    '遠百信義': '遠東百貨 信義A13', '信義遠百': '遠東百貨 信義A13',
    '板橋大遠百': 'Mega City 板橋大遠百', '板橋遠百': 'Mega City 板橋大遠百',
    '台中大遠百': 'Top City 台中大遠百', '台中遠百': 'Top City 台中大遠百',
    '高雄大遠百': '遠東百貨 高雄店', '高雄遠百': '遠東百貨 高雄店',
    '花蓮遠百': '遠東百貨 花蓮店',
    '台大': '國立臺灣大學', 'ntu': '國立臺灣大學',
    '宜大': '國立宜蘭大學', 'niu': '國立宜蘭大學',
    '北科大': '國立臺北科技大學', 'ntut': '國立臺北科技大學',
    '台科大': '國立臺灣科技大學', 'ntust': '國立臺灣科技大學',
    '政大': '國立政治大學', 'nccu': '國立政治大學',
    '師大': '國立臺灣師範大學', 'ntnu': '國立臺灣師範大學',
    '清大': '國立清華大學', 'nthu': '國立清華大學',
    '成大': '國立成功大學', 'ncku': '國立成功大學',
    '台北車站': { name: '台北車站', lat: 25.0478, lon: 121.5170 }, '北車': { name: '台北車站', lat: 25.0478, lon: 121.5170 },
    '南科': '南部科學園區', '台南科學園區': '南部科學園區',
    '竹科': '新竹科學園區', '中科': '中部科學園區',
    '南港展覽館': '台北南港展覽館', '南港展覽': '台北南港展覽館',
    '北流': '臺北流行音樂中心',
    '晶華': '台北晶華酒店', '台北晶華': '台北晶華酒店',
    '礁溪老爺': '礁溪老爺酒店', '新竹老爺': '新竹老爺酒店', '台北老爺': '台北老爺大酒店',
    '知本老爺': '知本老爺酒店', '南港老爺': '南港老爺行旅', '台南老爺': '台南老爺行旅',
    '桃園機場': { name: '桃園國際機場', lat: 25.0797, lon: 121.2342 }, '桃機': { name: '桃園國際機場', lat: 25.0797, lon: 121.2342 },
    '松機': '臺北松山機場', '高鐵台北': '高鐵台北站', '高鐵台中': '高鐵台中站', '高鐵左營': '高鐵左營站',
    '雪隧': { name: '雪山隧道', lat: 24.8680, lon: 121.7480 }, '雪山隧道': { name: '雪山隧道', lat: 24.8680, lon: 121.7480 },
    '高雄車站': { name: '高雄車站', lat: 22.6397, lon: 120.3027 },
    'lalaport南港': 'Mitsui Shopping Park LaLaport 南港', '南港lalaport': 'Mitsui Shopping Park LaLaport 南港', '三井lalaport南港': 'Mitsui Shopping Park LaLaport 南港',
  };

  const poiCatalog = [
    ['華南商業銀行總行','華南商業銀行總行 臺北市信義區松仁路123號','BANK / HQ',['華南總行','華南銀行總行','華南商銀總行','華南商業銀行總行','松仁路123號']],
    ['台北 101','台北 101','LANDMARK',['101','台北101','信義101']],
    ['新光三越 A11','新光三越 台北信義新天地 A11','MALL',['a11','新光a11','信義a11']],
    ['新光三越 A8','新光三越 台北信義新天地 A8','MALL',['a8','新光a8']],
    ['新光三越 A9','新光三越 台北信義新天地 A9','MALL',['a9','新光a9']],
    ['遠百信義 A13','遠東百貨 信義A13','MALL',['遠百','大遠百','a13','遠百a13','信義遠百']],
    ['板橋大遠百','Mega City 板橋大遠百','MALL',['遠百','大遠百','板橋遠百','板橋大遠百']],
    ['台中大遠百','Top City 台中大遠百','MALL',['遠百','大遠百','台中遠百','台中大遠百']],
    ['高雄大遠百','遠東百貨 高雄店','MALL',['遠百','大遠百','高雄遠百','高雄大遠百']],
    ['LaLaport 南港','Mitsui Shopping Park LaLaport 南港','MALL',['lalaport南港','南港lalaport','南港三井']],
    ['國立臺灣大學','國立臺灣大學','UNIVERSITY',['台大','ntu']],
    ['國立宜蘭大學','國立宜蘭大學','UNIVERSITY',['宜大','niu']],
    ['國立臺北科技大學','國立臺北科技大學','UNIVERSITY',['北科大','ntut']],
    ['國立臺灣科技大學','國立臺灣科技大學','UNIVERSITY',['台科大','ntust']],
    ['國立政治大學','國立政治大學','UNIVERSITY',['政大','nccu']],
    ['國立臺灣師範大學','國立臺灣師範大學','UNIVERSITY',['師大','ntnu']],
    ['國立清華大學','國立清華大學','UNIVERSITY',['清大','nthu']],
    ['國立成功大學','國立成功大學','UNIVERSITY',['成大','ncku']],
    ['台北車站','台北車站','TRANSIT',['北車','台北車站']],
    ['南部科學園區','南部科學園區','DISTRICT',['南科','台南科學園區']],
    ['新竹科學園區','新竹科學園區','DISTRICT',['竹科','新竹科學園區']],
    ['中部科學園區','中部科學園區','DISTRICT',['中科','中部科學園區']],
    ['台北晶華酒店','台北晶華酒店','HOTEL',['晶華','台北晶華']],
    ['礁溪老爺酒店','礁溪老爺酒店','HOTEL',['老爺','礁溪老爺']],
    ['台北老爺大酒店','台北老爺大酒店','HOTEL',['老爺','台北老爺']],
    ['新竹老爺酒店','新竹老爺酒店','HOTEL',['老爺','新竹老爺']],
    ['知本老爺酒店','知本老爺酒店','HOTEL',['老爺','知本老爺']],
    ['桃園國際機場','桃園國際機場','AIRPORT',['桃機','桃園機場']],
    ['雪山隧道','雪山隧道','TUNNEL',['雪隧','雪山隧道']],
  ].map(([label,query,category,keywords]) => ({ label, query, category, keywords }));

  const ambiguousAliases = new Set(['遠百','大遠百','老爺']);

  const SOURCE_CATALOG = [
    { id:'basemap', name:'底圖', source:'OpenStreetMap / Esri World Imagery', mode:'STATIC', note:'參考底圖，不是即時影像。' },
    { id:'weather', name:'天氣', source:'Open-Meteo', mode:'MODEL', note:'模式分析／預報資料；不等同現地測站即時觀測。' },
    { id:'route', name:'A→B 路線', source:'OSRM + Valhalla', mode:'MODEL', note:'跨區中長途加入高速公路偏好候選，再以 ETA、路況與替代路線比較；不等同商用導航完整交通 ETA。' },
    { id:'traffic', name:'交通事件', source:'警察廣播電臺公開資料', mode:'LIVE', note:'公開即時路況，可能有短暫發布延遲。' },
    { id:'flow', name:'國道流速', source:'高速公路局 LiveTraffic / SectionShape', mode:'LIVE', note:'官方路段流速；網站以快取降低公共服務負載。' },
    { id:'city-flow', name:'臺北市道路車流', source:'臺北市交通管制工程處 VD', mode:'OBSERVED', note:'公開車輛偵測器速度／流量；用於目標周邊道路車流，不等同每個路口影像分析。' },
    { id:'lane', name:'車道 Flow Edge', source:'高速公路局 VD lane-level', mode:'DERIVED', note:'以官方 Speed / Occupancy / Volume 計算短時相對流動優勢；不是保證。' },
    { id:'cctv', name:'公開 CCTV', source:'高速公路局／公路局／地方政府原始公開影像 + 景點官方直播', mode:'LIVE', note:'第三方站只作來源辨識參考；道路與景點影像實際播放直接連原始政府／官方來源。' },
    { id:'speed', name:'測速執法點', source:'警政署公開資料', mode:'STATIC', note:'公開設置點清單與公布速限；不是即時警方位置。' },
    { id:'aqi', name:'AQI', source:'環境部官方測站', mode:'OBSERVED', note:'官方測站觀測；更新頻率較交通資料慢，不等同秒級即時。' },
    { id:'flood', name:'淹水／水情', source:'水利署公開資料', mode:'LIVE', note:'官方警戒／水情訊號；依來源更新週期刷新。' },
    { id:'parking', name:'停車', source:'地方政府公開動態', mode:'LIVE', note:'目前以有公開動態的支援區域為主。' },
    { id:'construction', name:'施工', source:'地方政府／警廣公開資料', mode:'LIVE', note:'施工排程與事件；部分為計畫資訊而非現地感測。' },
    { id:'air', name:'航空訊號', source:'adsb.lol public ADS-B', mode:'LIVE', note:'公開 ADS-B；位置刷新有網路與接收延遲。' },
    { id:'quake', name:'地震', source:'USGS recent seismic feed', mode:'LIVE', note:'近期事件資料；並非地震預測。' },
    { id:'news', name:'區域新聞', source:'公開新聞來源', mode:'LIVE', note:'發布時間依各媒體而異。' },
    { id:'alert', name:'壅塞／威脅判斷', source:'SENTINEL local sensor fusion', mode:'DERIVED', note:'由官方事件、流速、天氣等融合；原因不確定時會標示未確認。' },
    { id:'cockpit', name:'Cockpit Follow', source:'ADS-B + CesiumJS / OSM', mode:'DERIVED', note:'公開 ADS-B 為 live；3D Cockpit 為按需載入的 OSM + WGS84 ellipsoid 視覺化，不是原版 Google Photorealistic 3D Tiles。' },
    { id:'cockpit-camera', name:'Cockpit Camera Framing', source:'SENTINEL camera transform', mode:'ESTIMATED', note:'由公開航空位置、航向、高度推導追蹤視角；不是機上真實攝影機或真實駕駛艙畫面。' },
    { id:'voice', name:'語音控制／標註', source:'Browser SpeechRecognition + local command parser', mode:'DERIVED', note:'Zero-Key 本地指令；不是原版需要 OpenAI key 的 Realtime AI agent。' },
    { id:'sensor', name:'NVG / FLIR / CRT / NOIR / SNOW', source:'SENTINEL display shader / CSS visual treatment', mode:'VISUAL', note:'只改畫面觀感，不改原始資料，也不是熱感測器或夜視硬體的真實量測。' },
    { id:'detection', name:'Detection Overlay', source:'SENTINEL map-entity overlay', mode:'VISUAL', note:'只框選已載入的公開地圖實體；不是電腦視覺人臉／車牌偵測。' },
    { id:'simulation', name:'原版模擬交通／粗估軌跡', source:'Original GEV parity note', mode:'UNAVAILABLE', note:'台灣版國道流速改用官方 LIVE；目前沒有火箭圖層，因此不製造模擬交通或粗估火箭軌跡。' },
  ];

  function aliasKey(value) {
    return String(value || '').toLowerCase().replace(/[\s\-_.·・／\/()（）]/g, '').replace(/臺/g, '台');
  }


  function localPoiMatches(value) {
    const key = aliasKey(value);
    if (!key) return [];
    return poiCatalog.map((item) => {
      const terms = [item.label, item.query, ...(item.keywords || [])].map(aliasKey);
      let score = 0;
      terms.forEach((term) => {
        if (term === key) score = Math.max(score, 100);
        else if (term.startsWith(key)) score = Math.max(score, 82);
        else if (term.includes(key)) score = Math.max(score, 68);
        else if (key.includes(term) && term.length >= 2) score = Math.max(score, 58);
      });
      return { ...item, score };
    }).filter((x) => x.score > 0).sort((a,b) => b.score-a.score || a.label.localeCompare(b.label,'zh-Hant')).slice(0, 8);
  }

  function renderPoiSuggestions(value, force = false) {
    const box = $('poiSuggestions');
    if (!box) return;
    const matches = localPoiMatches(value);
    if (!matches.length || (!force && String(value || '').trim().length < 1)) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.innerHTML = matches.map((item, i) => `<button type="button" role="option" data-poi-query="${escapeAttr(item.query)}"><span>${String(i+1).padStart(2,'0')} · ${escapeHtml(item.category)}</span><b>${escapeHtml(item.label)}</b><em>${escapeHtml(item.query)}</em></button>`).join('');
    box.hidden = false;
    box.querySelectorAll('[data-poi-query]').forEach((btn) => btn.addEventListener('click', () => {
      const query = btn.dataset.poiQuery || '';
      $('queryInput').value = query;
      box.hidden = true;
      handleSearch(query).catch((err) => toast(err.message, 4200));
    }));
  }

  function setMapSource(source = 'satellite', announce = true) {
    if (!state.map || !window.L) return;
    const next = source === 'satellite' ? 'satellite' : 'tactical';
    if (state.baseMapLayer) state.map.removeLayer(state.baseMapLayer);
    if (next === 'satellite') {
      const imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, opacity: .98, attribution: 'Labels &copy; Esri' });
      state.baseMapLayer = L.layerGroup([imagery, labels]);
    } else {
      state.baseMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' });
    }
    state.baseMapLayer.addTo(state.map);
    state.mapSource = next;
    document.querySelectorAll('[data-map-source]').forEach((btn) => {
      const active = btn.dataset.mapSource === next;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    $('app')?.classList.toggle('map-satellite', next === 'satellite');
    if (state.cockpitActive && state.cesium.viewer && window.Cesium) syncCockpitImagery(window.Cesium);
    if (announce) toast(`MAP // ${next === 'satellite' ? 'SATELLITE + LABELS' : 'STREET'}`);
  }

  function setOverlayVisibility(key, visible, announce = true) {
    if (key === 'speed' && visible && !state.navigation.active) {
      visible = false;
      if (announce) toast('測速標籤只在實際導航中顯示。');
    }
    const prop = { flow:'flowLayer', cctv:'cameraLayer', event:'incidentLayer', speed:'speedLayer' }[key];
    const layer = prop ? state[prop] : null;
    if (!layer || !state.map) return;
    state.overlayVisibility[key] = !!visible;
    if (visible) { if (!state.map.hasLayer(layer)) layer.addTo(state.map); }
    else if (state.map.hasLayer(layer)) state.map.removeLayer(layer);
    document.querySelectorAll(`[data-layer-toggle="${key}"]`).forEach((btn) => {
      btn.classList.toggle('active', !!visible);
      btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
    });
    if (announce) toast(`${key.toUpperCase()} LAYER // ${visible ? 'ON' : 'OFF'}`);
  }

  function initMap() {
    if (!window.L) {
      toast('地圖元件載入失敗，請確認網路連線。');
      return;
    }
    state.map = L.map('map', { zoomControl: false, preferCanvas: true, minZoom: 6 }).setView([NATIONAL_CENTER.lat, NATIONAL_CENTER.lon], window.innerWidth <= 920 ? 7 : 7);
    const flowPane = state.map.createPane('flowPane');
    flowPane.style.zIndex = '455';
    flowPane.style.pointerEvents = 'auto';
    const cctvPreviewPane = state.map.createPane('cctvPreviewPane');
    cctvPreviewPane.style.zIndex = '645';
    cctvPreviewPane.style.pointerEvents = 'auto';
    setMapSource('satellite', false);
    $('map').classList.toggle('map-fx', state.mapFx);
    state.cameraLayer = L.layerGroup().addTo(state.map);
    state.cctvPreviewLayer = L.layerGroup().addTo(state.map);
    state.incidentLayer = L.layerGroup().addTo(state.map);
    state.flowLayer = L.layerGroup().addTo(state.map);
    state.cityFlowLayer = L.layerGroup().addTo(state.map);
    state.sentinelLayer = L.layerGroup().addTo(state.map);
    state.speedLayer = L.layerGroup();
    state.airLayer = L.layerGroup().addTo(state.map);
    state.quakeLayer = L.layerGroup().addTo(state.map);
    state.threatLayer = L.layerGroup().addTo(state.map);
    state.nationalHotspotLayer = L.layerGroup().addTo(state.map);
    state.annotationLayer = L.layerGroup().addTo(state.map);
    state.trackTrailLayer = L.layerGroup().addTo(state.map);
    const noteUserMapIntent = () => {
      if (Date.now() > state.mapProgrammaticUntil) {
        state.mapUserMovedAt = Date.now();
        if (state.locationFollowing && !state.navigation.active) {
          pauseLocationFollow({ keepWatch:true });
          toast('已暫停地圖跟隨；按「定位」可重新跟隨目前位置。', 2800);
        }
      }
    };
    state.map.on('dragstart', noteUserMapIntent);
    state.map.on('zoomstart', noteUserMapIntent);
    state.map.on('moveend', debounce(() => {
      const c = state.map.getCenter();
      updateMapTelemetry(c.lat, c.lng);
      layoutTargetCctvPreviews();
      if (!state.weatherAuto || (!state.target && !state.user)) return;
      loadWeather(c.lat, c.lng, false);
    }, 700));
    state.map.on('zoomend', () => setTimeout(layoutTargetCctvPreviews, 30));
    state.map.on('click', (ev) => {
      if (state.navigation.active || state.cockpitActive) return;
      const target = ev?.originalEvent?.target;
      if (target?.closest?.('.leaflet-marker-icon,.leaflet-interactive,.leaflet-control,.map-live-cctv-card')) return;
      handleMapPointSelection(ev.latlng).catch((err) => toast(`地圖選點：${err.message}`, 3200));
    });
    updateMapTelemetry(NATIONAL_CENTER.lat, NATIONAL_CENTER.lon);
  }

  function moveMapTo(lat, lon, zoom, options = {}) {
    if (!state.map || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return false;
    const force = Boolean(options.force);
    const recentManualMove = Date.now() - Number(state.mapUserMovedAt || 0) < 2400;
    if (!force && recentManualMove) return false;
    state.mapProgrammaticUntil = Date.now() + Math.max(600, Number(options.guardMs || 1300));
    const duration = options.duration ?? (state.motion ? .7 : .25);
    state.map.flyTo([Number(lat), Number(lon)], Number(zoom || state.map.getZoom()), { duration });
    return true;
  }

  function markerIcon(type, size = 10) {
    return L.divIcon({
      className: '',
      html: `<div class="marker-${type}" style="width:${size}px;height:${size}px"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function speedMarkerIcon(cam = {}) {
    const limit = Number(cam.limit);
    const label = Number.isFinite(limit) && limit > 0 ? String(Math.round(limit)) : 'S';
    return L.divIcon({
      className: '',
      html: `<div class="marker-speed-sign"><span>${escapeHtml(label)}</span><i></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }

  function updateMapTelemetry(lat, lon) {
    const grid = $('gridTelemetry');
    if (!grid || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return;
    grid.textContent = `TW // ${Number(lat).toFixed(3)}N ${Number(lon).toFixed(3)}E`;
  }

  function setLinkTelemetry(text) {
    const el = $('linkTelemetry');
    if (el) el.textContent = `PUBLIC SIGNAL // ${String(text || 'STANDBY').toUpperCase()}`;
  }

  function tactile(ms = 10) {
    if (!state.motion || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (_) {}
  }

  function signalAcquire(active, label = 'SIGNAL ACQUISITION') {
    const el = $('signalTrace');
    if (!el) return;
    clearTimeout(signalAcquire._timer);
    const text = el.querySelector('span');
    if (text) text.textContent = label;
    el.classList.toggle('show', Boolean(active && state.motion));
    setLinkTelemetry(active ? 'ACQUIRING' : 'LIVE');
    if (active) signalAcquire._timer = setTimeout(() => signalAcquire(false), 6200);
  }

  function setTheaterStandby(active) {
    const el = $('theaterStandby');
    if (!el) return;
    el.classList.toggle('hidden', !active);
    $('app')?.classList.toggle('theater-active', Boolean(active));
  }

  function showTargetLock(place) {
    const shell = $('app');
    const box = $('targetLock');
    if (!shell || !box) return;
    $('targetLockName').textContent = String(place?.name || 'TARGET').toUpperCase().slice(0, 42);
    $('targetLockCoord').textContent = Number.isFinite(Number(place?.lat)) && Number.isFinite(Number(place?.lon))
      ? `${Number(place.lat).toFixed(5)}N / ${Number(place.lon).toFixed(5)}E`
      : 'POSITION VERIFIED';
    setTheaterStandby(false);
    shell.classList.add('locking');
    box.classList.add('show');
    tactile(14);
    clearTimeout(showTargetLock._timer);
    showTargetLock._timer = setTimeout(() => {
      shell.classList.remove('locking');
      box.classList.remove('show');
    }, 2200);
  }

  function flashSignal(stage) {
    if (!stage || !state.motion) return;
    stage.classList.remove('signal-switch');
    void stage.offsetWidth;
    stage.classList.add('signal-switch');
    setTimeout(() => stage.classList.remove('signal-switch'), 520);
  }

  function runGeoTransfer(place, label = 'SATELLITE HANDOFF') {
    const el = $('geoTransfer');
    if (!el || !state.transferFx || !state.motion || !place) return;
    const name = $('geoTransferName');
    const coord = $('geoTransferCoord');
    if (name) name.textContent = String(place.name || label || 'RELOCATING SIGNAL').toUpperCase().slice(0, 44);
    if (coord) coord.textContent = Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon))
      ? `${Number(place.lat).toFixed(4)}N / ${Number(place.lon).toFixed(4)}E`
      : 'GRID TRANSFER';
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');
    setLinkTelemetry('SATELLITE HANDOFF');
    tactile(12);
    clearTimeout(runGeoTransfer._timer);
    runGeoTransfer._timer = setTimeout(() => {
      el.classList.remove('active');
      setLinkTelemetry(state.navigation.active ? 'NAV OPS' : 'LIVE');
    }, 1650);
  }

  function runBootSequence(initialLoadPromise = Promise.resolve()) {
    const boot = $('bootSequence');
    if (!boot || !state.motion) { if (boot) boot.classList.add('done'); return; }
    const status = $('bootStatus');
    const progressBar = $('bootProgressBar');
    const progressText = $('bootProgressText');
    const telemetry = $('bootTelemetry');
    const bootClock = $('bootClock');
    const started = performance.now();
    const minDuration = 5800;
    const maxDuration = 9500;
    let dataSettled = false;
    let finished = false;

    const setModule = (id, mode, text) => {
      const el = $(id);
      if (!el) return;
      el.classList.remove('online','standby','syncing');
      el.classList.add(mode);
      const value = el.querySelector('b');
      if (value) value.textContent = text;
    };
    const refreshModules = (settled = false) => {
      setModule('bootModuleLink', 'online', navigator.onLine ? 'SECURE' : 'OFFLINE');
      setModule('bootModuleFlow', state.latestFlow?.length ? 'online' : settled ? 'standby' : 'syncing', state.latestFlow?.length ? 'LIVE' : settled ? 'STANDBY' : 'SYNC');
      setModule('bootModuleCctv', state.latestCctv?.length ? 'online' : settled ? 'standby' : 'syncing', state.latestCctv?.length ? 'LIVE' : settled ? 'STANDBY' : 'SYNC');
      setModule('bootModuleEvent', state.latestTraffic?.length ? 'online' : settled ? 'standby' : 'syncing', state.latestTraffic?.length ? 'LIVE' : settled ? 'STANDBY' : 'SYNC');
    };
    const timeline = [
      [0, 'AUTHENTICATING PUBLIC SIGNAL CHANNELS', 'phase-earth'],
      [850, 'SATELLITE GRID LOCK // TAIWAN THEATER', 'phase-taiwan'],
      [1900, 'SYNCHRONIZING NATIONAL FLOW NETWORK', 'phase-flow'],
      [3150, 'HANDSHAKE // CCTV + TRAFFIC EVENT BUS', 'phase-signals'],
      [4550, 'FUSING NATIONAL SITUATION PICTURE', 'phase-fusion'],
    ];
    timeline.forEach(([delay, text, cls]) => setTimeout(() => {
      if (finished) return;
      if (status) status.textContent = text;
      boot.classList.add(cls);
    }, delay));

    const moduleTimer = setInterval(() => refreshModules(dataSettled), 220);
    refreshModules(false);
    Promise.resolve(initialLoadPromise).catch(() => null).finally(() => {
      dataSettled = true;
      refreshModules(true);
      boot.classList.add('phase-ready');
      if (status) status.textContent = (state.latestFlow?.length || state.latestCctv?.length || state.latestTraffic?.length)
        ? 'MISSION READY // NATIONAL GRID STABLE'
        : 'MISSION READY // PUBLIC SOURCES DEGRADED';
    });

    const finishBoot = () => {
      if (finished) return;
      finished = true;
      clearInterval(moduleTimer);
      refreshModules(true);
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = '100%';
      boot.classList.add('phase-ready','boot-complete');
      setTimeout(() => boot.classList.add('done'), 620);
    };

    const tick = (now) => {
      if (finished) return;
      const elapsed = now - started;
      const base = Math.min(84, (elapsed / minDuration) * 84);
      const liveCount = Number(!!state.latestFlow?.length) + Number(!!state.latestCctv?.length) + Number(!!state.latestTraffic?.length);
      let pct = Math.min(92, base + liveCount * 2.5 + (dataSettled ? 4 : 0));
      if (dataSettled && elapsed >= minDuration) pct = 100;
      if (elapsed >= maxDuration) pct = 100;
      if (progressBar) progressBar.style.width = `${Math.max(2, pct).toFixed(0)}%`;
      if (progressText) progressText.textContent = `${Math.max(0, Math.min(100, Math.round(pct)))}%`;
      if (telemetry) telemetry.textContent = `FLOW ${state.latestFlow?.length || 0} // CCTV ${state.latestCctv?.length || 0} // EVT ${state.latestTraffic?.length || 0}`;
      if (bootClock) bootClock.textContent = new Intl.DateTimeFormat('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
      if (pct >= 100) return finishBoot();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function updateClock() {
    const now = new Date();
    $('clock').textContent = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  }

  function toast(message, ms = 2600) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function speak(text, force = false) {
    if ((!state.speech && !force) || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    u.rate = 1.02;
    speechSynthesis.speak(u);
  }

  async function jsonFetch(url, options = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal, headers: { Accept: 'application/json', ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function geocode(query) {
    const clean = String(query || '').trim();
    const key = aliasKey(clean);
    const alias = aliases[key];
    if (!alias && ambiguousAliases.has(key)) {
      renderPoiSuggestions(clean, true);
      throw new Error(`「${clean}」有多個常見分店，請從搜尋框下方選擇目標。`);
    }
    if (alias && typeof alias === 'object') return { ...alias, aliasFrom: clean };
    const localMatches = !alias ? localPoiMatches(clean) : [];
    const localTop = localMatches[0];
    const strongLocal = localTop && localTop.score >= 82 && (!localMatches[1] || localTop.score - localMatches[1].score >= 12);
    const lookup = typeof alias === 'string' ? alias : (strongLocal ? localTop.query : clean);
    const bias = state.user || state.target || (state.nationalMode ? null : state.map?.getCenter?.());
    const biasQuery = bias && Number.isFinite(Number(bias.lat)) && Number.isFinite(Number(bias.lon ?? bias.lng))
      ? `&lat=${Number(bias.lat).toFixed(5)}&lon=${Number(bias.lon ?? bias.lng).toFixed(5)}` : '';
    const data = await jsonFetch(`/api/data?action=geocode&q=${encodeURIComponent(lookup)}${biasQuery}`);
    if (!data.results?.length) throw new Error(data.hint || '找不到這個地點，請加入縣市、區域或完整地址再試。');
    const first = data.results[0];
    if ((alias && typeof alias === 'string') || strongLocal) first.aliasFrom = clean;
    return first;
  }

  function updateLocationFollowUi() {
    document.querySelectorAll('[data-command="locate"]').forEach((btn) => {
      btn.classList.toggle('active', Boolean(state.locationFollowing));
      btn.setAttribute('aria-pressed', state.locationFollowing ? 'true' : 'false');
      btn.title = state.locationFollowing ? '正在持續跟隨目前位置；拖曳地圖可暫停跟隨' : '定位並持續跟隨目前位置';
    });
    const btn = $('searchLocateBtn');
    if (btn) {
      btn.classList.toggle('active', Boolean(state.locationFollowing));
      btn.setAttribute('aria-pressed', state.locationFollowing ? 'true' : 'false');
      btn.title = state.locationFollowing ? '目前位置持續更新中' : '使用目前位置';
    }
  }

  function applyUserPosition(position, { center = false } = {}) {
    const coords = position?.coords || {};
    const lat = Number(coords.latitude), lon = Number(coords.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const accuracy = Math.max(0, Number(coords.accuracy || 0));
    state.user = { lat, lon, name: '我的位置', accuracy, timestamp: Number(position.timestamp || Date.now()) };
    state.originMode = 'user';
    updateOriginUi();
    if (!state.userMarker) {
      state.userMarker = L.marker([lat, lon], { icon: markerIcon('user', 12), zIndexOffset: 1000 }).addTo(state.map).bindPopup('<b>目前位置</b><br>位置只保留在此瀏覽器工作階段。');
    } else state.userMarker.setLatLng([lat, lon]);
    if (state.locationAccuracyLayer) { try { state.locationAccuracyLayer.remove(); } catch (_) {} }
    if (accuracy > 0 && accuracy < 2000) {
      state.locationAccuracyLayer = L.circle([lat, lon], { radius: accuracy, color:'#9ac8b0', weight:1, opacity:.45, fillColor:'#7da990', fillOpacity:.08, interactive:false }).addTo(state.map);
    }
    if (center || state.locationFollowing || state.navigation.active) {
      const zoom = state.navigation.active ? Math.max(16, state.map.getZoom()) : Math.max(15, state.map.getZoom());
      moveMapTo(lat, lon, zoom, { force:true, duration: state.navigation.active ? .35 : .55, guardMs:900 });
    }
    updateLocationFollowUi();
    return state.user;
  }

  function startLocationWatch({ follow = true } = {}) {
    if (!navigator.geolocation) throw new Error('此瀏覽器不支援定位');
    state.locationFollowing = Boolean(follow);
    updateLocationFollowUi();
    if (state.locationWatchId != null) return state.locationWatchId;
    state.locationWatchId = navigator.geolocation.watchPosition((position) => {
      const previous = state.user ? { ...state.user } : null;
      const user = applyUserPosition(position, { center:false });
      if (!user) return;
      if (state.target?.liveUserTarget && state.targetMarker) {
        state.target.lat = user.lat; state.target.lon = user.lon;
        state.targetMarker.setLatLng([user.lat,user.lon]);
        const moved = previous ? haversineKm(previous.lat, previous.lon, user.lat, user.lon) : 99;
        if ((Date.now() - state.locationLastRefreshAt > 45000) && moved >= .18) {
          state.locationLastRefreshAt = Date.now();
          loadCctv(user.lat,user.lon,false,35).then((items)=>renderTargetCctvPreviews(state.target,items||[])).catch(()=>{});
        }
      }
    }, (err) => {
      if (!state.user) toast(`持續定位暫時中斷：${err.message}`, 3600);
    }, { enableHighAccuracy:true, timeout:12000, maximumAge:6000 });
    return state.locationWatchId;
  }

  function pauseLocationFollow({ keepWatch = true } = {}) {
    state.locationFollowing = false;
    if (!keepWatch && state.locationWatchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.locationWatchId);
      state.locationWatchId = null;
    }
    updateLocationFollowUi();
  }

  async function locateUser({ center = true, follow = center } = {}) {
    if (!navigator.geolocation) throw new Error('此瀏覽器不支援定位');
    toast('正在取得目前位置…');
    signalAcquire(true, 'POSITION ACQUISITION');
    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 12000,
    }));
    const user = applyUserPosition(pos, { center });
    startLocationWatch({ follow:Boolean(follow) });
    setTheaterStandby(false);
    loadWeather(user.lat, user.lon, true);
    loadNews(user.lat, user.lon, false, user.name || '我的位置').catch(() => {});
    signalAcquire(false);
    showTargetLock(user);
    toast(follow ? '定位完成 · 已持續跟隨位置' : '定位完成');
    return user;
  }

  async function monitorMyLocation() {
    const user = await locateUser({ center:true, follow:true });
    const place = { ...user, name:'我的位置', liveUserTarget:true };
    if ($('queryInput')) $('queryInput').value = '我的位置';
    await lockTarget(place, 16);
    state.locationFollowing = true;
    updateLocationFollowUi();
    return place;
  }


  function updateOriginUi() {
    const label = $('originLabel');
    const chip = $('originChip');
    if (!label || !chip) return;
    const usingUser = state.originMode === 'user';
    label.textContent = usingUser ? (state.user?.name || '我的位置') : DEFAULT_CENTER.name;
    if ($('abOrigin')) $('abOrigin').value = usingUser ? '我的位置' : DEFAULT_CENTER.name;
    const hint = chip.querySelector('em');
    if (hint) hint.textContent = usingUser ? '點一下改回台北 101' : '點一下改用目前位置';
    chip.classList.toggle('using-user', usingUser);
  }

  function clearRoutePresentation({ clearFields = false } = {}) {
    if (state.routeLayer) { try { state.routeLayer.remove(); } catch (_) {} state.routeLayer = null; }
    if (state.routeAltLayer) { try { state.routeAltLayer.remove(); } catch (_) {} state.routeAltLayer = null; }
    state.currentRoute = null;
    state.routeCandidates = [];
    state.routeContext = null;
    state.lastThreatSignature = '';
    const info = $('routeInfo'); if (info) info.hidden = true;
    const empty = $('routeEmpty'); if (empty) { empty.hidden = false; empty.textContent = '輸入目的地後，自動建立 A → B 候選路線與沿途情報。'; }
    const options = $('routeOptions'); if (options) options.innerHTML = '';
    const threat = $('routeThreatSummary'); if (threat) { threat.hidden = true; threat.innerHTML = ''; }
    const tm = $('routeTimeMachine'); if (tm) tm.hidden = true;
    const alert = $('threatAlert'); if (alert) alert.hidden = true;
    $('app')?.classList.remove('condition-red');
    if (clearFields) {
      if ($('abTarget')) $('abTarget').value = '';
      if ($('abOrigin')) $('abOrigin').value = '';
      if ($('routeTarget')) $('routeTarget').value = '';
      if ($('routeOrigin')) $('routeOrigin').value = '';
    }
  }

  function setSearchMode(mode = 'monitor', { focus = true } = {}) {
    const next = mode === 'nav' ? 'nav' : 'monitor';
    const leavingNav = state.searchMode === 'nav' && next === 'monitor';
    if (leavingNav && state.navigation.active) stopNavigation(false);
    if (leavingNav) clearRoutePresentation({ clearFields:true });
    state.searchMode = next;
    const command = document.querySelector('.command');
    command?.classList.toggle('search-nav', next === 'nav');
    const routePanel = $('abRoutePanel');
    if (routePanel) routePanel.hidden = next !== 'nav';
    document.querySelectorAll('[data-search-mode]').forEach((btn) => {
      const active = btn.dataset.searchMode === next;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const input = $('queryInput');
    if (next === 'nav' && state.target && !state.target.bootstrap) {
      if ($('abTarget') && !$('abTarget').value.trim()) $('abTarget').value = state.target.name || '';
      if ($('routeTarget') && !$('routeTarget').value.trim()) $('routeTarget').value = state.target.name || '';
    }
    if (input) input.placeholder = next === 'nav'
      ? '導航模式使用下方 A / B 欄位'
      : '搜尋地點／路口／CCTV，例如 101、A11、忠孝東路與基隆路';
    const hint = $('commandHint');
    if (hint) hint.innerHTML = next === 'nav'
      ? '<b>NAV MODE</b><span>設定 A → B；系統比較替代路線、ETA、沿途事件與即時流速。</span>'
      : '<b>AUTO INTEL</b><span>搜尋地點後，地圖直接展開最近 LIVE CCTV；區域態勢、車流、天氣與來源狀態固定在地圖外側情報欄。</span>';
    if (focus) setTimeout(() => (next === 'nav' ? $('abTarget') : $('queryInput'))?.focus?.(), 0);
  }

  function syncIntelMapLayout() {
    clearTimeout(state._intelLayoutTimer);
    state._intelLayoutTimer = setTimeout(() => {
      try { state.map?.invalidateSize?.({ pan:false, animate:false }); } catch (_) {}
      try { layoutTargetCctvPreviews(); } catch (_) {}
    }, 230);
  }

  function openIntelResults() {
    state.intelOpen = true;
    $('app')?.classList.add('intel-results-open');
    if ($('nationalOverview')) $('nationalOverview').hidden = true;
    if ($('intelPanel')) $('intelPanel').hidden = false;
    $('intelPanel')?.classList.add('open');
    if ($('intelCollapse')) $('intelCollapse').textContent = '−';
    syncIntelMapLayout();
  }

  function collapseIntelResults() {
    state.intelOpen = false;
    $('app')?.classList.remove('intel-results-open');
    if ($('intelPanel')) $('intelPanel').hidden = false;
    $('intelPanel')?.classList.remove('open');
    if ($('intelCollapse')) $('intelCollapse').textContent = '+';
    if ($('intelBody')) $('intelBody').scrollTop = 0;
    syncIntelMapLayout();
  }

  function setRailActive(key) {
    document.querySelectorAll('.ops-rail button').forEach((btn) => {
      const active = btn.dataset.rail === key || btn.dataset.command === key || btn.dataset.mission === key;
      btn.classList.toggle('active', active);
    });
  }

  function jumpIntelCard(id) {
    const el = $(id);
    if (!el) return;
    openIntelResults();
    document.querySelectorAll('[data-intel-jump]').forEach((btn) => btn.classList.toggle('active', btn.dataset.intelJump === id));
    setTimeout(() => el.scrollIntoView({ behavior: state.motion ? 'smooth' : 'auto', block: 'start' }), 30);
  }

  async function preferredOrigin() {
    if (state.originMode !== 'user') return { ...DEFAULT_CENTER };
    if (state.user) return state.user;
    try { return await locateUser({ center: false }); }
    catch (_) {
      state.originMode = 'taipei';
      updateOriginUi();
      toast('目前位置無法取得，起點暫用台北 101。', 3800);
      return { ...DEFAULT_CENTER };
    }
  }

  async function toggleOriginMode() {
    if (state.originMode === 'user') {
      state.originMode = 'taipei';
      updateOriginUi();
      toast('起點已切換：台北 101');
    } else {
      try {
        await locateUser({ center: false });
        state.originMode = 'user';
        updateOriginUi();
        toast('起點已切換：我的位置');
      } catch (err) {
        state.originMode = 'taipei';
        updateOriginUi();
        toast(`定位失敗，維持台北 101：${err.message}`, 4200);
      }
    }
    if (state.target && !state.target.bootstrap) {
      const origin = await preferredOrigin();
      await planRoute(origin, state.target, { preference: 'recommended' });
    }
  }

  function nationalReason(segment, traffic = [], flow = []) {
    const lat = Number(segment?.lat), lon = Number(segment?.lon);
    const near = traffic
      .filter((ev) => Number.isFinite(Number(ev.lat)) && Number.isFinite(Number(ev.lon)) && Number.isFinite(lat) && Number.isFinite(lon))
      .map((ev) => ({ ...ev, _d: haversineKm(lat, lon, Number(ev.lat), Number(ev.lon)) }))
      .filter((ev) => ev._d <= 8)
      .sort((a,b) => a._d-b._d)[0];
    if (near) {
      const text = `${near.title || ''} ${near.description || ''}`;
      const type = /封閉|禁止通行/.test(text) ? '道路封閉' : /施工|工程/.test(text) ? '附近施工' : /事故|車禍|碰撞/.test(text) ? '附近事故' : '附近交通事件';
      return { label:type, detail:(near.description || near.title || '').slice(0,54), verified:true };
    }
    const same = flow.filter((x) => x !== segment && x.status === 'congested' && x.road && segment.road && x.road === segment.road && haversineKm(lat, lon, Number(x.lat), Number(x.lon)) <= 18).length;
    if (same >= 1) return { label:'連續低速回堵', detail:`同一路廊另有 ${same} 段嚴重低速`, verified:true };
    return { label:'極端低速', detail:'目前沒有相符公開事件，原因未確認', verified:false };
  }

  function nearestCameraForHotspot(hotspot, cameras = []) {
    if (!hotspot) return null;
    return cameras
      .filter((cam) => cam?.streamUrl && Number.isFinite(Number(cam.lat)) && Number.isFinite(Number(cam.lon)))
      .map((cam) => ({ ...cam, _hotspotDistance:haversineKm(Number(hotspot.lat), Number(hotspot.lon), Number(cam.lat), Number(cam.lon)) }))
      .filter((cam) => cam._hotspotDistance <= 12)
      .sort((a,b) => a._hotspotDistance-b._hotspotDistance)[0] || null;
  }

  function addNationalIndexedCameraMarker(cam) {
    if (!state.cameraLayer || !state.map || !cam || !Number.isFinite(Number(cam.lat)) || !Number.isFinite(Number(cam.lon))) return;
    state.cctvCanvasRenderer ||= L.canvas({ padding:0.5, tolerance:5 });
    const marker = L.circleMarker([Number(cam.lat), Number(cam.lon)], {
      renderer:state.cctvCanvasRenderer, radius:4, weight:1.2, color:'#17120a', fillColor:'#f1c96a', fillOpacity:.96, opacity:1, interactive:true,
    }).addTo(state.cameraLayer);
    marker.bindTooltip(`LIVE · ${escapeHtml(shortName(cam.name || cam.road || '公開 CCTV'))}`, { direction:'top', offset:[0,-5], opacity:.94 });
    marker.on('click', () => openCamera(cam));
  }

  async function enrichNationalHotspotCamera(hotspot, previewKey) {
    try {
      const data = await jsonFetch(`/api/data?action=cctv&lat=${Number(hotspot.lat).toFixed(6)}&lon=${Number(hotspot.lon).toFixed(6)}&radius=15&limit=24&index=1`);
      if (!state.nationalMode || state.nationalPreviewKey !== previewKey) return;
      const cam = nearestCameraForHotspot(hotspot, data.items || []);
      if (!cam) {
        $('nationalPreviewMeta').textContent = `${Math.round(Number(hotspot.travelSpeed) || 0)} km/h · ${hotspot.reason?.label || 'FLOW WATCH'} · NO VIEWABLE CCTV`;
        $('nationalPreviewStage').innerHTML = '<div class="camera-placeholder">15 km 內目前沒有可內嵌的公開 CCTV；流速與事件情報仍持續更新。</div>';
        return;
      }
      if (!state.latestCctv.some((x) => String(x.id) === String(cam.id))) state.latestCctv.push(cam);
      addNationalIndexedCameraMarker(cam);
      $('nationalPreviewMeta').textContent = `${Math.round(Number(hotspot.travelSpeed) || 0)} km/h · ${hotspot.reason?.label || 'FLOW WATCH'} · CAM ${cam._hotspotDistance.toFixed(1)} km`;
      renderCameraMedia($('nationalPreviewStage'), cam);
      syncLocalPrivacyMask($('nationalPreviewStage'));
    } catch (_) {
      if (state.nationalPreviewKey === previewKey) $('nationalPreviewStage').innerHTML = '<div class="camera-placeholder">附近公開 CCTV 補查暫時無回應；國道流量仍持續更新。</div>';
    }
  }

  function selectNationalHotspot(hotspot, fly = true) {
    if (!hotspot || !state.map) return;
    if (fly) state.map.flyTo([hotspot.lat, hotspot.lon], window.innerWidth <= 920 ? 11 : 10, { duration:state.motion ? .85 : .2 });
    const previewKey = `${Number(hotspot.lat).toFixed(4)},${Number(hotspot.lon).toFixed(4)},${Number(hotspot._index ?? -1)}`;
    state.nationalPreviewKey = previewKey;
    const cam = nearestCameraForHotspot(hotspot, state.latestCctv);
    $('nationalPreviewTitle').textContent = shortName(hotspot.road || hotspot.name || 'CRITICAL FLOW');
    $('nationalPreviewMeta').textContent = `${Math.round(Number(hotspot.travelSpeed) || 0)} km/h · ${hotspot.reason?.label || 'FLOW WATCH'}${cam ? ` · CAM ${cam._hotspotDistance.toFixed(1)} km` : ' · SEARCHING NEARBY CCTV'}`;
    const stage = $('nationalPreviewStage');
    if (cam) renderCameraMedia(stage, cam);
    else {
      stage.innerHTML = '<div class="camera-placeholder">正在補查此壅塞路段附近可觀看公開 CCTV…</div>';
      enrichNationalHotspotCamera(hotspot, previewKey);
    }
    syncLocalPrivacyMask(stage);
    document.querySelectorAll('[data-national-hotspot]').forEach((btn) => btn.classList.toggle('active', Number(btn.dataset.nationalHotspot) === Number(hotspot._index)));
  }

  function renderNationalOverview({ flow = [], traffic = [], cctv = [] } = {}) {
    const box = $('nationalOverview');
    if (!box) return;
    box.hidden = false;
    const speeds = flow.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const avg = speeds.length ? Math.round(speeds.reduce((a,b)=>a+b,0)/speeds.length) : null;
    const allCritical = flow
      .filter((x) => x.status === 'congested' || Number(x.travelSpeed) < 30)
      .sort((a,b) => Number(a.travelSpeed ?? 999)-Number(b.travelSpeed ?? 999));
    const allSlow = flow
      .filter((x) => Number.isFinite(Number(x.travelSpeed)) && (x.status === 'slow' || x.status === 'congested' || Number(x.travelSpeed) < 60))
      .sort((a,b) => Number(a.travelSpeed ?? 999)-Number(b.travelSpeed ?? 999));
    const alertPool = allSlow.length ? allSlow : [...flow].filter((x)=>Number.isFinite(Number(x.travelSpeed))).sort((a,b)=>Number(a.travelSpeed)-Number(b.travelSpeed));
    const critical = alertPool.slice(0,6).map((x,i) => ({ ...x, _index:i, reason:nationalReason(x, traffic, flow) }));
    state.nationalHotspots = critical;
    $('nationalCriticalCount').textContent = String(allCritical.length);
    $('nationalEventCount').textContent = String(traffic.length);
    $('nationalCameraCount').textContent = String(cctv.length);
    $('nationalAvgFlow').textContent = avg == null ? 'N/A' : `${avg}`;
    $('nationalStatusText').textContent = flow.length
      ? (allCritical.length ? `${allCritical.length} CRITICAL CORRIDOR${allCritical.length>1?'S':''} DETECTED` : (allSlow.length ? `${allSlow.length} SLOW CORRIDOR${allSlow.length>1?'S':''} WATCH` : 'TAIWAN NETWORK NOMINAL'))
      : (traffic.length ? `FLOW REFRESHING · ${traffic.length} EVENTS ONLINE` : 'WAITING FOR FREEWAY LIVE FLOW');
    $('nationalDataAge').textContent = new Date().toLocaleTimeString('zh-TW',{hour12:false,hour:'2-digit',minute:'2-digit'});
    const summary = $('nationalNetworkSummary');
    if (summary) {
      const normalCount = flow.filter((x)=>Number.isFinite(Number(x.travelSpeed)) && Number(x.travelSpeed) >= 60).length;
      const roadStats = Array.isArray(state.latestFlowMeta?.roadStats) ? state.latestFlowMeta.roadStats.slice(0,5) : [];
      const chips = [
        `<span><b>${flow.length}</b><small>FLOW SEGMENTS</small></span>`,
        `<span class="critical"><b>${allCritical.length}</b><small>CONGESTED</small></span>`,
        `<span class="slow"><b>${Math.max(0,allSlow.length-allCritical.length)}</b><small>SLOW</small></span>`,
        `<span class="clear"><b>${normalCount}</b><small>NORMAL</small></span>`,
      ];
      roadStats.forEach((r)=>chips.push(`<span class="road"><b>${escapeHtml(shortName(r.road || 'FREEWAY'))}</b><small>${r.avgSpeed==null?'—':r.avgSpeed+' km/h'} · ${r.critical||0} RED · ${r.slow||0} SLOW</small></span>`));
      summary.innerHTML = chips.join('');
    }
    const list = $('nationalHotspotList');
    if (critical.length) {
      list.innerHTML = critical.map((h,i) => {
        const speed = Math.round(Number(h.travelSpeed) || 0);
        const severe = h.status === 'congested' || speed < 30;
        const cam = nearestCameraForHotspot(h, cctv);
        return `<button type="button" data-national-hotspot="${i}" class="national-hotspot-card ${i===0?'active':''} ${severe?'danger':'watch'}"><span><i></i>${severe?'CONGESTION':'SLOW WATCH'} ${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(shortName(h.road || h.name || 'FREEWAY'))}</b><strong>${speed} km/h · ${escapeHtml(h.reason.label || (severe?'壅塞':'車多'))}</strong><em>${escapeHtml(h.start || '')}${h.end ? ` → ${escapeHtml(h.end)}` : ''}</em><small>${cam ? `LIVE CCTV ${cam._hotspotDistance.toFixed(1)} km · 點擊預覽` : '點擊查看路段情報'}</small></button>`;
      }).join('');
    } else if (traffic.length) {
      list.innerHTML = traffic.slice(0,6).map((ev,i)=>`<button type="button" class="national-hotspot-card watch event-only"><span><i></i>TRAFFIC EVENT ${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(shortName(ev.road || ev.title || 'ROAD EVENT'))}</b><strong>${escapeHtml(shortName(ev.title || ev.description || '即時道路事件'))}</strong><em>${escapeHtml(String(ev.description || '').slice(0,72))}</em><small>FLOW 資料更新中 · 事件資料已上線</small></button>`).join('');
    } else {
      list.innerHTML = `<div class="national-empty"><b>${flow.length ? 'NETWORK NOMINAL' : 'FLOW NETWORK CONNECTING'}</b><span>${flow.length ? `已取得 ${flow.length} 段國道路況，目前沒有顯著低速路段。` : '先顯示事件與 CCTV；官方國道路速接通後會自動補上綠／黃／橘／紅色帶。'}</span></div>`;
    }
    list.querySelectorAll('[data-national-hotspot]').forEach((btn) => btn.addEventListener('click', () => { const h=critical[Number(btn.dataset.nationalHotspot)]; if(h) selectNationalHotspot(h); }));

    state.nationalHotspotLayer?.clearLayers();
    critical.forEach((h) => {
      const severe = h.status === 'congested' || Number(h.travelSpeed) < 30;
      const marker = L.circleMarker([h.lat,h.lon], {
        radius: severe ? 5.5 : 4.5,
        weight: 1.5,
        color: severe ? '#7d2d27' : '#7b5a2e',
        fillColor: severe ? '#e16d60' : '#d59a59',
        fillOpacity: .92,
        opacity: .95,
        pane:'markerPane',
      }).addTo(state.nationalHotspotLayer);
      marker.bindTooltip(`${escapeHtml(shortName(h.road || h.name || 'FLOW'))} · ${Math.round(Number(h.travelSpeed)||0)} km/h`, { direction:'top', opacity:.9 });
      marker.on('click', () => selectNationalHotspot(h));
    });
    if (critical[0]) selectNationalHotspot(critical[0], false);
    else {
      $('nationalPreviewTitle').textContent = 'NETWORK NOMINAL';
      $('nationalPreviewMeta').textContent = 'NO CRITICAL CORRIDOR';
      $('nationalPreviewStage').innerHTML = '<div class="camera-placeholder">目前沒有需要自動接管的嚴重壅塞熱點。</div>';
    }
  }

  function resetNationalMapView({ animate = true } = {}) {
    if (!state.map) return;
    try { state.map.invalidateSize(false); } catch (_) {}
    const bounds = L.latLngBounds([[21.85,119.35],[25.45,122.10]]);
    state.map.fitBounds(bounds, { padding:[34,34], animate:Boolean(animate && state.motion), maxZoom:7 });
    updateMapTelemetry(NATIONAL_CENTER.lat,NATIONAL_CENTER.lon);
  }

  function syncFreewayModeUi() {
    const btn = $('freewayModeBtn');
    if (btn) {
      btn.classList.toggle('active', Boolean(state.freewayMode));
      btn.setAttribute('aria-pressed', state.freewayMode ? 'true' : 'false');
      btn.title = state.freewayMode ? '退出全台國道壅塞色帶模式' : '全台國道即時壅塞色帶模式';
    }
    $('app')?.classList.toggle('freeway-mode', Boolean(state.freewayMode));
  }

  async function setFreewayMode(active = true) {
    const next = Boolean(active);
    if (next && !state.freewayMode) state.freewayPrevMapSource = state.mapSource || 'satellite';
    state.freewayMode = next;
    syncFreewayModeUi();
    if (!state.freewayMode) {
      if (state.freewayPrevMapSource) setMapSource(state.freewayPrevMapSource, false);
      state.freewayPrevMapSource = null;
      return;
    }
    // Street/tactical base makes the traffic colors read like a dedicated road-status map.
    setMapSource('tactical', false);
    setOverlayVisibility('flow', true, false);
    setOverlayVisibility('event', true, false);
    setOverlayVisibility('cctv', true, false);
    enterNationalMode();
    $('nationalOverview')?.classList.remove('compact');
    if ($('nationalCompactBtn')) $('nationalCompactBtn').textContent = '−';
    clearAllCctvPreviews();
    resetNationalMapView({ animate:true });
    await refreshNationalSignals(true).catch(()=>{});
    toast('已顯示全台國道壅塞狀況');
  }

  function enterNationalMode() {
    closeOverlayPanels();
    $('app')?.classList.remove('map-focus');
    if ($('mapFocusBtn')) $('mapFocusBtn').textContent = 'MAP FOCUS';
    state.nationalMode = true;
    $('app')?.classList.add('national-mode');
    if ($('intelPanel')) $('intelPanel').hidden = true;
    if ($('nationalOverview')) $('nationalOverview').hidden = false;
    state.target = null;
    state.targetMarker?.remove?.(); state.targetMarker = null;
    state.cameraLayer?.clearLayers?.(); clearAllCctvPreviews(); state.incidentLayer?.clearLayers?.(); state.speedLayer?.clearLayers?.(); state.cityFlowLayer?.clearLayers?.();
    state.airLayer?.clearLayers?.(); state.quakeLayer?.clearLayers?.(); state.sentinelLayer?.clearLayers?.(); state.threatLayer?.clearLayers?.();
    if (state.routeLayer) { state.map?.removeLayer?.(state.routeLayer); state.routeLayer = null; }
    if (state.routeAltLayer) { state.map?.removeLayer?.(state.routeAltLayer); state.routeAltLayer = null; }
    resetNationalMapView({ animate:true });
    setTimeout(() => { if (state.nationalMode) resetNationalMapView({ animate:false }); }, 420);
    setLinkTelemetry('TAIWAN NATIONAL GRID LIVE');
    setTheaterStandby(false);
  }

  function exitNationalMode() {
    closeOverlayPanels();
    state.nationalMode = false;
    if (state.freewayMode) { state.freewayMode = false; syncFreewayModeUi(); }
    if (state.nationalTimer) { clearInterval(state.nationalTimer); state.nationalTimer = null; }
    $('app')?.classList.remove('national-mode');
    if ($('nationalOverview')) $('nationalOverview').hidden = true;
    if ($('intelPanel')) $('intelPanel').hidden = false;
    state.nationalHotspotLayer?.clearLayers();
    const stage=$('nationalPreviewStage');
    stage?.querySelectorAll?.('video')?.forEach?.((v)=>{ try{v._eyeHls?.destroy?.();}catch(_){} });
  }

  function renderNationalTrafficMarkers(items = []) {
    if (!state.incidentLayer || !state.map) return;
    state.incidentLayer.clearLayers();
    const important = items.filter((ev) => {
      const text = `${ev?.title || ''} ${ev?.description || ''} ${ev?.road || ''}`;
      return /事故|車禍|封閉|施工|回堵|壅塞|落石|坍方|管制|故障|event|accident|closure|construction/i.test(text);
    }).filter((ev)=>Number.isFinite(Number(ev.lat)) && Number.isFinite(Number(ev.lon))).slice(0, 36);
    important.forEach((ev) => {
      const marker = L.circleMarker([Number(ev.lat), Number(ev.lon)], { radius:5, weight:2, color:'#9f2f2f', fillColor:'#e0574f', fillOpacity:.92 }).addTo(state.incidentLayer);
      marker.bindTooltip(escapeHtml(shortName(ev.road || ev.title || '交通事件')), { direction:'top', offset:[0,-5], opacity:.94 });
      marker.on('click', () => {
        lockMapContact({ ...ev, name:ev.title || ev.road || 'TRAFFIC EVENT' }, 'TRAFFIC EVENT', { zoom:12 });
        openIntelResults();
        jumpIntelCard('autoTrafficFeed');
      });
    });
  }

  async function refreshNationalSignals(includeCctv = false) {
    if (!state.nationalMode) return;
    const flowPromise = loadFlow(NATIONAL_CENTER.lat, NATIONAL_CENTER.lon, false, 240);
    const trafficPromise = loadTraffic(NATIONAL_CENTER.lat, NATIONAL_CENTER.lon, false, 250, { draw:false });
    const cctvPromise = (includeCctv || !state.latestCctv.length)
      ? loadCctv(NATIONAL_CENTER.lat, NATIONAL_CENTER.lon, false, 420, { draw:false, national:true, fast:true })
      : Promise.resolve(state.latestCctv || []);

    // Progressive paint: no single slow source is allowed to hold the entire national board hostage.
    flowPromise.then((flow)=>{
      if (!state.nationalMode) return;
      renderNationalOverview({ flow:flow || state.latestFlow || [], traffic:state.latestTraffic || [], cctv:state.latestCctv || [] });
    }).catch(()=>{});
    trafficPromise.then((traffic)=>{
      if (!state.nationalMode) return;
      renderNationalTrafficMarkers(traffic || []);
      renderNationalOverview({ flow:state.latestFlow || [], traffic:traffic || [], cctv:state.latestCctv || [] });
    }).catch(()=>{});
    cctvPromise.then((cctv)=>{
      if (!state.nationalMode) return;
      renderCctvMapMarkers(cctv || [], { national:true });
      renderNationalOverview({ flow:state.latestFlow || [], traffic:state.latestTraffic || [], cctv:cctv || [] });
      if (includeCctv) setTimeout(() => { if (state.nationalMode) resetNationalMapView({ animate:false }); }, 50);
    }).catch(()=>{});

    await Promise.allSettled([flowPromise, trafficPromise, cctvPromise]);
  }

  async function bootstrapDefaultCenter() {
    setRailActive('overview');
    setSearchMode('monitor', { focus:false });
    state.originMode = 'taipei';
    updateOriginUi();
    enterNationalMode();
    if (window.innerWidth <= 920) {
      $('nationalOverview')?.classList.add('compact');
      if ($('nationalCompactBtn')) $('nationalCompactBtn').textContent = '+';
    }
    $('app')?.classList.remove('intel-results-open');
    if ($('intelTitle')) $('intelTitle').textContent = 'TAIWAN NATIONAL GRID';
    await refreshNationalSignals(true);
    if (state.nationalTimer) clearInterval(state.nationalTimer);
    state.nationalTimer = setInterval(() => refreshNationalSignals(false).catch(() => {}), 60000);
    if ($('routeEmpty')) $('routeEmpty').textContent = '搜尋目的地後，系統切換至區域戰情並自動建立 A → B 候選路線。';
  }

  async function loadWeather(lat, lon, announce = false) {
    try {
      const data = await jsonFetch(`/api/data?action=weather&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`);
      state.currentWeather = data;
      $('weatherTemp').textContent = `${Math.round(data.current.temperature)}°`;
      $('weatherText').textContent = data.current.summary || '即時天氣';
      $('weatherRain').textContent = `${Math.round(data.current.precipitationProbability || 0)}%`;
      $('weatherWind').textContent = `${Math.round(data.current.windSpeed || 0)} km/h`;
      $('weatherFeels').textContent = `${Math.round(data.current.apparentTemperature ?? data.current.temperature)}°`;
      if (announce) speak(`目前氣溫 ${Math.round(data.current.temperature)} 度，${data.current.summary || ''}`);
      return data;
    } catch (err) {
      $('weatherText').textContent = '天氣資料暫時無法取得';
      if (announce) toast(`天氣：${err.message}`);
      return null;
    }
  }


  async function loadAirQuality(lat, lon, radius = 65) {
    try {
      const data = await jsonFetch(`/api/data?action=air-quality&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      state.latestAqi = data.nearest || null;
      return data;
    } catch (_) { state.latestAqi = null; return { nearest:null, items:[] }; }
  }

  async function loadParking(lat, lon, radius = 5) {
    try {
      const data = await jsonFetch(`/api/data?action=parking&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      state.latestParking = data.items || [];
      return data;
    } catch (_) { state.latestParking = []; return { items:[], coverage:'' }; }
  }

  async function loadConstruction(lat, lon, radius = 7) {
    try {
      const data = await jsonFetch(`/api/data?action=construction&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      state.latestConstruction = data.items || [];
      return data;
    } catch (_) { state.latestConstruction = []; return { items:[], coverage:'' }; }
  }

  async function loadFlood(lat, lon, radius = 70) {
    try {
      const data = await jsonFetch(`/api/data?action=flood&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      state.latestFlood = data.items || [];
      return data;
    } catch (_) { state.latestFlood = []; return { items:[] }; }
  }

  function parseTimeLoose(value) {
    if (!value) return null;
    const raw = String(value).trim().replace(/\//g,'-');
    const t = Date.parse(raw.includes('T') ? raw : raw.replace(' ', 'T'));
    return Number.isFinite(t) ? t : null;
  }

  function dataAge(value, cadenceMinutes = null) {
    const t = parseTimeLoose(value);
    if (!t) return cadenceMinutes ? `≤${cadenceMinutes}m` : 'LIVE';
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 1) return '<1m';
    if (mins < 60) return `${mins}m`;
    return `${Math.round(mins/60)}h`;
  }

  function areaThreatAssessment({ weather=null, traffic=[], construction=[], aqi=null, flood=[] }={}) {
    const rain = Number(weather?.current?.precipitationProbability || 0);
    const nearFlood = (flood || []).filter((x) => Number(x.distance) <= 8);
    const impactWorks = (construction || []).filter((x) => x.impactTraffic);
    const severeEvents = (traffic || []).filter((x) => /封閉|封路|事故|車禍|回堵|壅塞/.test(`${x.title||''} ${x.description||''}`));
    const aqiValue = Number(aqi?.aqi);
    let score = 0;
    const reasons = [];
    if (nearFlood.length) { score += 5; reasons.push(`${nearFlood.length} 筆淹水警戒訊號`); }
    if (severeEvents.length >= 2) { score += 3; reasons.push(`${severeEvents.length} 件高關聯交通事件`); }
    else if (severeEvents.length) { score += 2; reasons.push('附近有交通事件'); }
    if (impactWorks.length >= 2) { score += 2; reasons.push(`${impactWorks.length} 件施工影響通行`); }
    else if (impactWorks.length) { score += 1; reasons.push('附近施工可能影響通行'); }
    if (rain >= 70) { score += 2; reasons.push(`降雨機率 ${Math.round(rain)}%`); }
    if (Number.isFinite(aqiValue) && aqiValue > 150) { score += 3; reasons.push(`AQI ${Math.round(aqiValue)}`); }
    else if (Number.isFinite(aqiValue) && aqiValue > 100) { score += 1; reasons.push(`AQI ${Math.round(aqiValue)}`); }
    const level = score >= 6 ? 'critical' : score >= 2 ? 'watch' : 'nominal';
    return { level, score, reasons, rain, aqiValue, nearFlood, impactWorks, severeEvents };
  }

  function drawThreatRadar(place, situation) {
    if (!state.threatLayer || !state.map || !place) return;
    state.threatLayer.clearLayers();
    const color = situation.level === 'critical' ? '#d86d61' : situation.level === 'watch' ? '#d5a25b' : '#91c39e';
    [850, 1800, 3200].forEach((radius, i) => {
      L.circle([place.lat, place.lon], { radius, color, weight:i===0?1.4:1, opacity:.18-(i*.03), fillColor:color, fillOpacity:i===0?.025:.009, dashArray:i?'5 9':null, interactive:false }).addTo(state.threatLayer);
    });
  }

  function sourceFreshnessHtml({weather, traffic=[], flow=[], aqi=null, construction=[], parkingMeta=null, floodMeta=null}={}) {
    const flowTime = flow.find((x)=>x.dataCollectTime)?.dataCollectTime;
    const trafficTime = traffic.find((x)=>x.time)?.time;
    const workTime = construction.find((x)=>x.reportedAt)?.reportedAt;
    const rows = [
      ['WX', weather?.current?.time, 5, 15],
      ['TRAFFIC', trafficTime, 1, 5],
      ['FLOW', flowTime, 1, 5],
      ['AQI', aqi?.publishedAt, 60, 90],
      ['WORK', workTime, 10, 30],
      ['PARK', parkingMeta?.generatedAt, parkingMeta?.cadenceMinutes || 5, 20],
      ['FLOOD', floodMeta?.generatedAt, 10, 30],
    ];
    const chip = ([name,time,cadence,staleAfter]) => {
      const parsed = parseTimeLoose(time);
      const mins = parsed ? Math.max(0,(Date.now()-parsed)/60000) : Number(cadence);
      const cls = mins > staleAfter ? 'stale' : mins > staleAfter*.55 ? 'aging' : 'live';
      return `<em class="freshness-chip ${cls}">${name} ${escapeHtml(dataAge(time,cadence))}</em>`;
    };
    return `<span>DATA AGE</span>${rows.map(chip).join('')}`;
  }

  function autoSituationBrief(place, situation, {weather, traffic=[], aqi=null, flood=[], construction=[], parking=[]}={}) {
    const rain = Math.round(Number(weather?.current?.precipitationProbability || 0));
    const aqiText = Number.isFinite(Number(aqi?.aqi)) ? `AQI ${Math.round(Number(aqi.aqi))}` : 'AQI N/A';
    const parkingText = parking.length ? `${parking.filter((x)=>Number.isFinite(Number(x.available)) && Number(x.available)>0).length} 個停車場有公開剩餘車位` : '停車動態無訊號';
    const hazard = situation.reasons.length ? situation.reasons.slice(0,2).join('；') : '未見明顯區域警戒';
    return `${shortName(place?.name||'目標區域')}：${hazard}。${traffic.length} 件交通事件、${construction.length} 件施工、${flood.length} 筆淹水警戒；${aqiText}，降雨 ${rain}%；${parkingText}。`;
  }

  function getWatchZones() {
    try { const v=JSON.parse(localStorage.getItem('sentinel-watch-zones-v1')||'[]'); return Array.isArray(v)?v:[]; } catch { return []; }
  }
  function saveWatchZones(zones) {
    state.watchedZones=(zones||[]).slice(0,6);
    try { localStorage.setItem('sentinel-watch-zones-v1', JSON.stringify(state.watchedZones)); } catch (_) {}
    renderWatchZones();
  }
  function watchKey(p={}) { return `${Number(p.lat).toFixed(3)},${Number(p.lon).toFixed(3)}`; }
  function renderWatchZones() {
    const box=$('watchZoneList'); if(!box) return;
    const zones=state.watchedZones=getWatchZones();
    box.innerHTML=zones.map((z)=>`<button class="watch-zone-chip" type="button" data-watch-key="${escapeAttr(watchKey(z))}" title="${escapeAttr(z.name||'WATCH ZONE')}">${escapeHtml(shortName(z.name||'ZONE'))}</button>`).join('');
    box.querySelectorAll('[data-watch-key]').forEach((btn)=>btn.addEventListener('click', async()=>{ const z=zones.find((x)=>watchKey(x)===btn.dataset.watchKey); if(!z)return; await lockTarget(z); const origin=await preferredOrigin(); await planRoute(origin,z,{preference:'recommended'}); }));
    const cur=state.target; const active=cur&&zones.some((z)=>watchKey(z)===watchKey(cur));
    $('watchZoneBtn')?.classList.toggle('active',!!active);
    if($('watchZoneBtn')) $('watchZoneBtn').textContent=active?'✓ WATCHING':'＋ WATCH ZONE';
  }
  function toggleWatchZone() {
    const p=state.target; if(!p) return toast('請先搜尋一個地點');
    const zones=getWatchZones(); const key=watchKey(p); const exists=zones.some((z)=>watchKey(z)===key);
    const next=exists?zones.filter((z)=>watchKey(z)!==key):[{name:p.name||'WATCH ZONE',lat:Number(p.lat),lon:Number(p.lon),level:state.currentSituation?.level||'nominal',updatedAt:new Date().toISOString()},...zones];
    saveWatchZones(next); toast(exists?'已移出 WATCH ZONE':'已加入 WATCH ZONE');
  }

  function renderSituationIntel(place, payload={}) {
    const weather=payload.weather||null, traffic=payload.traffic||[], flow=payload.flow||[], parking=payload.parking?.items||[], construction=payload.construction?.items||[], aqi=payload.aqi?.nearest||null, flood=payload.flood?.items||[];
    const sit=areaThreatAssessment({weather,traffic,construction,aqi,flood});
    state.currentSituation=sit;
    drawThreatRadar(place,sit);
    const brief=$('situationBrief'); if(brief) brief.className=`situation-brief ${sit.level}`;
    if($('situationLevel')) $('situationLevel').textContent=sit.level==='critical'?'CRITICAL':sit.level==='watch'?'WATCH':'NOMINAL';
    if($('situationHeadline')) $('situationHeadline').textContent=sit.level==='critical'?'區域風險訊號升高':sit.level==='watch'?'區域存在需注意訊號':'區域情報未見明顯警戒';
    if($('situationNarrative')) $('situationNarrative').textContent=autoSituationBrief(place,sit,{weather,traffic,aqi,flood,construction,parking});
    if($('situationAqi')) $('situationAqi').textContent=Number.isFinite(Number(aqi?.aqi))?String(Math.round(Number(aqi.aqi))):'N/A';
    if($('situationAqiMeta')) $('situationAqiMeta').textContent=aqi?`${aqi.site||'測站'} · ${aqi.status||'官方 AQI'}`:'官方測站 N/A';
    if($('situationFlood')) $('situationFlood').textContent=String(flood.length);
    if($('situationWork')) $('situationWork').textContent=construction.length?`${construction.filter((x)=>x.impactTraffic).length}/${construction.length}`:'0';
    if($('situationParking')) {
      const open=parking.filter((x)=>Number.isFinite(Number(x.available))&&Number(x.available)>0);
      $('situationParking').textContent=parking.length?(open.length?`${open.reduce((a,b)=>a+Number(b.available||0),0)} 格`:`${parking.length} 處`):'N/A';
    }
    const park=$('parkingFeed');
    if(park) park.innerHTML=`<div class="situation-feed-title"><span>PARKING INTEL</span><em>${payload.parking?.coverage||'AUTO'}</em></div>`+(parking.length?parking.slice(0,3).map((x)=>`<div class="situation-row"><b>${escapeHtml(x.name||'停車場')}</b><span>${escapeHtml(x.address||'')} · ${Number(x.distance).toFixed(1)} km</span><em>${Number.isFinite(Number(x.available))?`${Math.max(0,Math.round(Number(x.available)))} 空位`:'車位 N/A'}</em></div>`).join(''):`<div class="auto-empty">${escapeHtml(payload.parking?.message||'此區目前沒有取得即時停車資料。')}</div>`);
    const floodBox=$('floodFeed');
    if(floodBox) floodBox.innerHTML=`<div class="situation-feed-title"><span>FLOOD / WATER INTEL</span><em>${flood.length} SIGNALS</em></div>`+(flood.length?flood.slice(0,3).map((x)=>`<div class="situation-row ${Number(x.distance)<=8?'critical-row':''}"><b>${escapeHtml(x.name||'淹水警戒')}</b><span>${escapeHtml((x.description||'水利署公開警戒訊號').slice(0,90))}</span><em>${Number.isFinite(Number(x.distance))?`${Number(x.distance).toFixed(1)} km`:'ACTIVE'}</em></div>`).join(''):`<div class="auto-empty">${escapeHtml(payload.flood?.message||'附近目前沒有取得淹水警戒訊號。')}</div>`);
    const work=$('constructionFeed');
    if(work) work.innerHTML=`<div class="situation-feed-title"><span>CONSTRUCTION VISION</span><em>${construction.length} SIGNALS</em></div>`+(construction.length?construction.slice(0,3).map((x)=>`<div class="situation-row"><b>${escapeHtml(x.address||x.district||'施工通報')}</b><span>${escapeHtml(x.purpose||x.unit||'道路施工')} ${x.hours?`· ${escapeHtml(x.hours)}`:''}</span><em>${x.impactTraffic?'IMPACT':'ACTIVE'}</em></div>`).join(''):`<div class="auto-empty">${escapeHtml(payload.construction?.message||'此區目前沒有取得詳細施工通報。')}</div>`);
    if($('freshnessFeed')) $('freshnessFeed').innerHTML=sourceFreshnessHtml({weather,traffic,flow,aqi,construction,parkingMeta:payload.parking,floodMeta:payload.flood});
    renderWatchZones();
  }

  async function loadExtendedIntel(place) {
    const results=await Promise.allSettled([
      loadAirQuality(place.lat,place.lon,70), loadParking(place.lat,place.lon,5), loadConstruction(place.lat,place.lon,7), loadFlood(place.lat,place.lon,80)
    ]);
    const v=(i,fb)=>results[i].status==='fulfilled'?(results[i].value??fb):fb;
    return { aqi:v(0,{nearest:null,items:[]}), parking:v(1,{items:[]}), construction:v(2,{items:[]}), flood:v(3,{items:[]}) };
  }

  const FLOW_HISTORY_KEY='sentinel-flow-history-v1';
  function flowHistoryStore() { try { const v=JSON.parse(localStorage.getItem(FLOW_HISTORY_KEY)||'{}'); return v&&typeof v==='object'?v:{}; } catch { return {}; } }
  function flowHistoryKey(place={}) { return `${Math.round(Number(place.lat)*50)/50},${Math.round(Number(place.lon)*50)/50}`; }
  function recordFlowHistory(place, flow=[]) {
    const speeds=flow.map((x)=>Number(x.travelSpeed)).filter((x)=>Number.isFinite(x)&&x>=0); if(!speeds.length)return [];
    const store=flowHistoryStore(), key=flowHistoryKey(place), now=Date.now();
    const item={t:now,avg:Math.round(speeds.reduce((a,b)=>a+b,0)/speeds.length),min:Math.min(...speeds),slow:speeds.filter((x)=>x<40).length};
    const rows=[...(store[key]||[]).filter((x)=>now-Number(x.t)<65*60*1000),item].slice(-16); store[key]=rows;
    try{localStorage.setItem(FLOW_HISTORY_KEY,JSON.stringify(store));}catch(_){ }
    return rows;
  }
  function flowTrend(rows=[]) {
    if(rows.length<2) return {code:'COLLECTING',label:'正在建立 60 分鐘趨勢'};
    const first=rows[0],last=rows[rows.length-1],delta=Number(last.avg)-Number(first.avg),slowDelta=Number(last.slow)-Number(first.slow);
    if(delta<=-10||slowDelta>=2) return {code:'EXPANDING',label:'壅塞訊號正在擴大'};
    if(delta>=10||slowDelta<=-2) return {code:'RECOVERING',label:'車流正在恢復'};
    return {code:'STABLE',label:'車流趨勢相對穩定'};
  }
  function renderFlowTimeMachine(place, flow=[]) {
    const box=$('routeTimeMachine'),bars=$('routeFlowHistory'),trend=$('routeFlowTrend'),range=$('routeTimeRange'),value=$('routeTimeValue'); if(!box||!bars||!trend)return;
    const rows=recordFlowHistory(place,flow); box.hidden=!flow.length;
    const t=flowTrend(rows); trend.textContent=`${t.code} · ${t.label}`;
    box.dataset.trend=String(t.code||'collecting').toLowerCase();
    document.body.classList.toggle('flow-expanding',t.code==='EXPANDING');
    document.body.classList.toggle('flow-recovering',t.code==='RECOVERING');
    bars.innerHTML=rows.map((x,i)=>{ const cls=x.avg<30?'critical':x.avg<50?'slow':''; const h=Math.max(12,Math.min(100,Number(x.avg)/1.05)); return `<i class="flow-history-bar ${cls}" style="--h:${h}%" data-speed="${Math.round(x.avg)}" data-index="${i}"></i>`; }).join('');
    const describe=(i)=>{ const row=rows[Math.max(0,Math.min(rows.length-1,Number(i)||0))]; if(!row)return '等待足夠歷史快照'; const time=new Date(Number(row.t)).toLocaleTimeString('zh-TW',{hour12:false,hour:'2-digit',minute:'2-digit'}); return `${time} · AVG ${Math.round(row.avg)} km/h · MIN ${Math.round(row.min)} · LOW ${row.slow}`; };
    if(range){ range.max=String(Math.max(0,rows.length-1)); range.value=String(Math.max(0,rows.length-1)); range.disabled=rows.length<2; range.oninput=()=>{ if(value)value.textContent=describe(range.value); bars.querySelectorAll('.flow-history-bar').forEach((el,j)=>el.classList.toggle('selected',j===Number(range.value))); }; }
    if(value) value.textContent=describe(rows.length-1);
    bars.querySelectorAll('.flow-history-bar').forEach((el,j)=>el.classList.toggle('selected',j===rows.length-1));
  }

  function updateIntelSync(label = 'AUTO') {
    const el = $('intelSync');
    if (!el) return;
    const t = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = `LAST SYNC ${t} · ${String(label || 'AUTO').toUpperCase()}`;
  }

  function renderTargetBrief(place, { weather = null, traffic = [], flow = [], cityFlow = [], cctv = [], speedCameras = [] } = {}) {
    const el = $('targetBrief');
    if (!el) return;
    const speeds = flow.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const avg = speeds.length ? Math.round(speeds.reduce((a,b) => a+b, 0) / speeds.length) : null;
    const citySpeeds = cityFlow.map((x)=>Number(x.avgSpeed)).filter((x)=>Number.isFinite(x)&&x>=0);
    const cityAvg = citySpeeds.length ? Math.round(citySpeeds.reduce((a,b)=>a+b,0)/citySpeeds.length) : null;
    const rain = Math.round(Number(weather?.current?.precipitationProbability || 0));
    const status = traffic.length >= 2 ? 'CONDITION AMBER' : traffic.length ? 'WATCH' : 'NOMINAL';
    const flowText = cityAvg != null ? `CITY FLOW ${cityAvg} km/h` : (avg == null ? 'FLOW N/A' : `FLOW ${avg} km/h`);
    el.className = `target-brief ${status === 'CONDITION AMBER' ? 'warning' : status === 'WATCH' ? 'watch' : 'live'}`;
    el.innerHTML = `<span>${escapeHtml(status)}</span><b>${escapeHtml(shortName(place?.name || 'TARGET'))}</b><em>${traffic.length} EVENTS · ${flowText} · ${cctv.length} CCTV · ${speedCameras.length} SPEED · RAIN ${rain}%</em>`;
  }

  function renderAutoIntel(place, { traffic = [], flow = [], cityFlow = [], cctv = [], speedCameras = [], news = [], flights = [], quakes = [] } = {}) {
    const overview = $('autoIntelOverview');
    const trafficBox = $('autoTrafficFeed');
    const newsBox = $('autoNewsFeed');
    const signalBox = $('autoSignalFeed');
    if (!overview || !trafficBox || !newsBox || !signalBox) return;
    const speeds = flow.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const avg = speeds.length ? Math.round(speeds.reduce((a,b) => a+b,0) / speeds.length) : null;
    overview.innerHTML = [
      ['事件', traffic.length], ['CCTV', cctv.length], ['新聞', news.length], ['航空', flights.length],
    ].map(([label,value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('');
    trafficBox.innerHTML = `<div class="auto-feed-title"><span>交通與區域訊息</span><em>AUTO</em></div>` + (traffic.length
      ? traffic.slice(0,4).map((ev) => `<div class="auto-row ${/封閉|事故|車禍|施工|回堵/.test(`${ev.title||''} ${ev.description||''}`) ? 'warning' : ''}"><span>EVENT</span><b>${escapeHtml(ev.road || ev.title || '交通事件')}</b><em>${escapeHtml((ev.description || ev.title || '').slice(0,70))}</em></div>`).join('')
      : `<div class="auto-empty">此區目前沒有取得高關聯公開交通事件。</div>`);
    const newsRows = news.slice(0,10).map((n, i) => `<a class="auto-news-row ${i >= 4 ? 'news-extra' : ''}" href="${escapeAttr(n.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(n.source || n.domain || 'NEWS')}</span><b>${escapeHtml(n.title)}</b><em>${escapeHtml(formatNewsTime(n.publishedAt))}</em></a>`).join('');
    newsBox.classList.remove('expanded');
    newsBox.innerHTML = `<div class="auto-feed-title"><span>相關新聞</span><em>${news.length} MATCH</em></div>` + (news.length
      ? `${newsRows}${news.length > 4 ? `<button type="button" class="news-more-toggle" data-news-more>看更多（${Math.min(news.length,10)-4}）</button>` : ''}`
      : `<div class="auto-empty">最近 7 天暫無高關聯區域新聞。</div>`);
    const speedText = speedCameras.length ? `附近 ${speedCameras.length} 個公開測速執法點` : '附近未取得公開測速執法點';
    const citySpeeds = cityFlow.map((x)=>Number(x.avgSpeed)).filter((x)=>Number.isFinite(x)&&x>=0);
    const cityAvg = citySpeeds.length ? Math.round(citySpeeds.reduce((a,b)=>a+b,0)/citySpeeds.length) : null;
    const flowText = cityAvg != null ? `市區平均流速 ${cityAvg} km/h` : (avg == null ? '道路流速資料 N/A' : `國道平均流速 ${avg} km/h`);
    const quakeText = quakes.length ? `24H 地震訊號 ${quakes.length} 筆` : '24H 地震訊號 0 筆';
    signalBox.innerHTML = `<div class="auto-feed-title"><span>感測訊號</span><em>${escapeHtml(shortName(place?.name || 'TARGET'))}</em></div><div class="auto-signal-grid"><div><small>FLOW</small><b>${escapeHtml(flowText)}</b></div><div><small>SPEED</small><b>${escapeHtml(speedText)}</b></div><div><small>AIRSPACE</small><b>${flights.length} PUBLIC SIGNALS</b></div><div><small>SEISMIC</small><b>${escapeHtml(quakeText)}</b></div></div>`;
  }

  function targetCctvPreviewCandidates(place, items = []) {
    const max = window.innerWidth <= 420 ? 5 : window.innerWidth <= 760 ? 6 : 8;
    const lat = Number(place?.lat), lon = Number(place?.lon ?? place?.lng);
    const seen = new Set();
    return (items || [])
      .filter((cam) => Number.isFinite(Number(cam?.lat)) && Number.isFinite(Number(cam?.lon)))
      .map((cam) => ({ ...cam, _targetDistance: Number.isFinite(lat) && Number.isFinite(lon) ? haversineKm(lat, lon, Number(cam.lat), Number(cam.lon)) : Number(cam.distance || 999) }))
      .sort((a,b) => cameraPlaybackPriority(a)-cameraPlaybackPriority(b) || Number(hasDirectCameraMedia(b))-Number(hasDirectCameraMedia(a)) || a._targetDistance-b._targetDistance)
      .filter((cam) => {
        const key = cam.id || `${Number(cam.lat).toFixed(5)},${Number(cam.lon).toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      }).slice(0, max);
  }

  function rectsOverlap(a, b, gap = 8) {
    return !(a.right + gap <= b.left || a.left >= b.right + gap || a.bottom + gap <= b.top || a.top >= b.bottom + gap);
  }

  function layoutTargetCctvPreviews() {
    if (!state.map || !state.cctvPreviewCards?.length) return;
    const mapSize = state.map.getSize();
    const mobile = window.innerWidth <= 760;
    const w = mobile ? 116 : 154, h = mobile ? 82 : 108;
    const edge = mobile ? 7 : 10;
    const candidateOffsets = mobile
      ? [[12,-h-14],[-w-12,-h-14],[12,14],[-w-12,14],[22,-Math.round(h/2)],[-w-22,-Math.round(h/2)],[Math.round(w*.45),-h*2-22],[-Math.round(w*1.45),-h*2-22],[Math.round(w*.45),h+24],[-Math.round(w*1.45),h+24],[w+22,-Math.round(h/2)],[-w*2-22,-Math.round(h/2)]]
      : [[14,-h-16],[-w-14,-h-16],[14,16],[-w-14,16],[24,-Math.round(h/2)],[-w-24,-Math.round(h/2)],[Math.round(w*.35),-h-34],[-Math.round(w*1.35),-h-34],[w+28,-h-16],[-w*2-28,-h-16],[w+28,16],[-w*2-28,16]];
    const placed = [];
    state.cctvPreviewCards.forEach((entry, index) => {
      const point = state.map.latLngToContainerPoint(entry.marker.getLatLng());
      let chosen = null, best = null;
      for (const [dx,dy] of candidateOffsets) {
        const rect = { left:point.x+dx, top:point.y+dy, right:point.x+dx+w, bottom:point.y+dy+h };
        const outside = Math.max(0, edge-rect.left) + Math.max(0, rect.right-(mapSize.x-edge)) + Math.max(0, edge-rect.top) + Math.max(0, rect.bottom-(mapSize.y-edge));
        const collisions = placed.reduce((sum, r) => sum + (rectsOverlap(rect,r) ? 1 : 0), 0);
        const score = collisions*10000 + outside*30 + Math.abs(dx)*0.03 + Math.abs(dy)*0.02;
        if (!best || score < best.score) best = { dx,dy,rect,score };
        if (!collisions && outside === 0) { chosen = { dx,dy,rect }; break; }
      }
      chosen ||= best || { dx:12,dy:-h-14,rect:{left:point.x+12,top:point.y-h-14,right:point.x+12+w,bottom:point.y-14} };
      placed.push(chosen.rect);
      const el = entry.marker.getElement?.()?.querySelector?.('.map-live-cctv-card');
      if (el) {
        el.style.setProperty('--cctv-dx', `${Math.round(chosen.dx)}px`);
        el.style.setProperty('--cctv-dy', `${Math.round(chosen.dy)}px`);
        el.style.setProperty('--cctv-order', String(index));
      }
    });
  }

  function openMapCctvPreview(cam) {
    if (!cam) return;
    if (!hasDirectCameraMedia(cam)) { openCctvPosition(cam); return; }
    if (state.anprRunning && !isAnprAuthorizedCamera(cam)) stopAuthorizedAnpr();
    state.activeCamera = cam;
    state.inlineCamera = cam; setAnprButtons();
    openCctvPopup();
  }

  function clearAllCctvPreviews() {
    (state.cctvPreviewCards || []).forEach((entry) => {
      const stage = $(entry.stageId);
      if (stage) clearCameraStage(stage);
      try { state.cctvPreviewLayer?.removeLayer?.(entry.marker); } catch (_) {}
    });
    try { state.cctvPreviewLayer?.clearLayers?.(); } catch (_) {}
    state.cctvPreviewCards = [];
  }

  function renderTargetCctvPreviews(place, items = []) {
    if (!state.cctvPreviewLayer || !state.map) return;
    if (!place || state.nationalMode || state.navigation.active) {
      (state.cctvPreviewCards || []).forEach((entry)=>{ const stage=$(entry.stageId); if(stage) clearCameraStage(stage); try{state.cctvPreviewLayer.removeLayer(entry.marker)}catch(_){} });
      state.cctvPreviewCards=[];
      return;
    }
    const cameras = targetCctvPreviewCandidates(place, items);
    const mobile = window.innerWidth <= 760;
    const liveBudget = mobile ? 1 : 2;
    const desiredKeys=new Set(cameras.map((cam,index)=>String(cam.id || cam.streamUrl || `${cam.lat},${cam.lon},${index}`)));
    const existing=new Map((state.cctvPreviewCards||[]).map((entry)=>[String(entry.key),entry]));

    // Remove only previews that truly disappeared. Do not clear/rebuild every live stage
    // whenever a slower registry source adds more cameras.
    for (const [key,entry] of existing) {
      if (desiredKeys.has(key)) continue;
      const stage=$(entry.stageId); if(stage) clearCameraStage(stage);
      try { state.cctvPreviewLayer.removeLayer(entry.marker); } catch (_) {}
      existing.delete(key);
    }

    const next=[];
    cameras.forEach((cam, index) => {
      const key=String(cam.id || cam.streamUrl || `${cam.lat},${cam.lon},${index}`);
      let entry=existing.get(key);
      if (entry) {
        entry.cam={...entry.cam,...cam};
        next.push(entry);
        return;
      }
      const stageId = `mapCctvPreviewStage-${String(cam.id || index).replace(/[^a-z0-9_-]/gi,'_')}-${Math.random().toString(36).slice(2,7)}`;
      const title = shortName(cam.road || cam.name || '公開攝影機');
      const distance = Number.isFinite(Number(cam._targetDistance)) ? `${Math.max(0,Number(cam._targetDistance)).toFixed(1)} km` : 'NEARBY';
      const region = cam.region && !/^(?:臺灣|Taiwan|全台)/i.test(String(cam.region)) ? shortName(cam.region) : '';
      const hasStream = hasDirectCameraMedia(cam);
      const icon = L.divIcon({
        className:'',
        html:`<div class="map-live-cctv-card ${cam.scenic?'scenic':cam.indexed?'indexed':''} ${hasStream?'':'point-only'}" style="--cctv-dx:12px;--cctv-dy:-112px"><div class="map-live-cctv-head"><span>${cam.scenic?'SCENIC':hasStream?(cam.indexed?'PUBLIC':'LIVE'):'SEARCH'}</span><b>${escapeHtml(title)}</b><em>${escapeHtml(region || distance)}</em></div><div class="map-live-cctv-stage" id="${escapeAttr(stageId)}"><div class="map-live-cctv-loading">${hasStream?'LIVE…':'POINT'}</div></div></div>`,
        iconSize: mobile ? [116,82] : [154,108], iconAnchor:[0,0],
      });
      const marker=L.marker([Number(cam.lat),Number(cam.lon)],{icon,pane:'cctvPreviewPane',interactive:true,keyboard:true,riseOnHover:true}).addTo(state.cctvPreviewLayer);
      marker.on('click',(ev)=>{try{L.DomEvent.stopPropagation(ev)}catch(_){} openMapCctvPreview(cam);});
      entry={key,marker,cam,stageId}; next.push(entry);
      setTimeout(()=>{
        layoutTargetCctvPreviews();
        const stage=$(stageId); if(!stage || !state.cctvPreviewLayer?.hasLayer?.(marker)) return;
        if (!hasStream) { stage.innerHTML='<div class="camera-placeholder"><b>僅官方點位</b><span>此位置未提供公開播放串流。</span></div>'; return; }
        // Browsers, especially mobile Safari, will throttle or pause pages that decode many
        // simultaneous live streams. Keep a very small live-preview budget; every card still
        // opens the full live stream on click.
        const liveIndex=next.filter((x)=>hasDirectCameraMedia(x.cam)).findIndex((x)=>x.key===key);
        if (liveIndex>=0 && liveIndex<liveBudget) renderCameraMedia(stage,cam,{fast:true,preview:true}).catch?.(()=>{});
        else if (cam.imageUrl) renderCameraImage(stage,String(cam.imageUrl),{sourcePath:'direct',refreshMs:3000});
        else stage.innerHTML='<div class="camera-placeholder compact"><b>點擊觀看</b><span>避免同時載入過多串流</span></div>';
      },index*35);
    });
    state.cctvPreviewCards=next;
    setTimeout(layoutTargetCctvPreviews,0);
  }

  async function openTargetNearbyCctv(place = state.target) {
    if (!place || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lon ?? place.lng))) return;
    const lat = Number(place.lat), lon = Number(place.lon ?? place.lng);
    let items = state.target === place && state.latestCctv?.length ? state.latestCctv : [];
    if (!items.length) items = await loadCctv(lat, lon, false, 35, { fast:true });
    renderCctvMapMarkers(items || []);
    renderTargetCctvPreviews(place, items || []);
    renderInlineCctvResults(items || [], place, state.latestCityFlow || []);
    const playable = targetCctvPreviewCandidates(place, items || []).filter(hasDirectCameraMedia).length;
    const points = targetCctvPreviewCandidates(place, items || []).filter((x)=>!hasDirectCameraMedia(x)).length;
    toast(`附近 CCTV：${playable} 支可直接播放${points ? ` · ${points} 個官方點位` : ''}`);
  }

  async function reverseGeocodePoint(lat, lon) {
    try {
      const data = await jsonFetch(`/api/data?action=reverse-geocode&lat=${Number(lat).toFixed(6)}&lon=${Number(lon).toFixed(6)}`);
      return data?.place || { lat:Number(lat), lon:Number(lon), name:'地圖選取位置' };
    } catch (_) {
      return { lat:Number(lat), lon:Number(lon), name:`地圖選取 ${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}` };
    }
  }

  async function handleMapPointSelection(latlng) {
    if (!latlng || !Number.isFinite(Number(latlng.lat)) || !Number.isFinite(Number(latlng.lng))) return;
    const seq = ++state.mapPointRequestSeq;
    pauseLocationFollow({ keepWatch:true });
    toast('正在讀取此位置與附近 CCTV…');
    const place = await reverseGeocodePoint(latlng.lat, latlng.lng);
    if (seq !== state.mapPointRequestSeq) return;
    await lockTarget({ ...place, lat:Number(place.lat ?? latlng.lat), lon:Number(place.lon ?? latlng.lng), mapSelected:true }, Math.max(15, state.map.getZoom()));
  }

  async function lockTarget(place, zoom = 15) {
    const requestSeq = ++state.targetRequestSeq;
    exitNationalMode();
    state.target = place;
    clearAllCctvPreviews();
    state.cameraLayer?.clearLayers?.();
    state.latestCctv = [];
    state.inlineCamera = null;
    state.activeCamera = null;
    clearCameraStage($('inlineCameraStage'));
    if ($('cctvPopup') && !$('cctvPopup').hidden) closeCctvPopup();
    setTheaterStandby(false);
    if (state.targetMarker) state.targetMarker.remove();
    state.targetMarker = L.marker([place.lat, place.lon], { icon: markerIcon('target', 13), zIndexOffset: 900 }).addTo(state.map).bindPopup(`<b>${escapeHtml(place.name || '目標位置')}</b><br><button type="button" class="map-cctv-link" id="targetNearbyCctvBtn">附近公開 CCTV</button>`);
    state.targetMarker.on('popupopen', () => { const btn = $('targetNearbyCctvBtn'); if (btn) btn.onclick = () => openTargetNearbyCctv(place); });
    signalAcquire(true, place.aliasFrom ? `ALIAS RESOLVED // ${String(place.aliasFrom).toUpperCase()}` : 'TARGET ACQUISITION');
    const center = state.map.getCenter();
    const transferDistance = haversineKm(center.lat, center.lng, place.lat, place.lon);
    if (transferDistance > 1.5) runGeoTransfer(place);
    moveMapTo(place.lat, place.lon, zoom, { force:true, duration: state.transferFx && state.motion && transferDistance > 1.5 ? 1.25 : .9, guardMs:1700 });
    updateMapTelemetry(place.lat, place.lon);
    setTimeout(() => { signalAcquire(false); showTargetLock(place); }, state.motion ? (transferDistance > 1.5 ? 880 : 520) : 0);
    $('intelTitle').textContent = String(place.name || 'TARGET').toUpperCase().slice(0, 42);
    const cctvPromise = loadCctv(place.lat, place.lon, false, 35, { requestSeq, fast:true });
    cctvPromise.then((items) => {
      if (requestSeq !== state.targetRequestSeq || state.target !== place) return;
      renderCctvMapMarkers(items || []);
      renderTargetCctvPreviews(place, items || []);
      // Fast local CCTV appears first. Slower official road registries enrich in the background.
      enrichTargetRoadCctv(place, requestSeq).catch(() => {});
      // Scenic/live-tourism cameras enrich separately and never block nearby road CCTV.
      enrichTargetScenic(place, requestSeq).catch(() => {});
    }).catch(() => {});
    const results = await Promise.allSettled([
      loadWeather(place.lat, place.lon, true),
      loadTraffic(place.lat, place.lon, false, 35),
      loadFlow(place.lat, place.lon, false, 55),
      loadCityFlow(place.lat, place.lon, false, 8),
      cctvPromise,
      loadSpeedCameras(place.lat, place.lon, false, 30),
      loadNews(place.lat, place.lon, false, place.name),
      loadFlights(place.lat, place.lon, false, 70),
      loadEarthquakes(place.lat, place.lon, false, 250),
      loadExtendedIntel(place),
    ]);
    if (requestSeq !== state.targetRequestSeq || state.target !== place) return;
    const value = (i, fallback) => results[i].status === 'fulfilled' ? (results[i].value ?? fallback) : fallback;
    renderTargetBrief(place, { weather: value(0, null), traffic: value(1, []), flow: value(2, []), cityFlow:value(3,[]), cctv: value(4, []), speedCameras: value(5, []) });
    renderAutoIntel(place, { traffic: value(1, []), flow: value(2, []), cityFlow:value(3,[]), cctv: value(4, []), speedCameras: value(5, []), news: value(6, []), flights: value(7, []), quakes: value(8, []) });
    renderSituationIntel(place, { weather:value(0,null), traffic:value(1,[]), flow:value(2,[]), ...(value(9,{})) });
    renderCctvMapMarkers(value(4, []));
    renderTargetCctvPreviews(place, value(4, []));
    renderInlineCctvResults(value(4, []), place, value(3,[]));
    updateIntelSync('TARGET AUTO');
    if ($('abTarget')) $('abTarget').value = place.name || '';
    if (window.innerWidth > 920 || state.searchMode === 'nav') openIntelResults();
    else collapseIntelResults();
  }

  function cctvSearchIntent(text = '') {
    const raw = String(text || '').trim();
    if (!raw) return false;
    return /cctv|監視器|監視攝影機|攝影機|即時影像|路口|交叉口/i.test(raw)
      || /(?:路|街|大道|巷|道).*(?:與|和|及|交叉).*(?:路|街|大道|巷|道)/.test(raw);
  }

  function mergeCctvItems(primary = [], secondary = []) {
    const map = new Map();
    [...primary, ...secondary].forEach((cam) => {
      if (!cam) return;
      const key = cam.id || cam.streamUrl || `${Number(cam.lat).toFixed(5)},${Number(cam.lon).toFixed(5)},${cam.road || cam.name || ''}`;
      if (!map.has(key)) map.set(key, cam);
    });
    return [...map.values()];
  }

  async function enrichTargetRoadCctv(place, requestSeq = state.targetRequestSeq) {
    if (!place || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lon ?? place.lng))) return [];
    try {
      const data = await jsonFetch(`/api/data?action=cctv&lat=${Number(place.lat).toFixed(6)}&lon=${Number(place.lon ?? place.lng).toFixed(6)}&radius=35&limit=180`);
      const incoming = Array.isArray(data?.items) ? data.items : [];
      if (requestSeq !== state.targetRequestSeq || state.target !== place) return incoming;
      const merged = mergeCctvItems(state.latestCctv || [], incoming);
      merged.forEach((cam) => {
        if (!Number.isFinite(Number(cam.distance)) && Number.isFinite(Number(cam.lat)) && Number.isFinite(Number(cam.lon))) {
          cam.distance = haversineKm(Number(place.lat), Number(place.lon ?? place.lng), Number(cam.lat), Number(cam.lon));
        }
      });
      state.latestCctv = merged;
      renderCctvMapMarkers(merged);
      renderTargetCctvPreviews(place, merged);
      renderInlineCctvResults(merged, place, state.latestCityFlow || []);
      if ($('cameraCount')) $('cameraCount').textContent = String(merged.length);
      return incoming;
    } catch (_) { return []; }
  }

  async function enrichTargetScenic(place, requestSeq = state.targetRequestSeq) {
    const q = String(place?.name || '').trim();
    if (!q || !Number.isFinite(Number(place?.lat)) || !Number.isFinite(Number(place?.lon ?? place?.lng))) return [];
    try {
      const data = await jsonFetch(`/api/data?action=scenic-cctv&q=${encodeURIComponent(q)}&lat=${Number(place.lat).toFixed(6)}&lon=${Number(place.lon ?? place.lng).toFixed(6)}`);
      const scenic = Array.isArray(data?.items) ? data.items : [];
      if (!scenic.length || requestSeq !== state.targetRequestSeq || state.target !== place) return scenic;
      const merged = mergeCctvItems(scenic, state.latestCctv || []);
      merged.forEach((cam) => {
        if (!Number.isFinite(Number(cam.distance)) && Number.isFinite(Number(cam.lat)) && Number.isFinite(Number(cam.lon))) {
          cam.distance = haversineKm(Number(place.lat), Number(place.lon ?? place.lng), Number(cam.lat), Number(cam.lon));
        }
      });
      state.latestCctv = merged;
      renderCctvMapMarkers(merged);
      renderTargetCctvPreviews(place, merged);
      renderInlineCctvResults(merged, place, state.latestCityFlow || []);
      if ($('cameraCount')) $('cameraCount').textContent = String(merged.length);
      return scenic;
    } catch (_) { return []; }
  }

  async function searchCctvByText(query, limit = 100) {
    const q = String(query || '').trim();
    if (!q) return { items:[] };
    return jsonFetch(`/api/data?action=cctv&q=${encodeURIComponent(q)}&limit=${Math.min(180, Math.max(20, Number(limit) || 100))}`);
  }

  async function openCctvSearchMatch(data, fallbackName = '') {
    const exact = Array.isArray(data?.items) ? data.items.filter((x) => Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lon))) : [];
    if (!exact.length) return false;
    const first = exact[0];
    const place = { name:first.road || first.name || fallbackName || 'CCTV 路口', lat:Number(first.lat), lon:Number(first.lon), cctvMatch:true };
    await lockTarget(place, 16);
    const merged = mergeCctvItems(exact, state.latestCctv);
    state.latestCctv = merged;
    renderCctvMapMarkers(merged);
    renderInlineCctvResults(merged, place, state.latestCityFlow || []);
    if ($('cameraCount')) $('cameraCount').textContent = String(merged.length);
    if ($('inlineCameraMeta')) {
      const live = exact.filter(hasDirectCameraMedia).length;
      $('inlineCameraMeta').textContent = `CCTV 命中 ${exact.length} · 可觀看 ${live} · 官方點位 ${Math.max(0, exact.length-live)}`;
    }
    if (!first.streamUrl) openCctvPosition(first);
    else jumpIntelCard('inlineCameraCard');
    return true;
  }

  async function handleSearch(raw, context = {}) {
    const query = raw.trim();
    if (!query) return;
    $('voiceTranscript').hidden = true;
    const travelIntent = parseTravelIntent(query);
    if (travelIntent) {
      setSearchMode('nav', { focus:false });
      $('routeOrigin').value = travelIntent.origin || '我的位置';
      $('routeTarget').value = travelIntent.target;
      if ($('abOrigin')) $('abOrigin').value = travelIntent.origin || '我的位置';
      if ($('abTarget')) $('abTarget').value = travelIntent.target;
      await planRoute(travelIntent.origin, travelIntent.target, { ...travelIntent, fromVoice: Boolean(context.fromVoice) });
      openIntelResults();
      return;
    }
    if (/我的位置|目前位置|定位/.test(query)) {
      await locateUser();
      return;
    }
    const wantsNews = /新聞|消息|發生什麼|地方情報/i.test(query);
    const wantsCctv = cctvSearchIntent(query);
    const stripped = query.replace(/(看|查看|附近|目前|的|監視器|監視攝影機|攝影機|cctv|即時影像|路況|事故|天氣|會不會下雨|下雨|新聞|消息|發生什麼|地方情報)/ig, ' ').replace(/\s+/g, ' ').trim() || query;
    toast(`TARGET ACQUISITION // ${stripped}`);
    let cctvLookup = null;
    if (wantsCctv) {
      try { cctvLookup = await searchCctvByText(stripped, 100); }
      catch (_) { cctvLookup = null; }
    }
    let place = null;
    try { place = await geocode(stripped); }
    catch (geoErr) {
      if (cctvLookup?.items?.length) {
        await openCctvSearchMatch(cctvLookup, stripped);
        openIntelResults();
        return;
      }
      throw geoErr;
    }
    if ($('abTarget')) $('abTarget').value = place.name || stripped;
    await lockTarget(place);
    if (cctvLookup?.items?.length) {
      const exact = cctvLookup.items.filter((x)=>x.streamUrl&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)));
      if (exact.length) {
        const merged = mergeCctvItems(exact, state.latestCctv);
        state.latestCctv = merged;
        renderCctvMapMarkers(merged);
        renderInlineCctvResults(merged, place, state.latestCityFlow || []);
      }
    }
    if (state.searchMode === 'nav') {
      const origin = await preferredOrigin();
      await planRoute(origin, place, { preference: 'recommended', fromVoice: Boolean(context.fromVoice) });
    }
    if (wantsNews) await loadNews(place.lat, place.lon, false, place.name || stripped);
    if (state.searchMode === 'nav' || window.innerWidth > 920) openIntelResults();
    else collapseIntelResults();
  }

  function parseTravelIntent(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const normalized = raw.replace(/[，,。！!？?；;]/g, ' ').replace(/\s+/g, ' ').trim();
    let origin = '我的位置';
    let target = '';
    const arrowMatch = normalized.match(/^(.+?)\s*(?:→|➜|->|＞)\s*(.+)$/);
    const fromMatch = normalized.match(/從\s*(.+?)\s*(?:到|去|前往)\s*(.+)$/);
    if (arrowMatch) {
      origin = arrowMatch[1].trim();
      target = arrowMatch[2].trim();
    } else if (fromMatch) {
      origin = fromMatch[1].trim();
      target = fromMatch[2].trim();
    } else {
      const move = normalized.match(/(?:我\s*)?(?:等下|等等|待會|稍後|現在)?\s*(?:想|要|準備|打算)?\s*(?:去|前往|到)\s*(.+)$/);
      if (!move) return null;
      target = move[1].trim();
    }
    const stopWords = /(現在|等下|等等|待會|稍後|會不會|是否|有沒有|塞車|壅塞|路況|事故|天氣|下雨|降雨|帶傘|雨傘|多久|幾分鐘|幾小時|導航|怎麼走|怎麼去|最短|最快|省時間|推薦|建議|好走|路線)/;
    const stop = target.search(stopWords);
    if (stop > 0) target = target.slice(0, stop).trim();
    target = target.replace(/(?:嗎|呢|啊|呀)+$/g, '').trim();
    if (!target || target.length > 80) return null;
    return {
      origin,
      target,
      wantsTraffic: /塞車|壅塞|路況|事故/.test(raw),
      wantsWeather: /天氣|下雨|降雨|帶傘|雨傘|溫度/.test(raw),
      wantsUmbrella: /帶傘|雨傘|下雨|降雨/.test(raw),
      preference: /最快|省時間/.test(raw) ? 'fastest' : /最短|距離短/.test(raw) ? 'shortest' : 'recommended',
      autoMission: true,
    };
  }

  function parseRouteIntent(text) {
    return parseTravelIntent(text);
  }

  async function resolvePlace(input, fallbackUser = false) {
    if (input && typeof input === 'object' && Number.isFinite(Number(input.lat)) && Number.isFinite(Number(input.lon ?? input.lng))) {
      return { ...input, lat: Number(input.lat), lon: Number(input.lon ?? input.lng), name: input.name || '指定位置' };
    }
    const value = (input || '').trim();
    if (!value || /我的位置|目前位置|我這裡|這裡/.test(value)) {
      if (state.user) return state.user;
      if (fallbackUser || !value) return locateUser({ center: false });
    }
    return geocode(value);
  }

  function selectRoute(routes = [], preference = 'shortest') {
    const valid = routes.filter((r) => Number.isFinite(Number(r.distance)) && Number.isFinite(Number(r.duration)));
    if (!valid.length) return null;
    if (preference === 'fastest') return [...valid].sort((a, b) => a.duration - b.duration)[0];
    if (preference === 'shortest') return [...valid].sort((a, b) => a.distance - b.distance)[0];
    return valid[0];
  }

  function routeIntelSnapshot(route, { traffic = [], flow = [], cctv = [], speedCameras = [] } = {}, km = null) {
    const routeKm = Number.isFinite(Number(km)) ? Number(km) : Number(route?.distance || 0) / 1000;
    const corridor = Math.max(3.2, Math.min(9, routeKm * .032));
    const withPos = (items, extra = 0) => items.map((x) => ({ ...x, routePos: routePosition(route, x) })).filter((x) => x.routePos.distance <= corridor + extra);
    const routeTraffic = withPos(traffic).sort((a,b) => a.routePos.progress-b.routePos.progress);
    const routeFlow = withPos(flow, 3);
    const routeCctv = withPos(cctv).sort((a,b) => a.routePos.progress-b.routePos.progress);
    const routeSpeedCameras = withPos(speedCameras, -Math.max(0, corridor-2.6)).sort((a,b) => a.routePos.progress-b.routePos.progress);
    const anomalies = findFlowAnomalies(routeFlow).slice(0, 8);
    const speeds = routeFlow.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a,b) => a+b, 0) / speeds.length) : null;
    const minSpeed = speeds.length ? Math.min(...speeds) : null;
    return { traffic: routeTraffic, flow: routeFlow, cctv: routeCctv, speedCameras: routeSpeedCameras, anomalies, avgSpeed, minSpeed };
  }

  function classifyTrafficCause(item = {}) {
    const text = `${item.title || ''} ${item.road || ''} ${item.description || ''}`;
    if (/封閉|封路|中斷|管制|禁止通行/.test(text)) return { code: 'CLOSURE', text: item.description || item.road || '道路封閉／管制' };
    if (/車禍|事故|碰撞|追撞/.test(text)) return { code: 'COLLISION', text: item.description || item.road || '交通事故' };
    if (/施工|工程|道路施工/.test(text)) return { code: 'ROAD WORK', text: item.description || item.road || '道路施工' };
    if (/故障|拋錨/.test(text)) return { code: 'DISABLED VEHICLE', text: item.description || item.road || '故障車事件' };
    if (/壅塞|車多|回堵|塞車/.test(text)) return { code: 'CONGESTION', text: item.description || item.road || '壅塞回堵' };
    return { code: 'TRAFFIC EVENT', text: item.description || item.road || item.title || '公開交通事件' };
  }

  function assessRouteThreat(intel = {}, forecast = null) {
    const events = intel.traffic || [];
    const anomalies = intel.anomalies || [];
    const severe = anomalies.filter((x) => x.severity === 'HIGH');
    const reasons = [];
    events.slice(0, 3).forEach((x) => {
      const cause = classifyTrafficCause(x);
      reasons.push({ code: cause.code, text: `${x.road || '沿途'} · ${cause.text}` });
    });
    severe.slice(0, 2).forEach((x) => reasons.push({ code: 'FLOW DROP', text: `${x.road || x.name || '國道路段'} · ${Math.round(Number(x.travelSpeed || 0))} km/h` }));
    const rain = Number(forecast?.precipitationProbability || 0);
    if (rain >= 70) reasons.push({ code: 'WEATHER RISK', text: `抵達時段降雨機率約 ${Math.round(rain)}%（風險因素，不直接推定為壅塞原因）` });
    const hardClosure = events.some((x) => /封閉|封路|中斷|禁止通行/.test(`${x.description || ''} ${x.title || ''}`));
    const extremeFlow = Number.isFinite(Number(intel.minSpeed)) && Number(intel.minSpeed) <= 20;
    const corridorSlow = (intel.flow || []).filter((x) => Number.isFinite(Number(x.travelSpeed)) && Number(x.travelSpeed) <= 35).length;
    const avgCritical = Number.isFinite(Number(intel.avgSpeed)) && Number(intel.avgSpeed) <= 32;
    if (avgCritical) reasons.unshift({ code: 'CORRIDOR SPEED', text: `沿途可取得的國道路段平均約 ${Math.round(Number(intel.avgSpeed))} km/h` });
    if (corridorSlow >= 3) reasons.unshift({ code: 'CONGESTION CASCADE', text: `${corridorSlow} 個路段同時落入低速區間` });
    const red = hardClosure || severe.length >= 2 || extremeFlow || avgCritical || corridorSlow >= 3 || (severe.length >= 1 && events.length >= 2);
    const amber = red || severe.length || events.length || corridorSlow || (Number.isFinite(Number(intel.avgSpeed)) && Number(intel.avgSpeed) < 50);
    return { level: red ? 'red' : amber ? 'amber' : 'green', reasons, hardClosure, severe: severe.length, eventCount: events.length, corridorSlow, avgCritical };
  }

  function routeOperationalScore(candidate) {
    const mins = Number(candidate.duration || 0) / 60;
    const intel = candidate.intel || {};
    const severe = (intel.anomalies || []).filter((x) => x.severity === 'HIGH').length;
    const avgPenalty = Number.isFinite(Number(intel.avgSpeed)) ? Math.max(0, 60 - Number(intel.avgSpeed)) / 5 : 0;
    return mins + (intel.traffic?.length || 0) * 5.5 + severe * 9 + (intel.anomalies?.length || 0) * 2.5 + avgPenalty;
  }

  function routeFreewayProfile(route = {}) {
    let n1 = 0, n3 = 0, highway = 0;
    for (const step of (route.steps || [])) {
      const d = Math.max(0, Number(step.distance || 0));
      const text = `${step.name || ''} ${step.ref || ''} ${step.destinations || ''}`.replace(/\s+/g,' ');
      const one = /國道\s*1(?:號)?|國1|一高|中山高速|Freeway\s*1|National Highway\s*1/i.test(text) || /(^|\D)1($|\D)/.test(String(step.ref || ''));
      const three = /國道\s*3(?:號)?|國3|二高|福爾摩沙高速|Freeway\s*3|National Highway\s*3/i.test(text) || /(^|\D)3($|\D)/.test(String(step.ref || ''));
      if (one) n1 += d;
      if (three) n3 += d;
      if (one || three || /國道|高速公路|freeway|expressway/i.test(text)) highway += d;
    }
    const total = Math.max(1, Number(route.distance || 0));
    const highwayShare = Math.min(1, highway / total);
    if (n1 <= 0 && n3 <= 0) {
      if (route.highwayPreferred || highwayShare >= .22) return { code:'HWY', label:'高速公路優先', n1, n3, highway, highwayShare };
      return { code:'OTHER', label:'一般道路路線', n1, n3, highway, highwayShare };
    }
    if (n1 > n3 * 1.12) return { code:'N1', label:'一高優先', n1, n3, highway, highwayShare };
    if (n3 > n1 * 1.12) return { code:'N3', label:'二高優先', n1, n3, highway, highwayShare };
    return { code:'MIX', label:'一高／二高混合', n1, n3, highway, highwayShare };
  }

  function chooseTwoNavigationRoutes(candidates = [], { longTrip = false } = {}) {
    if (!candidates.length) return [];
    const ranked = [...candidates].sort((a,b) => {
      if (longTrip) {
        const ah = (a.corridor?.code !== 'OTHER' ? 1 : 0), bh = (b.corridor?.code !== 'OTHER' ? 1 : 0);
        if (ah !== bh) return bh-ah;
        const aScore = (a.duration/60) + (1-(a.corridor?.highwayShare||0))*10;
        const bScore = (b.duration/60) + (1-(b.corridor?.highwayShare||0))*10;
        if (Math.abs(aScore-bScore) > .5) return aScore-bScore;
      }
      return a.duration-b.duration || a.distance-b.distance;
    });
    const first = ranked[0];
    const second = ranked.slice(1).find((x) => {
      const corridorDifferent = x.corridor?.code !== first.corridor?.code;
      const timeReasonable = x.duration <= first.duration * 1.28;
      const distanceReasonable = x.distance <= first.distance * 1.35;
      return corridorDifferent && timeReasonable && distanceReasonable;
    }) || ranked[1];
    return [first, second].filter(Boolean).map((x,i) => ({ ...x, index:i }));
  }


  function routeRoadSummary(route = {}) {
    const roads = [];
    for (const leg of (route.legs || [])) for (const step of (leg.steps || [])) {
      const raw = String(step.ref || step.name || step.destinations || '').trim();
      if (!raw) continue;
      const text = raw.replace(/\s+/g,' ');
      const important = /國道|高速公路|快速道路|台\s*\d+線|縣道|市民大道|環東|建國高架|Freeway|Expressway/i.test(text);
      if (!important && roads.length >= 2) continue;
      const short = text.split('/')[0].trim().slice(0,34);
      if (short && !roads.includes(short)) roads.push(short);
      if (roads.length >= 4) break;
    }
    if (!roads.length) {
      for (const leg of (route.legs || [])) for (const step of (leg.steps || [])) {
        const text = String(step.name || step.ref || '').trim();
        if (text && !roads.includes(text)) roads.push(text.slice(0,34));
        if (roads.length >= 3) break;
      }
    }
    return roads.slice(0,3).join(' → ') || '依即時路線規劃';
  }

  function routeChoiceReason(candidate, candidates = [], recommended = null) {
    const fastest = Math.min(...candidates.map((c)=>Number(c.duration)||Infinity));
    const delta = Math.max(0, Math.round((Number(candidate.duration)-fastest)/60));
    const ev = candidate.intel?.traffic?.length || 0;
    const avg = Number(candidate.intel?.avgSpeed);
    const flow = Number.isFinite(avg) ? `沿途可用流速約 ${Math.round(avg)} km/h` : '部分路段即時流速未涵蓋';
    if (candidate.index === recommended) return `${delta ? `較最快 +${delta} 分 · ` : ''}綜合 ETA、${ev} 個事件與流速後優先`;
    if (candidate.corridor?.code === 'N1') return `一高走廊 · ${flow}`;
    if (candidate.corridor?.code === 'N3') return `二高走廊 · ${flow}`;
    return `${ev} 個事件 · ${flow}`;
  }

  function renderRouteOptions() {
    const box = $('routeOptions');
    if (!box) return;
    const candidates = state.routeCandidates || [];
    if (!candidates.length) { box.innerHTML = ''; return; }
    if (candidates.length === 1) {
      box.innerHTML = '<div class="route-option-note">ROUTER RETURNED ONE DISTINCT PATH · 不虛構替代路線</div>';
      return;
    }
    const recommended = [...candidates].sort((a,b) => a.score-b.score)[0]?.index;
    box.innerHTML = candidates.map((x) => {
      const active = state.currentRoute?.candidateIndex === x.index;
      const badges = [x.corridor?.label || '', x.isFastest ? 'FASTEST' : '', x.isShortest ? 'SHORTEST' : ''].filter(Boolean).join(' · ');
      const flow = Number.isFinite(Number(x.intel.avgSpeed)) ? `${Math.round(x.intel.avgSpeed)} km/h` : 'FLOW N/A';
      const risk = x.threat.level === 'red' ? 'CRITICAL' : x.threat.level === 'amber' ? 'WATCH' : 'NOMINAL';
      const rationale = routeChoiceReason(x, candidates, recommended);
      const roads = routeRoadSummary(x.route);
      return `<button class="route-option ${active ? 'active' : ''} ${x.threat.level === 'red' ? 'danger' : x.threat.level === 'amber' ? 'warning' : ''}" data-route-option="${x.index}"><span>${escapeHtml(x.corridor?.label || `PATH ${String(x.index+1).padStart(2,'0')}`)} · ${risk}</span><b>${Math.round(x.duration/60)} min · ${(x.distance/1000).toFixed(1)} km</b><strong class="route-option-path">${escapeHtml(roads)}</strong><em>${escapeHtml(badges || 'ALTERNATE')} · ${escapeHtml(rationale)}</em></button>`;
    }).join('');
    box.querySelectorAll('[data-route-option]').forEach((btn) => btn.addEventListener('click', () => activateRouteCandidate(Number(btn.dataset.routeOption), { announce: true })));
  }

  function playAlertTone() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.62);
      gain.connect(ctx.destination);
      [440, 330].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'square'; osc.frequency.value = freq;
        osc.connect(gain); osc.start(ctx.currentTime + i * .18); osc.stop(ctx.currentTime + .42 + i * .18);
      });
      setTimeout(() => ctx.close?.(), 900);
    } catch (_) {}
  }

  function showThreatAlert(threat, candidate) {
    if (!threat || threat.level !== 'red' || !$('threatAlert')) return;
    const signature = `${candidate?.index || 0}|${threat.reasons.map((x) => x.code+x.text).join('|')}`;
    if (state.lastThreatSignature === signature) return;
    state.lastThreatSignature = signature;
    $('threatTitle').textContent = threat.hardClosure ? 'ROUTE ACCESS CONFLICT' : 'CRITICAL TRAFFIC ALERT';
    $('threatSummary').textContent = `PATH ${String((candidate?.index || 0)+1).padStart(2,'0')} 公開即時訊號顯示高度路況風險。已知原因與風險因素只列可驗證訊號；若只有低速異常而沒有事件資料，系統不推測原因。`;
    $('threatReasons').innerHTML = (threat.reasons.length ? threat.reasons : [{ code:'FLOW ANOMALY', text:'即時流速顯著偏低，原因尚未確認' }]).slice(0,5).map((r) => `<div><span>${escapeHtml(r.code)}</span><b>${escapeHtml(r.text)}</b></div>`).join('');
    $('threatAlert').hidden = false;
    $('app').classList.add('condition-red');
    tactile(45);
    playAlertTone();
  }

  function forecastForArrival(weatherData, minutes) {
    const hourly = weatherData?.hourly || [];
    if (!hourly.length) return weatherData?.current || null;
    const targetMs = Date.now() + Math.max(0, Number(minutes || 0)) * 60000;
    return hourly.reduce((best, item) => {
      const ms = Date.parse(item.time || '');
      if (!Number.isFinite(ms)) return best;
      const diff = Math.abs(ms - targetMs);
      return !best || diff < best.diff ? { ...item, diff } : best;
    }, null) || weatherData?.current || null;
  }

  function umbrellaAdvice(forecast) {
    if (!forecast) return { label: '天氣資料暫缺', shouldCarry: null };
    const prob = Number(forecast.precipitationProbability || 0);
    const precipitation = Number(forecast.precipitation || 0);
    const code = Number(forecast.weatherCode);
    const wetCode = [51,53,55,61,63,65,66,67,80,81,82,95,96,99].includes(code);
    if (wetCode || precipitation > .1 || prob >= 50) return { label: '建議帶傘', shouldCarry: true };
    if (prob >= 25) return { label: '建議備一把傘', shouldCarry: true };
    return { label: '目前看來不必特別帶傘', shouldCarry: false };
  }

  function routeTrafficAdvice(intel = {}) {
    const events = intel.traffic || [];
    const anomalies = intel.anomalies || [];
    const severe = anomalies.filter((x) => x.severity === 'HIGH');
    if (severe.length || events.length >= 2) return { label: '沿途有較明顯壅塞／事件訊號', level: 'danger' };
    if (events.length || anomalies.length) return { label: '部分路段可能較慢', level: 'warning' };
    return { label: '目前公開資料未見明顯壅塞', level: 'live' };
  }

  function missionVoiceBrief({ target, mins, km, intel, forecast, umbrella, preference }) {
    const traffic = routeTrafficAdvice(intel);
    const rain = Math.round(Number(forecast?.precipitationProbability || 0));
    const temp = Number.isFinite(Number(forecast?.temperature)) ? `${Math.round(Number(forecast.temperature))} 度` : '氣溫資料暫缺';
    const routeLabel = preference === 'fastest' ? '較快基準路線' : preference === 'shortest' ? '最短距離路線' : preference === 'alternate' ? '替代路線' : '綜合公開路況較平衡的推薦路線';
    const firstCause = intel.traffic?.[0] ? classifyTrafficCause(intel.traffic[0]) : null;
    const flowCause = intel.anomalies?.find((x) => x.severity === 'HIGH');
    const reasonText = firstCause ? `，已知事件：${firstCause.code}` : flowCause ? `，${flowCause.road || '沿途'}偵測到約 ${Math.round(flowCause.travelSpeed)} km/h 的低速異常，原因尚未確認` : '';
    const trafficScope = traffic.level === 'live'
      ? '目前可取得的公開交通事件與國道路速未見明顯異常，但市區道路即時速度並非完整涵蓋'
      : `${traffic.label}${reasonText}，判斷依公開事件與可取得的國道路速`;
    return `已規劃前往${shortName(target?.name || '目的地')}的${routeLabel}，基準車程約 ${mins} 分鐘，距離 ${Number(km).toFixed(1)} 公里。${trafficScope}。預計抵達時${temp}，降雨機率約 ${rain}%。${umbrella.label}。基準車程不是完整即時交通 ETA，行車請以現場路況與標誌為準。`;
  }

  function renderRouteLayers(selectedIndex) {
    if (state.routeLayer) { state.routeLayer.remove(); state.routeLayer = null; }
    if (state.routeAltLayer) { state.routeAltLayer.remove(); state.routeAltLayer = null; }
    state.routeAltLayer = L.layerGroup().addTo(state.map);
    (state.routeCandidates || []).forEach((candidate) => {
      if (candidate.index === selectedIndex) return;
      const color = candidate.threat?.level === 'red' ? '#9b5e52' : '#766b52';
      L.geoJSON(candidate.route.geometry, { style: { color, weight: 2.4, opacity: .62, dashArray: '7 8' } })
        .bindTooltip?.(`PATH ${String(candidate.index+1).padStart(2,'0')} · ${Math.round(candidate.duration/60)} min`, { sticky: true, opacity: .86 })
        .addTo(state.routeAltLayer);
    });
    const active = (state.routeCandidates || []).find((x) => x.index === selectedIndex);
    if (active) {
      state.routeLayer = L.geoJSON(active.route.geometry, { style: { color: active.threat.level === 'red' ? '#e4a878' : '#e0c77f', weight: 5.2, opacity: .96 } }).addTo(state.map);
      state.routeLayer.bringToFront?.();
    }
  }

  async function activateRouteCandidate(index, { announce = false, fromVoice = false, navigation = false } = {}) {
    const candidate = (state.routeCandidates || []).find((x) => x.index === index);
    const ctx = state.routeContext;
    if (!candidate || !ctx) return;
    clearAllCctvPreviews();
    renderRouteLayers(candidate.index);
    const bounds = state.routeLayer.getBounds();
    if (!navigation) state.map.fitBounds(bounds.pad(.08), { animate: true });
    const mins = Math.max(1, Math.round(candidate.duration / 60));
    const km = candidate.distance / 1000;
    state.currentRoute = { route: candidate.route, origin: ctx.origin, target: ctx.target, mins, km, preference: ctx.preference, candidateIndex: candidate.index, datasets: ctx.datasets };
    $('routeEmpty').hidden = true;
    $('routeInfo').hidden = false;
    $('routeEta').textContent = `${mins} min`;
    $('routeDistance').textContent = `${km.toFixed(1)} km`;
    const recommended = [...state.routeCandidates].sort((a,b) => a.score-b.score)[0]?.index;
    $('routeMode').textContent = candidate.corridor?.label || (candidate.isFastest ? 'FASTEST BASE' : candidate.isShortest ? 'SHORTEST' : `PATH ${candidate.index+1}`);
    if ($('routeRecommendation')) $('routeRecommendation').textContent = `${candidate.corridor?.label || `PATH ${String(candidate.index+1).padStart(2,'0')}`} · ${candidate.index === recommended ? '建議路線' : '使用者選擇'} · ${routeRoadSummary(candidate.route)}`;
    $('routeFrom').textContent = shortName(ctx.origin.name || 'START');
    $('routeTo').textContent = shortName(ctx.target.name || 'TARGET');
    const intel = buildMissionRouteBrief({ route: candidate.route, origin: ctx.origin, target: ctx.target, mins, km, traffic: ctx.datasets.traffic, flow: ctx.datasets.flow, cctv: ctx.datasets.cctv, speedCameras: ctx.datasets.speedCameras, weatherData: ctx.weatherData });
    candidate.intel = { ...candidate.intel, ...intel };
    const forecast = forecastForArrival(ctx.weatherData, mins);
    const umbrella = umbrellaAdvice(forecast);
    const brief = missionVoiceBrief({ target: ctx.target, mins, km, intel: candidate.intel, forecast, umbrella, preference: candidate.index === recommended ? 'recommended' : candidate.isFastest ? 'fastest' : candidate.isShortest ? 'shortest' : 'alternate' });
    state.currentRoute.travelBrief = { text: brief, forecast, umbrella, traffic: routeTrafficAdvice(candidate.intel), preference: ctx.preference };
    state.currentRoute.intel = candidate.intel;
    renderTravelAnswer(state.currentRoute.travelBrief, ctx.target, mins, km);
    renderRouteOptions();
    if (ctx?.datasets?.flow) renderFlowTimeMachine({ lat:(ctx.origin.lat+ctx.target.lat)/2, lon:(ctx.origin.lon+ctx.target.lon)/2, name:'ROUTE CORRIDOR' }, ctx.datasets.flow);
    renderInlineCctvResults(candidate.intel.cctv || ctx.datasets.cctv || [], ctx.target);
    openIntelResults();
    if (candidate.threat.level === 'red' && !navigation) showThreatAlert(candidate.threat, candidate);
    if (announce) {
      toast(`PATH ${candidate.index+1}｜約 ${mins} 分鐘・${km.toFixed(1)} 公里`);
      speak(brief, fromVoice || state.speech);
    }
  }

  async function planRoute(originInput, targetInput, options = {}) {
    try {
      const origin = await resolvePlace(originInput || $('routeOrigin').value, true);
      const target = await resolvePlace(targetInput || $('routeTarget').value);
      if (!target) throw new Error('請輸入目的地');
      toast('正在建立多路線戰情…');
      signalAcquire(true, 'MULTI-PATH DECRYPTION');
      const data = await jsonFetch(`/api/data?action=route&from=${origin.lon},${origin.lat}&to=${target.lon},${target.lat}`);
      const routes = (data.routes || []).filter((r) => r?.geometry && Number.isFinite(Number(r.distance)) && Number.isFinite(Number(r.duration))).slice(0,4);
      if (!routes.length) throw new Error('目前找不到可用路線');
      const allLatLng = routes.flatMap((r) => (r.geometry?.coordinates || []).map(([lon,lat]) => [lat,lon]));
      const aggregateBounds = L.latLngBounds(allLatLng);
      const center = aggregateBounds.getCenter();
      const longestKm = Math.max(...routes.map((r) => Number(r.distance)/1000));
      const routeRadius = Math.min(220, Math.max(50, longestKm * .62 + 26));
      const [weatherData, traffic, flow, cctv, speedCameras] = await Promise.all([
        loadWeather(target.lat, target.lon, false),
        loadTraffic(center.lat, center.lng, false, Math.min(250, routeRadius)),
        loadFlow(center.lat, center.lng, false, Math.min(220, routeRadius)),
        loadCctv(center.lat, center.lng, false, routeRadius),
        loadSpeedCameras(center.lat, center.lng, false, Math.min(250, routeRadius)),
      ]);
      const datasets = { traffic: traffic || [], flow: flow || [], cctv: cctv || [], speedCameras: speedCameras || [] };
      renderFlowTimeMachine({ lat:center.lat, lon:center.lng, name:'ROUTE CORRIDOR' }, datasets.flow);
      const fastestDuration = Math.min(...routes.map((r) => Number(r.duration)));
      const shortestDistance = Math.min(...routes.map((r) => Number(r.distance)));
      const routePool = routes.map((route, index) => {
        const intel = routeIntelSnapshot(route, datasets, Number(route.distance)/1000);
        const forecast = forecastForArrival(weatherData, Math.round(Number(route.duration)/60));
        const threat = assessRouteThreat(intel, forecast);
        const corridor = routeFreewayProfile(route);
        const candidate = { index, route, duration: Number(route.duration), distance: Number(route.distance), intel, threat, corridor, isFastest: Number(route.duration) === fastestDuration, isShortest: Number(route.distance) === shortestDistance };
        candidate.score = routeOperationalScore(candidate);
        return candidate;
      });
      const straightKm = haversineKm(origin.lat, origin.lon, target.lat, target.lon);
      const longTrip = straightKm >= 25;
      if (longTrip) {
        routePool.forEach((candidate) => {
          const share = Number(candidate.corridor?.highwayShare || 0);
          if (candidate.corridor?.code === 'OTHER') candidate.score += 18;
          else candidate.score -= Math.min(8, 3 + share * 8);
        });
      }
      state.routeCandidates = chooseTwoNavigationRoutes(routePool, { longTrip });
      const preference = options.preference || 'recommended';
      let selected;
      if (preference === 'fastest') selected = [...state.routeCandidates].sort((a,b) => a.duration-b.duration)[0];
      else if (preference === 'shortest') selected = [...state.routeCandidates].sort((a,b) => a.distance-b.distance)[0];
      else selected = [...state.routeCandidates].sort((a,b) => a.score-b.score)[0];
      state.routeContext = { origin, target, weatherData, datasets, preference };
      $('routeDrawer').hidden = true;
      await activateRouteCandidate(selected.index, { announce: false, fromVoice: Boolean(options.fromVoice) });
      signalAcquire(false);
      showTargetLock(target);
      const corridorText = state.routeCandidates.map((x)=>x.corridor?.label).filter(Boolean).join(' / ');
      const routeCountText = state.routeCandidates.length >= 2 ? `已取得兩條實用替代路線${corridorText ? `（${corridorText}）` : ''}` : '路由服務目前只取得 1 條可用路線';
      toast(`${routeCountText}｜推薦 PATH ${selected.index+1}`);
      const currentBrief = state.currentRoute?.travelBrief?.text;
      if (options.fromVoice && currentBrief) speak(currentBrief, true);
      else if (currentBrief && state.speech) speak(currentBrief);
    } catch (err) {
      signalAcquire(false);
      toast(`路線失敗：${err.message}`, 4200);
    }
  }

  function getOpsCenter() {
    const c = state.target || state.user || state.map?.getCenter?.();
    return c ? { lat: Number(c.lat), lon: Number(c.lon ?? c.lng), name: c.name || 'MAP CENTER' } : { lat: 25.0478, lon: 121.5170, name: 'TAIPEI' };
  }

  const OVERLAY_PANEL_IDS = ['routeDrawer','cameraDrawer','opsDrawer','wallDrawer','sourceDrawer','settingsPanel'];

  function closeOverlayPanels(exceptId = '') {
    OVERLAY_PANEL_IDS.forEach((id) => {
      if (id === exceptId) return;
      const el = $(id);
      if (el) el.hidden = true;
    });
  }

  function openOverlayPanel(id) {
    closeOverlayPanels(id);
    const el = $(id);
    if (el) el.hidden = false;
  }

  function setOpsPanel({ eyebrow = 'CLASSIFIED OPS', title = 'INTELLIGENCE', code = 'LIVE', html = '' }) {
    const card = $('opsInlineCard');
    if (card) {
      card.hidden = false;
      if ($('opsInlineEyebrow')) $('opsInlineEyebrow').textContent = eyebrow;
      if ($('opsInlineTitle')) $('opsInlineTitle').textContent = title;
      if ($('opsInlineCode')) $('opsInlineCode').textContent = code;
      if ($('opsInlineBody')) $('opsInlineBody').innerHTML = html;
      openIntelResults();
      setTimeout(() => card.scrollIntoView({ behavior: state.motion ? 'smooth' : 'auto', block: 'nearest' }), 30);
    }
    setLinkTelemetry(code);
  }

  function animateSweep() {
    const fx = $('sweepFx');
    if (!fx) return;
    fx.classList.remove('active');
    void fx.offsetWidth;
    fx.classList.add('active');
    setTimeout(() => fx.classList.remove('active'), 2800);
  }

  function haversineKm(aLat, aLon, bLat, bLon) {
    const r = 6371;
    const p1 = aLat * Math.PI / 180;
    const p2 = bLat * Math.PI / 180;
    const dp = (bLat - aLat) * Math.PI / 180;
    const dl = (bLon - aLon) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return r * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function bearingDeg(aLat, aLon, bLat, bLon) {
    const p1 = aLat * Math.PI / 180;
    const p2 = bLat * Math.PI / 180;
    const dl = (bLon - aLon) * Math.PI / 180;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function angularDifference(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 180;
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function routeAheadItems(route, items = [], currentProgress = 0, corridor = 2.2) {
    return items.map((x) => ({ ...x, routePos: x.routePos || routePosition(route, x) }))
      .filter((x) => x.routePos.distance <= corridor && x.routePos.progress >= currentProgress - .01)
      .sort((a, b) => a.routePos.progress - b.routePos.progress);
  }

  function ensureRouteMetrics(route) {
    const coords = route?.geometry?.coordinates || [];
    if (!coords.length) return { cumulative:[0], totalKm:0 };
    if (route.__metrics?.count === coords.length) return route.__metrics;
    const cumulative = [0];
    let totalKm = 0;
    for (let i = 1; i < coords.length; i += 1) {
      const a = coords[i - 1], b = coords[i];
      totalKm += haversineKm(a[1], a[0], b[1], b[0]);
      cumulative.push(totalKm);
    }
    route.__metrics = { cumulative, totalKm, count: coords.length };
    return route.__metrics;
  }

  function routePosition(route, point) {
    const coords = route?.geometry?.coordinates || [];
    if (coords.length < 2 || !Number.isFinite(point?.lat) || !Number.isFinite(point?.lon)) return { distance: Infinity, progress: 1, routeKm: 0, segmentIndex: 0 };
    const metrics = ensureRouteMetrics(route);
    const lat0 = Number(point.lat) * Math.PI / 180;
    const cosLat = Math.max(.2, Math.cos(lat0));
    const px = Number(point.lon) * cosLat;
    const py = Number(point.lat);
    let best = { distance: Infinity, progress: 1, routeKm: metrics.totalKm, segmentIndex: coords.length - 2, snapped: null };
    const stride = coords.length > 2800 ? 3 : coords.length > 1400 ? 2 : 1;
    for (let i = 0; i < coords.length - 1; i += stride) {
      const a = coords[i], b = coords[Math.min(coords.length - 1, i + stride)];
      const ax = Number(a[0]) * cosLat, ay = Number(a[1]);
      const bx = Number(b[0]) * cosLat, by = Number(b[1]);
      const dx = bx - ax, dy = by - ay;
      const denom = dx * dx + dy * dy || 1e-12;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denom));
      const sx = ax + t * dx, sy = ay + t * dy;
      const snappedLon = sx / cosLat;
      const d = haversineKm(point.lat, point.lon, sy, snappedLon);
      if (d < best.distance) {
        const segStartKm = metrics.cumulative[i] || 0;
        const segEndIdx = Math.min(coords.length - 1, i + stride);
        const segEndKm = metrics.cumulative[segEndIdx] ?? metrics.totalKm;
        const routeKm = segStartKm + (segEndKm - segStartKm) * t;
        best = {
          distance: d,
          progress: metrics.totalKm > 0 ? routeKm / metrics.totalKm : 1,
          routeKm,
          segmentIndex: i,
          snapped: { lat: sy, lon: snappedLon },
        };
      }
    }
    return best;
  }

  function routePointAtKm(route, km) {
    const coords = route?.geometry?.coordinates || [];
    if (!coords.length) return null;
    const metrics = ensureRouteMetrics(route);
    const targetKm = Math.max(0, Math.min(metrics.totalKm, Number(km) || 0));
    let idx = metrics.cumulative.findIndex((v) => v >= targetKm);
    if (idx <= 0) return { lat: coords[0][1], lon: coords[0][0] };
    if (idx < 0) idx = coords.length - 1;
    const aIdx = idx - 1, a = coords[aIdx], b = coords[idx];
    const aKm = metrics.cumulative[aIdx], bKm = metrics.cumulative[idx];
    const t = bKm > aKm ? (targetKm - aKm) / (bKm - aKm) : 0;
    return { lat: a[1] + (b[1] - a[1]) * t, lon: a[0] + (b[0] - a[0]) * t };
  }


  function findFlowAnomalies(items = []) {
    const speeds = items.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const sorted = [...speeds].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
    return items.map((item) => {
      const speed = Number(item.travelSpeed);
      const limit = Number(item.speedLimit);
      if (!Number.isFinite(speed) || speed < 0) return null;
      const ratioLimit = Number.isFinite(limit) && limit > 0 ? speed / limit : null;
      const ratioMedian = Number.isFinite(median) && median > 0 ? speed / median : null;
      const abnormal = speed < 30 || (ratioLimit != null && ratioLimit < .45) || (ratioMedian != null && median >= 55 && ratioMedian < .55);
      if (!abnormal) return null;
      const severe = speed < 20 || (ratioLimit != null && ratioLimit < .3);
      const score = (severe ? 3 : 2) + Math.max(0, (50 - speed) / 50);
      return { ...item, severity: severe ? 'HIGH' : 'WATCH', score, baseline: median };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
  }

  function formatNewsTime(value) {
    const t = Date.parse(value || '');
    if (!Number.isFinite(t)) return 'RECENT';
    const diff = Math.max(0, Date.now() - t);
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  function newsListHtml(items = [], location = {}) {
    if (!items.length) return `<div class="ops-empty">NO LOCAL NEWS MATCHES<br>${escapeHtml(location.label || '目前區域')} 最近沒有取得高關聯新聞。</div>`;
    const rows = items.slice(0, 20).map((n, i) => `<a class="news-item ${i >= 5 ? 'news-extra' : ''}" href="${escapeAttr(n.url)}" target="_blank" rel="noopener noreferrer"><span><small>${escapeHtml(n.scope || 'REGION')} · ${escapeHtml(formatNewsTime(n.publishedAt))}</small><b>${escapeHtml(n.title)}</b></span><em>${escapeHtml(n.source || n.domain || 'NEWS')}</em></a>`).join('');
    return `<div class="news-list news-expandable">${rows}${items.length > 5 ? `<button type="button" class="news-more-toggle" data-news-more>看更多（${Math.min(items.length,20)-5}）</button>` : ''}</div>`;
  }

  async function loadNews(lat, lon, open = false, query = '') {
    $('newsCount').textContent = '…';
    try {
      const q = String(query || state.target?.name || '').trim();
      const data = await jsonFetch(`/api/data?action=news&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
      const items = data.items || [];
      state.latestNews = items;
      state.newsLocation = data.location || null;
      $('newsCount').textContent = String(items.length);
      if (open) {
        setOpsPanel({
          eyebrow: 'LOCAL INTEL',
          title: data.location?.label || 'NEARBY NEWS',
          code: items.length ? 'NEWS ACQUIRED' : 'NO MATCH',
          html: `<div class="news-context"><b>${escapeHtml(data.location?.label || '目前區域')}</b><span>ADMIN-AREA MATCH · LAST 7 DAYS</span></div>${newsListHtml(items, data.location)}<p class="ops-disclaimer">新聞以行政區與地名關聯篩選；多數新聞來源沒有精確事件座標，因此不表示事件位於目前位置的特定距離內。</p>`,
        });
      }
      return items;
    } catch (err) {
      $('newsCount').textContent = 'OFF';
      if (open) {
        setOpsPanel({ eyebrow: 'LOCAL INTEL', title: 'NEARBY NEWS', code: 'SOURCE OFFLINE', html: `<div class="ops-empty">LOCAL NEWS SOURCE TEMPORARILY UNAVAILABLE<br>${escapeHtml(err.message)}</div>` });
      }
      return [];
    }
  }

  async function runAreaSweep() {
    const c = getOpsCenter();
    animateSweep();
    signalAcquire(true, 'AREA SIGNAL SWEEP');
    state.map?.flyTo([c.lat, c.lon], Math.max(state.map.getZoom(), 11), { duration: .7 });
    setOpsPanel({ title: 'AREA SWEEP', code: 'SCANNING', html: '<div class="ops-empty">SCANNING PUBLIC SIGNALS…<br>WEATHER · CCTV · TRAFFIC · FREEWAY FLOW · LOCAL NEWS</div>' });
    const [weatherData, cctv, traffic, flow, news] = await Promise.all([
      loadWeather(c.lat, c.lon, false),
      loadCctv(c.lat, c.lon, false, 25),
      loadTraffic(c.lat, c.lon, false, 25),
      loadFlow(c.lat, c.lon, false, 35),
      loadNews(c.lat, c.lon, false, c.name),
    ]);
    const weather = weatherData?.current || state.currentWeather?.current || {};
    const avg = flow.map((x) => Number(x.travelSpeed)).filter(Number.isFinite);
    const avgSpeed = avg.length ? Math.round(avg.reduce((a, b) => a + b, 0) / avg.length) : null;
    const rain = Math.round(Number(weather.precipitationProbability || 0));
    const riskText = traffic.length ? `${traffic.length} 個交通事件` : '未取得高關聯交通事件';
    const lines = [
      `<div class="ops-line"><span>WEATHER</span><b>${escapeHtml(weather.summary || '資料暫缺')} · ${Number.isFinite(weather.temperature) ? `${Math.round(weather.temperature)}°C` : '—'}</b><em>RAIN ${rain}%</em></div>`,
      `<div class="ops-line ${traffic.length ? 'warning' : ''}"><span>EVENTS</span><b>${traffic.length ? escapeHtml(traffic[0].road || traffic[0].title || '附近有交通事件') : '附近未取得交通事件'}</b><em>${traffic.length}</em></div>`,
      `<div class="ops-line"><span>FLOW</span><b>${escapeHtml(riskText)}</b><em>${avgSpeed != null ? `${avgSpeed} km/h` : 'N/A'}</em></div>`,
      `<div class="ops-line"><span>WATCH</span><b>${cctv.length ? `附近 ${cctv.length} 支公開 CCTV 可用` : '附近沒有可用公開 CCTV'}</b><em>${cctv.length}</em></div>`,
      `<div class="ops-line"><span>LOCAL</span><b>${news.length ? escapeHtml(news[0].title) : '附近暫無高關聯新聞'}</b><em>${news.length} NEWS</em></div>`,
    ].join('');
    setOpsPanel({
      title: 'AREA SWEEP',
      code: 'SCAN COMPLETE',
      html: `<div class="ops-grid"><div class="ops-metric"><small>CCTV</small><b class="gold">${cctv.length}</b></div><div class="ops-metric"><small>EVENTS</small><b>${traffic.length}</b></div><div class="ops-metric"><small>NEWS</small><b>${news.length}</b></div><div class="ops-metric"><small>RAIN</small><b>${rain}%</b></div></div><div class="ops-brief">${lines}</div>`,
    });
    signalAcquire(false);
    tactile(12);
    toast('AREA SWEEP 完成');
  }

  async function runSentinel() {
    const c = getOpsCenter();
    signalAcquire(true, 'SENTINEL ANALYSIS');
    setOpsPanel({ eyebrow: 'ROAD ANOMALY', title: 'SENTINEL', code: 'ANALYZING', html: '<div class="ops-empty">COMPARING LIVE SPEED SIGNALS…<br>不推測事故原因，只標示異常低速路段。</div>' });
    const flow = await loadFlow(c.lat, c.lon, false, 85);
    const anomalies = findFlowAnomalies(flow).slice(0, 8);
    state.sentinelLayer.clearLayers();
    anomalies.forEach((item) => {
      if (Array.isArray(item.geometry) && item.geometry.length > 1) {
        L.polyline(item.geometry, { color: '#d99576', weight: 7, opacity: .42, dashArray: '3 8' }).addTo(state.sentinelLayer);
      }
      if (Number.isFinite(item.lat) && Number.isFinite(item.lon)) {
        L.marker([item.lat, item.lon], { icon: L.divIcon({ className: '', html: '<div class="marker-sentinel"></div>', iconSize: [12, 12], iconAnchor: [6, 6] }) }).addTo(state.sentinelLayer)
          .bindPopup(`<b>SENTINEL · ${escapeHtml(item.severity)}</b><br>${escapeHtml(item.road || item.name || '國道路段')}<br>${Math.round(item.travelSpeed)} km/h · 僅表示即時速度異常`);
      }
    });
    const body = anomalies.length
      ? `<div class="ops-grid"><div class="ops-metric"><small>SEGMENTS</small><b>${flow.length}</b></div><div class="ops-metric"><small>ANOMALIES</small><b class="gold">${anomalies.length}</b></div><div class="ops-metric"><small>HIGH</small><b>${anomalies.filter((x) => x.severity === 'HIGH').length}</b></div><div class="ops-metric"><small>MODE</small><b>LIVE</b></div></div><div class="ops-brief">${anomalies.map((x) => `<div class="ops-line ${x.severity === 'HIGH' ? 'danger' : 'warning'}"><span>${escapeHtml(x.severity)}</span><b>${escapeHtml(x.road || x.name || '國道路段')} · ${escapeHtml(x.start || '')} ${x.end ? `→ ${escapeHtml(x.end)}` : ''}</b><em>${Math.round(x.travelSpeed)} km/h</em></div>`).join('')}</div>`
      : '<div class="ops-empty">NO SPEED ANOMALY DETECTED<br>目前取得的國道路段未符合異常低速門檻。</div>';
    setOpsPanel({ eyebrow: 'ROAD ANOMALY', title: 'SENTINEL', code: anomalies.length ? 'WATCH ACTIVE' : 'CLEAR', html: body });
    signalAcquire(false);
    if (anomalies[0]) {
      state.map.flyTo([anomalies[0].lat, anomalies[0].lon], Math.max(state.map.getZoom(), 11), { duration: .7 });
      setTimeout(() => showTargetLock({ name: `SENTINEL ${anomalies[0].severity}`, lat: anomalies[0].lat, lon: anomalies[0].lon }), state.motion ? 380 : 0);
    }
  }

  function buildMissionRouteBrief({ route, origin, target, mins, km, traffic = [], flow = [], cctv = [], speedCameras = [], weatherData = null }) {
    const corridor = Math.max(4, Math.min(10, km * .035));
    const routeTraffic = traffic.map((x) => ({ ...x, routePos: routePosition(route, x) })).filter((x) => x.routePos.distance <= corridor).sort((a, b) => a.routePos.progress - b.routePos.progress);
    const routeFlow = flow.map((x) => ({ ...x, routePos: routePosition(route, x) })).filter((x) => x.routePos.distance <= corridor + 3);
    const routeCctv = cctv.map((x) => ({ ...x, routePos: routePosition(route, x) })).filter((x) => x.routePos.distance <= corridor).sort((a, b) => a.routePos.progress - b.routePos.progress);
    const routeSpeedCameras = speedCameras.map((x) => ({ ...x, routePos: routePosition(route, x) })).filter((x) => x.routePos.distance <= Math.min(2.6, corridor)).sort((a, b) => a.routePos.progress - b.routePos.progress);
    const anomalies = findFlowAnomalies(routeFlow).slice(0, 5);
    const weather = weatherData?.current || state.currentWeather?.current || {};
    const timeline = [
      { progress: 0, label: 'START', text: shortName(origin.name || 'ORIGIN'), meta: 'ROUTE START' },
      ...routeTraffic.slice(0, 4).map((x) => ({ progress: x.routePos.progress, label: 'EVENT', text: x.road || x.title || '交通事件', meta: x.description || '警廣公開事件', danger: true })),
      ...anomalies.map((x) => ({ progress: x.routePos?.progress ?? routePosition(route, x).progress, label: 'FLOW ALERT', text: `${x.road || x.name || '國道路段'} · ${Math.round(x.travelSpeed)} km/h`, meta: '即時低速異常；不推測原因', danger: x.severity === 'HIGH' })),
      ...routeSpeedCameras.slice(0, 6).map((x) => ({ progress: x.routePos.progress, label: 'SPEED', text: x.address || `${x.city || ''}${x.region || ''} 公開測速點`, meta: `${x.direction || '方向未提供'}${Number.isFinite(Number(x.limit)) ? ` · LIMIT ${Number(x.limit)}` : ''}`, danger: false })),
      { progress: 1, label: 'TARGET', text: shortName(target.name || 'TARGET'), meta: `${mins} min · ${km.toFixed(1)} km` },
    ].sort((a, b) => a.progress - b.progress);
    const rain = Math.round(Number(weather.precipitationProbability || 0));
    $('routeThreatSummary').hidden = false;
    $('routeThreatSummary').innerHTML = `<b>${routeTraffic.length}</b> EVENTS · <b>${anomalies.length}</b> FLOW WATCH · <b>${routeSpeedCameras.length}</b> SPEED ENF · <b>${routeCctv.length}</b> CCTV · RAIN <b>${rain}%</b>`;
    const intel = { traffic: routeTraffic, flow: routeFlow, cctv: routeCctv, speedCameras: routeSpeedCameras, anomalies, timeline };
    state.currentRoute.intel = intel;
    setOpsPanel({
      eyebrow: 'A → B ROUTE',
      title: 'PATH INTELLIGENCE',
      code: 'ROUTE LOCKED',
      html: `<div class="ops-grid"><div class="ops-metric"><small>ETA</small><b class="gold">${mins}m</b></div><div class="ops-metric"><small>EVENTS</small><b>${routeTraffic.length}</b></div><div class="ops-metric"><small>SPEED ENF</small><b>${routeSpeedCameras.length}</b></div><div class="ops-metric"><small>CCTV</small><b>${routeCctv.length}</b></div></div><div class="timeline">${timeline.map((x) => `<div class="timeline-item ${x.danger ? 'danger' : ''}"><small>${escapeHtml(x.label)} · ${Math.round(x.progress * 100)}%</small><b>${escapeHtml(x.text)}</b><em>${escapeHtml(x.meta)}</em></div>`).join('')}</div>`,
    });
    return intel;
  }

  function renderTravelAnswer(brief, target, mins, km) {
    if (!brief) return;
    const forecast = brief.forecast || {};
    const rain = Math.round(Number(forecast.precipitationProbability || 0));
    const temp = Number.isFinite(Number(forecast.temperature)) ? `${Math.round(Number(forecast.temperature))}°C` : '—';
    const traffic = brief.traffic || { label: '路況資料暫缺', level: '' };
    setOpsPanel({
      eyebrow: 'VOICE QUERY',
      title: shortName(target?.name || 'TARGET'),
      code: 'BRIEF READY',
      html: `<div class="voice-mission-answer"><small>AUTO INTEL BRIEF</small><b>${escapeHtml(brief.text)}</b></div><div class="ops-grid"><div class="ops-metric"><small>ETA BASE</small><b class="gold">${mins}m</b></div><div class="ops-metric"><small>DISTANCE</small><b>${km.toFixed(1)}km</b></div><div class="ops-metric"><small>ARRIVAL WX</small><b>${escapeHtml(temp)}</b></div><div class="ops-metric"><small>RAIN</small><b>${rain}%</b></div></div><div class="ops-brief"><div class="ops-line ${escapeHtml(traffic.level || '')}"><span>TRAFFIC</span><b>${escapeHtml(traffic.label)}</b><em>PUBLIC LIVE</em></div><div class="ops-line ${brief.umbrella?.shouldCarry ? 'warning' : ''}"><span>UMBRELLA</span><b>${escapeHtml(brief.umbrella?.label || '天氣資料暫缺')}</b><em>ETA WEATHER</em></div></div>`,
    });
  }

  function showCurrentMissionRoute() {
    const cur = state.currentRoute;
    if (!cur) {
      openOverlayPanel('routeDrawer');
      if (state.user) $('routeOrigin').value = '我的位置';
      toast('先指定 A 點與 B 點，系統會建立沿途情報。');
      return;
    }
    if (cur.intel?.timeline) {
      buildMissionRouteBrief({ ...cur, traffic: cur.intel.traffic, flow: cur.intel.flow, cctv: cur.intel.cctv, speedCameras: cur.intel.speedCameras || [] });
    } else {
      openOverlayPanel('routeDrawer');
    }
  }

  function navMarkerIcon(heading = 0) {
    const h = Number.isFinite(Number(heading)) ? Number(heading) : 0;
    return L.divIcon({
      className: '',
      html: `<div class="nav-marker"><span style="transform:rotate(${h}deg)"></span><i></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  async function enableHeadingSensor() {
    if (state.navigation.orientationBound) return;
    const handler = (event) => {
      let heading = Number(event.webkitCompassHeading);
      if (!Number.isFinite(heading) && Number.isFinite(Number(event.alpha))) heading = (360 - Number(event.alpha)) % 360;
      if (Number.isFinite(heading)) state.navigation.sensorHeading = heading;
    };
    try {
      if (window.DeviceOrientationEvent?.requestPermission) {
        const permission = await window.DeviceOrientationEvent.requestPermission(true).catch(() => window.DeviceOrientationEvent.requestPermission());
        if (permission !== 'granted') return;
      }
      window.addEventListener('deviceorientationabsolute', handler, true);
      window.addEventListener('deviceorientation', handler, true);
      state.navigation.orientationBound = true;
    } catch (_) {}
  }


  async function refreshNavigationFlow() {
    if (!state.navigation.active || !state.currentRoute?.route) return;
    const cur=state.currentRoute;
    const mid={lat:(Number(cur.origin.lat)+Number(cur.target.lat))/2,lon:(Number(cur.origin.lon)+Number(cur.target.lon))/2,name:'NAV CORRIDOR'};
    try {
      const flow=await loadFlow(mid.lat,mid.lon,false,Math.min(160,Math.max(55,cur.km*.7+25)));
      if(flow?.length){ cur.intel=cur.intel||{}; cur.intel.flow=flow; cur.intel.anomalies=findFlowAnomalies(flow).slice(0,8); renderFlowTimeMachine(mid,flow); }
    } catch (_) {}
  }

  function navDistanceLabel(km) {
    const d = Math.max(0, Number(km) || 0);
    if (d >= 1) return `約 ${Math.round(d * 10) / 10} 公里`;
    return `約 ${Math.max(20, Math.round(d * 1000 / 10) * 10)} 公尺`;
  }

  function navTurnArrow(step = {}) {
    const type = String(step?.maneuver?.type || '').toLowerCase();
    const mod = String(step?.maneuver?.modifier || '').toLowerCase();
    if (type === 'arrive') return '◎';
    if (type.includes('roundabout') || type === 'rotary') return '↻';
    if (type === 'merge' || type === 'on ramp') return mod.includes('left') ? '↖' : '↗';
    if (type === 'off ramp') return mod.includes('left') ? '↙' : '↘';
    if (type === 'fork') return mod.includes('left') ? '↖' : '↗';
    if (mod.includes('sharp left')) return '↶';
    if (mod.includes('sharp right')) return '↷';
    if (mod.includes('slight left')) return '↖';
    if (mod.includes('slight right')) return '↗';
    if (mod.includes('left')) return '←';
    if (mod.includes('right')) return '→';
    if (mod.includes('uturn')) return '↶';
    return '↑';
  }

  function navTurnText(step = {}) {
    const type = String(step?.maneuver?.type || '').toLowerCase();
    const mod = String(step?.maneuver?.modifier || '').toLowerCase();
    const road = String(step?.name || step?.ref || '').trim();
    const roadText = road ? `進入 ${road}` : '';
    let action = '繼續直行';
    if (type === 'arrive') action = '抵達目的地';
    else if (type === 'depart') action = '開始行駛';
    else if (type.includes('roundabout') || type === 'rotary') action = step?.maneuver?.exit ? `進入圓環，於第 ${step.maneuver.exit} 個出口離開` : '進入圓環';
    else if (type === 'merge') action = mod.includes('left') ? '向左匯入' : mod.includes('right') ? '向右匯入' : '匯入主線';
    else if (type === 'on ramp') action = mod.includes('left') ? '靠左進入匝道' : mod.includes('right') ? '靠右進入匝道' : '進入匝道';
    else if (type === 'off ramp') action = mod.includes('left') ? '靠左下匝道' : mod.includes('right') ? '靠右下匝道' : '下匝道';
    else if (type === 'fork') action = mod.includes('left') ? '岔路靠左' : mod.includes('right') ? '岔路靠右' : '進入岔路';
    else if (type === 'end of road') action = mod.includes('left') ? '道路盡頭左轉' : mod.includes('right') ? '道路盡頭右轉' : '道路盡頭轉向';
    else if (mod.includes('uturn')) action = '迴轉';
    else if (mod.includes('sharp left')) action = '大幅左轉';
    else if (mod.includes('sharp right')) action = '大幅右轉';
    else if (mod.includes('slight left')) action = '稍向左';
    else if (mod.includes('slight right')) action = '稍向右';
    else if (mod.includes('left')) action = '左轉';
    else if (mod.includes('right')) action = '右轉';
    else if (type === 'continue' || mod === 'straight') action = '繼續直行';
    return `${action}${roadText ? `，${roadText}` : ''}`;
  }

  function nextNavigationStep(route, point, progress) {
    const steps = Array.isArray(route?.steps) ? route.steps : [];
    const options = steps.map((step, index) => {
      const loc = step?.maneuver?.location;
      if (!Array.isArray(loc) || !Number.isFinite(Number(loc[0])) || !Number.isFinite(Number(loc[1]))) return null;
      const p = { lat:Number(loc[1]), lon:Number(loc[0]) };
      const rp = routePosition(route, p);
      return { step, index, progress:rp.progress, distance:haversineKm(point.lat, point.lon, p.lat, p.lon) };
    }).filter(Boolean)
      .filter((x) => x.progress >= progress - .003 && String(x.step?.maneuver?.type || '') !== 'depart')
      .sort((a,b) => a.progress - b.progress || a.distance - b.distance);
    return options[0] || null;
  }

  function announceTurnStep(next, speed) {
    if (!next?.step) return;
    const d = Number(next.distance);
    if (!Number.isFinite(d)) return;
    // One concise spoken cue per maneuver.  The old three-stage EARLY/NEAR/NOW
    // prompts were noisy during GPS updates and could repeat on dense urban routes.
    const triggerKm = Number.isFinite(speed) && speed >= 80 ? .60 : Number.isFinite(speed) && speed >= 50 ? .42 : .28;
    if (d > triggerKm) return;
    const key = `TURN:${next.index}`;
    if (state.navigation.announced.has(key)) return;
    state.navigation.announced.add(key);
    const action = navTurnText(next.step);
    const lead = d <= .07 ? '現在' : `前方${navDistanceLabel(d)}`;
    speak(`${lead}${action}。`, true);
    tactile(d <= .07 ? 20 : 10);
  }

  function hideNavTurnScene() {
    const scene = $('navTurnScene');
    if (scene) scene.hidden = true;
  }

  async function updateTurnStreetImage(next) {
    const scene = $('navTurnScene'), img = $('navTurnSceneImage');
    if (!scene || !img || !state.navigation.active || !next?.step?.maneuver?.location) { hideNavTurnScene(); return; }
    if (!Number.isFinite(Number(next.distance)) || Number(next.distance) > 1.25) { hideNavTurnScene(); return; }
    const [lon,lat] = next.step.maneuver.location.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { hideNavTurnScene(); return; }
    const key = `${next.index}:${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (state.navigation.turnImageKey === key && !scene.hidden) return;
    if (state.navigation.turnImagePending) return;
    state.navigation.turnImagePending = true;
    try {
      const heading = Number(next.step.maneuver.bearingAfter ?? next.step.maneuver.bearingBefore ?? state.navigation.heading ?? 0);
      const data = await jsonFetch(`/api/data?action=street-image&lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&heading=${Number.isFinite(heading)?Math.round(heading):0}&radius=220`);
      const item = data?.item;
      if (!state.navigation.active || !item?.imageUrl) { hideNavTurnScene(); return; }
      state.navigation.turnImageKey = key;
      img.onload = () => { scene.hidden = false; };
      img.onerror = () => { scene.hidden = true; };
      img.src = item.imageUrl;
      $('navTurnSceneTitle').textContent = navTurnText(next.step);
      const captured = item.capturedAt ? new Date(item.capturedAt).toLocaleDateString('zh-TW') : '日期未知';
      $('navTurnSceneMeta').textContent = `${captured} · 歷史街景 · 非即時影像`;
      $('navTurnSceneArrow').textContent = navTurnArrow(next.step);
    } catch (_) { hideNavTurnScene(); }
    finally { state.navigation.turnImagePending = false; }
  }

  function updateNavAheadStrip(point, cur, progress, cameras = [], incidents = []) {
    const flowBox = $('navAheadFlow'), cctvBox = $('navAheadCctv'), eventBox = $('navAheadEvent');
    if (!flowBox || !cctvBox || !eventBox) return;
    const flows = routeAheadItems(cur.route, cur.intel?.flow || state.latestFlow || [], progress, 5)
      .map((x)=>({ ...x, navDistance:haversineKm(point.lat,point.lon,x.lat,x.lon) }))
      .filter((x)=>x.navDistance <= 8)
      .sort((a,b)=>a.navDistance-b.navDistance);
    const flow = flows[0];
    const speed = Number(flow?.travelSpeed);
    flowBox.textContent = flow ? `${Number.isFinite(speed)?Math.round(speed)+' km/h':'FLOW'} · ${flow.navDistance.toFixed(1)} km` : 'NO FLOW';
    cctvBox.textContent = cameras[0] ? `${cameras[0].navDistance.toFixed(1)} km` : 'NONE';
    eventBox.textContent = incidents[0] ? `${incidents[0].navDistance.toFixed(1)} km` : 'CLEAR';
  }

  function updateTurnInstruction(next, speed) {
    const arrow = $('navTurnArrow'), text = $('navTurnText'), dist = $('navTurnDistance'), road = $('navTurnRoad');
    if (!arrow || !text || !dist || !road) return;
    if (!next?.step) {
      arrow.textContent = '↑'; text.textContent = '沿目前路線繼續行駛'; dist.textContent = ''; road.textContent = 'ROUTE GUIDANCE';
      hideNavTurnScene();
      return;
    }
    arrow.textContent = navTurnArrow(next.step);
    text.textContent = navTurnText(next.step);
    dist.textContent = navDistanceLabel(next.distance);
    road.textContent = next.step.name || next.step.ref || (next.step.maneuver?.type === 'arrive' ? 'DESTINATION' : 'ROUTE GUIDANCE');
    announceTurnStep(next, speed);
    updateTurnStreetImage(next).catch(()=>{});
  }

  async function rerouteNavigation(point) {
    if (!state.navigation.active || state.navigation.rerouting || !state.currentRoute?.target) return;
    const now = Date.now();
    if (now - Number(state.navigation.lastRerouteAt || 0) < 15000) return;
    state.navigation.rerouting = true;
    state.navigation.lastRerouteAt = now;
    navWarningHtml('RECALCULATING', '已偏離路線，正在重新規劃', 'AUTO REROUTE', 'danger');
    try {
      const cur = state.currentRoute;
      const target = cur.target;
      const data = await jsonFetch(`/api/data?action=route&from=${point.lon},${point.lat}&to=${target.lon},${target.lat}`);
      const routes = (data.routes || []).filter((r) => r?.geometry && Number.isFinite(Number(r.distance)) && Number.isFinite(Number(r.duration))).slice(0,4);
      if (!routes.length) throw new Error('找不到替代路線');
      const datasets = state.routeContext?.datasets || cur.datasets || { traffic:state.latestTraffic, flow:state.latestFlow, cctv:state.latestCctv, speedCameras:state.latestSpeedCameras };
      const weatherData = state.routeContext?.weatherData || state.currentWeather;
      const fastestDuration = Math.min(...routes.map((r) => Number(r.duration)));
      const shortestDistance = Math.min(...routes.map((r) => Number(r.distance)));
      state.routeCandidates = routes.map((route, index) => {
        const intel = routeIntelSnapshot(route, datasets, Number(route.distance)/1000);
        const forecast = forecastForArrival(weatherData, Math.round(Number(route.duration)/60));
        const threat = assessRouteThreat(intel, forecast);
        const corridor = routeFreewayProfile(route);
        const candidate = { index, route, duration:Number(route.duration), distance:Number(route.distance), intel, threat, corridor, isFastest:Number(route.duration)===fastestDuration, isShortest:Number(route.distance)===shortestDistance };
        candidate.score = routeOperationalScore(candidate);
        return candidate;
      });
      const remainingKm = haversineKm(point.lat, point.lon, target.lat, target.lon);
      const longTrip = remainingKm >= 25;
      if (longTrip) state.routeCandidates.forEach((candidate) => {
        if (candidate.corridor?.code === 'OTHER') candidate.score += 18;
        else candidate.score -= Math.min(8, 3 + Number(candidate.corridor?.highwayShare || 0) * 8);
      });
      state.routeCandidates = chooseTwoNavigationRoutes(state.routeCandidates, { longTrip });
      const preference = cur.preference || 'recommended';
      const selected = preference === 'shortest'
        ? [...state.routeCandidates].sort((a,b)=>a.distance-b.distance)[0]
        : preference === 'fastest'
          ? [...state.routeCandidates].sort((a,b)=>a.duration-b.duration)[0]
          : [...state.routeCandidates].sort((a,b)=>a.score-b.score)[0];
      state.routeContext = { origin:{ lat:point.lat, lon:point.lon, name:'目前位置' }, target, weatherData, datasets, preference };
      await activateRouteCandidate(selected.index, { announce:false, navigation:true });
      state.navigation.offRouteHits = 0;
      state.navigation.lastInstructionKey = '';
      state.navigation.announced = new Set([...state.navigation.announced].filter((k) => String(k).startsWith('SPEED:')));
      const zoom = Math.max(16, state.map.getZoom?.() || 17);
      state.map.setView([point.lat, point.lon], zoom, { animate:true });
      navWarningHtml('ROUTE UPDATED', '已重新規劃並繼續導航', `${Math.round(selected.duration/60)} min · ${(selected.distance/1000).toFixed(1)} km`, 'live');
    } catch (err) {
      navWarningHtml('REROUTE FAILED', '自動重算暫時失敗', err.message || 'ROUTER OFFLINE', 'danger');
    } finally {
      state.navigation.rerouting = false;
    }
  }

  function setNavigationViewMode(mode = 'map') {
    const next = mode === 'immersive' ? 'immersive' : 'map';
    state.navigation.viewMode = next;
    const active = next === 'immersive' && state.navigation.active;
    $('app')?.classList.toggle('nav-immersive-mode', active);
    if ($('navImmersive')) $('navImmersive').hidden = !active;
    const btn = $('navViewBtn');
    if (btn) {
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.textContent = active ? 'MAP' : 'FREE 3D';
      btn.title = active ? '返回一般地圖導航' : '免費 GPS＋路線沉浸導航（非 Street View）';
    }
  }

  function renderImmersiveNavigation(nextStep, speed, remainingKm, camera = null) {
    if (state.navigation.viewMode !== 'immersive' || !state.navigation.active) return;
    const heading = Number(state.navigation.heading);
    if ($('immersiveHeading')) $('immersiveHeading').textContent = Number.isFinite(heading) ? `HDG ${String(Math.round(heading)).padStart(3,'0')}°` : 'HDG ---°';
    if ($('immersiveSpeed')) $('immersiveSpeed').textContent = Number.isFinite(speed) ? String(Math.round(speed)) : '--';
    if ($('immersiveRemain')) $('immersiveRemain').textContent = Number.isFinite(remainingKm) ? remainingKm.toFixed(1) : '--';
    if ($('immersiveArrow')) $('immersiveArrow').textContent = nextStep?.step ? navTurnArrow(nextStep.step) : '↑';
    if ($('immersiveDistance')) $('immersiveDistance').textContent = nextStep?.step ? navDistanceLabel(nextStep.distance) : '沿路線前進';
    if ($('immersiveText')) $('immersiveText').textContent = nextStep?.step ? navTurnText(nextStep.step) : '沿目前路線前進';
    if ($('immersiveRoad')) $('immersiveRoad').textContent = nextStep?.step?.name || nextStep?.step?.ref || 'ROUTE GUIDANCE';
    const camBox = $('immersiveCctv');
    if (camBox) {
      if (camera) {
        camBox.hidden = false;
        $('immersiveCctvName').textContent = shortName(camera.name || camera.road || '公開攝影機');
        $('immersiveCctvDistance').textContent = `${Number(camera.navDistance || camera.distance || 0).toFixed(1)} km`;
        camBox.onclick = () => camera.streamUrl ? openCamera(camera) : null;
      } else camBox.hidden = true;
    }
    const immersive = $('navImmersive');
    if (immersive && Number.isFinite(heading)) immersive.style.setProperty('--nav-heading', `${heading}deg`);
  }

  async function startNavigation() {
    const cur = state.currentRoute;
    if (!cur?.route) {
      openOverlayPanel('routeDrawer');
      toast('請先建立一條路線，再啟動 NAV OPS。');
      return;
    }
    if (!navigator.geolocation?.watchPosition) {
      toast('此瀏覽器不支援連續定位，無法啟動 NAV OPS。', 4200);
      return;
    }
    await enableHeadingSensor();
    if (!state.user) {
      try { await locateUser({ center: false }); } catch (err) { toast(`NAV OPS：${err.message}`, 4200); return; }
    }
    stopNavigation(false);
    state.navigation.active = true;
    setOverlayVisibility('speed', Boolean(state.speedAlerts), false);
    document.querySelectorAll('[data-layer-toggle="speed"]').forEach((btn) => { btn.hidden = false; btn.setAttribute('aria-hidden','false'); });
    state.navigation.announced = new Set();
    state.navigation.activeCameraId = null;
    state.navigation.lastPoint = null;
    state.navigation.lastUiAt = 0;
    state.navigation.lastInstructionKey = '';
    state.navigation.offRouteHits = 0;
    state.navigation.rerouting = false;
    state.navigation.lastRouteProgress = 0;
    state.navigation.turnImageKey = '';
    state.navigation.turnImagePending = false;
    hideNavTurnScene();
    setSearchMode('nav', { focus:false });
    $('app')?.classList.add('nav-driving');
    if ($('intelTitle')) $('intelTitle').textContent = 'LIVE NAVIGATION';
    if ($('intelSync')) $('intelSync').textContent = 'GPS FOLLOW · TURN GUIDANCE · AUTO REROUTE';
    $('navHud').hidden = false;
    setNavigationViewMode('immersive');
    openIntelResults();
    $('navTargetName').textContent = shortName(cur.target?.name || 'TARGET');
    $('navAlert').className = 'nav-alert live';
    $('navAlert').innerHTML = '<span>NAV LINK</span><b>GPS TRACKING ACTIVE</b><em>LIVE</em>';
    setTheaterStandby(false);
    signalAcquire(true, 'NAVIGATION LINK');
    setLinkTelemetry('NAV OPS');
    runGeoTransfer(state.user, 'NAVIGATION LINK');
    state.map.flyTo([state.user.lat, state.user.lon], 17, { duration: state.motion ? 1.1 : .5 });
    state.navigation.watchId = navigator.geolocation.watchPosition(onNavigationPosition, (err) => {
      $('navAlert').className = 'nav-alert danger';
      $('navAlert').innerHTML = `<span>POSITION LOST</span><b>${escapeHtml(err.message || 'GPS SIGNAL LOST')}</b><em>RETRY</em>`;
    }, { enableHighAccuracy: true, maximumAge: 1500, timeout: 12000 });
    state.navigation.flowTimer = setInterval(refreshNavigationFlow, 60000);
    refreshNavigationFlow().catch(() => {});
    tactile(16);
  }

  function stopNavigation(showToast = true) {
    if (state.navigation.watchId != null && navigator.geolocation?.clearWatch) {
      try { navigator.geolocation.clearWatch(state.navigation.watchId); } catch (_) {}
    }
    state.navigation.watchId = null;
    if (state.navigation.flowTimer) clearInterval(state.navigation.flowTimer);
    state.navigation.flowTimer = null;
    state.navigation.active = false;
    state.navigation.activeCameraId = null;
    state.navigation.offRouteHits = 0;
    state.navigation.rerouting = false;
    setOverlayVisibility('speed', false, false);
    document.querySelectorAll('[data-layer-toggle="speed"]').forEach((btn) => { btn.hidden = true; btn.setAttribute('aria-hidden','true'); });
    $('app')?.classList.remove('nav-driving');
    if ($('intelTitle')) $('intelTitle').textContent = shortName(state.target?.name || (state.nationalMode ? 'TAIWAN COMMAND' : 'TARGET INTEL'));
    if ($('intelSync')) $('intelSync').textContent = 'PUBLIC SIGNALS · AUTO';
    if ($('navHud')) $('navHud').hidden = true;
    hideNavTurnScene();
    state.navigation.turnImageKey = '';
    if ($('navCameraHandoff')) $('navCameraHandoff').hidden = true;
    if ($('navLimitBadge')) { $('navLimitBadge').hidden = true; $('navLimitBadge').classList.remove('danger'); }
    setNavigationViewMode('map');
    if (showToast) {
      if ($('queryInput')) $('queryInput').value = '';
      if ($('abTarget')) $('abTarget').value = '';
      if ($('abOrigin')) $('abOrigin').value = '';
      if ($('routeTarget')) $('routeTarget').value = '';
      if ($('routeOrigin')) $('routeOrigin').value = '';
      clearRoutePresentation({ clearFields:true });
      state.searchMode = 'monitor';
      toast('導航已結束；導航線與路線選擇已清除，返回地點查詢。');
      bootstrapDefaultCenter().then(() => {
        if ($('queryInput')) $('queryInput').value = '';
        if ($('abTarget')) $('abTarget').value = '';
        if ($('abOrigin')) $('abOrigin').value = '';
        if ($('routeTarget')) $('routeTarget').value = '';
        if ($('routeOrigin')) $('routeOrigin').value = '';
      }).catch(() => {});
    }
    if (!showToast) setLinkTelemetry('LIVE');
  }

  function estimateGroundSpeed(point, previous, nativeSpeed) {
    if (Number.isFinite(Number(nativeSpeed)) && Number(nativeSpeed) >= 0) return Number(nativeSpeed) * 3.6;
    if (!previous?.time || !Number.isFinite(point?.time) || point.time <= previous.time) return null;
    const dt = (point.time - previous.time) / 1000;
    if (dt < 1) return null;
    const km = haversineKm(previous.lat, previous.lon, point.lat, point.lon);
    const speed = km / (dt / 3600);
    return speed <= 240 ? speed : null;
  }

  function updateNavigationMarker(point, heading) {
    state.user = { ...(state.user || {}), lat: point.lat, lon: point.lon, name: '我的位置' };
    if (state.userMarker) state.userMarker.remove();
    state.userMarker = L.marker([point.lat, point.lon], { icon: navMarkerIcon(heading), zIndexOffset: 1400 }).addTo(state.map);
  }

  function navWarningHtml(kind, title, meta, level = 'warning') {
    $('navAlert').className = `nav-alert ${level}`;
    $('navAlert').innerHTML = `<span>${escapeHtml(kind)}</span><b>${escapeHtml(title)}</b><em>${escapeHtml(meta)}</em>`;
  }

  function speedAlertEarlyKm(currentSpeed) {
    const speed = Number(currentSpeed);
    // Used for map look-ahead only. Spoken alerts use a much closer one-shot threshold.
    if (Number.isFinite(speed) && speed >= 80) return 2.2;
    if (Number.isFinite(speed) && speed >= 50) return 1.5;
    return 1.0;
  }

  function announceSpeedCamera(cam, distanceKmValue, currentSpeed = null) {
    if (!state.speedAlerts || !cam) return;
    const d = Number(distanceKmValue);
    if (!Number.isFinite(d)) return;
    const speed = Number(currentSpeed);
    const triggerKm = Number.isFinite(speed) && speed >= 80 ? .95 : Number.isFinite(speed) && speed >= 50 ? .70 : .48;
    if (d > triggerKm) return;
    const key = `SPEED:${cam.id}`;
    if (state.navigation.announced.has(key)) return;
    state.navigation.announced.add(key);
    const meters = Math.max(50, Math.round(d * 1000 / 50) * 50);
    const publishedLimit = Number(cam.limit);
    const limit = Number.isFinite(publishedLimit) ? `，標示速限 ${publishedLimit}` : '';
    speak(`前方約 ${meters} 公尺有公開測速執法點${limit}。`, true);
    tactile(18);
  }

  function renderNavCameraHandoff(cam, distance) {
    const box = $('navCameraHandoff');
    if (!box || !cam) return;
    if (state.navigation.activeCameraId === cam.id) return;
    state.navigation.activeCameraId = cam.id;
    $('navCameraName').textContent = shortName(cam.name || cam.road || '公開攝影機');
    $('navCameraMeta').textContent = `${Number.isFinite(distance) ? `${distance.toFixed(1)} km AHEAD · ` : ''}${cam.direction || 'PUBLIC SIGNAL'}`;
    const thumb = $('navCameraThumb');
    if (thumb) {
      const imageFeed = /^https:\/\//i.test(cam.streamUrl || '') && /\.(jpg|jpeg|png)(\?|$)/i.test(cam.streamUrl || '');
      thumb.style.backgroundImage = imageFeed ? `url("${String(cam.streamUrl).replace(/["\\]/g, '')}")` : '';
      thumb.classList.toggle('has-image', imageFeed);
      thumb.innerHTML = imageFeed ? '<i>LIVE</i>' : '<i>LINK</i>';
      syncLocalPrivacyMask(thumb);
    }
    box.hidden = false;
    box.classList.remove('switching');
    void box.offsetWidth;
    box.classList.add('switching');
    box.onclick = () => openCamera(cam);
    setTimeout(() => box.classList.remove('switching'), 1000);
  }

  function onNavigationPosition(pos) {
    if (!state.navigation.active || !state.currentRoute?.route) return;
    const point = { lat: Number(pos.coords.latitude), lon: Number(pos.coords.longitude), time: Number(pos.timestamp || Date.now()) };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return;
    const prev = state.navigation.lastPoint;
    const moved = prev ? haversineKm(prev.lat, prev.lon, point.lat, point.lon) : 0;
    const gpsHeading = Number(pos.coords.heading);
    const derivedHeading = prev && moved > .006 ? bearingDeg(prev.lat, prev.lon, point.lat, point.lon) : null;
    const heading = Number.isFinite(gpsHeading) && gpsHeading >= 0 ? gpsHeading : (Number.isFinite(derivedHeading) ? derivedHeading : state.navigation.sensorHeading);
    const speed = estimateGroundSpeed(point, prev, pos.coords.speed);
    if (Number.isFinite(heading)) state.navigation.heading = heading;
    updateNavigationMarker(point, state.navigation.heading || 0);
    state.navigation.lastPoint = point;

    const cur = state.currentRoute;
    const routePos = routePosition(cur.route, point);
    const progress = Math.max(0, Math.min(1, routePos.progress));
    state.navigation.lastRouteProgress = progress;
    const routeMetrics = ensureRouteMetrics(cur.route);
    const remainingRouteKm = Math.max(0, routeMetrics.totalKm - Number(routePos.routeKm || 0));
    const remainingKm = Number.isFinite(remainingRouteKm) ? remainingRouteKm : Math.max(0, cur.km * (1 - progress));
    const remainingMin = Math.max(0, Math.round(cur.mins * (remainingKm / Math.max(.05, cur.km))));
    $('navSpeed').textContent = Number.isFinite(speed) ? String(Math.round(speed)) : '--';
    $('navHeading').textContent = Number.isFinite(state.navigation.heading) ? `${String(Math.round(state.navigation.heading)).padStart(3, '0')}°` : '---°';
    $('navRemaining').textContent = `${remainingKm.toFixed(1)} km`;
    $('navEta').textContent = `${remainingMin} min`;
    updateMapTelemetry(point.lat, point.lon);

    const nextStep = nextNavigationStep(cur.route, point, progress);
    updateTurnInstruction(nextStep, speed);

    if (Date.now() - state.navigation.lastUiAt > 650) {
      const lookAheadKm = Math.max(.07, Math.min(.32, (Number.isFinite(speed) ? speed : 35) / 360));
      const ahead = routePointAtKm(cur.route, Number(routePos.routeKm || 0) + lookAheadKm);
      const focus = ahead || point;
      const zoom = state.map.getZoom?.() || 17;
      if (zoom < 16) state.map.setZoom(17, { animate:false });
      state.map.panTo([focus.lat, focus.lon], { animate: true, duration: .38 });
      state.navigation.lastUiAt = Date.now();
    }

    const intel = cur.intel || {};
    const cameraCandidates = routeAheadItems(cur.route, intel.cctv || state.latestCctv, progress, 2.6)
      .map((x) => ({ ...x, navDistance: haversineKm(point.lat, point.lon, x.lat, x.lon) }))
      .filter((x) => x.navDistance <= 4.5);
    if (state.cameraHandoff && cameraCandidates[0]) renderNavCameraHandoff(cameraCandidates[0], cameraCandidates[0].navDistance);
    renderImmersiveNavigation(nextStep, speed, remainingKm, cameraCandidates[0] || null);

    const earlySpeedKm = speedAlertEarlyKm(speed);
    const speedCandidates = routeAheadItems(cur.route, intel.speedCameras || state.latestSpeedCameras, progress, Math.max(earlySpeedKm + .5, 2.4))
      .map((x) => ({ ...x, navDistance: haversineKm(point.lat, point.lon, x.lat, x.lon) }))
      .filter((x) => x.navDistance <= Math.max(earlySpeedKm + .35, 3.2))
      .sort((a, b) => a.navDistance - b.navDistance);
    const speedCam = state.speedAlerts ? speedCandidates[0] : null;
    const incidents = routeAheadItems(cur.route, intel.traffic || [], progress, 4)
      .map((x) => ({ ...x, navDistance: haversineKm(point.lat, point.lon, x.lat, x.lon) }))
      .filter((x) => x.navDistance <= 4)
      .sort((a, b) => a.navDistance - b.navDistance);

    updateNavAheadStrip(point, cur, progress, cameraCandidates, incidents);

    const accuracyKm = Number.isFinite(Number(pos.coords.accuracy)) ? Number(pos.coords.accuracy) / 1000 : .03;
    const deviationThreshold = Math.max(.12, accuracyKm * 2.5);
    const severeDeviation = routePos.distance > Math.max(.35, deviationThreshold * 1.8);
    if (routePos.distance > deviationThreshold && haversineKm(point.lat, point.lon, cur.target.lat, cur.target.lon) > .25) state.navigation.offRouteHits += 1;
    else state.navigation.offRouteHits = 0;
    const shouldReroute = severeDeviation || state.navigation.offRouteHits >= 2;

    const limitBadge = $('navLimitBadge');
    if (speedCam && speedCam.navDistance <= earlySpeedKm) {
      const meters = Math.max(50, Math.round(speedCam.navDistance * 1000 / 50) * 50);
      const limit = Number(speedCam.limit);
      const over = Number.isFinite(speed) && Number.isFinite(limit) && speed > limit + 2;
      if (limitBadge) {
        limitBadge.hidden = false;
        limitBadge.textContent = Number.isFinite(limit) ? `ENF LIMIT ${limit}` : 'SPEED ENF';
        limitBadge.classList.toggle('danger', Boolean(over));
      }
      navWarningHtml('SPEED LIMIT AHEAD', Number.isFinite(limit) ? `前方公開執法點速限 ${limit} · ${meters} m` : `前方公開測速點 · ${meters} m`, `${speedCam.address || speedCam.region || '公開測速執法點'}${over ? ' · 請確認車速' : ''}`, over ? 'danger' : 'warning');
      announceSpeedCamera(speedCam, speedCam.navDistance, speed);
    } else if (shouldReroute) {
      if (limitBadge) { limitBadge.hidden = true; limitBadge.classList.remove('danger'); }
      if (!state.navigation.rerouting) rerouteNavigation(point).catch(() => {});
    } else if (incidents[0] && incidents[0].navDistance <= 2.5) {
      if (limitBadge) { limitBadge.hidden = true; limitBadge.classList.remove('danger'); }
      navWarningHtml('TRAFFIC EVENT AHEAD', incidents[0].road || incidents[0].title || '前方交通事件', `${incidents[0].navDistance.toFixed(1)} km`, 'danger');
    } else {
      if (limitBadge) { limitBadge.hidden = true; limitBadge.classList.remove('danger'); }
      const guidance = nextStep ? `${navTurnText(nextStep.step)} · ${navDistanceLabel(nextStep.distance)}` : 'GPS TRACKING · ROUTE GUIDANCE';
      navWarningHtml('ROUTE GUIDANCE', guidance, `${Math.round(progress * 100)}% COMPLETE`, 'live');
    }

    const toTarget = haversineKm(point.lat, point.lon, cur.target.lat, cur.target.lon);
    if (toTarget <= .15) {
      navWarningHtml('TARGET AREA', '已進入目的地範圍', `${Math.round(toTarget * 1000)} m`, 'live');
      if (!state.navigation.announced.has('arrival')) {
        state.navigation.announced.add('arrival');
        speak('已進入目的地範圍。');
        showTargetLock(cur.target);
      }
    }
  }


  async function openCctvWall() {
    const c = getOpsCenter();
    openOverlayPanel('wallDrawer');
    signalAcquire(true, '正在取得公開攝影機');
    $('wallGrid').innerHTML = '<div class="ops-empty" style="grid-column:1/-1">正在取得公開攝影機…</div>';
    const items = await loadCctv(c.lat, c.lon, false, 35);
    renderCctvWall(items.slice(0, 9));
    signalAcquire(false);
  }

  function renderCctvWall(items) {
    const grid = $('wallGrid');
    grid.innerHTML = '';
    const valid = (items || []).filter((cam) => Number.isFinite(Number(cam?.lat)) && Number.isFinite(Number(cam?.lon))).slice(0, 9);
    if (!valid.length) {
      grid.innerHTML = '<div class="ops-empty" style="grid-column:1/-1">附近沒有公開攝影機</div>';
      $('wallMain').innerHTML = '<div class="camera-placeholder">沒有可用的 CCTV 點位</div>';
      return;
    }
    valid.forEach((cam, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wall-card';
      btn.innerHTML = `<span class="cam-code"><span>${cam.streamUrl ? '即時' : '點位'} ${String(index + 1).padStart(2, '0')}</span><span>${Number.isFinite(cam.distance) ? `${cam.distance.toFixed(1)} km` : '公開'}</span></span><b>${escapeHtml(cam.name || cam.road || '公開攝影機')}</b><small>${escapeHtml(cam.direction || cam.source || (cam.streamUrl ? '即時影像' : '官方點位'))}</small>`;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.wall-card').forEach((el) => el.classList.remove('active'));
        btn.classList.add('active');
        if (cam.streamUrl) renderWallCamera(cam);
        else renderOriginalSourceUnavailable($('wallMain'), cam);
      });
      grid.appendChild(btn);
      if (index === 0) setTimeout(() => {
        btn.classList.add('active');
        if (cam.streamUrl) renderWallCamera(cam);
        else renderOriginalSourceUnavailable($('wallMain'), cam);
      }, 0);
    });
  }

  function renderWallCamera(cam) {
    const stage = $('wallMain');
    flashSignal(stage);
    renderCameraMedia(stage, cam);
    syncLocalPrivacyMask(stage);
    $('wallMainTitle').textContent = shortName(cam.name || cam.road || '公開攝影機');
    $('wallMainMeta').textContent = `${cam.direction || '—'} · ${cam.source || 'PUBLIC DATA'}`;
  }

  async function runMissionMode(mode) {
    document.querySelectorAll('[data-mission]').forEach((btn) => btn.classList.toggle('active', btn.dataset.mission === mode));
    try {
      if (mode === 'sweep') return await runAreaSweep();
      if (mode === 'mission') return showCurrentMissionRoute();
      if (mode === 'watch') return await openCctvWall();
      if (mode === 'sentinel') return await runSentinel();
      if (mode === 'theater') return await runTheaterMode();
    } catch (err) {
      toast(`${String(mode).toUpperCase()}：${err.message}`, 4200);
    }
  }

  async function loadSpeedCameras(lat, lon, focus = false, radius = 60) {
    if (!state.speedLayer) return [];
    state.speedLayer.clearLayers();
    $('speedCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/data?action=speed-cameras&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestSpeedCameras = items;
      items.forEach((cam) => {
        const marker = L.marker([cam.lat, cam.lon], { icon: speedMarkerIcon(cam), zIndexOffset: 650 }).addTo(state.speedLayer);
        const limit = Number.isFinite(Number(cam.limit)) ? `${Number(cam.limit)} km/h` : '速限依現場標誌';
        marker.bindPopup(`<b>公開測速執法點</b><br>${escapeHtml(cam.address || `${cam.city || ''}${cam.region || ''}`)}<br>${escapeHtml(cam.direction || '方向未提供')} · ${escapeHtml(limit)}<br><small>來源：警政署公開資料；行車仍以現場標誌為準。</small>`);
        marker.on('click', () => lockMapContact({ ...cam, name:'SPEED ENFORCEMENT', source:'警政署公開資料' }, 'SPEED CAMERA', { zoom:14 }));
      });
      $('speedCount').textContent = String(items.length);
      if (focus && items.length) {
        runGeoTransfer({ ...items[0], name: 'SPEED ENFORCEMENT' }, 'PUBLIC ENFORCEMENT');
        state.map.flyTo([items[0].lat, items[0].lon], Math.max(state.map.getZoom(), 13), { duration: state.transferFx && state.motion ? 1.1 : .7 });
      }
      if (!items.length && focus) toast(data.message || '附近沒有取得公開測速執法點。');
      return items;
    } catch (err) {
      $('speedCount').textContent = 'OFF';
      if (focus) toast(`測速點：${err.message}`, 4200);
      return [];
    }
  }

  async function loadFlights(lat, lon, focus = false, radius = 120) {
    if (!state.airLayer) return [];
    state.airLayer.clearLayers();
    if ($('airCount')) $('airCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/data?action=flights&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestFlights = items;
      items.forEach((ac) => {
        const hdg = Number.isFinite(Number(ac.heading)) ? Number(ac.heading) : 0;
        const icon = L.divIcon({ className: '', html: `<div class="marker-air" style="transform:rotate(${hdg}deg)">▲</div>`, iconSize: [18,18], iconAnchor: [9,9] });
        const marker = L.marker([ac.lat, ac.lon], { icon, zIndexOffset: 520 }).addTo(state.airLayer);
        marker.bindPopup(`<b>${escapeHtml(ac.callsign || 'AIR CONTACT')}</b><br>${Number.isFinite(Number(ac.altitude)) ? `${Math.round(Number(ac.altitude))} ft` : 'ALT N/A'} · ${Number.isFinite(Number(ac.groundSpeed)) ? `${Math.round(Number(ac.groundSpeed))} kt` : 'SPD N/A'}<br><small>PUBLIC ADS-B SIGNAL</small>`);
        marker.on('click', () => {
          lockMapContact(ac, 'AIRCRAFT', { zoom:11 });
        });
      });
      if ($('airCount')) $('airCount').textContent = String(items.length);
      if (focus && items[0]) state.map.flyTo([items[0].lat, items[0].lon], Math.max(state.map.getZoom(), 9), { duration: .7 });
      return items;
    } catch (err) {
      if ($('airCount')) $('airCount').textContent = 'OFF';
      if (focus) toast(`AIRSPACE：${err.message}`, 4200);
      return [];
    }
  }

  async function loadEarthquakes(lat, lon, focus = false, radius = 300) {
    if (!state.quakeLayer) return [];
    state.quakeLayer.clearLayers();
    if ($('quakeCount')) $('quakeCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/data?action=earthquakes&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestQuakes = items;
      items.forEach((q) => {
        const size = Math.max(8, Math.min(24, 7 + Math.max(0, Number(q.mag || 0))*2.5));
        const icon = L.divIcon({ className: '', html: `<div class="marker-quake" style="width:${size}px;height:${size}px"></div>`, iconSize: [size,size], iconAnchor: [size/2,size/2] });
        const marker = L.marker([q.lat, q.lon], { icon, zIndexOffset: 500 }).addTo(state.quakeLayer)
          .bindPopup(`<b>SEISMIC CONTACT · M${Number.isFinite(Number(q.mag)) ? Number(q.mag).toFixed(1) : '?'}</b><br>${escapeHtml(q.place || '')}<br>${Number.isFinite(Number(q.depth)) ? `${Math.round(Number(q.depth))} km depth` : ''}<br><small>USGS · LAST 24H</small>`);
        marker.on('click', () => lockMapContact({ ...q, name:`M${Number(q.mag || 0).toFixed(1)} ${q.place || 'SEISMIC CONTACT'}`, source:'USGS recent seismic feed' }, 'SEISMIC', { zoom:9 }));
      });
      if ($('quakeCount')) $('quakeCount').textContent = String(items.length);
      if (focus && items[0]) state.map.flyTo([items[0].lat, items[0].lon], Math.max(state.map.getZoom(), 8), { duration: .7 });
      return items;
    } catch (err) {
      if ($('quakeCount')) $('quakeCount').textContent = 'OFF';
      if (focus) toast(`SEISMIC：${err.message}`, 4200);
      return [];
    }
  }

  async function runTheaterMode() {
    const c = getOpsCenter();
    signalAcquire(true, 'GLOBAL CONTEXT ACQUISITION');
    setOpsPanel({ eyebrow: 'GLOBAL CONTEXT', title: 'TAIWAN THEATER', code: 'FUSING SIGNALS', html: '<div class="ops-empty">CCTV · TRAFFIC · FLOW · AIRSPACE · SEISMIC<br>FUSING PUBLIC SIGNALS…</div>' });
    const settled = await Promise.allSettled([
      loadCctv(c.lat, c.lon, false, 90),
      loadTraffic(c.lat, c.lon, false, 120),
      loadFlow(c.lat, c.lon, false, 150),
      loadFlights(c.lat, c.lon, false, 160),
      loadEarthquakes(c.lat, c.lon, false, 420),
      loadWeather(c.lat, c.lon, false),
    ]);
    const val = (i) => settled[i].status === 'fulfilled' ? (settled[i].value || []) : [];
    const cctv = val(0), traffic = val(1), flow = val(2), flights = val(3), quakes = val(4), weather = settled[5].status === 'fulfilled' ? settled[5].value : null;
    const theaterSpeeds = flow.map((x) => Number(x.travelSpeed)).filter(Number.isFinite);
    const theaterAvg = theaterSpeeds.length ? Math.round(theaterSpeeds.reduce((a,b)=>a+b,0)/theaterSpeeds.length) : null;
    const rain = Math.round(Number(weather?.current?.precipitationProbability || 0));
    setOpsPanel({
      eyebrow: 'GLOBAL CONTEXT', title: 'TAIWAN THEATER', code: 'SIGNALS FUSED',
      html: `<div class="ops-grid six"><div class="ops-metric"><small>AIR</small><b class="gold">${flights.length}</b></div><div class="ops-metric"><small>CCTV</small><b>${cctv.length}</b></div><div class="ops-metric"><small>EVENTS</small><b>${traffic.length}</b></div><div class="ops-metric"><small>AVG FLOW</small><b>${theaterAvg != null ? theaterAvg : '—'}</b></div><div class="ops-metric"><small>SEISMIC</small><b>${quakes.length}</b></div><div class="ops-metric"><small>RAIN</small><b>${rain}%</b></div></div><div class="ops-brief"><div class="ops-line"><span>GLOBAL CONTEXT</span><b>目標周邊公開訊號已融合</b><em>ZERO-KEY</em></div><div class="ops-line"><span>FLOW</span><b>${theaterAvg != null ? `目前可取得路段平均 ${theaterAvg} km/h` : '國道流速資料暫缺'}</b><em>LIVE</em></div><div class="ops-line"><span>AIRSPACE</span><b>${flights.length} 個公開 ADS-B 航空訊號</b><em>PUBLIC</em></div><div class="ops-line"><span>SEISMIC</span><b>${quakes.length} 筆 24 小時內區域地震訊號</b><em>USGS</em></div></div>`,
    });
    state.map.flyTo([c.lat, c.lon], Math.min(state.map.getZoom(), 9), { duration: state.motion ? .9 : .4 });
    signalAcquire(false);
    toast('已更新全台即時資訊');
  }

  function cameraMapIcon(cam = {}, national = false) {
    const live = hasDirectCameraMedia(cam);
    const size = national ? (live ? 7 : 6) : 11;
    return L.divIcon({
      className: '',
      html: `<div class="marker-camera ${live ? 'live' : 'location-only'} ${cam.scenic ? 'scenic' : ''}" style="--cam-size:${size}px"><span></span></div>`,
      iconSize: [Math.max(10,size+6), Math.max(10,size+6)],
      iconAnchor: [Math.max(5,(size+6)/2), Math.max(5,(size+6)/2)],
    });
  }

  function hasDirectCameraMedia(cam = {}) {
    const kind = String(cam?._probe?.kind || '');
    return Boolean(
      cam?.scenic || cam?.streamUrl || cam?.imageUrl ||
      ['hls','image','mjpeg','video'].includes(kind)
    );
  }

  function cameraPlaybackPriority(cam = {}) {
    if (!cam) return 99;
    if (cam.scenic && cam.streamUrl) return 1;
    if (cam.playbackPolicy === 'direct-public-stream' && cam.streamUrl) return 0;
    if (cam.streamUrl && !cam.resolverBridge && !cam.indexed) return 1;
    if (cam.imageUrl && !cam.resolverBridge) return 2;
    if (cam.resolverBridge || cam.indexed || cam.playbackPolicy === 'public-wrapper') return 5;
    return hasDirectCameraMedia(cam) ? 3 : 9;
  }

  function renderOriginalSourceUnavailable(stage, cam = {}) {
    if (!stage) return;
    clearCameraStage(stage);
    const label = escapeHtml(cam.road || cam.name || '此 CCTV');
    stage.innerHTML = `<div class="camera-placeholder"><b>此攝影機目前沒有可播放影像</b><span>${label} 的官方點位仍保留；不會自動替換成其他位置的攝影機。</span></div>`;
  }


  async function openCctvPosition(cam = {}) {
    if (!Number.isFinite(Number(cam?.lat)) || !Number.isFinite(Number(cam?.lon))) return;
    if (state.anprRunning && !isAnprAuthorizedCamera(cam)) stopAuthorizedAnpr();
    state.inlineCamera = cam; state.activeCamera = cam; setAnprButtons();
    if ($('inlineCameraCard')) $('inlineCameraCard').hidden = false;
    if ($('inlineCameraTitle')) $('inlineCameraTitle').textContent = shortName(cam.name || cam.road || '公開攝影機');
    if ($('inlineCameraSignal')) $('inlineCameraSignal').textContent = '尋找附近影像';
    if ($('inlineCameraMeta')) $('inlineCameraMeta').textContent = `${cam.road || cam.name || ''} · 此點位目前未提供可直接播放的公開影像。`;
    const exactStage = $('inlineCameraStage');
    if (exactStage) {
      clearCameraStage(exactStage);
      exactStage.innerHTML = '<div class="camera-placeholder"><b>此攝影機目前沒有可播放影像</b><span>保留官方點位，不會用其他鏡頭冒充此位置。</span></div>';
    }
    const popup = $('cctvPopup');
    if (popup && !popup.hidden) {
      clearCameraStage($('inlineCameraStage'));
      resetCctvPopupPosition();
      $('cctvPopupTitle').textContent = shortName(cam.name || cam.road || '公開攝影機');
      $('cctvPopupMeta').textContent = '此點位目前沒有可播放影像';
      const popupStage = $('cctvPopupStage');
      if (popupStage) popupStage.innerHTML = '<div class="camera-placeholder"><b>無可播放影像</b><span>不自動替換成其他位置的 CCTV。</span></div>';
    }
  }


  function renderCctvMapMarkers(items = [], { national = false } = {}) {
    if (!state.cameraLayer || !state.map) return;
    state.cameraLayer.clearLayers();
    const valid = (items || []).filter((cam) => Number.isFinite(Number(cam?.lat)) && Number.isFinite(Number(cam?.lon)));
    const viewable = valid.filter(hasDirectCameraMedia);
    const drawItems = national ? viewable : valid.slice(0, 240);
    drawItems.forEach((cam) => {
      const title = cam.name || cam.road || '公開 CCTV';
      let marker;
      if (national) {
        state.cctvCanvasRenderer ||= L.canvas({ padding:0.5, tolerance:5 });
        marker = L.circleMarker([Number(cam.lat), Number(cam.lon)], {
          renderer:state.cctvCanvasRenderer, radius:3.2, weight:1, color:'#17120a', fillColor:cam.scenic ? '#71d8c0' : '#d9b85f', fillOpacity:.88, opacity:.95,
          interactive:true,
        }).addTo(state.cameraLayer);
      } else {
        marker = L.marker([cam.lat, cam.lon], { icon:cameraMapIcon(cam, false), zIndexOffset:260 }).addTo(state.cameraLayer);
      }
      const pointLabel = hasDirectCameraMedia(cam) ? '即時影像' : '攝影機';
      marker.bindTooltip(`${cam.scenic ? '景點影像' : cam.streamUrl ? '即時影像' : pointLabel} · ${escapeHtml(shortName(title))}`, { direction:'top', offset:[0,-5], opacity:.94 });
      marker.on('click', () => hasDirectCameraMedia(cam) ? openCamera(cam) : openCctvPosition(cam));
    });
  }

  async function loadCctv(lat, lon, focus = false, radius = 40, options = {}) {
    if (!state.map) return [];
    const draw = options.draw !== false;
    $('cameraCount').textContent = '…';
    try {
      const nationalQuery = options.national ? '&national=1&limit=8000' : '';
      const fastQuery = options.fast ? '&fast=1' : '';
      const targetQuery = options.query ? `&q=${encodeURIComponent(options.query)}` : '';
      // Start with official/original sources. Resolver bridges are a fallback only,
      // so a healthy government stream is never replaced by a wrapped copy.
      const bridgeQuery = options.bridge === true ? '&bridge=1' : '&bridge=0';
      const data = await jsonFetch(`/api/data?action=cctv&lat=${lat}&lon=${lon}&radius=${Math.round(radius)}${nationalQuery}${fastQuery}${targetQuery}${bridgeQuery}`);
      const items = data.items || [];
      if (options.requestSeq && options.requestSeq !== state.targetRequestSeq) return items;
      if (items.length || options.national) state.latestCctv = items;
      state.cctvCoverage = data.coverage || null;
      if (draw && (items.length || options.national || options.clearOnEmpty)) renderCctvMapMarkers(items, { national:Boolean(options.national) });
      const viewable = items.filter(hasDirectCameraMedia).length;
      const positions = Math.max(0, items.length - viewable);
      $('cameraCount').textContent = String(items.length);
      if ($('cameraCount')) $('cameraCount').title = `附近 CCTV ${items.length} · 可觀看 ${viewable} · 官方點位 ${positions}`;
      // Do not move the map merely because CCTV data finished loading. Search/navigation owns the camera.
      if (!items.length && focus) toast(data.message || '此區目前沒有取得 CCTV 點位或公開影像。');
      return items;
    } catch (err) {
      $('cameraCount').textContent = 'OFF';
      if (focus) toast(`CCTV：${err.message}`, 4200);
      return [];
    }
  }

  function bindPopupCameraAction(cam) {
    document.querySelectorAll('[data-camera-id]').forEach((btn) => {
      if (btn.dataset.cameraId === String(cam.id)) btn.onclick = () => openCamera(cam);
    });
  }

  function youtubeEmbedUrl(value = '') {
    const raw = String(value || '');
    const match = raw.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i) || raw.match(/[?&]v=([A-Za-z0-9_-]{6,})/i) || raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&playsinline=1` : '';
  }

  function renderScenicOriginal(stage, cam = {}) {
    if (!stage || !cam?.streamUrl) return false;
    const stream = String(cam.streamUrl);
    const yt = youtubeEmbedUrl(stream);
    if (yt) {
      clearCameraStage(stage);
      stage.innerHTML = `<iframe class="camera-official-frame" src="${escapeAttr(yt)}" title="${escapeAttr(cam.name || '景點官方即時影像')}" loading="eager" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="camera-index-badge">SCENIC · OFFICIAL SOURCE</div>`;
      return true;
    }
    // : never fall back to embedding a whole scenic/reference webpage.
    // Only actual media URLs or verified official YouTube embeds are rendered.
    return false;
  }

  function renderOfficialWrapperFrame(stage, cam = {}) {
    // Road CCTV pages are never embedded. /api/cctv-feed must resolve them to media.
    return false;
  }

  function cameraFeedUrl(cam) {
    if (cam?.id) return `/api/cctv-feed?id=${encodeURIComponent(cam.id)}`;
    return '';
  }

  const cameraResolveCache = new Map();
  let hlsLoaderPromise = null;

  function browserCanDirect(url = '') {
    try {
      const u = new URL(String(url), location.href);
      if (location.protocol === 'https:' && u.protocol !== 'https:') return false;
      return ['http:','https:'].includes(u.protocol);
    } catch (_) { return false; }
  }

  async function resolveCameraPlayback(cam, signal) {
    if (!cam) throw new Error('沒有 CCTV 資料');
    const key = String(cam.id || cam.streamUrl || cam.imageUrl || '');
    const now = Date.now();
    const hit = cameraResolveCache.get(key);
    if (hit?.data && hit.expiresAt > now) return hit.data;
    if (hit?.promise) return hit.promise;

    const rawUrl = String(cam.streamUrl || cam.imageUrl || '');
    const rawKind = inferCameraMediaKind(cam);
    if (!cam.id) {
      const data = {
        id:'', kind:rawKind, directUrl:rawUrl, proxyUrl:'', snapshotDirectUrl:String(cam.imageUrl || ''), snapshotProxyUrl:'',
        directFirst:true, resolverBridge:false, playbackPolicy:cam.playbackPolicy || '', source:cam.source || '',
      };
      cameraResolveCache.set(key,{data,expiresAt:now+30000});
      return data;
    }

    const ctrl = new AbortController();
    const abort = () => ctrl.abort();
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', abort, {once:true});
    }
    const timer = setTimeout(() => ctrl.abort(), 6500);
    const promise = fetch(`/api/cctv-feed?id=${encodeURIComponent(cam.id)}&resolve=1`, { cache:'no-store', signal:ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`resolve ${res.status}`);
        const data = await res.json();
        return {
          ...data,
          directUrl:String(data.directUrl || rawUrl || ''),
          proxyUrl:String(data.proxyUrl || cameraFeedUrl(cam) || ''),
          snapshotDirectUrl:String(data.snapshotDirectUrl || cam.imageUrl || ''),
          snapshotProxyUrl:String(data.snapshotProxyUrl || ''),
          kind:String(data.kind || rawKind || 'unknown'),
        };
      })
      .finally(() => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener?.('abort', abort);
      });
    cameraResolveCache.set(key,{promise,expiresAt:now+8000});
    try {
      const data = await promise;
      cameraResolveCache.set(key,{data,expiresAt:Date.now()+120000});
      cam._resolvedPlayback = data;
      return data;
    } catch (err) {
      cameraResolveCache.delete(key);
      // If the registry already gave us an obvious media URL, playback can still proceed
      // without waiting for the resolver endpoint.
      if (rawUrl && rawKind !== 'unknown') {
        return { id:key, kind:rawKind, directUrl:rawUrl, proxyUrl:cameraFeedUrl(cam), snapshotDirectUrl:String(cam.imageUrl || ''), snapshotProxyUrl:'', directFirst:true };
      }
      throw err;
    }
  }

  function ensureHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsLoaderPromise) return hlsLoaderPromise;
    const candidates = [
      'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js',
      'https://unpkg.com/hls.js@1/dist/hls.min.js',
    ];
    hlsLoaderPromise = new Promise((resolve, reject) => {
      let i = 0;
      const loadNext = () => {
        if (i >= candidates.length) { reject(new Error('HLS loader failed')); return; }
        const script = document.createElement('script');
        script.src = candidates[i++]; script.async = true;
        script.onload = () => window.Hls ? resolve(window.Hls) : loadNext();
        script.onerror = loadNext;
        document.head.appendChild(script);
      };
      loadNext();
    });
    return hlsLoaderPromise;
  }

  function clearCameraStage(stage) {
    clearInterval(stage?._eyeRefresh); stage._eyeRefresh = null;
    try { stage?._eyeAbort?.abort?.(); } catch (_) {}
    if (stage) stage._eyeAbort = null;
    stage?.querySelectorAll?.('video').forEach((v) => { cleanupPlaybackGuard(v); try { v._eyeHls?.destroy?.(); } catch (_) {} });
    if (stage) { stage.innerHTML = ''; delete stage.dataset.playbackPath; delete stage.dataset.mediaKind; }
  }

  function syncLocalPrivacyMask(stage) {
    if (!stage) return;
    const on = !!state.privacyShield;
    stage.classList.toggle('privacy-shield', on);
    stage.setAttribute?.('data-privacy', on ? 'local-roi' : 'off');
    stage.querySelectorAll?.(':scope > .privacy-local-mask').forEach((node) => node.remove());
    if (!on) return;
    const hasMedia = !!stage.querySelector?.('img,video') || stage.classList?.contains('has-image');
    if (!hasMedia) return;
    const mask = document.createElement('div');
    mask.className = 'privacy-local-mask'; mask.setAttribute('aria-hidden', 'true'); mask.innerHTML = '';
    stage.appendChild(mask);
  }

  function inferCameraMediaKind(cam = {}) {
    if (cam?._probe?.kind) return cam._probe.kind;
    const url = String(cam?.streamUrl || cam?.imageUrl || '');
    if (/\.m3u8(?:\?|$)/i.test(url)) return 'hls';
    if (/\.(?:mjpg|mjpeg)(?:\?|$)/i.test(url)) return 'mjpeg';
    if (/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(url)) return 'image';
    if (/\.(?:mp4|webm)(?:\?|$)/i.test(url)) return 'video';
    return 'unknown';
  }

  function cleanupPlaybackGuard(video) {
    if (!video) return;
    try { video._eyePlaybackCleanup?.(); } catch (_) {}
    video._eyePlaybackCleanup = null;
  }

  function setPlaybackPath(stage, path, kind = '') {
    if (!stage) return;
    stage.dataset.playbackPath = path;
    const text = path === 'direct' ? '來源直連' : path === 'proxy' ? '備援播放' : '即時影像';
    if (stage.id === 'inlineCameraStage' && $('inlineCameraSignal')) $('inlineCameraSignal').textContent = text;
    if (stage.id === 'cctvPopupStage' && $('cctvPopupMeta')) {
      const cam = state.inlineCamera || state.activeCamera;
      const base = `${cam?.region ? `${cam.region} · ` : ''}${cam?.road || cam?.name || ''}`.trim();
      $('cctvPopupMeta').textContent = [base,text].filter(Boolean).join(' · ');
    }
  }

  function installPlaybackGuard(video, hls = null, recoverFn = null) {
    if (!video) return;
    cleanupPlaybackGuard(video);
    let stopped = false;
    let lastTime = Number(video.currentTime || 0);
    let lastProgressAt = performance.now();
    const safePlay = () => {
      if (stopped || !video.isConnected || document.hidden) return;
      video.muted = true;
      const p = video.play?.(); if (p?.catch) p.catch(()=>{});
    };
    const markProgress = () => {
      const t = Number(video.currentTime || 0);
      if (Math.abs(t-lastTime) > .03) { lastTime=t; lastProgressAt=performance.now(); }
    };
    const onPlaying = () => { lastProgressAt=performance.now(); markProgress(); };
    const onWaiting = () => { /* hls.js/native player gets time to refill before recovery */ };
    const onVisibility = () => { if (!document.hidden && video.autoplay && video.paused) safePlay(); };
    video.addEventListener('timeupdate', markProgress);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onWaiting);
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(() => {
      if (stopped || !video.isConnected || document.hidden) return;
      markProgress();
      if (video.paused && video.autoplay && !video.ended) safePlay();
      // Only recover after a real stall. Older versions restarted HLS too aggressively
      // and could create the pause/retry loop reported by users.
      if (video.readyState >= 2 && performance.now()-lastProgressAt > 9000) {
        lastProgressAt=performance.now();
        try { recoverFn?.(); } catch (_) { try { hls?.startLoad?.(-1); } catch (_) {} }
        setTimeout(safePlay,180);
      }
    }, 2500);
    video._eyePlaybackCleanup = () => {
      stopped=true; clearInterval(timer);
      video.removeEventListener('timeupdate', markProgress);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onWaiting);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    safePlay();
  }

  function armVideoAutoplay(video, hls = null, recoverFn = null) {
    if (!video) return;
    video.autoplay = true; video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.setAttribute('autoplay',''); video.setAttribute('muted',''); video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline','');
    const play = () => { video.muted=true; const p=video.play?.(); if (p?.catch) p.catch(()=>{}); };
    video.addEventListener('canplay', play, { once:true });
    video.addEventListener('loadedmetadata', play, { once:true });
    setTimeout(play,60); setTimeout(play,420);
    installPlaybackGuard(video,hls,recoverFn);
  }

  function renderHls(stage, url, retry = 0, options = {}) {
    const fallbackUrl = String(options.fallbackUrl || '');
    const sourcePath = options.sourcePath || (fallbackUrl ? 'direct' : 'proxy');
    const switchToFallback = () => {
      if (!fallbackUrl || fallbackUrl === url || !stage.isConnected || stage.dataset.playbackPath === 'proxy') return false;
      clearCameraStage(stage);
      renderHls(stage, fallbackUrl, 0, { sourcePath:'proxy' });
      return true;
    };
    const video = document.createElement('video');
    video.controls = !stage.classList?.contains('map-live-cctv-stage'); video.preload='auto';
    stage.appendChild(video); setPlaybackPath(stage,sourcePath,'hls'); syncLocalPrivacyMask(stage);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src=url;
      video.addEventListener('error', () => { if (!switchToFallback()) setPlaybackPath(stage,sourcePath,'hls'); }, {once:true});
      armVideoAutoplay(video,null,() => { try { video.load(); } catch (_) {} });
      return;
    }

    ensureHlsJs().then((Hls) => {
      if (!Hls?.isSupported?.()) throw new Error('HLS unsupported');
      const previewMode=!!options.preview;
      const hls = new Hls({
        enableWorker:true,
        lowLatencyMode:!previewMode,
        backBufferLength:previewMode?8:6,
        maxBufferLength:previewMode?18:12,
        maxMaxBufferLength:previewMode?24:18,
        liveSyncDurationCount:previewMode?4:3,
        liveMaxLatencyDurationCount:previewMode?9:7,
        maxLiveSyncPlaybackRate:previewMode?1.03:1.06,
        maxBufferHole:.5,
        highBufferWatchdogPeriod:4,
        nudgeOffset:.08,
        nudgeMaxRetry:3,
        capLevelToPlayerSize:true,
        manifestLoadingTimeOut:10000,
        levelLoadingTimeOut:10000,
        fragLoadingTimeOut:15000,
        fragLoadingMaxRetry:6,
        levelLoadingMaxRetry:6,
        manifestLoadingMaxRetry:4,
        fragLoadingRetryDelay:500,
        levelLoadingRetryDelay:500,
      });
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
      hls.on(Hls.Events.MANIFEST_PARSED, () => armVideoAutoplay(video,hls,() => hls.startLoad(-1)));
      hls.on(Hls.Events.ERROR, (_event,data) => {
        if (!data?.fatal) return;
        if (sourcePath === 'direct' && switchToFallback()) { try { hls.destroy(); } catch (_) {} return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retry < 2) {
          try { hls.startLoad(-1); } catch (_) {}
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && retry < 2) {
          try { hls.recoverMediaError(); } catch (_) {}
          return;
        }
        cleanupPlaybackGuard(video); try { hls.destroy(); } catch (_) {}
        if (retry < 2 && stage.isConnected) setTimeout(() => { if (stage.isConnected) { clearCameraStage(stage); renderHls(stage,url,retry+1,{...options,sourcePath}); } },700);
      });
      video._eyeHls=hls;
    }).catch(() => {
      if (sourcePath === 'direct' && switchToFallback()) return;
      stage.innerHTML='<div class="camera-placeholder"><b>目前無法播放</b><span>此鏡頭的影像來源暫時無法解碼。</span></div>';
    });
  }

  async function probeCameraFeed(cam, signal) {
    const data = await resolveCameraPlayback(cam,signal);
    return { kind:data.kind || 'unknown', contentType:data.contentType || '', directUrl:data.directUrl || '', proxyUrl:data.proxyUrl || '', ...data };
  }

  function renderCameraImage(stage, url, options = {}) {
    const refreshMs = Math.max(0,Number(options.refreshMs || 0));
    const fallbackUrl = String(options.fallbackUrl || '');
    const sourcePath = options.sourcePath || (fallbackUrl ? 'direct' : 'proxy');
    const img=document.createElement('img'); img.alt='CCTV 即時影像'; img.loading='eager'; img.decoding='async';
    try { img.fetchPriority='high'; } catch (_) {}
    let usingFallback = sourcePath === 'proxy';
    const apply = () => {
      const src = usingFallback ? fallbackUrl || url : url;
      if (!src) return;
      img.src = refreshMs ? `${src}${src.includes('?')?'&':'?'}frame=${Date.now()}` : src;
    };
    img.addEventListener('load',()=>setPlaybackPath(stage,usingFallback?'proxy':sourcePath,'image'));
    img.addEventListener('error',()=>{
      if (!usingFallback && fallbackUrl) { usingFallback=true; setPlaybackPath(stage,'proxy','image'); apply(); return; }
      clearInterval(stage._eyeRefresh); stage._eyeRefresh=null;
      stage.innerHTML='<div class="camera-placeholder"><b>影像暫時中斷</b><span>請切換其他鏡頭或稍後再試。</span></div>';
    });
    stage.appendChild(img); syncLocalPrivacyMask(stage); setPlaybackPath(stage,sourcePath,'image'); apply();
    if (refreshMs) stage._eyeRefresh=setInterval(apply,refreshMs);
  }

  function renderCameraVideo(stage, url, options = {}) {
    const fallbackUrl=String(options.fallbackUrl || ''); const sourcePath=options.sourcePath || (fallbackUrl?'direct':'proxy');
    const video=document.createElement('video'); video.controls=!stage.classList?.contains('map-live-cctv-stage'); video.preload='auto';
    const use = (src,path) => { video.src=src; setPlaybackPath(stage,path,'video'); armVideoAutoplay(video,null,()=>{ try { video.load(); } catch (_) {} }); };
    let fellBack=sourcePath==='proxy';
    video.addEventListener('error',()=>{
      if (!fellBack && fallbackUrl) { fellBack=true; use(fallbackUrl,'proxy'); return; }
      stage.innerHTML='<div class="camera-placeholder"><b>影像暫時中斷</b><span>請切換其他鏡頭或稍後再試。</span></div>';
    });
    stage.appendChild(video); syncLocalPrivacyMask(stage); use(url,sourcePath);
  }

  function renderResolvedMedia(stage, cam, resolved, options = {}) {
    const kind=String(resolved?.kind || inferCameraMediaKind(cam) || 'unknown');
    const direct=String(resolved?.directUrl || cam?.streamUrl || cam?.imageUrl || '');
    const proxy=String(resolved?.proxyUrl || cameraFeedUrl(cam) || '');
    const canDirect=direct && browserCanDirect(direct);
    const primary=canDirect ? direct : proxy;
    const fallback=canDirect && proxy && proxy!==direct ? proxy : '';
    const path=canDirect ? 'direct' : 'proxy';
    cam._resolvedPlayback={...resolved,directUrl:direct,proxyUrl:proxy};

    if (kind==='hls') { renderHls(stage,primary,0,{fallbackUrl:fallback,sourcePath:path,preview:!!options.preview}); return true; }
    if (kind==='mjpeg') { renderCameraImage(stage,primary,{fallbackUrl:fallback,sourcePath:path,refreshMs:0}); return true; }
    if (kind==='image') {
      const refreshSec=Math.max(1,Number(cam.imageRefreshRate || 2));
      renderCameraImage(stage,primary,{fallbackUrl:fallback,sourcePath:path,refreshMs:Math.min(5000,refreshSec*1000)}); return true;
    }
    if (kind==='video') { renderCameraVideo(stage,primary,{fallbackUrl:fallback,sourcePath:path,preview:!!options.preview}); return true; }
    return false;
  }

  async function renderCameraMedia(stage, cam, options = {}) {
    if (!stage) return;
    const token=`${Date.now()}-${Math.random()}`; stage.dataset.renderToken=token; clearCameraStage(stage); stage.dataset.cameraId=String(cam?.id || cam?.streamUrl || cam?.imageUrl || '');

    if (cam?.scenic && renderScenicOriginal(stage,cam)) return;
    if (!cam?.id && !cam?.streamUrl && !cam?.imageUrl) {
      stage.innerHTML='<div class="camera-placeholder"><b>目前沒有影像</b><span>此攝影機暫時沒有可播放的來源。</span></div>'; return;
    }

    // True media URLs start immediately from the source. Resolver/proxy work happens
    // only when the URL is unknown or direct playback fails.
    const quickKind=inferCameraMediaKind(cam);
    const quickDirect=String(cam.streamUrl || cam.imageUrl || '');
    if (quickDirect && quickKind!=='unknown' && browserCanDirect(quickDirect)) {
      const provisional={kind:quickKind,directUrl:quickDirect,proxyUrl:cameraFeedUrl(cam),snapshotDirectUrl:String(cam.imageUrl||''),snapshotProxyUrl:cam.imageUrl&&cam.id?`${cameraFeedUrl(cam)}&snapshot=1`:''};
      if (renderResolvedMedia(stage,cam,provisional,options)) {
        // Resolve metadata in the background for analysis/snapshot use; never block playback.
        resolveCameraPlayback(cam).then((data)=>{ cam._resolvedPlayback=data; }).catch(()=>{});
        return;
      }
    }

    stage.innerHTML=`<div class="camera-loading"><i></i><b>正在連線</b><span>讀取即時影像…</span></div>`;
    const ctrl=new AbortController(); stage._eyeAbort=ctrl;
    const timer=setTimeout(()=>ctrl.abort(),options.fast?4200:6500);
    try {
      const resolved=await resolveCameraPlayback(cam,ctrl.signal);
      clearTimeout(timer);
      if (stage.dataset.renderToken!==token) return;
      clearCameraStage(stage); stage.dataset.renderToken=token;
      if (renderResolvedMedia(stage,cam,resolved,options)) return;
      // Unknown endpoints are often snapshots without useful extensions.
      const primary=browserCanDirect(resolved.directUrl)?resolved.directUrl:resolved.proxyUrl;
      const fallback=primary===resolved.directUrl?resolved.proxyUrl:'';
      renderCameraImage(stage,primary,{fallbackUrl:fallback,sourcePath:primary===resolved.directUrl?'direct':'proxy',refreshMs:2000});
    } catch (_) {
      clearTimeout(timer);
      if (stage.dataset.renderToken!==token) return;
      clearCameraStage(stage);
      stage.innerHTML='<div class="camera-placeholder"><b>目前無法取得此鏡頭影像</b><span>來源暫時沒有回應；不會自動替換成其他位置的 CCTV。</span></div>';
    }
  }

  function nearestCityFlowForCamera(cam, cityFlow = []) {
    if (!cam || !cityFlow?.length) return null;
    return cityFlow.map((x)=>({ ...x, _d:haversineKm(Number(cam.lat),Number(cam.lon),Number(x.lat),Number(x.lon)) })).filter((x)=>Number.isFinite(x._d)).sort((a,b)=>a._d-b._d)[0] || null;
  }

  function loadExternalScript(src, test) {
    if (test?.()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((x) => x.src === src);
      if (existing) { existing.addEventListener('load', resolve, { once:true }); existing.addEventListener('error', reject, { once:true }); return; }
      const script = document.createElement('script');
      script.src = src; script.async = true; script.crossOrigin = 'anonymous';
      script.onload = () => resolve(); script.onerror = () => reject(new Error('免費視覺模型載入失敗'));
      document.head.appendChild(script);
    });
  }

  async function getVisionModel() {
    if (state.visionModel) return state.visionModel;
    if (state.visionModelPromise) return state.visionModelPromise;
    state.visionModelPromise = (async () => {
      await loadExternalScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', () => window.tf);
      await loadExternalScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js', () => window.cocoSsd);
      if (!window.cocoSsd) throw new Error('VISION MODEL unavailable');
      try {
        if (window.tf?.setBackend) { await window.tf.setBackend('webgl'); await window.tf.ready?.(); }
      } catch (_) {}
      state.visionModel = await window.cocoSsd.load({ base:'lite_mobilenet_v2' });
      // Warm the graph once so the first live frame does not carry model compilation latency.
      try {
        const warm = document.createElement('canvas'); warm.width=64; warm.height=64;
        await state.visionModel.detect(warm,1,.8);
      } catch (_) {}
      return state.visionModel;
    })().finally(() => { state.visionModelPromise = null; });
    return state.visionModelPromise;
  }

  function densityLabel(score) {
    if (score >= 75) return 'VERY HIGH';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MODERATE';
    return 'LOW';
  }

  function cameraMediaElement() {
    const popup = $('cctvPopup');
    const stage = popup && !popup.hidden ? $('cctvPopupStage') : $('inlineCameraStage');
    return stage?.querySelector('video, img') || null;
  }

  function analysisStages() {
    const stages = [];
    if ($('inlineCameraStage')) stages.push($('inlineCameraStage'));
    if ($('cctvPopup') && !$('cctvPopup').hidden && $('cctvPopupStage')) stages.push($('cctvPopupStage'));
    return stages;
  }

  function clearLiveVisionBoxes() {
    analysisStages().forEach((stage) => stage.querySelectorAll('.live-vision-layer').forEach((node) => node.remove()));
  }

  function visionCenter(box = [0,0,0,0]) {
    return { x:Number(box[0]||0)+Number(box[2]||0)/2, y:Number(box[1]||0)+Number(box[3]||0)/2 };
  }

  function visionDirection(dx = 0, dy = 0, dead = 4) {
    if (Math.hypot(dx,dy) < dead) return 'STILL';
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'RIGHT' : 'LEFT';
    return dy > 0 ? 'DOWN' : 'UP';
  }

  function resetVisionTracks(cameraId = null) {
    state.visionTracks = new Map();
    state.visionTrackSeq = 1;
    state.visionTrackCameraId = cameraId == null ? null : String(cameraId);
    state.visionLastFrameAt = 0;
  }

  function updateVisionTracks(predictions = [], srcW = 1, srcH = 1, cameraId = null) {
    const now = Date.now();
    const camKey = cameraId == null ? '' : String(cameraId);
    if (state.visionTrackCameraId !== camKey) resetVisionTracks(camKey);
    const previousAt = Number(state.visionLastFrameAt || now);
    const dt = Math.max(.25, Math.min(8, (now - previousAt) / 1000 || 1));
    state.visionLastFrameAt = now;
    const diag = Math.max(1, Math.hypot(srcW,srcH));
    const maxDist = diag * .16;
    const vehicleClasses = new Set(['car','bus','truck','motorcycle','bicycle']);
    const detections = predictions.filter((p)=>vehicleClasses.has(p.class)).map((p)=>({ ...p, center:visionCenter(p.bbox) }));
    const tracks = [...state.visionTracks.values()].filter((t)=>now-t.lastSeen < 9000);
    const used = new Set();
    const output = [];
    for (const det of detections) {
      let best = null, bestD = Infinity;
      for (const t of tracks) {
        if (used.has(t.id) || t.class !== det.class) continue;
        const d = Math.hypot(det.center.x-t.cx, det.center.y-t.cy);
        if (d < bestD && d <= maxDist) { best=t; bestD=d; }
      }
      if (!best) {
        best = { id:state.visionTrackSeq++, class:det.class, cx:det.center.x, cy:det.center.y, firstSeen:now, lastSeen:now, ageFrames:0, stationaryFrames:0, vx:0, vy:0, path:[] };
      } else used.add(best.id);
      const dx = det.center.x-best.cx, dy = det.center.y-best.cy;
      const movement = Math.hypot(dx,dy);
      best.vx = best.ageFrames ? best.vx*.55 + (dx/dt)*.45 : 0;
      best.vy = best.ageFrames ? best.vy*.55 + (dy/dt)*.45 : 0;
      best.stationaryFrames = movement < diag*.009 ? best.stationaryFrames+1 : Math.max(0,best.stationaryFrames-1);
      best.cx=det.center.x; best.cy=det.center.y; best.lastSeen=now; best.ageFrames++;
      best.path = [...(best.path||[]).slice(-4), {x:best.cx,y:best.cy,at:now}];
      best.direction = visionDirection(best.vx,best.vy,diag*.006);
      best.stopped = best.stationaryFrames >= 2 && now-best.firstSeen >= 5000;
      state.visionTracks.set(best.id,best);
      output.push({ ...det, trackId:best.id, direction:best.direction, stopped:best.stopped, trackAgeMs:now-best.firstSeen, vx:best.vx, vy:best.vy });
    }
    for (const [id,t] of state.visionTracks) if (now-t.lastSeen >= 9000) state.visionTracks.delete(id);
    const stopped = output.filter((x)=>x.stopped).length;
    const lowerHalf = output.filter((x)=>x.center.y > srcH*.42).length;
    const queueScore = Math.min(100, Math.round(output.length*8 + stopped*18 + Math.max(0,lowerHalf-2)*7));
    const directions = output.reduce((acc,x)=>{ acc[x.direction]=(acc[x.direction]||0)+1; return acc; },{});
    const dominantDirection = Object.entries(directions).filter(([k])=>k!=='STILL').sort((a,b)=>b[1]-a[1])[0]?.[0] || (stopped ? 'STILL' : 'N/A');
    return { tracked:output, stopped, queueScore, dominantDirection, activeTracks:state.visionTracks.size };
  }

  function plateRegionForPrediction(p = {}) {
    const [x,y,w,h] = p.bbox || [0,0,0,0];
    if (!w || !h || p.class === 'bicycle') return null;
    if (p.class === 'motorcycle') return [x+w*.18, y+h*.52, w*.64, h*.30];
    return [x+w*.16, y+h*.55, w*.68, h*.27];
  }

  function plateRegionsForPrediction(p = {}) {
    const [x,y,w,h] = p.bbox || [0,0,0,0];
    if (!w || !h || p.class === 'bicycle') return [];
    if (p.class === 'motorcycle') return [
      [x+w*.18, y+h*.50, w*.64, h*.32],
      [x+w*.27, y+h*.60, w*.46, h*.22],
      [x+w*.12, y+h*.58, w*.76, h*.25],
    ];
    return [
      [x+w*.16, y+h*.55, w*.68, h*.27],
      [x+w*.22, y+h*.62, w*.56, h*.18],
      [x+w*.10, y+h*.58, w*.80, h*.22],
    ];
  }

  function anprAuthorizedIds() {
    return new Set((window.SENTINEL_ANPR_AUTHORIZED_IDS || []).map((x)=>String(x)));
  }

  function anprCameraConfig(cam = null) {
    const id=String(cam?.id || cam?.key || cam?.cameraId || '');
    const all=window.SENTINEL_ANPR_CONFIG || {};
    return { ...(all.default || {}), ...(id && all.cameras?.[id] ? all.cameras[id] : {}) };
  }

  function isAnprAuthorizedCamera(cam = null) {
    if (!cam) return false;
    const id = String(cam.id || cam.key || cam.cameraId || '');
    return Boolean(id && anprAuthorizedIds().has(id));
  }

  function resetAnpr(cameraId = null) {
    state.anprCameraId = cameraId == null ? null : String(cameraId);
    state.anprReads = new Map();
    state.anprVotes = new Map();
    state.anprLastAt = 0;
    state.anprTelemetry = { mode:'IDLE', lastAngle:0, attempts:0 };
  }

  function alphaFix(s='') { return String(s).replace(/0/g,'O').replace(/1/g,'I').replace(/2/g,'Z').replace(/5/g,'S').replace(/8/g,'B').replace(/6/g,'G'); }
  function digitFix(s='') { return String(s).replace(/[OQ]/g,'0').replace(/[IL]/g,'1').replace(/Z/g,'2').replace(/S/g,'5').replace(/[BG]/g,(m)=>m==='B'?'8':'6'); }

  function normalizePlateText(text = '') {
    const pieces=[String(text || '').toUpperCase().replace(/[^A-Z0-9]/g,''), ...String(text || '').toUpperCase().split(/\s+/).map((x)=>x.replace(/[^A-Z0-9]/g,''))].filter(Boolean);
    const seen=new Set();
    for (const raw of pieces) {
      if (raw.length < 5 || raw.length > 8 || seen.has(raw)) continue;
      seen.add(raw);
      const direct=[
        [/^([A-Z]{2,3})(\d{3,4})$/, (m)=>`${m[1]}-${m[2]}`],
        [/^(\d{3,4})([A-Z]{2,3})$/, (m)=>`${m[1]}-${m[2]}`],
        [/^([A-Z]{1,2})(\d{2,4})([A-Z]{1,2})$/, (m)=>`${m[1]}${m[2]}-${m[3]}`],
      ];
      for (const [rx,fmt] of direct) { const m=raw.match(rx); if(m) return fmt(m); }
      for (const split of [2,3]) {
        if (raw.length-split < 3 || raw.length-split > 4) continue;
        const a=alphaFix(raw.slice(0,split)), n=digitFix(raw.slice(split));
        if (/^[A-Z]{2,3}$/.test(a) && /^\d{3,4}$/.test(n)) return `${a}-${n}`;
      }
      for (const split of [3,4]) {
        if (raw.length-split < 2 || raw.length-split > 3) continue;
        const n=digitFix(raw.slice(0,split)), a=alphaFix(raw.slice(split));
        if (/^\d{3,4}$/.test(n) && /^[A-Z]{2,3}$/.test(a)) return `${n}-${a}`;
      }
    }
    return '';
  }

  async function getAnprWorker() {
    if (state.anprWorker) return state.anprWorker;
    if (state.anprWorkerPromise) return state.anprWorkerPromise;
    state.anprWorkerPromise = (async () => {
      await loadExternalScript('https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js', () => window.Tesseract);
      if (!window.Tesseract?.createWorker) throw new Error('ANPR OCR engine unavailable');
      const worker = await window.Tesseract.createWorker('eng', 1, { logger:()=>{} });
      await worker.setParameters({
        tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode:'7',
        preserve_interword_spaces:'0',
        user_defined_dpi:'300'
      });
      state.anprWorker = worker;
      return worker;
    })().finally(()=>{ state.anprWorkerPromise = null; });
    return state.anprWorkerPromise;
  }

  function cropPlateRoi(sourceCanvas, roi = [0,0,0,0], targetWidth = 320) {
    const [rx,ry,rw,rh] = roi.map(Number);
    if (!rw || !rh) return null;
    const padX=rw*.08, padY=rh*.18;
    const sx=Math.max(0,Math.floor(rx-padX)), sy=Math.max(0,Math.floor(ry-padY));
    const sw=Math.max(1,Math.min(sourceCanvas.width-sx,Math.ceil(rw+padX*2))), sh=Math.max(1,Math.min(sourceCanvas.height-sy,Math.ceil(rh+padY*2)));
    if (sw < 18 || sh < 8) return null;
    const out=document.createElement('canvas');
    const scale=Math.min(7,Math.max(2.5,targetWidth/Math.max(1,sw)));
    out.width=Math.max(220,Math.round(sw*scale)); out.height=Math.max(64,Math.round(sh*scale));
    const ctx=out.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(sourceCanvas,sx,sy,sw,sh,0,0,out.width,out.height);
    return out;
  }

  function plateLuma(canvas) {
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const d=ctx.getImageData(0,0,canvas.width,canvas.height).data; let sum=0, n=0;
    for(let i=0;i<d.length;i+=16){ sum += .299*d[i]+.587*d[i+1]+.114*d[i+2]; n++; }
    return sum/Math.max(1,n);
  }

  function otsuThreshold(gray = []) {
    const hist=new Uint32Array(256); gray.forEach((v)=>hist[Math.max(0,Math.min(255,Math.round(v)))]++);
    let total=gray.length,sum=0; for(let i=0;i<256;i++) sum+=i*hist[i];
    let sumB=0,wB=0,max=0,threshold=128;
    for(let i=0;i<256;i++){
      wB+=hist[i]; if(!wB)continue; const wF=total-wB; if(!wF)break;
      sumB+=i*hist[i]; const mB=sumB/wB,mF=(sum-sumB)/wF; const between=wB*wF*(mB-mF)*(mB-mF);
      if(between>max){max=between;threshold=i;}
    }
    return threshold;
  }

  function enhancePlateCanvas(baseCanvas, mode = 'auto') {
    const out=document.createElement('canvas'); out.width=baseCanvas.width; out.height=baseCanvas.height;
    const ctx=out.getContext('2d',{willReadFrequently:true}); ctx.drawImage(baseCanvas,0,0);
    const img=ctx.getImageData(0,0,out.width,out.height), d=img.data; const gray=[];
    let min=255,max=0,sum=0;
    for(let i=0;i<d.length;i+=4){ const g=.299*d[i]+.587*d[i+1]+.114*d[i+2]; gray.push(g); min=Math.min(min,g); max=Math.max(max,g); sum+=g; }
    const mean=sum/Math.max(1,gray.length); const night=mean<82;
    const lo=Math.max(0,min-4), hi=Math.max(lo+24,max); const stretch=255/(hi-lo);
    const normalized=gray.map((g)=>Math.max(0,Math.min(255,(g-lo)*stretch)));
    const threshold=otsuThreshold(normalized);
    for(let p=0,i=0;i<d.length;i+=4,p++){
      let v=normalized[p];
      if(night) v=255*Math.pow(v/255,.72);
      if(mode==='binary') v=v>threshold?255:0;
      else if(mode==='invert') v=v>threshold?0:255;
      else v=Math.max(0,Math.min(255,(v-128)*1.32+128));
      d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
    }
    ctx.putImageData(img,0,0); out.dataset.anprMode=night?'NIGHT':'DAY'; out.dataset.preprocess=mode; return out;
  }

  function rotatePlateCanvas(canvas, degrees = 0) {
    if (!degrees) return canvas;
    const out=document.createElement('canvas'); out.width=canvas.width; out.height=canvas.height;
    const ctx=out.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,out.width,out.height);
    ctx.translate(out.width/2,out.height/2); ctx.rotate(degrees*Math.PI/180); ctx.drawImage(canvas,-canvas.width/2,-canvas.height/2); return out;
  }

  function keystonePlateCanvas(canvas, strength = 0) {
    if (!strength) return canvas;
    const out=document.createElement('canvas'); out.width=canvas.width; out.height=canvas.height;
    const ctx=out.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,out.width,out.height);
    const slices=Math.min(48,Math.max(18,Math.round(canvas.height/4)));
    for(let i=0;i<slices;i++){
      const sy=Math.floor(i*canvas.height/slices), sh=Math.ceil(canvas.height/slices)+1;
      const t=(i+.5)/slices; const scale=Math.max(.72,Math.min(1.28,1+strength*(t-.5)*2));
      const dw=canvas.width*scale, dx=(canvas.width-dw)/2; const dy=sy;
      ctx.drawImage(canvas,0,sy,canvas.width,sh,dx,dy,dw,sh);
    }
    return out;
  }

  function buildPlateCandidate(sourceCanvas, p, attempt = 0) {
    const cfg=anprCameraConfig(state.inlineCamera || state.activeCamera);
    const regions=plateRegionsForPrediction(p); if(!regions.length)return null;
    const roi=regions[attempt % regions.length]; const base=cropPlateRoi(sourceCanvas,roi,Number(cfg.targetWidth||320)); if(!base)return null;
    const modes=['auto','binary','auto','binary','invert']; const angles=Array.isArray(cfg.skewAngles)&&cfg.skewAngles.length?cfg.skewAngles:[0,-4,4,-7,7];
    const keystones=Array.isArray(cfg.keystoneStrengths)&&cfg.keystoneStrengths.length?cfg.keystoneStrengths:[0,-.10,.10,-.16,.16];
    const mode=modes[attempt%modes.length], angle=Number(angles[attempt%angles.length]||0), keystone=Number(keystones[attempt%keystones.length]||0);
    const enhanced=enhancePlateCanvas(base,mode); const warped=keystonePlateCanvas(enhanced,keystone); const canvas=rotatePlateCanvas(warped,angle);
    return { canvas, roi, angle, keystone, mode:enhanced.dataset.anprMode || 'DAY', preprocess:mode, luma:Math.round(plateLuma(base)) };
  }

  function voteAnprRead(key, plate, confidence, meta = {}) {
    const now=Date.now(); const bucket=state.anprVotes.get(key) || { frames:0, candidates:new Map(), lastSeen:now };
    bucket.frames++; bucket.lastSeen=now;
    const c=bucket.candidates.get(plate) || { count:0, confidenceSum:0, bestConfidence:0, preview:'', plate };
    c.count++; c.confidenceSum+=confidence; c.bestConfidence=Math.max(c.bestConfidence,confidence); if(confidence>=c.bestConfidence){ c.preview=meta.preview||c.preview; c.roi=meta.roi||c.roi; c.mode=meta.mode; c.angle=meta.angle; }
    bucket.candidates.set(plate,c); state.anprVotes.set(key,bucket);
    const ranked=[...bucket.candidates.values()].sort((a,b)=>(b.count-a.count)||((b.confidenceSum/b.count)-(a.confidenceSum/a.count)));
    const best=ranked[0]; if(!best)return null;
    const cfg=anprCameraConfig(state.inlineCamera || state.activeCamera); const need=Math.max(2,Number(cfg.stableVotes||2)); const avg=Math.round(best.confidenceSum/Math.max(1,best.count));
    const stable=best.count>=need || (best.bestConfidence>=92 && best.count>=1);
    return { plate:best.plate, confidence:avg, votes:best.count, stable, preview:best.preview, roi:best.roi, mode:best.mode, angle:best.angle, at:now };
  }

  async function runAuthorizedAnpr(found = [], sourceCanvas = null, tracking = null, cam = null) {
    if (!state.anprRunning || state.anprBusy || !sourceCanvas || !isAnprAuthorizedCamera(cam)) return [];
    const camId=String(cam?.id || cam?.key || ''); if (state.anprCameraId !== camId) resetAnpr(camId);
    const cfg=anprCameraConfig(cam), now=Date.now(), interval=Math.max(1600,Number(cfg.intervalMs||2200));
    if (now-state.anprLastAt < interval) return [...state.anprReads.values()];
    state.anprLastAt=now; state.anprBusy=true;
    try {
      const worker=await getAnprWorker();
      const vehicles=(tracking?.tracked || found).filter((p)=>p.class !== 'person' && p.class !== 'bicycle').sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,Math.max(1,Math.min(2,Number(cfg.maxVehicles||2))));
      const reads=[];
      for (const p of vehicles) {
        const key=String(p.trackId || `${p.class}:${Math.round(p.bbox?.[0]||0)}:${Math.round(p.bbox?.[1]||0)}`);
        const bucket=state.anprVotes.get(key); const attempt=Number(bucket?.frames||0); const candidate=buildPlateCandidate(sourceCanvas,p,attempt); if(!candidate)continue;
        const result=await worker.recognize(candidate.canvas); const plate=normalizePlateText(result?.data?.text || ''); const confidence=Math.round(Number(result?.data?.confidence || 0));
        state.anprTelemetry={ mode:candidate.mode, lastAngle:candidate.angle, keystone:candidate.keystone, attempts:Number(state.anprTelemetry?.attempts||0)+1 };
        if (!plate || confidence < Math.max(24,Number(cfg.minConfidence||28))) continue;
        const preview=candidate.canvas.toDataURL('image/jpeg',.78); const voted=voteAnprRead(key,plate,confidence,{...candidate,preview}); if(!voted)continue;
        if(voted.stable){ const item={ key, trackId:p.trackId || null, ...voted }; state.anprReads.set(key,item); reads.push(item); }
      }
      for (const [k,v] of state.anprReads) if(now-v.at>14000) state.anprReads.delete(k);
      for (const [k,v] of state.anprVotes) if(now-v.lastSeen>16000) state.anprVotes.delete(k);
      return reads;
    } finally { state.anprBusy=false; }
  }

  function setAnprButtons() {
    const cam=state.inlineCamera || state.activeCamera;
    const authorized=isAnprAuthorizedCamera(cam);
    [$('cameraAnprBtn'),$('cctvPopupAnpr')].filter(Boolean).forEach((btn)=>{
      // Keep the control visible so users can tell whether ANPR exists and why it is unavailable.
      btn.hidden=false;
      btn.disabled=!authorized;
      btn.classList.toggle('active',state.anprRunning);
      btn.classList.toggle('locked',!authorized);
      btn.setAttribute('aria-pressed',String(state.anprRunning));
      btn.setAttribute('aria-disabled',String(!authorized));
      btn.textContent=authorized ? (state.anprRunning?'停止車牌辨識':'車牌辨識') : '車牌辨識（未授權）';
      btn.title=authorized ? '辨識目前已授權鏡頭中的車牌' : '公開 CCTV 僅顯示車牌候選區；OCR 只對自有或已授權鏡頭開放';
    });
  }

  async function stopAuthorizedAnpr() {
    state.anprRunning=false; state.visionPlateShield=true; resetAnpr(null); setAnprButtons();
    if ($('anprPlateList')) $('anprPlateList').innerHTML='<span>車牌辨識未啟用</span>';
    if (!state.visionRunning) clearLiveVisionBoxes();
  }

  function toggleAuthorizedAnpr() {
    const cam=state.inlineCamera || state.activeCamera;
    if (!isAnprAuthorizedCamera(cam)) { toast('ANPR 僅能用於你自有或已明確授權的鏡頭'); return; }
    if (state.anprRunning) { stopAuthorizedAnpr(); return; }
    const ok=window.confirm('此功能僅供你自有或已取得授權的鏡頭使用。確定啟用車牌辨識？');
    if (!ok) return;
    state.anprRunning=true; state.visionPlateShield=false; resetAnpr(cam.id || cam.key || null); setAnprButtons();
    if (!state.visionRunning) startCameraLiveAnalysis();
    toast('車牌辨識已啟用');
  }

  function renderLiveVisionBoxes(predictions = [], srcW = 1, srcH = 1, tracking = null) {
    clearLiveVisionBoxes();
    const allowed = new Set(['person','car','bus','truck','motorcycle','bicycle']);
    const found = predictions.filter((x) => allowed.has(x.class));
    const trackedByKey = new Map((tracking?.tracked||[]).map((x)=>[`${x.class}:${Math.round(x.bbox?.[0]||0)}:${Math.round(x.bbox?.[1]||0)}`,x]));
    analysisStages().forEach((stage) => {
      const layer = document.createElement('div');
      layer.className = 'live-vision-layer';
      const stageW = Math.max(1, stage.clientWidth || stage.getBoundingClientRect().width || srcW);
      const stageH = Math.max(1, stage.clientHeight || stage.getBoundingClientRect().height || srcH);
      const fitScale = Math.min(stageW / Math.max(1,srcW), stageH / Math.max(1,srcH));
      const drawW = srcW * fitScale, drawH = srcH * fitScale;
      const offsetX = (stageW - drawW) / 2, offsetY = (stageH - drawH) / 2;
      found.forEach((p) => {
        const [x,y,w,h] = p.bbox || [0,0,0,0];
        const tracked = trackedByKey.get(`${p.class}:${Math.round(x)}:${Math.round(y)}`);
        const box = document.createElement('div');
        box.className = `live-vision-box ${p.class === 'person' ? 'person' : 'vehicle'} ${tracked?.stopped ? 'stopped' : ''}`;
        box.style.left = `${Math.max(0, offsetX + x * fitScale)}px`;
        box.style.top = `${Math.max(0, offsetY + y * fitScale)}px`;
        box.style.width = `${Math.max(12, w * fitScale)}px`;
        box.style.height = `${Math.max(12, h * fitScale)}px`;
        const trackText = tracked ? ` · T${String(tracked.trackId).padStart(2,'0')} · ${tracked.stopped?'STOP':tracked.direction}` : '';
        const simpleName={person:'人',car:'汽車',bus:'公車',truck:'卡車',motorcycle:'機車',bicycle:'自行車'}[p.class]||String(p.class||'');
        box.innerHTML = `<span>${escapeHtml(simpleName)} ${Math.round(Number(p.score || 0)*100)}%</span>`;
        layer.appendChild(box);
        const plate = p.class !== 'person' ? plateRegionForPrediction(p) : null;
        if (plate && state.visionPlateShield) {
          const [px,py,pw,ph] = plate;
          const mask = document.createElement('div');
          mask.className = 'plate-privacy-roi';
          mask.style.left = `${Math.max(0, offsetX + px * fitScale)}px`;
          mask.style.top = `${Math.max(0, offsetY + py * fitScale)}px`;
          mask.style.width = `${Math.max(12, pw * fitScale)}px`;
          mask.style.height = `${Math.max(7, ph * fitScale)}px`;
          mask.title = '車牌候選區';
          layer.appendChild(mask);
          const hint=document.createElement('div'); hint.className='plate-candidate-label';
          hint.style.left=`${Math.max(0,offsetX+px*fitScale)}px`; hint.style.top=`${Math.max(0,offsetY+(py+ph)*fitScale+2)}px`;
          hint.textContent='車牌候選'; layer.appendChild(hint);
        } else if (plate && state.anprRunning) {
          const [px,py,pw,ph]=plate;
          const roi=document.createElement('div'); roi.className='anpr-plate-roi';
          roi.style.left=`${Math.max(0,offsetX+px*fitScale)}px`; roi.style.top=`${Math.max(0,offsetY+py*fitScale)}px`;
          roi.style.width=`${Math.max(12,pw*fitScale)}px`; roi.style.height=`${Math.max(7,ph*fitScale)}px`; layer.appendChild(roi);
          const match=[...state.anprReads.values()].find((r)=> tracked?.trackId && String(r.trackId)===String(tracked.trackId));
          const tag=document.createElement('div'); tag.className='anpr-plate-tag';
          tag.style.left=`${Math.max(0,offsetX+px*fitScale)}px`; tag.style.top=`${Math.max(0,offsetY+(py+ph)*fitScale+3)}px`;
          tag.innerHTML=match?`<b>${escapeHtml(match.plate)}</b><small>${match.confidence}%</small>`:'<b>辨識中</b>';
          layer.appendChild(tag);
        }
      });
      const stamp = document.createElement('div');
      stamp.className = 'live-vision-stamp';
      stamp.textContent = `即時分析 ${new Date().toLocaleTimeString('zh-TW',{hour12:false})}`;
      layer.appendChild(stamp);
      stage.appendChild(layer);
    });
  }


  function waitForVideoFrame(media, timeoutMs = 220) {
    if (!media || media.tagName !== 'VIDEO' || typeof media.requestVideoFrameCallback !== 'function') {
      return new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    return new Promise((resolve) => {
      let done=false;
      const finish=()=>{ if(done)return; done=true; resolve(); };
      const timer=setTimeout(finish,timeoutMs);
      try { media.requestVideoFrameCallback(()=>{ clearTimeout(timer); finish(); }); }
      catch (_) { clearTimeout(timer); requestAnimationFrame(finish); }
    });
  }

  function nextVisionCadence(lastDuration = 0) {
    const mobile=window.innerWidth<=920;
    const floor=mobile?620:420;
    if (lastDuration>1300) return mobile?1500:1250;
    if (lastDuration>850) return mobile?1200:950;
    if (lastDuration>500) return mobile?900:700;
    return floor;
  }

  function loadAnalysisImage(url, timeoutMs = 2200) {
    return new Promise((resolve,reject)=>{
      const img=new Image(); img.crossOrigin='anonymous'; img.decoding='async';
      const timer=setTimeout(()=>{ img.src=''; reject(new Error('snapshot timeout')); },timeoutMs);
      img.onload=()=>{ clearTimeout(timer); resolve(img); };
      img.onerror=()=>{ clearTimeout(timer); reject(new Error('snapshot unavailable')); };
      img.src=`${url}${url.includes('?')?'&':'?'}frame=${Date.now()}`;
    });
  }

  async function drawLatestAnalysisFrame(canvas, media, cam) {
    const displayW=media?.videoWidth || media?.naturalWidth || media?.width || 640;
    const displayH=media?.videoHeight || media?.naturalHeight || media?.height || 360;
    const maxW=window.innerWidth<=920?320:384;
    const setCanvas=(w,h)=>{
      const scale=Math.min(1,maxW/Math.max(1,w));
      canvas.width=Math.max(256,Math.round(w*scale));
      canvas.height=Math.max(144,Math.round(h*scale));
      return canvas.getContext('2d',{willReadFrequently:false,alpha:false});
    };

    // First use the exact frame currently on screen. This keeps analysis aligned with playback.
    try {
      const ctx=setCanvas(displayW,displayH);
      ctx.drawImage(media,0,0,canvas.width,canvas.height);
      // Detect cross-origin canvas taint immediately. If tainted, use the official
      // snapshot through the same-origin Worker without changing visible playback.
      ctx.getImageData(0,0,1,1);
      return { srcW:displayW, srcH:displayH, mode:'video-frame' };
    } catch (_) {}

    const resolved=cam?._resolvedPlayback;
    const snap=String(resolved?.snapshotProxyUrl || '');
    if (snap) {
      const img=await loadAnalysisImage(snap);
      const w=img.naturalWidth || displayW, h=img.naturalHeight || displayH;
      const ctx=setCanvas(w,h); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      return { srcW:w, srcH:h, mode:'snapshot' };
    }
    throw new Error('此來源可以播放，但目前無法取得可分析影格');
  }

  async function runCameraFrameAnalysis() {
    if (state.visionBusy || !state.visionRunning) return;
    const analysisStartedAt=performance.now();
    const cam=state.inlineCamera || state.activeCamera;
    const media=cameraMediaElement();
    const lab=$('cameraVisionLab'), status=$('visionLabStatus'), metrics=$('cameraAnalysisMetrics'), types=$('cameraAnalysisTypes'), canvas=$('cameraAnalysisCanvas');
    if (!lab || !status || !metrics || !types || !canvas) return;
    lab.hidden=false;
    if (!cam || !media) { status.textContent='等待影像'; types.textContent='請先選擇一支可播放的 CCTV。'; return; }
    if (media.tagName==='VIDEO' && (media.readyState<2 || media.seeking || media.paused)) { status.textContent='等待最新畫面'; return; }
    if (media.tagName==='IMG' && !media.complete) { status.textContent='等待最新畫面'; return; }

    state.visionBusy=true;
    try {
      const model=await getVisionModel();
      status.textContent='分析中';
      const frame=await drawLatestAnalysisFrame(canvas,media,cam);
      const predictions=await model.detect(canvas,12,.44);
      const allowed=new Set(['person','car','bus','truck','motorcycle','bicycle']);
      const found=predictions.filter((x)=>allowed.has(x.class));
      const counts={}; let personArea=0,vehicleArea=0;
      const vehicleClasses=new Set(['car','bus','truck','motorcycle','bicycle']);
      found.forEach((p)=>{
        counts[p.class]=(counts[p.class]||0)+1;
        const [x,y,w,h]=p.bbox; const area=Math.max(0,w*h)/Math.max(1,canvas.width*canvas.height);
        if(p.class==='person')personArea+=area; else if(vehicleClasses.has(p.class))vehicleArea+=area;
      });
      const persons=counts.person||0;
      const vehicles=[...vehicleClasses].reduce((n,k)=>n+(counts[k]||0),0);
      const crowdScore=Math.min(100,Math.round(persons*7+personArea*180));
      const trafficScore=Math.min(100,Math.round(vehicles*7+vehicleArea*150));
      const tracking=updateVisionTracks(found,canvas.width,canvas.height,cam.id);

      if (state.anprRunning && isAnprAuthorizedCamera(cam)) runAuthorizedAnpr(found,canvas,tracking,cam).catch(()=>{});
      const livePlates=[...state.anprReads.values()].filter((x)=>Date.now()-x.at<12000);
      const directionText=({LEFT:'左',RIGHT:'右',UP:'上',DOWN:'下',STILL:'停滯','N/A':'—'})[tracking.dominantDirection]||tracking.dominantDirection;
      const plateMetric=isAnprAuthorizedCamera(cam) ? (state.anprRunning ? String(livePlates.length) : '未啟用') : '未授權';
      metrics.innerHTML=`<div><small>人</small><b>${persons}</b></div><div><small>車輛</small><b>${vehicles}</b></div><div><small>排隊程度</small><b>${tracking.queueScore}</b></div><div><small>停滯</small><b>${tracking.stopped}</b></div><div><small>方向</small><b>${escapeHtml(directionText)}</b></div><div><small>車牌</small><b>${escapeHtml(plateMetric)}</b></div>`;
      const typeOrder=['car','bus','truck','motorcycle','bicycle','person'];
      const typeNames={car:'汽車',bus:'公車',truck:'卡車',motorcycle:'機車',bicycle:'自行車',person:'行人'};
      const chips=typeOrder.filter((k)=>counts[k]).map((k)=>`<span><b>${typeNames[k]}</b><em>${counts[k]}</em></span>`).join('');
      const plateChips=state.anprRunning&&livePlates.length?livePlates.map((r)=>`<span class="plate-chip"><b>${escapeHtml(r.plate)}</b><em>${r.confidence}%</em></span>`).join(''):'';
      types.innerHTML=`${chips||'<span><b>目前未偵測到人車</b></span>'}${plateChips}`;
      if ($('anprPlateList')) {
        $('anprPlateList').innerHTML=!isAnprAuthorizedCamera(cam)
          ? '<span>此鏡頭未開放車牌 OCR；仍會顯示車牌候選區。</span>'
          : state.anprRunning
            ? (livePlates.length?livePlates.map((r)=>`<div class="anpr-stable-read"><img src="${r.preview}" alt="車牌"><b>${escapeHtml(r.plate)}</b><em>${r.confidence}%</em></div>`).join(''):'<span>正在辨識車牌…</span>')
            : '<span>可使用車牌辨識，尚未啟用。</span>';
      }

      const targetW=media.videoWidth||media.naturalWidth||frame.srcW;
      const targetH=media.videoHeight||media.naturalHeight||frame.srcH;
      const scaleX=targetW/Math.max(1,canvas.width), scaleY=targetH/Math.max(1,canvas.height);
      const scaledFound=found.map((p)=>({...p,bbox:[p.bbox[0]*scaleX,p.bbox[1]*scaleY,p.bbox[2]*scaleX,p.bbox[3]*scaleY]}));
      const scaledTracking={...tracking,tracked:tracking.tracked.map((p)=>({...p,bbox:[p.bbox[0]*scaleX,p.bbox[1]*scaleY,p.bbox[2]*scaleX,p.bbox[3]*scaleY]}))};
      renderLiveVisionBoxes(scaledFound,targetW,targetH,scaledTracking);
      state.visionAnalysis={cameraId:cam.id,at:Date.now(),counts,crowdScore,trafficScore,queueScore:tracking.queueScore,stopped:tracking.stopped,dominantDirection:tracking.dominantDirection,activeTracks:tracking.activeTracks,frameMode:frame.mode};
      const elapsed=Math.round(performance.now()-analysisStartedAt);
      status.textContent=`即時 · ${elapsed} ms`;
    } catch (err) {
      status.textContent='目前無法分析';
      types.innerHTML=`<small>${escapeHtml(err.message||'此 CCTV 暫時無法分析')}</small>`;
    } finally {
      state.visionBusy=false;
      state.visionLastDurationMs=Math.max(0,Math.round(performance.now()-analysisStartedAt));
      state.visionCadenceMs=nextVisionCadence(state.visionLastDurationMs);
      state.visionLastRunAt=Date.now();
    }
  }

  function setVisionButtons(active) {
    setAnprButtons();
    [$('cameraAnalyzeBtn'),$('cctvPopupAnalyze')].filter(Boolean).forEach((btn)=>{
      btn.classList.toggle('active',active); btn.setAttribute('aria-pressed',String(active)); btn.textContent=active?'停止分析':'即時分析';
    });
  }

  function stopCameraLiveAnalysis({collapse=false}={}) {
    state.visionRunning=false;
    clearTimeout(state.visionLoopTimer); state.visionLoopTimer=null;
    const media=cameraMediaElement();
    try { if (media?.cancelVideoFrameCallback && state.visionFrameCallbackId!=null) media.cancelVideoFrameCallback(state.visionFrameCallbackId); } catch (_) {}
    state.visionFrameCallbackId=null;
    clearLiveVisionBoxes(); resetVisionTracks(null);
    if (state.anprRunning) stopAuthorizedAnpr();
    analysisStages().forEach((stage)=>stage.classList.remove('live-analysis-active'));
    setVisionButtons(false);
    if ($('visionLabStatus')) $('visionLabStatus').textContent='待命';
    if (collapse&&$('cameraVisionLab')) $('cameraVisionLab').hidden=true;
  }

  function startCameraLiveAnalysis() {
    if (!(state.inlineCamera||state.activeCamera)) { toast('請先選擇一支 CCTV'); return; }
    state.visionRunning=true;
    analysisStages().forEach((stage)=>stage.classList.add('live-analysis-active'));
    setVisionButtons(true); if ($('cameraVisionLab')) $('cameraVisionLab').hidden=false;
    clearTimeout(state.visionLoopTimer);
    state.visionCadenceMs=window.innerWidth<=920?620:420;
    state.visionLastRunAt=0;
    const loop=async()=>{
      if(!state.visionRunning)return;
      const media=cameraMediaElement();
      if(media?.tagName==='VIDEO') await waitForVideoFrame(media,220);
      if(!state.visionRunning)return;
      if(!state.visionBusy && Date.now()-Number(state.visionLastRunAt||0)>=Math.max(320,Number(state.visionCadenceMs||500))) await runCameraFrameAnalysis();
      if(!state.visionRunning)return;
      state.visionLoopTimer=setTimeout(loop,60);
    };
    loop();
  }

  function toggleCameraLiveAnalysis() {
    if(state.visionRunning)stopCameraLiveAnalysis({collapse:false}); else startCameraLiveAnalysis();
  }

  function resetCctvPopupPosition() {
    const popup = $('cctvPopup');
    if (!popup) return;
    const side = (window.innerWidth > 920 && state.intelOpen) ? Math.min(410, Math.max(360, Math.round(window.innerWidth * .29))) : 0;
    const mapWidth = Math.max(320, window.innerWidth - side);
    popup.style.left = `${Math.round(mapWidth / 2)}px`; popup.style.top = '50%'; popup.style.transform = 'translate(-50%,-50%)';
  }

  function openCctvPopup() {
    const cam = state.inlineCamera || state.activeCamera;
    const popup = $('cctvPopup');
    if (!cam || !popup) { toast('請先選擇一支 CCTV'); return; }
    popup.hidden = false;
    resetCctvPopupPosition();
    if (state.visionRunning) $('cctvPopupStage')?.classList.add('live-analysis-active');
    $('cctvPopupTitle').textContent = shortName(cam.name || cam.road || '公開攝影機');
    $('cctvPopupMeta').textContent = `${cam.region ? `${cam.region} · ` : ''}${cam.road || ''} ${cam.direction || ''} · ${cam.source || 'PUBLIC DATA'}`.trim();
    clearCameraStage($('inlineCameraStage'));
    renderCameraMedia($('cctvPopupStage'), cam, { fast:true });
    renderCameraIntel(cam).catch(() => {});
    setVisionButtons(state.visionRunning);
    setTimeout(() => { if (state.visionRunning) runCameraFrameAnalysis(); }, 700);
  }

  function closeCctvPopup() {
    const popup = $('cctvPopup');
    if (!popup) return;
    popup.hidden = true;
    $('cctvPopupStage')?.classList.remove('live-analysis-active');
    clearCameraStage($('cctvPopupStage'));
    const cam = state.inlineCamera || state.activeCamera;
    if (cam && $('inlineCameraStage')) renderCameraMedia($('inlineCameraStage'), cam);
    resetCctvPopupPosition();
  }

  function bindCctvPopupDrag() {
    const popup = $('cctvPopup'), handle = $('cctvPopupHandle');
    if (!popup || !handle || handle.dataset.dragBound) return;
    handle.dataset.dragBound = '1';
    let drag = null;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const r = popup.getBoundingClientRect();
      drag = { id:e.pointerId, dx:e.clientX-r.left, dy:e.clientY-r.top, w:r.width, h:r.height };
      popup.style.transform = 'none'; popup.style.left = `${r.left}px`; popup.style.top = `${r.top}px`;
      handle.setPointerCapture?.(e.pointerId); e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const pad = 6;
      const side = (window.innerWidth > 920 && state.intelOpen) ? Math.min(410, Math.max(360, Math.round(window.innerWidth * .29))) : 0;
      const rightEdge = Math.max(drag.w + pad * 2, window.innerWidth - side);
      const left = Math.min(rightEdge-drag.w-pad, Math.max(pad, e.clientX-drag.dx));
      const top = Math.min(window.innerHeight-drag.h-pad, Math.max(pad, e.clientY-drag.dy));
      popup.style.left = `${left}px`; popup.style.top = `${top}px`;
    });
    const end = (e) => { if (drag && (!e || drag.id === e.pointerId)) drag = null; };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  }

  function toggleInlineCameraExpand(force = null) {
    if (force === false) { closeCctvPopup(); return; }
    openCctvPopup();
  }

  function stageHasCameraMedia(stage, cam) {
    if (!stage || !cam) return false;
    const key=String(cam.id || cam.streamUrl || cam.imageUrl || '');
    return !!key && stage.dataset.cameraId===key && !!stage.querySelector('video,img,iframe');
  }

  function selectInlineCamera(cam, cityFlow = [], options = {}) {
    if (!cam || !$('inlineCameraStage') || !hasDirectCameraMedia(cam)) return;
    const previousId=String(state.inlineCamera?.id || state.inlineCamera?.streamUrl || '');
    const nextId=String(cam.id || cam.streamUrl || '');
    const changed=previousId!==nextId;
    if (changed) {
      resetVisionTracks(cam.id);
      if (state.anprRunning && !isAnprAuthorizedCamera(cam)) stopAuthorizedAnpr();
      else resetAnpr(cam.id);
    }
    state.inlineCamera = cam;
    setAnprButtons();
    $('inlineCameraCard').hidden = false;
    $('inlineCameraTitle').textContent = shortName(cam.name || cam.road || '公開攝影機');
    $('inlineCameraSignal').textContent = $('inlineCameraStage')?.dataset?.playbackPath==='proxy' ? '備援播放' : '即時影像';
    $('inlineCameraMeta').textContent = `${cam.region ? `${cam.region} · ` : ''}${cam.road || ''} ${cam.direction || ''} · ${cam.source || 'PUBLIC DATA'}`.trim();
    const popup=$('cctvPopup');
    if (popup && !popup.hidden) {
      const popupStage=$('cctvPopupStage');
      clearCameraStage($('inlineCameraStage'));
      $('cctvPopupTitle').textContent = shortName(cam.name || cam.road || '公開攝影機');
      $('cctvPopupMeta').textContent = `${cam.region ? `${cam.region} · ` : ''}${cam.road || ''} ${cam.direction || ''} · ${cam.source || 'PUBLIC DATA'}`.trim();
      if (options.force || !stageHasCameraMedia(popupStage,cam)) renderCameraMedia(popupStage, cam);
    } else {
      const inlineStage=$('inlineCameraStage');
      if (options.force || !stageHasCameraMedia(inlineStage,cam)) renderCameraMedia(inlineStage, cam);
      else syncLocalPrivacyMask(inlineStage);
    }
    if (!state.visionRunning && $('cameraVisionLab')) $('cameraVisionLab').hidden = true;
    if ($('visionLabStatus')) $('visionLabStatus').textContent = state.visionRunning ? (changed?'切換鏡頭中':'分析中') : '待命';
    if (changed || options.refreshIntel) renderCameraIntel(cam).catch(() => {});
    if (state.visionRunning && changed) setTimeout(() => runCameraFrameAnalysis(), 500);
    document.querySelectorAll('[data-inline-camera]').forEach((btn) => btn.classList.toggle('active', btn.dataset.inlineCamera === String(cam.id)));
  }

  function renderInlineCctvResults(items = [], focus = null, cityFlow = []) {
    const card = $('inlineCameraCard');
    const choices = $('inlineCameraChoices');
    const stage = $('inlineCameraStage');
    if (!card || !choices || !stage) return;
    const valid = [...(items || [])]
      .filter((x)=>Number.isFinite(Number(x?.lat)) && Number.isFinite(Number(x?.lon)))
      .sort((a,b) => {
        const priority = cameraPlaybackPriority(a)-cameraPlaybackPriority(b);
        if (priority) return priority;
        if (!focus) return Number(a.distance || 0) - Number(b.distance || 0);
        return haversineKm(focus.lat, focus.lon, a.lat, a.lon) - haversineKm(focus.lat, focus.lon, b.lat, b.lon);
      });
    const cameras = valid.filter(hasDirectCameraMedia).slice(0,12);
    const positions = valid.filter((x)=>!hasDirectCameraMedia(x)).slice(0,12);
    card.hidden = false;

    if (!cameras.length) {
      $('inlineCameraTitle').textContent = '附近公開攝影機';
      $('inlineCameraSignal').textContent = positions.length ? `${positions.length} 個攝影機點位` : '暫無可播放影像';
      $('inlineCameraMeta').textContent = positions.length
        ? `找到 ${positions.length} 個附近官方 CCTV 點位；未提供公開播放串流的點位只顯示位置。`
        : '附近目前沒有可直接使用的原始公開 CCTV。';
      if (!stage.querySelector('video,img,iframe')) {
        clearCameraStage(stage);
        stage.innerHTML = '<div class="camera-placeholder"><b>附近暫無可播放影像</b><span>只顯示來源可驗證的官方攝影機，不自動替換成其他位置。</span></div>';
      }
      choices.innerHTML = positions.slice(0,8).map((cam, i) => `<button type="button" data-position-camera="${escapeAttr(String(cam.id || i))}"><span>POINT ${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(shortName(cam.name || cam.road || 'OFFICIAL CCTV'))}</b></button>`).join('');
      choices.querySelectorAll('[data-position-camera]').forEach((btn) => btn.addEventListener('click', () => {
        const cam = positions.find((x, i) => String(x.id || i) === btn.dataset.positionCamera);
        if (cam) openCctvPosition(cam);
      }));
      return;
    }

    choices.innerHTML = cameras.map((cam, i) => `<button type="button" data-inline-camera="${escapeAttr(cam.id)}" class="live ${cam.scenic?'scenic':''}"><span>${cam.scenic?'景點':'即時'} ${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(shortName(cam.name || cam.road || '公開攝影機'))}</b></button>`).join('');
    choices.querySelectorAll('[data-inline-camera]').forEach((btn) => btn.addEventListener('click', () => {
      const cam = cameras.find((x) => String(x.id) === btn.dataset.inlineCamera);
      if (cam) selectInlineCamera(cam, cityFlow, { force:true, refreshIntel:true });
    }));

    // Data arrives in several waves. Never tear down a camera that is already playing
    // just because the surrounding registry was enriched in the background.
    const activeKey=String(state.inlineCamera?.id || state.inlineCamera?.streamUrl || '');
    const current=cameras.find((cam)=>String(cam.id || cam.streamUrl || '')===activeKey);
    const activeStage=($('cctvPopup') && !$('cctvPopup').hidden) ? $('cctvPopupStage') : stage;
    if (current && stageHasCameraMedia(activeStage,current)) {
      state.inlineCamera={...state.inlineCamera,...current,_probe:state.inlineCamera?._probe || current._probe,_resolvedPlayback:state.inlineCamera?._resolvedPlayback || current._resolvedPlayback};
      selectInlineCamera(state.inlineCamera, cityFlow, { refreshIntel:false });
      return;
    }

    const selectionToken=`${Date.now()}-${Math.random()}`;
    stage.dataset.selectionToken=selectionToken;
    if (!stage.querySelector('video,img,iframe')) stage.innerHTML = '<div class="camera-loading"><i></i><b>正在選擇攝影機</b><span>檢查附近可播放影像…</span></div>';
    (async () => {
      for (const cam of cameras.slice(0, 6)) {
        if (stage.dataset.selectionToken!==selectionToken) return;
        if (cam.scenic || cam.imageUrl) { selectInlineCamera(cam, cityFlow); return; }
        try {
          const probe = await probeCameraFeed(cam);
          if (stage.dataset.selectionToken!==selectionToken) return;
          if (['hls','image','mjpeg','video'].includes(probe?.kind)) { cam._probe = probe; selectInlineCamera(cam, cityFlow); return; }
        } catch (_) {}
      }
      if (stage.dataset.selectionToken!==selectionToken || stage.querySelector('video,img,iframe')) return;
      $('inlineCameraSignal').textContent = '暫無可播放影像';
      $('inlineCameraMeta').textContent = '附近原始公開影像目前無法播放；不切換第三方參考頁。';
      renderOriginalSourceUnavailable(stage, focus || cameras[0]);
    })();
  }

  function openCamera(cam) {
    lockMapContact({ ...cam, source:cam.source || '公開攝影機' }, 'CCTV', { zoom:14 });
    state.activeCamera = cam;
    if ($('inlineCameraCard')) $('inlineCameraCard').hidden = false;
    selectInlineCamera(cam);
    openIntelResults();
    jumpIntelCard('inlineCameraCard');
  }

  function applyPrivacyShield() {
    [$('cameraStage'), $('wallMain'), $('inlineCameraStage'), $('cctvPopupStage'), $('nationalPreviewStage'), $('navCameraThumb')]
      .filter(Boolean)
      .forEach(syncLocalPrivacyMask);
  }

  function laneLabel(lane, index) {
    const id = lane?.laneId;
    return Number.isFinite(Number(id)) ? `LANE ${Number(id) + 1}` : `LANE ${index + 1}`;
  }

  function tunnelLaneContext(cam, vd) {
    const text = `${cam?.name || ''} ${cam?.road || ''} ${cam?.direction || ''} ${vd?.road || ''} ${vd?.locationType || ''}`;
    const named = text.match(/([\u3400-\u9fff]{1,10}(?:一號|二號|1號|2號)?隧道)/)?.[1] || null;
    if (/隧道|tunnel/i.test(text)) return { active: true, name: named || 'TUNNEL CORRIDOR', snow: /雪山/.test(text) };
    const lat = Number(cam?.lat), lon = Number(cam?.lon);
    const n5Mountain = /國道5|國5/.test(text) && Number.isFinite(lat) && Number.isFinite(lon) && lat >= 24.83 && lat <= 25.02 && lon >= 121.61 && lon <= 121.86;
    if (n5Mountain) return { active: true, name: 'N5 TUNNEL CORRIDOR', snow: lat <= 24.94 && lon >= 121.69 };
    return { active: false, name: null, snow: false };
  }

  function isTunnelLaneContext(cam, vd) { return tunnelLaneContext(cam, vd).active; }

  function renderCameraVisionOverlay(cam, { status='SIGNAL', speed='—', vd=null } = {}) {
    const stages = [$('cameraStage'), $('inlineCameraStage'), $('cctvPopupStage')].filter(Boolean);
    if (!stages.length) return;
    stages.forEach((stage) => stage.querySelector('.vision-fusion')?.remove());
    const stage = stages[0];
    const lanes = (vd?.lanes || []).filter((x) => Number.isFinite(Number(x.speed)) || Number.isFinite(Number(x.occupancy)));
    const best = [...lanes].filter((x) => Number.isFinite(Number(x.probability))).sort((a,b) => Number(b.probability)-Number(a.probability))[0];
    const laneStrip = lanes.slice(0,4).map((lane, i) => {
      const spd = Number.isFinite(Number(lane.speed)) ? `${Math.round(Number(lane.speed))}` : '—';
      const occ = Number.isFinite(Number(lane.occupancy)) ? `${Math.round(Number(lane.occupancy))}%` : '—';
      const prob = Number.isFinite(Number(lane.probability)) ? `${Math.round(Number(lane.probability))}%` : '—';
      const cls = best === lane ? 'best' : '';
      return `<div class="vision-lane ${cls}"><span>${escapeHtml(laneLabel(lane,i))}</span><b>${spd}<small>km/h</small></b><em>占用 ${occ}</em></div>`;
    }).join('');
    const tunnelCtx = tunnelLaneContext(cam, vd);
    const tunnel = tunnelCtx.active;
    const overlay = document.createElement('div');
    overlay.className = 'vision-fusion';
    overlay.innerHTML = `<div class="vision-top"><span>道路資訊</span><b>${escapeHtml(status)}</b><em>${new Date().toLocaleTimeString('zh-TW',{hour12:false})}</em></div>${laneStrip ? `<div class="vision-lanes">${laneStrip}</div>` : ''}<div class="vision-bottom"><span>${escapeHtml(cam?.road || 'CCTV')} ${escapeHtml(cam?.direction || '')}</span><b>${escapeHtml(speed)}</b></div>${tunnel && best ? `<div class="vision-safety">${escapeHtml(tunnelCtx.name || '隧道路段')}：請依現場標誌、標線與速限行駛。</div>` : ''}`;
    stages.forEach((targetStage, i) => targetStage.appendChild(i === 0 ? overlay : overlay.cloneNode(true)));
  }

  function setCameraIntelContent(html = '', hidden = false) {
    [$('cameraIntel'), $('inlineCameraSensor'), $('cctvPopupSensor')].filter(Boolean).forEach((box) => { box.hidden = hidden; box.innerHTML = hidden ? '' : html; });
  }

  async function renderCameraIntel(cam) {
    if (!state.vehicleIntel || !cam) {
      setCameraIntelContent('', true);
      [$('cameraStage'), $('inlineCameraStage'), $('cctvPopupStage')].filter(Boolean).forEach((stage)=>stage.querySelector('.vision-fusion')?.remove());
      return;
    }
    setCameraIntelContent('<b>正在載入道路資訊…</b>', false);
    try {
      const [flowResult, laneResult] = await Promise.allSettled([
        jsonFetch(`/api/data?action=flow&lat=${cam.lat}&lon=${cam.lon}&radius=12`),
        jsonFetch(`/api/data?action=lane-flow&lat=${cam.lat}&lon=${cam.lon}&radius=8`),
      ]);
      const data = flowResult.status === 'fulfilled' ? flowResult.value : { items: [] };
      const laneData = laneResult.status === 'fulfilled' ? laneResult.value : { items: [] };
      const items = data.items || [];
      const avg = Number(data.avgSpeed);
      const nearest = items[0];
      const vd = (laneData.items || [])[0] || null;
      const status = nearest?.congestionLevel || (nearest?.status === 'congested' ? '壅塞' : nearest?.status === 'slow' ? '緩慢' : items.length ? '順暢' : vd ? 'VD SIGNAL' : '無鄰近路況');
      const speedValue = Number.isFinite(avg) ? avg : (Number.isFinite(nearest?.travelSpeed) ? Number(nearest.travelSpeed) : Number(vd?.avgSpeed));
      const speed = Number.isFinite(speedValue) ? `${Math.round(speedValue)} km/h` : '—';
      const lanes = vd?.lanes || [];
      const best = [...lanes].filter((x) => Number.isFinite(Number(x.probability))).sort((a,b) => Number(b.probability)-Number(a.probability))[0];
      const bestText = best ? `${laneLabel(best, lanes.indexOf(best))} · ${Math.round(Number(best.probability))}%` : '資料不足';
      const occupancy = Number.isFinite(Number(vd?.avgOccupancy)) ? `${Math.round(Number(vd.avgOccupancy))}%` : '—';
      const laneHtml = lanes.length ? `<div class="lane-matrix">${lanes.slice(0,4).map((lane,i)=>`<div class="lane-card ${lane===best?'best':''}"><small>${escapeHtml(laneLabel(lane,i))}</small><b>${Number.isFinite(Number(lane.speed))?Math.round(Number(lane.speed)):'—'} <em>km/h</em></b><span>OCC ${Number.isFinite(Number(lane.occupancy))?Math.round(Number(lane.occupancy))+'%':'—'} · FLOW ${Number.isFinite(Number(lane.volume))?Math.round(Number(lane.volume)):'—'}</span><strong>${Number.isFinite(Number(lane.probability))?Math.round(Number(lane.probability))+'%':'—'}</strong></div>`).join('')}</div>` : '';
      const tctx = tunnelLaneContext(cam, vd);
      const safety = tctx.active && best ? `<small class="lane-safety">${escapeHtml(tctx.name || 'TUNNEL APPROACH')}：車道機率為目前速度／占有率／流量推算的短時趨勢，不保證未來速度；進入隧道後請依現場 LCS/CMS、標線與速限行駛${tctx.snow ? '，雪山隧道內禁止變換車道' : ''}。</small>` : '';
      setCameraIntelContent(`<div class="intel-grid four"><div><small>路況</small><b>${escapeHtml(status)}</b></div><div><small>平均速度</small><b>${escapeHtml(speed)}</b></div><div><small>道路占用</small><b>${escapeHtml(occupancy)}</b></div><div><small>較順車道</small><b>${escapeHtml(bestText)}</b></div></div>${laneHtml}${safety}`, false);
      renderCameraVisionOverlay(cam, { status, speed, vd });
    } catch (err) {
      renderCameraVisionOverlay(cam, { status: 'PUBLIC FEED', speed: '—', vd: null });
      setCameraIntelContent('<b>目前沒有可用的車道感測資料</b>', false);
    }
  }

  async function loadTraffic(lat, lon, focus = false, radius = 60, options = {}) {
    const draw = options.draw !== false;
    if (draw) state.incidentLayer.clearLayers();
    $('trafficCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/data?action=traffic&lat=${lat}&lon=${lon}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestTraffic = items;
      if (draw) items.forEach((ev) => {
        if (!Number.isFinite(ev.lat) || !Number.isFinite(ev.lon)) return;
        const marker = L.marker([ev.lat, ev.lon], { icon: markerIcon('incident', 10) }).addTo(state.incidentLayer);
        marker.bindPopup(`<b>${escapeHtml(ev.title || '交通事件')}</b><br>${escapeHtml(ev.road || '')}<br>${escapeHtml(ev.description || '')}`);
        marker.on('click', () => lockMapContact({ ...ev, name:ev.title || ev.road || 'TRAFFIC EVENT' }, 'TRAFFIC EVENT', { zoom:13 }));
      });
      $('trafficCount').textContent = data.degraded ? (items.length ? 'STALE' : '—') : String(items.length);
      if (focus && items.length) state.map.flyTo([items[0].lat, items[0].lon], Math.max(state.map.getZoom(), 12));
      if (!items.length && focus && data.message) toast(data.message, 2600);
      return items;
    } catch (err) {
      $('trafficCount').textContent = state.latestTraffic?.length ? 'STALE' : '—';
      if (focus) toast('事件資料暫時未更新；國道路速與 CCTV 仍可使用。', 3000);
      return state.latestTraffic || [];
    }
  }



  function cityFlowVisual(item = {}) {
    const speed = Number(item.avgSpeed);
    if (!Number.isFinite(speed)) return { color:'#9aa0a6', label:'N/A' };
    if (speed < 20) return { color:'#d86d61', label:'壅塞' };
    if (speed < 35) return { color:'#d59a59', label:'緩慢' };
    if (speed < 50) return { color:'#c7d78d', label:'稍慢' };
    return { color:'#93c7a2', label:'順暢' };
  }

  async function loadCityFlow(lat, lon, focus = false, radius = 6) {
    if (!state.cityFlowLayer) return [];
    state.cityFlowLayer.clearLayers();
    try {
      const data = await jsonFetch(`/api/data?action=city-flow&lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestCityFlow = items;
      items.slice(0,70).forEach((item) => {
        const visual = cityFlowVisual(item);
        const marker = L.circleMarker([item.lat,item.lon], {
          radius: 4.5, color:'#101415', weight:2, fillColor:visual.color, fillOpacity:.92, opacity:.9,
        }).addTo(state.cityFlowLayer);
        const speed = Number.isFinite(Number(item.avgSpeed)) ? `${Math.round(Number(item.avgSpeed))} km/h` : '速度 N/A';
        marker.bindTooltip(`${escapeHtml(shortName(item.road || 'CITY VD'))} · ${speed}`, { direction:'top', opacity:.95 });
        marker.on('click', () => lockMapContact({ ...item, name:item.road || '臺北市道路車流', travelSpeed:item.avgSpeed, source:item.source || '臺北市 VD' }, 'CITY FLOW', { zoom:15 }));
      });
      if (focus && items[0]) state.map.flyTo([items[0].lat,items[0].lon],Math.max(state.map.getZoom(),14));
      return items;
    } catch (_) {
      state.latestCityFlow = [];
      return [];
    }
  }

  function flowVisual(segment = {}) {
    const speed = Number(segment.travelSpeed);
    const status = String(segment.status || '').toLowerCase();
    if (status === 'congested' || (Number.isFinite(speed) && speed < 30)) return { color: '#d86d61', className: 'critical', label: '壅塞', glow: .34 };
    if (status === 'slow' || (Number.isFinite(speed) && speed < 50)) return { color: '#d59a59', className: 'slow', label: '緩慢', glow: .26 };
    if (Number.isFinite(speed) && speed < 70) return { color: '#c7d78d', className: 'moderate', label: '稍慢', glow: .18 };
    return { color: '#93c7a2', className: 'clear', label: '順暢', glow: .16 };
  }

  function flowStyle(segment = {}) {
    const visual = flowVisual(segment);
    return { color: visual.color, weight: visual.className === 'critical' ? 6 : 5, opacity: visual.className === 'clear' ? .72 : .9, lineCap: 'round', lineJoin: 'round' };
  }

  function flowSpeedIcon(segment = {}) {
    const visual = flowVisual(segment);
    const speed = Number(segment.travelSpeed);
    const value = Number.isFinite(speed) ? Math.max(0, Math.round(speed)) : '—';
    return L.divIcon({
      className: 'flow-speed-marker',
      html: `<div class="flow-speed-badge ${visual.className}"><b>${value}</b><span>km/h</span></div>`,
      iconSize: [43, 23],
      iconAnchor: [21, 12],
    });
  }

  function flowLabelPoint(segment = {}) {
    const geometry = Array.isArray(segment.geometry) ? segment.geometry : [];
    if (!geometry.length) return null;
    const point = geometry[Math.floor(geometry.length / 2)];
    if (!Array.isArray(point) || point.length < 2) return null;
    const lat = Number(point[0]);
    const lon = Number(point[1]);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
  }

  async function loadFlow(lat, lon, focus = false, radius = 70) {
    if (!state.flowLayer) return;
    $('flowStatus').textContent = '…';
    try {
      const nationalQuery = (state.nationalMode || state.freewayMode || radius >= 180) ? '&national=1' : '';
      const data = await jsonFetch(`/api/data?action=flow&lat=${lat}&lon=${lon}&radius=${Math.round(radius)}${nationalQuery}`);
      let items = data.items || [];
      state.latestFlowMeta = data;
      // Never erase a visible national network because one refresh temporarily degraded.
      if (!items.length && data.degraded && state.latestFlow?.length) items = state.latestFlow;
      if (items.length) {
        state.flowLayer.clearLayers();
        state.latestFlow = items;
      }
      items.forEach((segment) => {
        if (!Array.isArray(segment.geometry) || segment.geometry.length < 2) return;
        const visual = flowVisual(segment);
        const nationalScale = state.nationalMode || state.map.getZoom() <= 8;
        const freewayScale = Boolean(state.freewayMode);
        L.polyline(segment.geometry, { pane:'flowPane', color: '#050606', weight: freewayScale ? (visual.className === 'critical' ? 13 : 12) : nationalScale ? (visual.className === 'critical' ? 10 : 9) : (visual.className === 'critical' ? 12 : 11), opacity: freewayScale ? .94 : .82, lineCap: 'round', lineJoin: 'round' }).addTo(state.flowLayer);
        const style = flowStyle(segment); style.pane='flowPane'; if (freewayScale) { style.weight = visual.className === 'critical' ? 9 : 8; style.opacity = 1; } else if (nationalScale) style.weight = visual.className === 'critical' ? 7 : 6; else style.weight += 1;
        const line = L.polyline(segment.geometry, style).addTo(state.flowLayer); line.bringToFront?.();
        const speedValue = Number(segment.travelSpeed);
        const speed = Number.isFinite(speedValue) ? `${Math.round(speedValue)} km/h` : '速度未提供';
        const label = segment.congestionLevel || visual.label;
        line.bindPopup(`<b>${escapeHtml(segment.road || segment.name || '國道路段')}</b><br>${escapeHtml(segment.start || '')} → ${escapeHtml(segment.end || '')}<br><span style="color:${visual.color}">● ${escapeHtml(label)}</span> · ${escapeHtml(speed)}`);
        line.on('click', () => lockMapContact({ ...segment, name:segment.road || segment.name || 'FREEWAY FLOW', source:'高速公路局 LiveTraffic' }, 'FLOW SEGMENT', { zoom:12 }));

        // map-first: speed values stay off the map.
        // Click/tap a colored road segment to reveal speed and congestion metadata.
      });
      const avg = Number(data.avgSpeed);
      $('flowStatus').textContent = Number.isFinite(avg) ? `${Math.round(avg)} km/h${data.degraded ? ' · CACHE' : ''}` : (items.length ? `${String(data.status || 'LIVE').toUpperCase()}${data.degraded ? ' · CACHE' : ''}` : (data.degraded ? 'RETRY' : 'N/A'));
      if (focus && items.length) {
        const first = items[0];
        state.map.flyTo([first.lat, first.lon], Math.max(state.map.getZoom(), 11));
      }
      if (!items.length && focus) toast(data.message || '附近沒有可定位的國道即時流速資料。');
      return items;
    } catch (err) {
      $('flowStatus').textContent = state.latestFlow?.length ? 'STALE' : 'OFF';
      if (focus) toast(`國道流速：${err.message}`, 4200);
      return state.latestFlow || [];
    }
  }

  function setSensorMode(mode = 'normal') {
    const allowed = new Set(['normal','nvg','flir','noir','crt','snow']);
    const next = allowed.has(mode) ? mode : 'normal';
    state.sensorMode = next;
    ['normal','nvg','flir','noir','crt','snow'].forEach((m) => $('app').classList.toggle(`sensor-${m}`, m === next));
    document.querySelectorAll('[data-sensor]').forEach((btn) => btn.classList.toggle('active', btn.dataset.sensor === next));
    toast('畫面濾鏡已切換');
  }

  function sourceAvailability(id) {
    if (id === 'traffic') return state.latestTraffic?.length ? 'LIVE' : 'AVAILABLE';
    if (id === 'flow' || id === 'lane') return state.latestFlow?.length ? (id === 'lane' ? 'DERIVED' : 'LIVE') : 'AVAILABLE';
    if (id === 'cctv') return state.latestCctv?.length ? 'LIVE' : 'AVAILABLE';
    if (id === 'speed') return state.latestSpeedCameras?.length ? 'STATIC' : 'AVAILABLE';
    if (id === 'aqi') return state.latestAqi ? 'OBSERVED' : 'AVAILABLE';
    if (id === 'flood') return state.latestFlood?.length ? 'LIVE' : 'AVAILABLE';
    if (id === 'parking') return state.latestParking?.length ? 'LIVE' : 'REGIONAL';
    if (id === 'construction') return state.latestConstruction?.length ? 'LIVE' : 'REGIONAL';
    if (id === 'air') return state.latestFlights?.length ? 'LIVE' : 'AVAILABLE';
    if (id === 'quake') return state.latestQuakes?.length ? 'LIVE' : 'AVAILABLE';
    if (id === 'news') return state.latestNews?.length ? 'LIVE' : 'AVAILABLE';
    return null;
  }

  function renderSourceMatrix() {
    const box = $('sourceMatrix');
    if (!box) return;
    if ($('sourceCount')) $('sourceCount').textContent = String(SOURCE_CATALOG.length);
    box.innerHTML = SOURCE_CATALOG.map((row) => {
      const runtime = sourceAvailability(row.id);
      const mode = runtime === 'REGIONAL' ? 'STATIC' : (runtime || row.mode);
      const cls = mode === 'LIVE' ? 'live' : mode === 'OBSERVED' ? 'observed' : mode === 'DERIVED' ? 'derived' : mode === 'MODEL' ? 'model' : mode === 'ESTIMATED' ? 'estimated' : mode === 'VISUAL' ? 'visual' : mode === 'SIMULATED' ? 'simulated' : mode === 'UNAVAILABLE' ? 'unavailable' : 'static';
      const status = runtime === 'REGIONAL' ? 'REGIONAL' : mode;
      return `<div class="source-row"><b>${escapeHtml(row.name)}</b><span>${escapeHtml(row.source)}<em>${escapeHtml(row.note)}</em></span><i class="source-state ${cls}">${escapeHtml(status)}</i></div>`;
    }).join('');
  }

  function openSourceStatus() {
    renderSourceMatrix();
    openOverlayPanel('sourceDrawer');
  }

  function addAnnotation(label = 'MARK', point = null) {
    if (!state.annotationLayer) return;
    const c = point || state.target || state.user || state.map?.getCenter?.();
    const lat = Number(c?.lat), lon = Number(c?.lon ?? c?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const text = String(label || 'MARK').trim().slice(0, 32) || 'MARK';
    const icon = L.divIcon({ className:'annotation-marker', html:'<div class="annotation-dot"></div>', iconSize:[12,12], iconAnchor:[6,6] });
    const marker = L.marker([lat,lon], { icon, zIndexOffset:780 }).addTo(state.annotationLayer);
    marker.bindTooltip(`<span class="annotation-label">${escapeHtml(text)}</span>`, { permanent:true, direction:'right', offset:[8,0], className:'' });
    state.annotations.push({ lat, lon, label:text, marker });
    toast(`VOICE MARKUP // ${text}`);
  }

  function clearAnnotations() {
    state.annotationLayer?.clearLayers?.();
    state.annotations = [];
    toast('VOICE MARKUP // CLEARED');
  }

  function updateTrackHud(contact = {}, type = 'CONTACT') {
    if (!$('trackHud')) return;
    $('trackHud').hidden = false;
    openIntelResults();
    $('trackName').textContent = shortName(contact.callsign || contact.name || contact.title || contact.road || 'PUBLIC CONTACT');
    $('trackType').textContent = String(type || 'PUBLIC SIGNAL').toUpperCase();
    const alt = Number(contact.altitude);
    const dep = Number(contact.depth);
    $('trackAltitude').textContent = Number.isFinite(alt) ? `${Math.round(alt)} ft` : Number.isFinite(dep) ? `${Math.round(dep)} km` : '—';
    const speed = Number(contact.groundSpeed ?? contact.travelSpeed);
    $('trackSpeed').textContent = Number.isFinite(speed) ? `${Math.round(speed)} ${type === 'AIRCRAFT' ? 'kt' : 'km/h'}` : '—';
    $('trackHeading').textContent = Number.isFinite(Number(contact.heading)) ? `HDG ${Math.round(Number(contact.heading))}°` : (contact.direction || 'HDG —');
    $('trackSource').textContent = String(contact.source || 'PUBLIC DATA').slice(0,42);
    $('trackStatus').querySelector('b').textContent = state.cockpitActive ? 'COCKPIT FOLLOW' : 'TARGET ACQUIRED';
    $('trackStatus').querySelector('em').textContent = type === 'AIRCRAFT' ? 'LIVE ADS-B' : 'PUBLIC DATA LOCK';
    const details = $('trackDetails');
    if (details) {
      const fields = [
        ['ID', contact.callsign || contact.id || contact.icao24 || contact.name || '—'],
        ['POSITION', Number.isFinite(Number(contact.lat)) && Number.isFinite(Number(contact.lon)) ? `${Number(contact.lat).toFixed(4)}, ${Number(contact.lon).toFixed(4)}` : '—'],
        ['SOURCE', contact.source || (type === 'AIRCRAFT' ? 'ADSB.lol' : 'PUBLIC DATA')],
        ['STATE', type === 'AIRCRAFT' ? 'LIVE / REFRESH ~8S' : type.includes('FLOW') ? 'LIVE / OFFICIAL FLOW' : 'PUBLIC SIGNAL'],
      ];
      details.innerHTML = fields.map(([k,v]) => `<div><small>${escapeHtml(k)}</small><b>${escapeHtml(String(v).slice(0,64))}</b></div>`).join('');
    }
  }

  function drawTrackedTrail() {
    state.trackTrailLayer?.clearLayers?.();
    const pts = state.trackedContact?.trail || [];
    if (pts.length < 2) return;
    for (let i = 1; i < pts.length; i++) {
      const age = i / Math.max(1, pts.length - 1);
      L.polyline([[pts[i-1].lat,pts[i-1].lon],[pts[i].lat,pts[i].lon]], { color:'#d7bd72', weight:2, opacity:.12 + age*.58, dashArray:'5 8', className:'contact-trail' }).addTo(state.trackTrailLayer);
    }
  }

  function stopTracking(announce = true) {
    if (state.trackedContact?.timer) clearInterval(state.trackedContact.timer);
    state.trackedContact = null;
    state.cockpitActive = false;
    closeCockpit3d(false);
    $('app')?.classList.remove('cockpit-active');
    if ($('trackHud')) $('trackHud').hidden = true;
    state.trackTrailLayer?.clearLayers?.();
    if (announce) toast('CONTACT RELEASED');
  }

  async function refreshTrackedAircraft() {
    const tracked = state.trackedContact;
    if (!tracked || tracked.type !== 'AIRCRAFT') return;
    try {
      const c = tracked.entity;
      const data = await jsonFetch(`/api/data?action=flights&lat=${Number(c.lat).toFixed(5)}&lon=${Number(c.lon).toFixed(5)}&radius=160`);
      const next = (data.items || []).find((x) => String(x.id) === String(tracked.id));
      if (!next) {
        $('trackStatus').querySelector('b').textContent = 'SIGNAL TEMPORARILY LOST';
        $('trackStatus').querySelector('em').textContent = 'ADS-B CONTACT STALE';
        return;
      }
      tracked.entity = next;
      tracked.trail.push({ lat:next.lat, lon:next.lon, t:Date.now() });
      tracked.trail = tracked.trail.slice(-30);
      updateTrackHud(next, 'AIRCRAFT');
      showTargetLock({ name:next.callsign || 'AIR CONTACT', lat:next.lat, lon:next.lon });
      drawTrackedTrail();
      if (state.cockpitActive) {
        state.map?.setView?.([next.lat,next.lon], Math.max(state.map.getZoom(),14), { animate:true });
        updateCockpit3d(next);
      }
    } catch (_) {
      if ($('trackStatus')) { $('trackStatus').querySelector('b').textContent = 'LINK DEGRADED'; $('trackStatus').querySelector('em').textContent = 'RETRYING'; }
    }
  }

  function lockMapContact(entity = {}, type = 'CONTACT', options = {}) {
    const lat = Number(entity.lat), lon = Number(entity.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (state.trackedContact?.timer) clearInterval(state.trackedContact.timer);
    const tracked = { id:String(entity.id || `${type}-${lat}-${lon}`), type, entity:{...entity}, trail:[{lat,lon,t:Date.now()}], timer:null };
    state.trackedContact = tracked;
    showTargetLock({ name:entity.callsign || entity.name || entity.title || entity.road || type, lat, lon });
    updateTrackHud(entity, type);
    if (options.followMap !== false) moveMapTo(lat, lon, Math.max(state.map.getZoom(), options.zoom || (type === 'AIRCRAFT' ? 11 : 13)), { force:Boolean(options.forceMap), duration:state.motion ? .7 : .25 });
    if (type === 'AIRCRAFT') tracked.timer = setInterval(refreshTrackedAircraft, 8000);
  }

  function loadExternalAsset(url, type = 'script') {
    return new Promise((resolve, reject) => {
      const attr = type === 'style' ? 'href' : 'src';
      const existing = [...document.querySelectorAll(type === 'style' ? 'link[rel="stylesheet"]' : 'script')].find((el) => el[attr] === url);
      if (existing) { if (type === 'script' && window.Cesium) return resolve(); existing.addEventListener('load', resolve, { once:true }); existing.addEventListener('error', reject, { once:true }); return; }
      const el = type === 'style' ? document.createElement('link') : document.createElement('script');
      if (type === 'style') { el.rel = 'stylesheet'; el.href = url; } else { el.src = url; el.async = true; }
      el.addEventListener('load', resolve, { once:true }); el.addEventListener('error', () => reject(new Error('3D engine unavailable')), { once:true });
      document.head.appendChild(el);
    });
  }

  async function ensureCesium() {
    if (window.Cesium) return window.Cesium;
    if (state.cesium.loadPromise) return state.cesium.loadPromise;
    state.cesium.loadPromise = (async () => {
      const version = '1.124.0';
      window.CESIUM_BASE_URL = `https://unpkg.com/cesium@${version}/Build/Cesium/`;
      await loadExternalAsset(`https://unpkg.com/cesium@${version}/Build/Cesium/Widgets/widgets.css`, 'style');
      await loadExternalAsset(`https://unpkg.com/cesium@${version}/Build/Cesium/Cesium.js`, 'script');
      if (!window.Cesium) throw new Error('Cesium did not initialize');
      return window.Cesium;
    })().catch((err) => { state.cesium.loadPromise = null; throw err; });
    return state.cesium.loadPromise;
  }

  function syncCockpitImagery(Cesium) {
    const viewer = state.cesium.viewer;
    if (!viewer || !Cesium) return;
    if (viewer._eyeMapSource === state.mapSource && viewer.imageryLayers.length) return;
    try { viewer.imageryLayers.removeAll(); } catch (_) {}
    const satellite = state.mapSource === 'satellite';
    viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: satellite
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      credit: satellite ? 'Esri World Imagery' : '© OpenStreetMap contributors',
      maximumLevel:19,
    }));
    viewer._eyeMapSource = state.mapSource;
  }

  async function openCockpit3d(contact = null) {
    const ac = contact || state.trackedContact?.entity;
    if (!ac || state.trackedContact?.type !== 'AIRCRAFT') return;
    const stage = $('cockpit3d');
    if (!stage) return;
    stage.hidden = false;
    $('cockpit3dMeta').textContent = 'LOADING ZERO-KEY 3D…';
    try {
      const Cesium = await ensureCesium();
      if (!state.cesium.viewer) {
        const viewer = new Cesium.Viewer('cesiumCockpitCanvas', {
          animation:false, timeline:false, baseLayerPicker:false, baseLayer:false, geocoder:false,
          homeButton:false, sceneModePicker:false, navigationHelpButton:false, fullscreenButton:false,
          infoBox:false, selectionIndicator:false, terrainProvider:new Cesium.EllipsoidTerrainProvider(),
          scene3DOnly:true, requestRenderMode:false,
        });
        viewer.scene.globe.depthTestAgainstTerrain = false;
        state.cesium.viewer = viewer;
        state.cesium.entity = viewer.entities.add({
          id:'tracked-aircraft',
          position:Cesium.Cartesian3.fromDegrees(Number(ac.lon), Number(ac.lat), Math.max(300, Number(ac.altitude || 0) * .3048)),
          point:{ pixelSize:8, color:Cesium.Color.fromCssColorString('#e1c777'), outlineColor:Cesium.Color.BLACK, outlineWidth:2 },
          label:{ text:String(ac.callsign || 'AIR CONTACT').trim(), font:'12px monospace', fillColor:Cesium.Color.fromCssColorString('#eadcae'), pixelOffset:new Cesium.Cartesian2(0,-18), showBackground:true, backgroundColor:Cesium.Color.fromCssColorString('#070909').withAlpha(.72) },
        });
      }
      syncCockpitImagery(Cesium);
      $('cockpit3dMeta').textContent = `${state.mapSource === 'satellite' ? 'ESRI IMAGERY' : 'OSM'} · ELLIPSOID · DERIVED VISUAL`;
      updateCockpit3d(ac);
    } catch (err) {
      stage.hidden = true;
      $('trackStatus').querySelector('em').textContent = '3D UNAVAILABLE · 2D FOLLOW ACTIVE';
      toast('3D Cockpit 載入失敗，已保留 2D 跟隨。');
    }
  }

  function updateCockpit3d(ac = null) {
    const viewer = state.cesium.viewer;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium || !ac) return;
    const lat = Number(ac.lat), lon = Number(ac.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const altitudeM = Math.max(300, Number(ac.altitude || 0) * .3048);
    const headingDeg = Number.isFinite(Number(ac.heading)) ? Number(ac.heading) : 0;
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, altitudeM);
    if (state.cesium.entity) state.cesium.entity.position = position;
    if (state.cesium.entity?.label) state.cesium.entity.label.text = String(ac.callsign || 'AIR CONTACT').trim();
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    const range = Math.max(1800, Math.min(8000, altitudeM * .32));
    viewer.camera.lookAtTransform(transform, new Cesium.HeadingPitchRange(Cesium.Math.toRadians((headingDeg + 180) % 360), Cesium.Math.toRadians(-12), range));
    $('cockpit3dName').textContent = String(ac.callsign || 'AIR CONTACT').trim() || 'AIR CONTACT';
    $('cockpit3dSpeed').textContent = Number.isFinite(Number(ac.groundSpeed)) ? `SPD ${Math.round(Number(ac.groundSpeed))} kt` : 'SPD —';
    $('cockpit3dAlt').textContent = Number.isFinite(Number(ac.altitude)) ? `ALT ${Math.round(Number(ac.altitude))} ft` : 'ALT —';
    $('cockpit3dHeading').textContent = `HDG ${Math.round(headingDeg)}°`;
  }

  function closeCockpit3d(announce = false) {
    const stage = $('cockpit3d');
    if (stage) stage.hidden = true;
    if (announce) toast('3D COCKPIT // EXIT');
  }

  async function enter3dCockpit() {
    return openCockpit3d(state.trackedContact?.entity || null);
  }

  async function toggleCockpitMode(force = null) {
    const tracked = state.trackedContact;
    if (!tracked || tracked.type !== 'AIRCRAFT') return toast('請先點擊一個公開航空訊號，再啟用 COCKPIT。');
    state.cockpitActive = force == null ? !state.cockpitActive : Boolean(force);
    $('app')?.classList.toggle('cockpit-active', state.cockpitActive);
    $('cockpitToggleBtn').textContent = state.cockpitActive ? 'COCKPIT ON' : 'COCKPIT 3D';
    updateTrackHud(tracked.entity, tracked.type);
    if (state.cockpitActive) {
      state.map?.setView?.([tracked.entity.lat,tracked.entity.lon], Math.max(state.map.getZoom(),14), { animate:true });
      enter3dCockpit();
      speak(`已進入座艙追蹤，${tracked.entity.callsign || '航空目標'}。`, true);
    } else closeCockpit3d(true);
  }

  async function addVoiceRouteAnnotation(targetText = '') {
    const text = String(targetText || '').trim();
    if (!text) return false;
    const start = state.target || state.user || state.map?.getCenter?.();
    if (!start) return false;
    const data = await jsonFetch(`/api/data?action=geocode&q=${encodeURIComponent(text)}`);
    const target = Array.isArray(data?.results) ? data.results[0] : (Array.isArray(data?.items) ? data.items[0] : (Array.isArray(data) ? data[0] : data));
    const lat = Number(target?.lat), lon = Number(target?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { toast('VOICE MARKUP // 找不到標註目標'); return true; }
    const slat = Number(start.lat), slon = Number(start.lon ?? start.lng);
    L.polyline([[slat,slon],[lat,lon]], { color:'#d8bd72', weight:2, opacity:.78, dashArray:'7 8' }).addTo(state.annotationLayer);
    addAnnotation(`VOICE ROUTE → ${shortName(target.name || text)}`, { lat, lon });
    toast(`VOICE ROUTE // ${shortName(target.name || text)}`);
    return true;
  }

  function addVoiceRadiusAnnotation(km = 1) {
    const c = state.target || state.user || state.map?.getCenter?.();
    const lat = Number(c?.lat), lon = Number(c?.lon ?? c?.lng);
    const radiusKm = Math.max(.1, Math.min(50, Number(km) || 1));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !state.annotationLayer) return false;
    L.circle([lat,lon], { radius:radiusKm*1000, color:'#d8bd72', weight:1, opacity:.76, fillColor:'#c8aa58', fillOpacity:.035, dashArray:'6 8' }).addTo(state.annotationLayer);
    addAnnotation(`${radiusKm} KM ZONE`, { lat, lon });
    toast(`VOICE ZONE // ${radiusKm} km`);
    return true;
  }

  async function handleVoiceMarkupCommand(transcript = '') {
    if (!state.voiceMarkup) return false;
    const text = String(transcript || '').trim();
    if (!text) return false;
    if (/^(?:清除|刪除)(?:所有)?標(?:註|記)/.test(text)) { clearAnnotations(); return true; }
    const mark = text.match(/(?:標記這裡|在這裡標記|標註這裡)(?:為|成)?\s*(.*)$/);
    if (mark) { addAnnotation(mark[1] || 'VOICE MARK'); return true; }
    const routeMark = text.match(/(?:畫|標註)(?:一條)?(?:線|路線)(?:到|去)\s*(.+)$/);
    if (routeMark) return await addVoiceRouteAnnotation(routeMark[1]);
    const radiusMark = text.match(/(?:圈出|畫圓|標註)(?:這裡|目前位置|目標)?\s*(\d+(?:\.\d+)?)\s*(?:公里|km)/i);
    if (radiusMark) { addVoiceRadiusAnnotation(Number(radiusMark[1])); return true; }
    if (/切換?(?:到)?夜視|開啟夜視/.test(text)) { setSensorMode('nvg'); return true; }
    if (/熱成像|熱影像|flir/i.test(text)) { setSensorMode('flir'); return true; }
    if (/crt|映像管/i.test(text)) { setSensorMode('crt'); return true; }
    if (/黑白|noir/i.test(text)) { setSensorMode('noir'); return true; }
    if (/雪地|snow/i.test(text)) { setSensorMode('snow'); return true; }
    if (/恢復正常|正常視角|關閉濾鏡/.test(text)) { setSensorMode('normal'); return true; }
    if (/停止追蹤|解除鎖定/.test(text)) { stopTracking(true); return true; }
    if (/追蹤最近(?:航班|飛機)|最近(?:航班|飛機)/.test(text)) {
      const c = state.target || state.user || state.map?.getCenter?.();
      if (!c) return true;
      const items = await loadFlights(c.lat, c.lon ?? c.lng, false, 160);
      if (items?.[0]) lockMapContact(items[0], 'AIRCRAFT'); else toast('附近目前沒有取得公開 ADS-B 航空訊號。');
      return true;
    }
    if (/座艙|cockpit/i.test(text) && /開|進入|追蹤/.test(text)) { toggleCockpitMode(true); return true; }
    if (/1968|國道(?:路況|車流)|高速公路(?:路況|車流)/i.test(text)) { await setFreewayMode(true); return true; }
    if (/全台(?:總覽|戰情)|回到台灣/.test(text)) { await bootstrapDefaultCenter(); return true; }
    return false;
  }

  async function shareCurrentView() {
    const c = state.target || state.user || state.map?.getCenter?.();
    if (!c) return;
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('view', 'shared');
    url.searchParams.set('lat', Number(c.lat).toFixed(5));
    url.searchParams.set('lon', Number(c.lon ?? c.lng).toFixed(5));
    url.searchParams.set('name', String(c.name || 'SHARED TARGET').slice(0,70));
    url.searchParams.set('sensor', state.sensorMode || 'normal');
    url.searchParams.set('map', state.mapSource || 'tactical');
    try {
      await navigator.clipboard.writeText(url.toString());
      toast('戰情連結已複製');
    } catch (_) {
      prompt('複製戰情連結', url.toString());
    }
  }

  function restoreSharedView() {
    const q = new URLSearchParams(location.search);
    if (q.get('view') !== 'shared') return false;
    const lat = Number(q.get('lat')), lon = Number(q.get('lon'));
    const sensor = q.get('sensor');
    const mapSource = q.get('map');
    if (mapSource) setMapSource(mapSource, false);
    if (sensor) setSensorMode(sensor);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const place = { lat, lon, name: q.get('name') || 'SHARED TARGET' };
      setTimeout(() => lockTarget(place, 14).catch(() => {}), 350);
      return true;
    }
    return false;
  }

  function startVoice() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      toast('此瀏覽器未提供語音辨識，請改用文字輸入。');
      $('queryInput').focus();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'zh-TW';
    recognition.interimResults = true;
    recognition.continuous = false;
    $('voiceBtn').classList.add('listening');
    $('voiceTranscript').hidden = false;
    $('voiceTranscript').textContent = 'LISTENING…';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      $('voiceTranscript').textContent = transcript;
      $('queryInput').value = transcript;
      const last = event.results[event.results.length - 1];
      if (last.isFinal) handleVoiceMarkupCommand(transcript).then((handled) => { if (!handled) return handleSearch(transcript, { fromVoice: true }); }).catch((err) => toast(err.message));
    };
    recognition.onerror = () => toast('語音辨識中斷，請再試一次。');
    recognition.onend = () => $('voiceBtn').classList.remove('listening');
    recognition.start();
  }

  function bindUi() {
    window.addEventListener('resize', debounce(() => layoutTargetCctvPreviews(), 120));
    const motionBtn = $('motionToggle');
    if (motionBtn && !state.motion) { motionBtn.classList.remove('active'); motionBtn.setAttribute('aria-pressed', 'false'); $('app').classList.add('motion-off'); }
    $('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSearch($('queryInput').value).catch((err) => toast(err.message, 4200));
    });
    $('searchLocateBtn')?.addEventListener('click', () => monitorMyLocation().catch((err) => toast(`定位失敗：${err.message}`, 4200)));
    document.querySelectorAll('[data-search-mode]').forEach((btn) => btn.addEventListener('click', () => setSearchMode(btn.dataset.searchMode, { focus:true })));
    setSearchMode(state.searchMode || 'monitor', { focus:false });
    $('queryInput').addEventListener('input', (e) => renderPoiSuggestions(e.target.value));
    $('queryInput').addEventListener('focus', (e) => renderPoiSuggestions(e.target.value));
    $('queryInput').addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('poiSuggestions')) $('poiSuggestions').hidden = true; });
    document.addEventListener('click', (e) => { if (!e.target.closest?.('.search-row') && !e.target.closest?.('#poiSuggestions') && $('poiSuggestions')) $('poiSuggestions').hidden = true; });
    $('voiceBtn').addEventListener('click', startVoice);
    $('originChip')?.addEventListener('click', () => toggleOriginMode());
    $('planRouteBtn').addEventListener('click', () => planRoute());
    $('startNavBtn').addEventListener('click', () => startNavigation());
    $('watchZoneBtn')?.addEventListener('click', toggleWatchZone);
    $('nationalResetBtn')?.addEventListener('click', () => bootstrapDefaultCenter().catch((err)=>toast(err.message,4200)));
    $('freewayModeBtn')?.addEventListener('click', () => setFreewayMode(!state.freewayMode).catch((err)=>toast(`國道路況：${err.message}`,4200)));
    $('brandHome')?.addEventListener('click', () => bootstrapDefaultCenter().catch((err)=>toast(err.message,4200)));
    $('brandHome')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bootstrapDefaultCenter().catch((err)=>toast(err.message,4200)); } });
    $('stopNavBtn').addEventListener('click', () => stopNavigation(true));
    $('navViewBtn')?.addEventListener('click', () => {
      setNavigationViewMode(state.navigation.viewMode === 'immersive' ? 'map' : 'immersive');
      tactile(8);
    });
    $('openSettings').addEventListener('click', () => { tactile(8); openOverlayPanel('settingsPanel'); });
    $('abRouteBtn')?.addEventListener('click', async () => {
      setSearchMode('nav', { focus:false });
      const a = $('abOrigin')?.value?.trim() || '台北 101';
      const b = $('abTarget')?.value?.trim();
      if (!b) { toast('請輸入 B 點目的地'); $('abTarget')?.focus(); return; }
      await planRoute(a, b, { preference: 'recommended' });
      openIntelResults();
    });
    $('abSwap')?.addEventListener('click', async () => {
      const a = $('abOrigin')?.value?.trim() || '台北 101';
      const b = $('abTarget')?.value?.trim();
      if (!b) return;
      $('abOrigin').value = b; $('abTarget').value = a;
      await planRoute(b, a, { preference: 'recommended' });
      openIntelResults();
    });
    $('abTarget')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('abRouteBtn')?.click(); } });

    $('mapFocusBtn')?.addEventListener('click', () => {
      const active = !$('app').classList.contains('map-focus');
      $('app').classList.toggle('map-focus', active);
      $('mapFocusBtn').textContent = active ? 'EXIT FOCUS' : 'MAP FOCUS';
      tactile(6);
    });
    $('nationalCompactBtn')?.addEventListener('click', () => {
      const panel = $('nationalOverview');
      if (!panel) return;
      const compact = !panel.classList.contains('compact');
      panel.classList.toggle('compact', compact);
      $('nationalCompactBtn').textContent = compact ? '+' : '−';
      tactile(6);
    });
    $('shareBtn')?.addEventListener('click', shareCurrentView);
    $('threatDismiss')?.addEventListener('click', () => { $('threatAlert').hidden = true; $('app').classList.remove('condition-red'); });
    $('threatCompare')?.addEventListener('click', () => { $('threatAlert').hidden = true; $('app').classList.remove('condition-red'); state.intelOpen = true; $('intelPanel').classList.add('open'); $('intelCollapse').textContent = '−'; $('routeCard')?.scrollIntoView?.({ behavior: state.motion ? 'smooth' : 'auto', block: 'center' }); });
    document.querySelectorAll('[data-sensor]').forEach((btn) => btn.addEventListener('click', () => setSensorMode(btn.dataset.sensor)));
    document.querySelectorAll('[data-map-source]').forEach((btn) => btn.addEventListener('click', () => setMapSource(btn.dataset.mapSource))); 
    document.querySelectorAll('[data-layer-toggle]').forEach((btn) => btn.addEventListener('click', () => { const key=btn.dataset.layerToggle; setOverlayVisibility(key, !state.overlayVisibility[key]); }));
    document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => $(btn.dataset.close).hidden = true));
    document.querySelectorAll('[data-intel-jump]').forEach((btn) => btn.addEventListener('click', () => { tactile(6); jumpIntelCard(btn.dataset.intelJump); }));
    document.querySelectorAll('.ops-rail [data-rail]').forEach((btn) => btn.addEventListener('click', async () => {
      tactile(8);
      const key = btn.dataset.rail;
      setRailActive(key);
      if (key === 'overview') return bootstrapDefaultCenter().catch((err) => toast(err.message, 4200));
      if (key === 'environment') return jumpIntelCard('situationCard');
      if (key === 'tools') { openOverlayPanel('settingsPanel'); return; }
    }));
    document.querySelectorAll('.ops-rail [data-command]').forEach((btn) => btn.addEventListener('click', () => setRailActive(btn.dataset.command)));
    document.querySelectorAll('.ops-rail [data-mission]').forEach((btn) => btn.addEventListener('click', () => setRailActive(btn.dataset.mission)));
    document.querySelectorAll('[data-command]').forEach((btn) => btn.addEventListener('click', () => { tactile(8); runCommand(btn.dataset.command); }));
    document.querySelectorAll('[data-mission]').forEach((btn) => btn.addEventListener('click', () => { tactile(10); runMissionMode(btn.dataset.mission); }));
    $('intelCollapse').addEventListener('click', toggleIntel);
    $('intelPanel').querySelector('.panel-head').addEventListener('click', (e) => { if (window.innerWidth <= 920 && e.target.id !== 'intelCollapse') toggleIntel(); });
    $('cameraSignal').addEventListener('click', () => runCommand('cctv'));
    $('inlineCameraExpand')?.addEventListener('click', () => openCctvPopup());
    $('inlineCameraStage')?.addEventListener('dblclick', () => openCctvPopup());
    $('cctvPopupClose')?.addEventListener('click', closeCctvPopup);
    $('cctvPopupAnalyze')?.addEventListener('click', toggleCameraLiveAnalysis);
    bindCctvPopupDrag();
    $('cameraAnalyzeBtn')?.addEventListener('click', toggleCameraLiveAnalysis);
    $('cameraAnprBtn')?.addEventListener('click', toggleAuthorizedAnpr);
    $('cctvPopupAnpr')?.addEventListener('click', toggleAuthorizedAnpr);
    $('visionLabClose')?.addEventListener('click', () => stopCameraLiveAnalysis({ collapse:true }));
    document.addEventListener('click', (e) => {
      const more = e.target.closest?.('[data-news-more]');
      if (!more) return;
      const host = more.closest('.auto-feed, .news-list, #autoNewsFeed') || more.parentElement;
      const expanded = !host.classList.contains('expanded');
      host.classList.toggle('expanded', expanded);
      more.textContent = expanded ? '收合新聞' : '看更多';
    });
    $('newsSignal').addEventListener('click', () => runCommand('news'));
    $('speedSignal').addEventListener('click', () => runCommand('speed'));
    $('trafficSignal').addEventListener('click', () => runCommand('traffic'));
    $('flowSignal').addEventListener('click', () => runCommand('traffic'));
    $('airSignal')?.addEventListener('click', () => { const c = getOpsCenter(); loadFlights(c.lat, c.lon, true, 160); });
    $('quakeSignal')?.addEventListener('click', () => { const c = getOpsCenter(); loadEarthquakes(c.lat, c.lon, true, 420); });
    $('sourceSignal').addEventListener('click', openSourceStatus);
    $('exitCockpit3d')?.addEventListener('click', () => toggleCockpitMode(false)); 
    $('provenanceRibbon')?.addEventListener('click', openSourceStatus);
    bindToggle('motionToggle', (active) => { state.motion = active; $('app').classList.toggle('motion-off', !active); toast(active ? '動態情報介面已啟用' : '動態情報介面已關閉'); });
    bindToggle('mapFxToggle', (active) => { state.mapFx = active; $('map').classList.toggle('map-fx', active); });
    bindToggle('weatherAutoToggle', (active) => { state.weatherAuto = active; });
    bindToggle('speechToggle', (active) => { state.speech = active; if (active) speak('語音回饋已啟用'); });
    bindToggle('vehicleIntelToggle', (active) => { state.vehicleIntel = active; if (state.activeCamera) renderCameraIntel(state.activeCamera); toast(active ? '交通情報輔助已啟用；不進行車牌辨識' : '交通情報輔助已關閉'); });
    bindToggle('speedAlertToggle', (active) => { state.speedAlerts = active; setOverlayVisibility('speed', Boolean(active && state.navigation.active), false); toast(active ? '公開測速點警示已啟用；只會在實際導航中顯示' : '公開測速點警示已關閉'); });
    bindToggle('cameraHandoffToggle', (active) => { state.cameraHandoff = active; if (!active) $('navCameraHandoff').hidden = true; toast(active ? 'CCTV 自動接管已啟用' : 'CCTV 自動接管已關閉'); });
    bindToggle('transferFxToggle', (active) => { state.transferFx = active; toast(active ? '戰術地點轉場已啟用' : '戰術地點轉場已關閉'); });
    bindToggle('privacyShieldToggle', (active) => { state.privacyShield = active; applyPrivacyShield(); toast(active ? 'CCTV 隱私遮罩已啟用' : 'CCTV 隱私遮罩已關閉；仍不進行車牌辨識'); });
    bindToggle('detectionToggle', (active) => { state.detectionOverlay = active; $('app').classList.toggle('detection-on', active); toast(active ? 'DETECTION OVERLAY // ON' : 'DETECTION OVERLAY // OFF'); });
    bindToggle('voiceMarkupToggle', (active) => { state.voiceMarkup = active; toast(active ? 'VOICE MARKUP // ON' : 'VOICE MARKUP // OFF'); });
    $('cockpitToggleBtn')?.addEventListener('click', () => toggleCockpitMode());
    $('stopTrackBtn')?.addEventListener('click', () => stopTracking(true));
    $('exitCockpit3d')?.addEventListener('click', () => toggleCockpitMode(false));
    document.addEventListener('keydown', (e) => { if (/INPUT|TEXTAREA/.test(e.target?.tagName || '')) return; const map={1:'normal',2:'crt',3:'nvg',4:'flir',5:'noir',6:'snow'}; if(map[e.key]) setSensorMode(map[e.key]); else if(e.key.toLowerCase()==='d'){ const b=$('detectionToggle'); b?.click(); } else if(e.key.toLowerCase()==='c') toggleCockpitMode(); else if(e.key==='Escape' && $('cctvPopup') && !$('cctvPopup').hidden) closeCctvPopup(); else if(e.key==='Escape' && state.trackedContact) stopTracking(false); });
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.deferredInstall = e; $('installBtn').hidden = false; });
    $('installBtn').addEventListener('click', async () => { if (!state.deferredInstall) return; state.deferredInstall.prompt(); await state.deferredInstall.userChoice; state.deferredInstall = null; $('installBtn').hidden = true; });
    window.addEventListener('online', updateNetworkState); window.addEventListener('offline', updateNetworkState);
    window.addEventListener('pagehide', () => { if (state.navigation.active) stopNavigation(false); if (state.trackedContact) stopTracking(false); if (state.locationWatchId != null && navigator.geolocation) { navigator.geolocation.clearWatch(state.locationWatchId); state.locationWatchId = null; } stopCameraLiveAnalysis({ collapse:false }); closeCctvPopup(); });
  }

  function bindToggle(id, onChange) {
    const btn = $(id);
    btn.addEventListener('click', () => {
      const active = !btn.classList.contains('active');
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
      onChange(active);
    });
  }

  async function runCommand(command) {
    try {
      if (command === 'locate') return await locateUser({ center:true, follow:true });
      if (command === 'voice') return startVoice();
      if (command === 'search') return $('queryInput').focus();
      if (command === 'route') {
        if (!state.target || state.target.bootstrap) { $('queryInput').focus(); return toast('輸入目的地即可自動建立點到點路線'); }
        const origin = await preferredOrigin();
        return await planRoute(origin, state.target, { preference: 'recommended' });
      }
      if (command === 'weather') { const c = state.target || state.user || state.map.getCenter(); const r = await loadWeather(c.lat, c.lon ?? c.lng, true); jumpIntelCard('weatherCard'); return r; }
      if (command === 'cctv') { if (state.nationalMode) { const r = await loadCctv(NATIONAL_CENTER.lat, NATIONAL_CENTER.lon, false, 420, { national:true }); renderNationalOverview({ flow:state.latestFlow, traffic:state.latestTraffic, cctv:r||[] }); return r; } const c = state.target || state.user || state.map.getCenter(); const place = { ...c, lon:c.lon ?? c.lng, name:c.name || state.target?.name || '目前地圖位置' }; const r = await loadCctv(place.lat, place.lon, false, 35, { query:place.name || '' }); renderCctvMapMarkers(r || []); renderTargetCctvPreviews(place, r || []); renderInlineCctvResults(r || [], place, state.latestCityFlow || []); toast('附近 CCTV 已在地圖展開；點任一畫面可放大'); return r; }
      if (command === 'intel') { if (state.intelOpen) collapseIntelResults(); else openIntelResults(); return; }
      if (command === 'speed') { const c = state.target || state.user || state.map.getCenter(); const r = await loadSpeedCameras(c.lat, c.lon ?? c.lng, false); jumpIntelCard('autoIntelCard'); return r; }
      if (command === 'news') { const c = state.target || state.user || state.map.getCenter(); const r = await loadNews(c.lat, c.lon ?? c.lng, false, c.name || ''); jumpIntelCard('autoIntelCard'); return r; }
      if (command === 'traffic') { if (state.nationalMode) return await refreshNationalSignals(false); const c = state.target || state.user || state.map.getCenter(); const r = await Promise.allSettled([loadTraffic(c.lat, c.lon ?? c.lng, false), loadFlow(c.lat, c.lon ?? c.lng, false)]); jumpIntelCard('autoIntelCard'); return r; }
    } catch (err) { toast(err.message, 4200); }
  }

  function toggleIntel() {
    state.intelOpen = !state.intelOpen;
    $('app')?.classList.toggle('intel-results-open', state.intelOpen);
    $('intelPanel')?.classList.toggle('open', state.intelOpen);
    if ($('intelCollapse')) $('intelCollapse').textContent = state.intelOpen ? '−' : '+';
    if (!state.intelOpen && $('intelBody')) $('intelBody').scrollTop = 0;
    syncIntelMapLayout();
  }

  function updateNetworkState() {
    $('networkState').textContent = navigator.onLine ? 'ZERO-KEY LIVE' : 'OFFLINE';
    setLinkTelemetry(navigator.onLine ? 'LIVE' : 'OFFLINE');
  }

  function shortName(name) { return String(name).replace(/, Taiwan.*$/i, '').slice(0, 23); }
  function escapeHtml(v = '') { return String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function escapeAttr(v = '') { return escapeHtml(v).replace(/`/g, '&#96;'); }
  function debounce(fn, ms) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }

  function bootPwa() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { updateViaCache:'none' }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMap(); bindUi(); bootPwa(); updateClock(); setInterval(updateClock, 1000); updateNetworkState(); updateOriginUi(); renderWatchZones();
    const params = new URLSearchParams(location.search);
    const shared = params.get('view') === 'shared' && params.has('lat') && params.has('lon');
    setTheaterStandby(!shared); restoreSharedView();
    let initialLoadPromise = Promise.resolve();
    if (!shared) {
      initialLoadPromise = new Promise((resolve) => setTimeout(resolve, 180))
        .then(() => bootstrapDefaultCenter())
        .catch(() => null);
      setTimeout(() => { if (state.nationalMode) resetNationalMapView({ animate:false }); }, 5900);
    }
    runBootSequence(initialLoadPromise);
  });
})();
