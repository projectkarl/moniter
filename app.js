(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DEFAULT_CENTER = Object.freeze({ lat: 25.0478, lon: 121.5170, name: '台北市中心' });
  const state = {
    map: null,
    user: null,
    target: null,
    routeLayer: null,
    routeAltLayer: null,
    cameraLayer: null,
    incidentLayer: null,
    flowLayer: null,
    sentinelLayer: null,
    speedLayer: null,
    airLayer: null,
    quakeLayer: null,
    currentWeather: null,
    latestCctv: [],
    latestTraffic: [],
    latestFlow: [],
    latestNews: [],
    latestSpeedCameras: [],
    latestFlights: [],
    latestQuakes: [],
    routeCandidates: [],
    newsLocation: null,
    currentRoute: null,
    originMode: 'taipei',
    inlineCamera: null,
    weatherAuto: true,
    speech: false,
    mapFx: true,
    deferredInstall: null,
    intelOpen: false,
    vehicleIntel: true,
    privacyShield: true,
    speedAlerts: true,
    cameraHandoff: true,
    transferFx: true,
    sensorMode: 'normal',
    mapSource: 'tactical',
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
    },
    motion: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  };

  const aliases = {
    '台北101': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    '101': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    '信義101': { name: '台北 101', lat: 25.033968, lon: 121.564468 },
    'a11': '新光三越 台北信義新天地 A11', '新光a11': '新光三越 台北信義新天地 A11', '信義a11': '新光三越 台北信義新天地 A11',
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

  function setMapSource(source = 'tactical', announce = true) {
    if (!state.map || !window.L) return;
    const next = source === 'satellite' ? 'satellite' : 'tactical';
    if (state.baseMapLayer) state.map.removeLayer(state.baseMapLayer);
    state.baseMapLayer = next === 'satellite'
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' });
    state.baseMapLayer.addTo(state.map);
    state.baseMapLayer.bringToBack?.();
    state.mapSource = next;
    document.querySelectorAll('[data-map-source]').forEach((btn) => btn.classList.toggle('active', btn.dataset.mapSource === next));
    $('app')?.classList.toggle('map-satellite', next === 'satellite');
    if (announce) toast(`MAP SOURCE // ${next.toUpperCase()}`);
  }

  function initMap() {
    if (!window.L) {
      toast('地圖元件載入失敗，請確認網路連線。');
      return;
    }
    state.map = L.map('map', { zoomControl: false, preferCanvas: true, minZoom: 6 }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lon], 13);
    setMapSource('tactical', false);
    $('map').classList.add('map-fx');
    state.cameraLayer = L.layerGroup().addTo(state.map);
    state.incidentLayer = L.layerGroup().addTo(state.map);
    state.flowLayer = L.layerGroup().addTo(state.map);
    state.sentinelLayer = L.layerGroup().addTo(state.map);
    state.speedLayer = L.layerGroup().addTo(state.map);
    state.airLayer = L.layerGroup().addTo(state.map);
    state.quakeLayer = L.layerGroup().addTo(state.map);
    state.map.on('moveend', debounce(() => {
      const c = state.map.getCenter();
      updateMapTelemetry(c.lat, c.lng);
      if (!state.weatherAuto || (!state.target && !state.user)) return;
      loadWeather(c.lat, c.lng, false);
    }, 700));
    updateMapTelemetry(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon);
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

  function runBootSequence() {
    const boot = $('bootSequence');
    if (!boot || !state.motion) { if (boot) boot.classList.add('done'); return; }
    const status = $('bootStatus');
    const steps = ['SECURE CHANNEL INITIALIZING', 'PUBLIC SIGNAL BUS ONLINE', 'PRIVACY LAYER VERIFIED', 'OPS NODE READY'];
    steps.forEach((text, i) => setTimeout(() => { if (status) status.textContent = text; }, i * 260));
    setTimeout(() => boot.classList.add('done'), 1180);
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
    const lookup = typeof alias === 'string' ? alias : clean;
    const bias = state.user || state.target || state.map?.getCenter?.();
    const biasQuery = bias && Number.isFinite(Number(bias.lat)) && Number.isFinite(Number(bias.lon ?? bias.lng))
      ? `&lat=${Number(bias.lat).toFixed(5)}&lon=${Number(bias.lon ?? bias.lng).toFixed(5)}` : '';
    const data = await jsonFetch(`/api/geocode?q=${encodeURIComponent(lookup)}${biasQuery}`);
    if (!data.results?.length) throw new Error('找不到這個地點');
    const first = data.results[0];
    if (alias && typeof alias === 'string') first.aliasFrom = clean;
    return first;
  }

  async function locateUser({ center = true } = {}) {
    if (!navigator.geolocation) throw new Error('此瀏覽器不支援定位');
    toast('正在取得目前位置…');
    signalAcquire(true, 'POSITION ACQUISITION');
    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 9000,
      maximumAge: 45000,
    }));
    state.user = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: '我的位置' };
    state.originMode = 'user';
    updateOriginUi();
    setTheaterStandby(false);
    if (state.userMarker) state.userMarker.remove();
    state.userMarker = L.marker([state.user.lat, state.user.lon], { icon: markerIcon('user', 12), zIndexOffset: 1000 }).addTo(state.map).bindPopup('<b>目前位置</b><br>位置只保留在此瀏覽器工作階段。');
    if (center) {
      runGeoTransfer(state.user, 'POSITION ACQUISITION');
      state.map.flyTo([state.user.lat, state.user.lon], 14, { duration: state.transferFx && state.motion ? 1.15 : .8 });
    }
    loadWeather(state.user.lat, state.user.lon, true);
    loadNews(state.user.lat, state.user.lon, false).catch(() => {});
    signalAcquire(false);
    showTargetLock(state.user);
    toast('定位完成');
    return state.user;
  }


  function updateOriginUi() {
    const label = $('originLabel');
    const chip = $('originChip');
    if (!label || !chip) return;
    const usingUser = state.originMode === 'user';
    label.textContent = usingUser ? (state.user?.name || '我的位置') : DEFAULT_CENTER.name;
    if ($('abOrigin')) $('abOrigin').value = usingUser ? '我的位置' : DEFAULT_CENTER.name;
    const hint = chip.querySelector('em');
    if (hint) hint.textContent = usingUser ? '點一下改回台北市中心' : '點一下改用目前位置';
    chip.classList.toggle('using-user', usingUser);
  }

  function openIntelResults() {
    state.intelOpen = true;
    $('intelPanel')?.classList.add('open');
    if ($('intelCollapse')) $('intelCollapse').textContent = '−';
  }

  async function preferredOrigin() {
    if (state.originMode !== 'user') return { ...DEFAULT_CENTER };
    if (state.user) return state.user;
    try { return await locateUser({ center: false }); }
    catch (_) {
      state.originMode = 'taipei';
      updateOriginUi();
      toast('目前位置無法取得，起點暫用台北市中心。', 3800);
      return { ...DEFAULT_CENTER };
    }
  }

  async function toggleOriginMode() {
    if (state.originMode === 'user') {
      state.originMode = 'taipei';
      updateOriginUi();
      toast('起點已切換：台北市中心');
    } else {
      try {
        await locateUser({ center: false });
        state.originMode = 'user';
        updateOriginUi();
        toast('起點已切換：我的位置');
      } catch (err) {
        state.originMode = 'taipei';
        updateOriginUi();
        toast(`定位失敗，維持台北市中心：${err.message}`, 4200);
      }
    }
    if (state.target && !state.target.bootstrap) {
      const origin = await preferredOrigin();
      await planRoute(origin, state.target, { preference: 'recommended' });
    }
  }

  async function bootstrapDefaultCenter() {
    state.originMode = 'taipei';
    updateOriginUi();
    const place = { ...DEFAULT_CENTER, bootstrap: true };
    state.target = place;
    setTheaterStandby(false);
    $('intelTitle').textContent = 'TAIPEI CENTER';
    state.map?.setView?.([place.lat, place.lon], 13, { animate: false });
    updateMapTelemetry(place.lat, place.lon);
    const results = await Promise.allSettled([
      loadWeather(place.lat, place.lon, false),
      loadTraffic(place.lat, place.lon, false, 32),
      loadFlow(place.lat, place.lon, false, 55),
      loadCctv(place.lat, place.lon, false, 32),
      loadSpeedCameras(place.lat, place.lon, false, 28),
      loadNews(place.lat, place.lon, false),
      loadFlights(place.lat, place.lon, false, 70),
      loadEarthquakes(place.lat, place.lon, false, 250),
    ]);
    const value = (i, fallback) => results[i].status === 'fulfilled' ? (results[i].value ?? fallback) : fallback;
    renderTargetBrief(place, { weather: value(0, null), traffic: value(1, []), flow: value(2, []), cctv: value(3, []), speedCameras: value(4, []) });
    renderAutoIntel(place, { traffic: value(1, []), flow: value(2, []), cctv: value(3, []), speedCameras: value(4, []), news: value(5, []), flights: value(6, []), quakes: value(7, []) });
    renderInlineCctvResults(value(3, []), place);
    $('routeEmpty').textContent = '輸入目的地後，系統會自動從台北市中心建立 2–3 條候選路線；也可切換為目前位置。';
    setLinkTelemetry('TAIPEI CENTER LIVE');
  }

  async function loadWeather(lat, lon, announce = false) {
    try {
      const data = await jsonFetch(`/api/weather?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`);
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

  function renderTargetBrief(place, { weather = null, traffic = [], flow = [], cctv = [], speedCameras = [] } = {}) {
    const el = $('targetBrief');
    if (!el) return;
    const speeds = flow.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const avg = speeds.length ? Math.round(speeds.reduce((a,b) => a+b, 0) / speeds.length) : null;
    const rain = Math.round(Number(weather?.current?.precipitationProbability || 0));
    const status = traffic.length >= 2 ? 'CONDITION AMBER' : traffic.length ? 'WATCH' : 'NOMINAL';
    const flowText = avg == null ? 'FLOW N/A' : `FLOW ${avg} km/h`;
    el.className = `target-brief ${status === 'CONDITION AMBER' ? 'warning' : status === 'WATCH' ? 'watch' : 'live'}`;
    el.innerHTML = `<span>${escapeHtml(status)}</span><b>${escapeHtml(shortName(place?.name || 'TARGET'))}</b><em>${traffic.length} EVENTS · ${flowText} · ${cctv.length} CCTV · ${speedCameras.length} SPEED · RAIN ${rain}%</em>`;
  }

  function renderAutoIntel(place, { traffic = [], flow = [], cctv = [], speedCameras = [], news = [], flights = [], quakes = [] } = {}) {
    const overview = $('autoIntelOverview');
    const trafficBox = $('autoTrafficFeed');
    const newsBox = $('autoNewsFeed');
    const signalBox = $('autoSignalFeed');
    if (!overview || !trafficBox || !newsBox || !signalBox) return;
    const speeds = flow.map((x) => Number(x.travelSpeed)).filter((x) => Number.isFinite(x) && x >= 0);
    const avg = speeds.length ? Math.round(speeds.reduce((a,b) => a+b,0) / speeds.length) : null;
    overview.innerHTML = [
      ['EVENTS', traffic.length], ['CCTV', cctv.length], ['NEWS', news.length], ['AIR', flights.length],
    ].map(([label,value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('');
    trafficBox.innerHTML = `<div class="auto-feed-title"><span>交通與區域訊息</span><em>AUTO</em></div>` + (traffic.length
      ? traffic.slice(0,4).map((ev) => `<div class="auto-row ${/封閉|事故|車禍|施工|回堵/.test(`${ev.title||''} ${ev.description||''}`) ? 'warning' : ''}"><span>EVENT</span><b>${escapeHtml(ev.road || ev.title || '交通事件')}</b><em>${escapeHtml((ev.description || ev.title || '').slice(0,70))}</em></div>`).join('')
      : `<div class="auto-empty">此區目前沒有取得高關聯公開交通事件。</div>`);
    newsBox.innerHTML = `<div class="auto-feed-title"><span>相關新聞</span><em>${news.length} MATCH</em></div>` + (news.length
      ? news.slice(0,4).map((n) => `<a class="auto-news-row" href="${escapeAttr(n.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(n.source || n.domain || 'NEWS')}</span><b>${escapeHtml(n.title)}</b><em>${escapeHtml(formatNewsTime(n.publishedAt))}</em></a>`).join('')
      : `<div class="auto-empty">最近 7 天暫無高關聯區域新聞。</div>`);
    const speedText = speedCameras.length ? `附近 ${speedCameras.length} 個公開測速執法點` : '附近未取得公開測速執法點';
    const flowText = avg == null ? '國道流速資料 N/A' : `國道平均流速 ${avg} km/h`;
    const quakeText = quakes.length ? `24H 地震訊號 ${quakes.length} 筆` : '24H 地震訊號 0 筆';
    signalBox.innerHTML = `<div class="auto-feed-title"><span>感測訊號</span><em>${escapeHtml(shortName(place?.name || 'TARGET'))}</em></div><div class="auto-signal-grid"><div><small>FLOW</small><b>${escapeHtml(flowText)}</b></div><div><small>SPEED</small><b>${escapeHtml(speedText)}</b></div><div><small>AIRSPACE</small><b>${flights.length} PUBLIC SIGNALS</b></div><div><small>SEISMIC</small><b>${escapeHtml(quakeText)}</b></div></div>`;
  }

  async function lockTarget(place, zoom = 15) {
    state.target = place;
    setTheaterStandby(false);
    if (state.targetMarker) state.targetMarker.remove();
    state.targetMarker = L.marker([place.lat, place.lon], { icon: markerIcon('target', 13), zIndexOffset: 900 }).addTo(state.map).bindPopup(`<b>${escapeHtml(place.name || '目標位置')}</b>`).openPopup();
    signalAcquire(true, place.aliasFrom ? `ALIAS RESOLVED // ${String(place.aliasFrom).toUpperCase()}` : 'TARGET ACQUISITION');
    const center = state.map.getCenter();
    const transferDistance = haversineKm(center.lat, center.lng, place.lat, place.lon);
    if (transferDistance > 1.5) runGeoTransfer(place);
    state.map.flyTo([place.lat, place.lon], zoom, { duration: state.transferFx && state.motion && transferDistance > 1.5 ? 1.25 : .9 });
    updateMapTelemetry(place.lat, place.lon);
    setTimeout(() => { signalAcquire(false); showTargetLock(place); }, state.motion ? (transferDistance > 1.5 ? 880 : 520) : 0);
    $('intelTitle').textContent = String(place.name || 'TARGET').toUpperCase().slice(0, 42);
    const results = await Promise.allSettled([
      loadWeather(place.lat, place.lon, true),
      loadTraffic(place.lat, place.lon, false, 35),
      loadFlow(place.lat, place.lon, false, 55),
      loadCctv(place.lat, place.lon, false, 35),
      loadSpeedCameras(place.lat, place.lon, false, 30),
      loadNews(place.lat, place.lon, false),
      loadFlights(place.lat, place.lon, false, 70),
      loadEarthquakes(place.lat, place.lon, false, 250),
    ]);
    const value = (i, fallback) => results[i].status === 'fulfilled' ? (results[i].value ?? fallback) : fallback;
    renderTargetBrief(place, { weather: value(0, null), traffic: value(1, []), flow: value(2, []), cctv: value(3, []), speedCameras: value(4, []) });
    renderAutoIntel(place, { traffic: value(1, []), flow: value(2, []), cctv: value(3, []), speedCameras: value(4, []), news: value(5, []), flights: value(6, []), quakes: value(7, []) });
    renderInlineCctvResults(value(3, []), place);
    if ($('abTarget')) $('abTarget').value = place.name || '';
    openIntelResults();
  }

  async function handleSearch(raw, context = {}) {
    const query = raw.trim();
    if (!query) return;
    $('voiceTranscript').hidden = true;
    const travelIntent = parseTravelIntent(query);
    if (travelIntent) {
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
    const stripped = query.replace(/(看|查看|附近|目前|的|監視器|攝影機|cctv|路況|事故|天氣|會不會下雨|下雨|新聞|消息|發生什麼|地方情報)/ig, ' ').replace(/\s+/g, ' ').trim() || query;
    toast(`TARGET ACQUISITION // ${stripped}`);
    const place = await geocode(stripped);
    if ($('abTarget')) $('abTarget').value = place.name || stripped;
    await lockTarget(place);
    const origin = await preferredOrigin();
    await planRoute(origin, place, { preference: 'recommended', fromVoice: Boolean(context.fromVoice) });
    if (wantsNews) await loadNews(place.lat, place.lon, false);
    openIntelResults();
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
      const badges = [x.index === recommended ? 'RECOMMENDED' : '', x.isFastest ? 'FASTEST' : '', x.isShortest ? 'SHORTEST' : ''].filter(Boolean).join(' · ');
      const flow = Number.isFinite(Number(x.intel.avgSpeed)) ? `${Math.round(x.intel.avgSpeed)} km/h` : 'FLOW N/A';
      const risk = x.threat.level === 'red' ? 'CRITICAL' : x.threat.level === 'amber' ? 'WATCH' : 'NOMINAL';
      const delta = Math.max(0, Math.round((x.duration - Math.min(...candidates.map((c)=>c.duration))) / 60));
      const rationale = x.index === recommended
        ? `${delta ? `較最快基準 +${delta}m · ` : ''}綜合 ETA / 事件 / 流速風險最低`
        : `${risk} · ${x.intel.traffic.length} EVT · ${flow}`;
      return `<button class="route-option ${active ? 'active' : ''} ${x.threat.level === 'red' ? 'danger' : x.threat.level === 'amber' ? 'warning' : ''}" data-route-option="${x.index}"><span>PATH ${String(x.index+1).padStart(2,'0')} · ${risk}</span><b>${Math.round(x.duration/60)} min · ${(x.distance/1000).toFixed(1)} km</b><em>${escapeHtml(badges || 'ALTERNATE')} · ${escapeHtml(rationale)}</em></button>`;
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
    speak('警告。規劃路線偵測到嚴重壅塞或交通事件。已顯示原因與替代路線。', true);
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

  async function activateRouteCandidate(index, { announce = false, fromVoice = false } = {}) {
    const candidate = (state.routeCandidates || []).find((x) => x.index === index);
    const ctx = state.routeContext;
    if (!candidate || !ctx) return;
    renderRouteLayers(candidate.index);
    const bounds = state.routeLayer.getBounds();
    state.map.fitBounds(bounds.pad(.08), { animate: true });
    const mins = Math.max(1, Math.round(candidate.duration / 60));
    const km = candidate.distance / 1000;
    state.currentRoute = { route: candidate.route, origin: ctx.origin, target: ctx.target, mins, km, preference: ctx.preference, candidateIndex: candidate.index, datasets: ctx.datasets };
    $('routeEmpty').hidden = true;
    $('routeInfo').hidden = false;
    $('routeEta').textContent = `${mins} min`;
    $('routeDistance').textContent = `${km.toFixed(1)} km`;
    const recommended = [...state.routeCandidates].sort((a,b) => a.score-b.score)[0]?.index;
    $('routeMode').textContent = candidate.index === recommended ? 'RECOMMENDED' : candidate.isFastest ? 'FASTEST BASE' : candidate.isShortest ? 'SHORTEST' : `PATH ${candidate.index+1}`;
    if ($('routeRecommendation')) $('routeRecommendation').textContent = candidate.index === recommended ? `PATH ${String(candidate.index+1).padStart(2,'0')} · 最佳綜合選擇` : `PATH ${String(candidate.index+1).padStart(2,'0')} · 使用者選擇`;
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
    renderInlineCctvResults(candidate.intel.cctv || ctx.datasets.cctv || [], ctx.target);
    openIntelResults();
    if (candidate.threat.level === 'red') showThreatAlert(candidate.threat, candidate);
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
      const data = await jsonFetch(`/api/route?from=${origin.lon},${origin.lat}&to=${target.lon},${target.lat}`);
      const routes = (data.routes || []).filter((r) => r?.geometry && Number.isFinite(Number(r.distance)) && Number.isFinite(Number(r.duration))).slice(0,3);
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
      const fastestDuration = Math.min(...routes.map((r) => Number(r.duration)));
      const shortestDistance = Math.min(...routes.map((r) => Number(r.distance)));
      state.routeCandidates = routes.map((route, index) => {
        const intel = routeIntelSnapshot(route, datasets, Number(route.distance)/1000);
        const forecast = forecastForArrival(weatherData, Math.round(Number(route.duration)/60));
        const threat = assessRouteThreat(intel, forecast);
        const candidate = { index, route, duration: Number(route.duration), distance: Number(route.distance), intel, threat, isFastest: Number(route.duration) === fastestDuration, isShortest: Number(route.distance) === shortestDistance };
        candidate.score = routeOperationalScore(candidate);
        return candidate;
      });
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
      const routeCountText = state.routeCandidates.length >= 2 ? `已取得 ${state.routeCandidates.length} 條可選路線` : '路由服務僅回傳 1 條不同路線';
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

  function setOpsPanel({ eyebrow = 'CLASSIFIED OPS', title = 'INTELLIGENCE', code = 'LIVE', html = '' }) {
    $('opsEyebrow').textContent = eyebrow;
    $('opsTitle').textContent = title;
    $('opsCode').textContent = code;
    $('opsTimestamp').textContent = $('clock').textContent;
    $('opsBody').innerHTML = html;
    $('opsDrawer').hidden = false;
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

  function routePosition(route, point) {
    const coords = route?.geometry?.coordinates || [];
    if (!coords.length || !Number.isFinite(point?.lat) || !Number.isFinite(point?.lon)) return { distance: Infinity, progress: 1 };
    const stride = Math.max(1, Math.floor(coords.length / 220));
    let best = { distance: Infinity, index: coords.length - 1 };
    for (let i = 0; i < coords.length; i += stride) {
      const c = coords[i];
      const d = haversineKm(point.lat, point.lon, c[1], c[0]);
      if (d < best.distance) best = { distance: d, index: i };
    }
    const last = coords[coords.length - 1];
    const lastD = haversineKm(point.lat, point.lon, last[1], last[0]);
    if (lastD < best.distance) best = { distance: lastD, index: coords.length - 1 };
    return { distance: best.distance, progress: best.index / Math.max(1, coords.length - 1) };
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
    return `<div class="news-list">${items.slice(0, 10).map((n) => `<a class="news-item" href="${escapeAttr(n.url)}" target="_blank" rel="noopener noreferrer"><span><small>${escapeHtml(n.scope || 'REGION')} · ${escapeHtml(formatNewsTime(n.publishedAt))}</small><b>${escapeHtml(n.title)}</b></span><em>${escapeHtml(n.source || n.domain || 'NEWS')}</em></a>`).join('')}</div>`;
  }

  async function loadNews(lat, lon, open = false) {
    $('newsCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/news?lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}`);
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
      loadNews(c.lat, c.lon, false),
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
      $('routeDrawer').hidden = false;
      if (state.user) $('routeOrigin').value = '我的位置';
      toast('先指定 A 點與 B 點，系統會建立沿途情報。');
      return;
    }
    if (cur.intel?.timeline) {
      buildMissionRouteBrief({ ...cur, traffic: cur.intel.traffic, flow: cur.intel.flow, cctv: cur.intel.cctv, speedCameras: cur.intel.speedCameras || [] });
    } else {
      $('routeDrawer').hidden = false;
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

  async function startNavigation() {
    const cur = state.currentRoute;
    if (!cur?.route) {
      $('routeDrawer').hidden = false;
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
    state.navigation.announced = new Set();
    state.navigation.activeCameraId = null;
    state.navigation.lastPoint = null;
    state.navigation.lastUiAt = 0;
    $('navHud').hidden = false;
    $('navTargetName').textContent = shortName(cur.target?.name || 'TARGET');
    $('navAlert').className = 'nav-alert live';
    $('navAlert').innerHTML = '<span>NAV LINK</span><b>GPS TRACKING ACTIVE</b><em>LIVE</em>';
    setTheaterStandby(false);
    signalAcquire(true, 'NAVIGATION LINK');
    setLinkTelemetry('NAV OPS');
    runGeoTransfer(state.user, 'NAVIGATION LINK');
    state.map.flyTo([state.user.lat, state.user.lon], 16, { duration: state.motion ? 1.1 : .5 });
    state.navigation.watchId = navigator.geolocation.watchPosition(onNavigationPosition, (err) => {
      $('navAlert').className = 'nav-alert danger';
      $('navAlert').innerHTML = `<span>POSITION LOST</span><b>${escapeHtml(err.message || 'GPS SIGNAL LOST')}</b><em>RETRY</em>`;
    }, { enableHighAccuracy: true, maximumAge: 1500, timeout: 12000 });
    tactile(16);
    speak('導航情報模式已啟動。行車請以道路現場標誌與官方號誌為準。');
  }

  function stopNavigation(showToast = true) {
    if (state.navigation.watchId != null && navigator.geolocation?.clearWatch) {
      try { navigator.geolocation.clearWatch(state.navigation.watchId); } catch (_) {}
    }
    state.navigation.watchId = null;
    state.navigation.active = false;
    state.navigation.activeCameraId = null;
    if ($('navHud')) $('navHud').hidden = true;
    if ($('navCameraHandoff')) $('navCameraHandoff').hidden = true;
    if ($('navLimitBadge')) { $('navLimitBadge').hidden = true; $('navLimitBadge').classList.remove('danger'); }
    if (showToast) toast('NAV OPS 已結束');
    setLinkTelemetry('LIVE');
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
    if (Number.isFinite(speed) && speed >= 80) return 5.2;
    if (Number.isFinite(speed) && speed >= 50) return 3.2;
    return 2.2;
  }

  function announceSpeedCamera(cam, distanceKmValue, currentSpeed = null) {
    if (!state.speedAlerts || !cam) return;
    const meters = Math.max(0, Math.round(distanceKmValue * 1000 / 50) * 50);
    const earlyKm = speedAlertEarlyKm(currentSpeed);
    const threshold = distanceKmValue <= .55 ? 'FINAL' : distanceKmValue <= 1.55 ? 'MID' : distanceKmValue <= earlyKm ? 'EARLY' : null;
    if (!threshold) return;
    const key = `${cam.id}:${threshold}`;
    if (state.navigation.announced.has(key)) return;
    state.navigation.announced.add(key);
    const publishedLimit = Number(cam.limit);
    const limit = Number.isFinite(publishedLimit) ? `，該公開執法點資料標示速限 ${publishedLimit}` : '';
    const distanceText = meters >= 1500 ? `約 ${Math.round(meters / 100) / 10} 公里` : `約 ${meters} 公尺`;
    const stageText = threshold === 'EARLY' ? '提早提醒' : threshold === 'MID' ? '再次提醒' : '即將接近';
    speak(`${stageText}。前方${distanceText}有公開測速執法點${limit}。請提早確認車速，實際速限以道路現場標誌為準。`, true);
    tactile(threshold === 'FINAL' ? 30 : threshold === 'MID' ? 20 : 12);
  }

  function renderNavCameraHandoff(cam, distance) {
    const box = $('navCameraHandoff');
    if (!box || !cam) return;
    if (state.navigation.activeCameraId === cam.id) return;
    state.navigation.activeCameraId = cam.id;
    $('navCameraName').textContent = shortName(cam.name || cam.road || 'PUBLIC CCTV');
    $('navCameraMeta').textContent = `${Number.isFinite(distance) ? `${distance.toFixed(1)} km AHEAD · ` : ''}${cam.direction || 'PUBLIC SIGNAL'}`;
    const thumb = $('navCameraThumb');
    if (thumb) {
      const imageFeed = /^https:\/\//i.test(cam.streamUrl || '') && /\.(jpg|jpeg|png)(\?|$)/i.test(cam.streamUrl || '');
      thumb.style.backgroundImage = imageFeed ? `url("${String(cam.streamUrl).replace(/["\\]/g, '')}")` : '';
      thumb.classList.toggle('has-image', imageFeed);
      thumb.classList.toggle('privacy-shield', state.privacyShield && imageFeed);
      thumb.innerHTML = imageFeed ? '<i>LIVE</i>' : '<i>LINK</i>';
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
    const remainingKm = Math.max(0, cur.km * (1 - progress));
    const remainingMin = Math.max(0, Math.round(cur.mins * (1 - progress)));
    $('navSpeed').textContent = Number.isFinite(speed) ? String(Math.round(speed)) : '--';
    $('navHeading').textContent = Number.isFinite(state.navigation.heading) ? `${String(Math.round(state.navigation.heading)).padStart(3, '0')}°` : '---°';
    $('navRemaining').textContent = `${remainingKm.toFixed(1)} km`;
    $('navEta').textContent = `${remainingMin} min`;
    updateMapTelemetry(point.lat, point.lon);

    if (Date.now() - state.navigation.lastUiAt > 850) {
      state.map.panTo([point.lat, point.lon], { animate: true, duration: .45 });
      state.navigation.lastUiAt = Date.now();
    }

    const intel = cur.intel || {};
    const cameraCandidates = routeAheadItems(cur.route, intel.cctv || state.latestCctv, progress, 2.6)
      .map((x) => ({ ...x, navDistance: haversineKm(point.lat, point.lon, x.lat, x.lon) }))
      .filter((x) => x.navDistance <= 4.5);
    if (state.cameraHandoff && cameraCandidates[0]) renderNavCameraHandoff(cameraCandidates[0], cameraCandidates[0].navDistance);

    const earlySpeedKm = speedAlertEarlyKm(speed);
    const speedCandidates = routeAheadItems(cur.route, intel.speedCameras || state.latestSpeedCameras, progress, 1.8)
      .map((x) => ({ ...x, navDistance: haversineKm(point.lat, point.lon, x.lat, x.lon) }))
      .filter((x) => x.navDistance <= Math.max(earlySpeedKm + .35, 3.2))
      .sort((a, b) => a.navDistance - b.navDistance);
    const speedCam = state.speedAlerts ? speedCandidates[0] : null;
    const incidents = routeAheadItems(cur.route, intel.traffic || [], progress, 4)
      .map((x) => ({ ...x, navDistance: haversineKm(point.lat, point.lon, x.lat, x.lon) }))
      .filter((x) => x.navDistance <= 4)
      .sort((a, b) => a.navDistance - b.navDistance);

    const limitBadge = $('navLimitBadge');
    if (speedCam && speedCam.navDistance <= earlySpeedKm) {
      const meters = Math.max(50, Math.round(speedCam.navDistance * 1000 / 50) * 50);
      const limit = Number(speedCam.limit);
      const over = Number.isFinite(speed) && Number.isFinite(limit) && speed > limit + 2;
      if (limitBadge) {
        limitBadge.hidden = false;
        limitBadge.textContent = Number.isFinite(limit) ? `ENF LIMIT ${limit}` : 'ENF AHEAD';
        limitBadge.classList.toggle('danger', Boolean(over));
      }
      navWarningHtml('SPEED LIMIT AHEAD', Number.isFinite(limit) ? `公開執法點標示 ${limit} km/h · ${meters} m` : `前方公開測速點 · ${meters} m`, `${speedCam.address || speedCam.region || '公開測速執法點'}${over ? ' · CHECK SPEED' : ''}`, over ? 'danger' : 'warning');
      announceSpeedCamera(speedCam, speedCam.navDistance, speed);
    } else if (incidents[0] && incidents[0].navDistance <= 2.5) {
      if (limitBadge) { limitBadge.hidden = true; limitBadge.classList.remove('danger'); }
      navWarningHtml('TRAFFIC EVENT AHEAD', incidents[0].road || incidents[0].title || '前方交通事件', `${incidents[0].navDistance.toFixed(1)} km`, 'danger');
    } else if (routePos.distance > 1.2) {
      if (limitBadge) { limitBadge.hidden = true; limitBadge.classList.remove('danger'); }
      navWarningHtml('ROUTE DEVIATION', '目前位置偏離規劃路線', `${routePos.distance.toFixed(1)} km OFF ROUTE`, 'danger');
    } else {
      if (limitBadge) { limitBadge.hidden = true; limitBadge.classList.remove('danger'); }
      navWarningHtml('ROUTE LINK', 'GPS TRACKING · PUBLIC INTEL ONLINE', `${Math.round(progress * 100)}% COMPLETE`, 'live');
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
    $('wallDrawer').hidden = false;
    signalAcquire(true, 'CAMERA SIGNAL ACQUISITION');
    $('wallGrid').innerHTML = '<div class="ops-empty" style="grid-column:1/-1">ACQUIRING PUBLIC CAMERA SIGNALS…</div>';
    const items = await loadCctv(c.lat, c.lon, false, 35);
    renderCctvWall(items.slice(0, 9));
    signalAcquire(false);
  }

  function renderCctvWall(items) {
    const grid = $('wallGrid');
    grid.innerHTML = '';
    if (!items.length) {
      grid.innerHTML = '<div class="ops-empty" style="grid-column:1/-1">NO PUBLIC CAMERA SIGNAL IN RANGE</div>';
      $('wallMain').innerHTML = '<div class="camera-placeholder">NO FEED</div>';
      return;
    }
    items.forEach((cam, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wall-card';
      btn.innerHTML = `<span class="cam-code"><span>CAM ${String(index + 1).padStart(2, '0')}</span><span>${Number.isFinite(cam.distance) ? `${cam.distance.toFixed(1)} km` : 'PUBLIC'}</span></span><b>${escapeHtml(cam.name || cam.road || 'PUBLIC CCTV')}</b><small>${escapeHtml(cam.direction || cam.source || 'LIVE SIGNAL')}</small>`;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.wall-card').forEach((el) => el.classList.remove('active'));
        btn.classList.add('active');
        renderWallCamera(cam);
      });
      grid.appendChild(btn);
      if (index === 0) setTimeout(() => btn.click(), 0);
    });
  }

  function renderWallCamera(cam) {
    const stage = $('wallMain');
    flashSignal(stage);
    renderCameraMedia(stage, cam);
    stage.classList.toggle('privacy-shield', state.privacyShield);
    $('wallMainTitle').textContent = shortName(cam.name || cam.road || 'PUBLIC CCTV');
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
      const data = await jsonFetch(`/api/speed-cameras?lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestSpeedCameras = items;
      items.forEach((cam) => {
        const marker = L.marker([cam.lat, cam.lon], { icon: speedMarkerIcon(cam), zIndexOffset: 650 }).addTo(state.speedLayer);
        const limit = Number.isFinite(Number(cam.limit)) ? `${Number(cam.limit)} km/h` : '速限依現場標誌';
        marker.bindPopup(`<b>公開測速執法點</b><br>${escapeHtml(cam.address || `${cam.city || ''}${cam.region || ''}`)}<br>${escapeHtml(cam.direction || '方向未提供')} · ${escapeHtml(limit)}<br><small>來源：警政署公開資料；行車仍以現場標誌為準。</small>`);
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
      const data = await jsonFetch(`/api/flights?lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestFlights = items;
      items.forEach((ac) => {
        const hdg = Number.isFinite(Number(ac.heading)) ? Number(ac.heading) : 0;
        const icon = L.divIcon({ className: '', html: `<div class="marker-air" style="transform:rotate(${hdg}deg)">▲</div>`, iconSize: [18,18], iconAnchor: [9,9] });
        const marker = L.marker([ac.lat, ac.lon], { icon, zIndexOffset: 520 }).addTo(state.airLayer);
        marker.bindPopup(`<b>${escapeHtml(ac.callsign || 'AIR CONTACT')}</b><br>${Number.isFinite(Number(ac.altitude)) ? `${Math.round(Number(ac.altitude))} ft` : 'ALT N/A'} · ${Number.isFinite(Number(ac.groundSpeed)) ? `${Math.round(Number(ac.groundSpeed))} kt` : 'SPD N/A'}<br><small>PUBLIC ADS-B SIGNAL</small>`);
        marker.on('click', () => {
          state.map.flyTo([ac.lat, ac.lon], Math.max(state.map.getZoom(), 10), { duration: .65 });
          showTargetLock({ name: ac.callsign || 'AIR CONTACT', lat: ac.lat, lon: ac.lon });
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
      const data = await jsonFetch(`/api/earthquakes?lat=${Number(lat).toFixed(5)}&lon=${Number(lon).toFixed(5)}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestQuakes = items;
      items.forEach((q) => {
        const size = Math.max(8, Math.min(24, 7 + Math.max(0, Number(q.mag || 0))*2.5));
        const icon = L.divIcon({ className: '', html: `<div class="marker-quake" style="width:${size}px;height:${size}px"></div>`, iconSize: [size,size], iconAnchor: [size/2,size/2] });
        L.marker([q.lat, q.lon], { icon, zIndexOffset: 500 }).addTo(state.quakeLayer)
          .bindPopup(`<b>SEISMIC CONTACT · M${Number.isFinite(Number(q.mag)) ? Number(q.mag).toFixed(1) : '?'}</b><br>${escapeHtml(q.place || '')}<br>${Number.isFinite(Number(q.depth)) ? `${Math.round(Number(q.depth))} km depth` : ''}<br><small>USGS · LAST 24H</small>`);
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
    toast('TAIWAN THEATER // SIGNALS FUSED');
  }

  async function loadCctv(lat, lon, focus = false, radius = 40) {
    if (!state.map) return;
    state.cameraLayer.clearLayers();
    $('cameraCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/cctv?lat=${lat}&lon=${lon}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestCctv = items;
      items.forEach((cam) => {
        const marker = L.marker([cam.lat, cam.lon], { icon: markerIcon('camera', 9) }).addTo(state.cameraLayer);
        marker.bindPopup(`<b>${escapeHtml(cam.name || cam.road || '公開 CCTV')}</b><br>${escapeHtml(cam.direction || '')}<br><button class="popup-action" data-camera-id="${escapeHtml(cam.id)}">OPEN FEED</button>`);
        marker.on('click', () => setTimeout(() => bindPopupCameraAction(cam), 0));
      });
      $('cameraCount').textContent = String(items.length);
      if (focus && items.length) {
        const nearest = items[0];
        state.map.flyTo([nearest.lat, nearest.lon], Math.max(state.map.getZoom(), 13));
      }
      if (!items.length) toast(data.message || '此區目前沒有可顯示的 CCTV。');
      return items;
    } catch (err) {
      $('cameraCount').textContent = 'OFF';
      toast(`CCTV：${err.message}`, 4200);
      return [];
    }
  }

  function bindPopupCameraAction(cam) {
    document.querySelectorAll('[data-camera-id]').forEach((btn) => {
      if (btn.dataset.cameraId === String(cam.id)) btn.onclick = () => openCamera(cam);
    });
  }

  function cameraFeedUrl(cam) {
    const raw = String(cam?.streamUrl || '');
    if (/^https:\/\//i.test(raw) && !/\.m3u8(?:\?|$)/i.test(raw)) return raw;
    if (cam?.id) return `/api/cctv-feed?id=${encodeURIComponent(cam.id)}`;
    return /^https:\/\//i.test(raw) ? raw : '';
  }

  let hlsLoaderPromise = null;
  function ensureHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsLoaderPromise) return hlsLoaderPromise;
    hlsLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      script.async = true;
      script.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('HLS unavailable'));
      script.onerror = () => reject(new Error('HLS loader failed'));
      document.head.appendChild(script);
    });
    return hlsLoaderPromise;
  }

  function renderHls(stage, url) {
    const video = document.createElement('video');
    video.controls = true; video.autoplay = true; video.muted = true; video.playsInline = true;
    stage.appendChild(video);
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      return;
    }
    ensureHlsJs().then((Hls) => {
      if (!Hls?.isSupported?.()) throw new Error('HLS unsupported');
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url); hls.attachMedia(video);
      video._eyeHls = hls;
    }).catch(() => {
      stage.innerHTML = '<div class="camera-placeholder">此公開串流格式目前無法在本瀏覽器直接解碼。系統不會另開外部網頁。</div>';
    });
  }

  function renderCameraMedia(stage, cam) {
    stage.querySelectorAll('video').forEach((v) => { try { v._eyeHls?.destroy?.(); } catch (_) {} });
    stage.innerHTML = '';
    const original = String(cam?.streamUrl || '');
    const url = cameraFeedUrl(cam);
    if (!original || !url) {
      stage.innerHTML = '<div class="camera-placeholder">此攝影機目前沒有可內嵌的公開串流。</div>';
      return;
    }
    if (/\.m3u8(?:\?|$)/i.test(original)) {
      renderHls(stage, url);
      return;
    }
    if (/\.(?:mp4|webm)(?:\?|$)/i.test(original)) {
      const video = document.createElement('video');
      video.src = url; video.controls = true; video.autoplay = true; video.muted = true; video.playsInline = true;
      video.addEventListener('error', () => { stage.innerHTML = '<div class="camera-placeholder">公開影像暫時無法播放，請稍後重試。</div>'; });
      stage.appendChild(video);
      return;
    }
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'CCTV 即時影像';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      stage.innerHTML = '';
      const video = document.createElement('video');
      video.src = url; video.controls = true; video.autoplay = true; video.muted = true; video.playsInline = true;
      video.addEventListener('error', () => { stage.innerHTML = '<div class="camera-placeholder">公開影像暫時無法直接播放，系統不會跳離本頁。</div>'; });
      stage.appendChild(video);
    }, { once: true });
    stage.appendChild(img);
  }

  function selectInlineCamera(cam) {
    if (!cam || !$('inlineCameraStage')) return;
    state.inlineCamera = cam;
    $('inlineCameraCard').hidden = false;
    $('inlineCameraTitle').textContent = shortName(cam.name || cam.road || 'PUBLIC CCTV');
    $('inlineCameraSignal').textContent = 'LIVE // DIRECT';
    $('inlineCameraMeta').textContent = `${cam.road || ''} ${cam.direction || ''} · ${cam.source || 'PUBLIC DATA'}`.trim();
    renderCameraMedia($('inlineCameraStage'), cam);
    $('inlineCameraStage').classList.toggle('privacy-shield', state.privacyShield);
    document.querySelectorAll('[data-inline-camera]').forEach((btn) => btn.classList.toggle('active', btn.dataset.inlineCamera === String(cam.id)));
  }

  function renderInlineCctvResults(items = [], focus = null) {
    const card = $('inlineCameraCard');
    const choices = $('inlineCameraChoices');
    if (!card || !choices) return;
    const cameras = [...items].filter((x) => x?.streamUrl).sort((a,b) => {
      if (!focus) return Number(a.distance || 0) - Number(b.distance || 0);
      return haversineKm(focus.lat, focus.lon, a.lat, a.lon) - haversineKm(focus.lat, focus.lon, b.lat, b.lon);
    }).slice(0,4);
    if (!cameras.length) {
      card.hidden = false;
      $('inlineCameraTitle').textContent = 'NO PUBLIC FEED';
      $('inlineCameraSignal').textContent = 'SIGNAL N/A';
      $('inlineCameraStage').innerHTML = '<div class="camera-placeholder">此區目前沒有可直接顯示的公開 CCTV。</div>';
      $('inlineCameraMeta').textContent = '系統會保留其他路況、天氣與速限情報。';
      choices.innerHTML = '';
      return;
    }
    card.hidden = false;
    choices.innerHTML = cameras.map((cam, i) => `<button type="button" data-inline-camera="${escapeAttr(cam.id)}"><span>CAM ${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(shortName(cam.name || cam.road || 'PUBLIC CCTV'))}</b></button>`).join('');
    choices.querySelectorAll('[data-inline-camera]').forEach((btn) => btn.addEventListener('click', () => {
      const cam = cameras.find((x) => String(x.id) === btn.dataset.inlineCamera);
      if (cam) selectInlineCamera(cam);
    }));
    selectInlineCamera(cameras[0]);
  }

  function openCamera(cam) {
    $('cameraDrawer').hidden = false;
    $('cameraTitle').textContent = shortName(cam.name || cam.road || 'CAMERA');
    const stage = $('cameraStage');
    flashSignal(stage);
    renderCameraMedia(stage, cam);
    state.activeCamera = cam;
    applyPrivacyShield();
    $('cameraMeta').textContent = `${cam.road || ''} ${cam.direction || ''} · ${cam.source || 'PUBLIC DATA'}`.trim();
    renderCameraIntel(cam);
  }

  function applyPrivacyShield() {
    const stage = $('cameraStage');
    if (!stage) return;
    stage.classList.toggle('privacy-shield', state.privacyShield);
    stage.setAttribute('data-privacy', state.privacyShield ? 'on' : 'off');
    const wall = $('wallMain');
    if (wall) wall.classList.toggle('privacy-shield', state.privacyShield);
    const inline = $('inlineCameraStage');
    if (inline) inline.classList.toggle('privacy-shield', state.privacyShield);
    const navThumb = $('navCameraThumb');
    if (navThumb?.classList.contains('has-image')) navThumb.classList.toggle('privacy-shield', state.privacyShield);
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
    const stage = $('cameraStage');
    if (!stage) return;
    stage.querySelector('.vision-fusion')?.remove();
    const lanes = (vd?.lanes || []).filter((x) => Number.isFinite(Number(x.speed)) || Number.isFinite(Number(x.occupancy)));
    const best = [...lanes].filter((x) => Number.isFinite(Number(x.probability))).sort((a,b) => Number(b.probability)-Number(a.probability))[0];
    const laneStrip = lanes.slice(0,4).map((lane, i) => {
      const spd = Number.isFinite(Number(lane.speed)) ? `${Math.round(Number(lane.speed))}` : '—';
      const occ = Number.isFinite(Number(lane.occupancy)) ? `${Math.round(Number(lane.occupancy))}%` : '—';
      const prob = Number.isFinite(Number(lane.probability)) ? `${Math.round(Number(lane.probability))}%` : '—';
      const cls = best === lane ? 'best' : '';
      return `<div class="vision-lane ${cls}"><span>${escapeHtml(laneLabel(lane,i))}</span><b>${spd}<small>km/h</small></b><em>OCC ${occ} · EDGE ${prob}</em></div>`;
    }).join('');
    const tunnelCtx = tunnelLaneContext(cam, vd);
    const tunnel = tunnelCtx.active;
    const advisory = best && lanes.length >= 2
      ? `${escapeHtml(laneLabel(best, lanes.indexOf(best)))} FLOW EDGE ${Math.round(Number(best.probability))}%`
      : 'LANE SIGNAL INSUFFICIENT';
    const overlay = document.createElement('div');
    overlay.className = 'vision-fusion';
    overlay.innerHTML = `<div class="vision-corners"></div><div class="vision-top"><span>LIVE SENSOR FUSION</span><b>${escapeHtml(status)}</b><em>${new Date().toLocaleTimeString('zh-TW',{hour12:false})}</em></div><div class="vision-reticle"><i></i><i></i><i></i><i></i></div>${laneStrip ? `<div class="vision-lanes">${laneStrip}</div>` : ''}<div class="vision-bottom"><span>${escapeHtml(cam?.road || 'PUBLIC CCTV')} · ${escapeHtml(cam?.direction || 'DIRECTION N/A')}</span><b>${escapeHtml(speed)}</b><em>${advisory}</em></div>${tunnel && best ? `<div class="vision-safety">${escapeHtml(tunnelCtx.name || 'TUNNEL APPROACH')} · FLOW EDGE 僅供入口前短時趨勢；進入隧道後依 LCS/CMS、標線與速限行駛${tunnelCtx.snow ? '；雪山隧道內禁止變換車道' : '；禁止變換車道的路段勿因本指標換道'}。</div>` : ''}`;
    stage.appendChild(overlay);
  }

  async function renderCameraIntel(cam) {
    const box = $('cameraIntel');
    if (!box) return;
    if (!state.vehicleIntel || !cam) {
      box.hidden = true;
      box.innerHTML = '';
      $('cameraStage')?.querySelector('.vision-fusion')?.remove();
      return;
    }
    box.hidden = false;
    box.innerHTML = '<span class="intel-kicker">LIVE VISION ANALYTICS</span><b>融合 CCTV、VD 車道偵測器與即時路況…</b><small>不進行車牌 OCR、個別車輛識別或跨鏡頭追蹤。</small>';
    try {
      const [flowResult, laneResult] = await Promise.allSettled([
        jsonFetch(`/api/flow?lat=${cam.lat}&lon=${cam.lon}&radius=12`),
        jsonFetch(`/api/lane-flow?lat=${cam.lat}&lon=${cam.lon}&radius=8`),
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
      box.innerHTML = `<span class="intel-kicker">LIVE VISION ANALYTICS · SENSOR FUSION</span><div class="intel-grid four"><div><small>FLOW STATE</small><b>${escapeHtml(status)}</b></div><div><small>AVG SPEED</small><b>${escapeHtml(speed)}</b></div><div><small>OCCUPANCY</small><b>${escapeHtml(occupancy)}</b></div><div><small>FLOW EDGE</small><b>${escapeHtml(bestText)}</b></div></div>${laneHtml}${safety}<small class="privacy-note">FREEWAY VD 1-MINUTE DATA + PUBLIC CCTV · NO PLATE OCR / NO FACE ID / NO VEHICLE TRACKING</small>`;
      renderCameraVisionOverlay(cam, { status, speed, vd });
    } catch (err) {
      renderCameraVisionOverlay(cam, { status: 'PUBLIC FEED', speed: '—', vd: null });
      box.innerHTML = '<span class="intel-kicker">LIVE VISION ANALYTICS</span><b>車道級感測資料暫時無法取得</b><small>公開 CCTV 仍可正常檢視；未執行任何車牌或人臉辨識。</small>';
    }
  }

  async function loadTraffic(lat, lon, focus = false, radius = 60) {
    state.incidentLayer.clearLayers();
    $('trafficCount').textContent = '…';
    try {
      const data = await jsonFetch(`/api/traffic?lat=${lat}&lon=${lon}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestTraffic = items;
      items.forEach((ev) => {
        if (!Number.isFinite(ev.lat) || !Number.isFinite(ev.lon)) return;
        const marker = L.marker([ev.lat, ev.lon], { icon: markerIcon('incident', 10) }).addTo(state.incidentLayer);
        marker.bindPopup(`<b>${escapeHtml(ev.title || '交通事件')}</b><br>${escapeHtml(ev.road || '')}<br>${escapeHtml(ev.description || '')}`);
      });
      $('trafficCount').textContent = String(items.length);
      if (focus && items.length) state.map.flyTo([items[0].lat, items[0].lon], Math.max(state.map.getZoom(), 12));
      if (!items.length) toast(data.message || '附近目前沒有取得交通事件。');
      return items;
    } catch (err) {
      $('trafficCount').textContent = 'OFF';
      toast(`路況：${err.message}`, 4200);
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
      className: '',
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
    state.flowLayer.clearLayers();
    $('flowStatus').textContent = '…';
    try {
      const data = await jsonFetch(`/api/flow?lat=${lat}&lon=${lon}&radius=${Math.round(radius)}`);
      const items = data.items || [];
      state.latestFlow = items;
      let speedLabels = 0;
      const labelAnchors = [];
      items.forEach((segment) => {
        if (!Array.isArray(segment.geometry) || segment.geometry.length < 2) return;
        const visual = flowVisual(segment);
        L.polyline(segment.geometry, { color: '#050606', weight: visual.className === 'critical' ? 10 : 9, opacity: .74, lineCap: 'round', lineJoin: 'round' }).addTo(state.flowLayer);
        const line = L.polyline(segment.geometry, flowStyle(segment)).addTo(state.flowLayer);
        const speedValue = Number(segment.travelSpeed);
        const speed = Number.isFinite(speedValue) ? `${Math.round(speedValue)} km/h` : '速度未提供';
        const label = segment.congestionLevel || visual.label;
        line.bindPopup(`<b>${escapeHtml(segment.road || segment.name || '國道路段')}</b><br>${escapeHtml(segment.start || '')} → ${escapeHtml(segment.end || '')}<br><span style="color:${visual.color}">● ${escapeHtml(label)}</span> · ${escapeHtml(speed)}`);

        const point = flowLabelPoint(segment);
        if (!point || !Number.isFinite(speedValue)) return;
        const priority = visual.className === 'critical' || visual.className === 'slow';
        const farEnough = labelAnchors.every((p) => haversineKm(p[0], p[1], point[0], point[1]) > (priority ? 1.05 : 1.8));
        if (farEnough && speedLabels < 34) {
          L.marker(point, { icon: flowSpeedIcon(segment), interactive: false, zIndexOffset: visual.className === 'critical' ? 450 : 120 }).addTo(state.flowLayer);
          labelAnchors.push(point);
          speedLabels += 1;
        }
      });
      const avg = Number(data.avgSpeed);
      $('flowStatus').textContent = Number.isFinite(avg) ? `${Math.round(avg)} km/h` : (items.length ? String(data.status || 'LIVE').toUpperCase() : 'N/A');
      if (focus && items.length) {
        const first = items[0];
        state.map.flyTo([first.lat, first.lon], Math.max(state.map.getZoom(), 11));
      }
      if (!items.length && focus) toast(data.message || '附近沒有可定位的國道即時流速資料。');
      return items;
    } catch (err) {
      $('flowStatus').textContent = 'OFF';
      if (focus) toast(`國道流速：${err.message}`, 4200);
      return [];
    }
  }

  function setSensorMode(mode = 'normal') {
    const allowed = new Set(['normal','nvg','flir','noir','crt']);
    const next = allowed.has(mode) ? mode : 'normal';
    state.sensorMode = next;
    ['normal','nvg','flir','noir','crt'].forEach((m) => $('app').classList.toggle(`sensor-${m}`, m === next));
    document.querySelectorAll('[data-sensor]').forEach((btn) => btn.classList.toggle('active', btn.dataset.sensor === next));
    toast(`SENSOR // ${next.toUpperCase()}`);
  }

  async function shareCurrentView() {
    const c = state.target || state.user || state.map?.getCenter?.();
    if (!c) return;
    const url = new URL(location.href);
    url.search = '';
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
    const lat = Number(q.get('lat')), lon = Number(q.get('lon'));
    const sensor = q.get('sensor');
    const mapSource = q.get('map');
    if (mapSource) setMapSource(mapSource, false);
    if (sensor) setSensorMode(sensor);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const place = { lat, lon, name: q.get('name') || 'SHARED TARGET' };
      setTimeout(() => lockTarget(place, 14).catch(() => {}), 350);
    }
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
      if (last.isFinal) handleSearch(transcript, { fromVoice: true }).catch((err) => toast(err.message));
    };
    recognition.onerror = () => toast('語音辨識中斷，請再試一次。');
    recognition.onend = () => $('voiceBtn').classList.remove('listening');
    recognition.start();
  }

  function bindUi() {
    const motionBtn = $('motionToggle');
    if (motionBtn && !state.motion) { motionBtn.classList.remove('active'); motionBtn.setAttribute('aria-pressed', 'false'); $('app').classList.add('motion-off'); }
    $('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSearch($('queryInput').value).catch((err) => toast(err.message, 4200));
    });
    $('queryInput').addEventListener('input', (e) => renderPoiSuggestions(e.target.value));
    $('queryInput').addEventListener('focus', (e) => renderPoiSuggestions(e.target.value));
    $('queryInput').addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('poiSuggestions')) $('poiSuggestions').hidden = true; });
    document.addEventListener('click', (e) => { if (!e.target.closest?.('.search-row') && !e.target.closest?.('#poiSuggestions') && $('poiSuggestions')) $('poiSuggestions').hidden = true; });
    $('voiceBtn').addEventListener('click', startVoice);
    $('originChip')?.addEventListener('click', () => toggleOriginMode());
    $('planRouteBtn').addEventListener('click', () => planRoute());
    $('startNavBtn').addEventListener('click', () => startNavigation());
    $('stopNavBtn').addEventListener('click', () => stopNavigation(true));
    $('openSettings').addEventListener('click', () => { tactile(8); $('settingsPanel').hidden = false; });
    $('abRouteBtn')?.addEventListener('click', async () => {
      const a = $('abOrigin')?.value?.trim() || '台北市中心';
      const b = $('abTarget')?.value?.trim();
      if (!b) { toast('請輸入 B 點目的地'); $('abTarget')?.focus(); return; }
      await planRoute(a, b, { preference: 'recommended' });
      openIntelResults();
    });
    $('abSwap')?.addEventListener('click', async () => {
      const a = $('abOrigin')?.value?.trim() || '台北市中心';
      const b = $('abTarget')?.value?.trim();
      if (!b) return;
      $('abOrigin').value = b; $('abTarget').value = a;
      await planRoute(b, a, { preference: 'recommended' });
      openIntelResults();
    });
    $('abTarget')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('abRouteBtn')?.click(); } });

    $('shareBtn')?.addEventListener('click', shareCurrentView);
    $('threatDismiss')?.addEventListener('click', () => { $('threatAlert').hidden = true; $('app').classList.remove('condition-red'); });
    $('threatCompare')?.addEventListener('click', () => { $('threatAlert').hidden = true; $('app').classList.remove('condition-red'); state.intelOpen = true; $('intelPanel').classList.add('open'); $('intelCollapse').textContent = '−'; $('routeCard')?.scrollIntoView?.({ behavior: state.motion ? 'smooth' : 'auto', block: 'center' }); });
    document.querySelectorAll('[data-sensor]').forEach((btn) => btn.addEventListener('click', () => setSensorMode(btn.dataset.sensor)));
    document.querySelectorAll('[data-map-source]').forEach((btn) => btn.addEventListener('click', () => setMapSource(btn.dataset.mapSource))); 
    document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => $(btn.dataset.close).hidden = true));
    document.querySelectorAll('[data-command]').forEach((btn) => btn.addEventListener('click', () => { tactile(8); runCommand(btn.dataset.command); }));
    document.querySelectorAll('[data-mission]').forEach((btn) => btn.addEventListener('click', () => { tactile(10); runMissionMode(btn.dataset.mission); }));
    $('intelCollapse').addEventListener('click', toggleIntel);
    $('intelPanel').querySelector('.panel-head').addEventListener('click', (e) => { if (window.innerWidth <= 920 && e.target.id !== 'intelCollapse') toggleIntel(); });
    $('cameraSignal').addEventListener('click', () => runCommand('cctv'));
    $('newsSignal').addEventListener('click', () => runCommand('news'));
    $('speedSignal').addEventListener('click', () => runCommand('speed'));
    $('trafficSignal').addEventListener('click', () => runCommand('traffic'));
    $('flowSignal').addEventListener('click', () => runCommand('traffic'));
    $('airSignal')?.addEventListener('click', () => { const c = getOpsCenter(); loadFlights(c.lat, c.lon, true, 160); });
    $('quakeSignal')?.addEventListener('click', () => { const c = getOpsCenter(); loadEarthquakes(c.lat, c.lon, true, 420); });
    $('sourceSignal').addEventListener('click', () => toast('ZERO-KEY：OSM / Open-Meteo / OSRM / 高速公路局 / 警廣 / 警政署 / ADSB.lol / USGS / 公開新聞來源')); 
    bindToggle('motionToggle', (active) => { state.motion = active; $('app').classList.toggle('motion-off', !active); toast(active ? '動態情報介面已啟用' : '動態情報介面已關閉'); });
    bindToggle('mapFxToggle', (active) => { state.mapFx = active; $('map').classList.toggle('map-fx', active); });
    bindToggle('weatherAutoToggle', (active) => { state.weatherAuto = active; });
    bindToggle('speechToggle', (active) => { state.speech = active; if (active) speak('語音回饋已啟用'); });
    bindToggle('vehicleIntelToggle', (active) => { state.vehicleIntel = active; if (state.activeCamera) renderCameraIntel(state.activeCamera); toast(active ? '交通情報輔助已啟用；不進行車牌辨識' : '交通情報輔助已關閉'); });
    bindToggle('speedAlertToggle', (active) => { state.speedAlerts = active; state.speedLayer?.eachLayer?.((layer) => { if (layer.setOpacity) layer.setOpacity(active ? 1 : 0); }); toast(active ? '公開測速點警示已啟用' : '公開測速點警示已關閉'); });
    bindToggle('cameraHandoffToggle', (active) => { state.cameraHandoff = active; if (!active) $('navCameraHandoff').hidden = true; toast(active ? 'CCTV 自動接管已啟用' : 'CCTV 自動接管已關閉'); });
    bindToggle('transferFxToggle', (active) => { state.transferFx = active; toast(active ? '戰術地點轉場已啟用' : '戰術地點轉場已關閉'); });
    bindToggle('privacyShieldToggle', (active) => { state.privacyShield = active; applyPrivacyShield(); toast(active ? 'CCTV 隱私遮罩已啟用' : 'CCTV 隱私遮罩已關閉；仍不進行車牌辨識'); });
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.deferredInstall = e; $('installBtn').hidden = false; });
    $('installBtn').addEventListener('click', async () => { if (!state.deferredInstall) return; state.deferredInstall.prompt(); await state.deferredInstall.userChoice; state.deferredInstall = null; $('installBtn').hidden = true; });
    window.addEventListener('online', updateNetworkState); window.addEventListener('offline', updateNetworkState);
    window.addEventListener('pagehide', () => { if (state.navigation.active) stopNavigation(false); });
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
      if (command === 'locate') return await locateUser();
      if (command === 'voice') return startVoice();
      if (command === 'search') return $('queryInput').focus();
      if (command === 'route') {
        if (!state.target || state.target.bootstrap) { $('queryInput').focus(); return toast('輸入目的地即可自動建立點到點路線'); }
        const origin = await preferredOrigin();
        return await planRoute(origin, state.target, { preference: 'recommended' });
      }
      if (command === 'weather') { const c = state.target || state.user || state.map.getCenter(); return await loadWeather(c.lat, c.lon ?? c.lng, true); }
      if (command === 'cctv') { const c = state.target || state.user || state.map.getCenter(); return await loadCctv(c.lat, c.lon ?? c.lng, true); }
      if (command === 'speed') { const c = state.target || state.user || state.map.getCenter(); return await loadSpeedCameras(c.lat, c.lon ?? c.lng, true); }
      if (command === 'news') { const c = state.target || state.user || state.map.getCenter(); return await loadNews(c.lat, c.lon ?? c.lng, true); }
      if (command === 'traffic') { const c = state.target || state.user || state.map.getCenter(); return await Promise.allSettled([loadTraffic(c.lat, c.lon ?? c.lng, true), loadFlow(c.lat, c.lon ?? c.lng, true)]); }
    } catch (err) { toast(err.message, 4200); }
  }

  function toggleIntel() {
    state.intelOpen = !state.intelOpen;
    $('intelPanel').classList.toggle('open', state.intelOpen);
    $('intelCollapse').textContent = state.intelOpen ? '−' : '+';
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
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    runBootSequence(); initMap(); bindUi(); bootPwa(); updateClock(); setInterval(updateClock, 1000); updateNetworkState(); updateOriginUi();
    const shared = new URLSearchParams(location.search).has('lat');
    setTheaterStandby(!shared); restoreSharedView();
    if (!shared) setTimeout(() => bootstrapDefaultCenter().catch(() => {}), 260);
  });
})();
