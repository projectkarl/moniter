import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const required = [
  'index.html','styles.css','app.js','manifest.webmanifest','sw.js','vercel.json',
  'api/data.js','api/cctv-feed.js','server/_utils.js','server/cctv-registry.js','server/geocode.js','server/reverse-geocode.js','server/weather.js','server/route.js','server/cctv.js','server/traffic.js','server/flow.js','server/lane-flow.js','server/news.js','server/speed-cameras.js','server/flights.js','server/earthquakes.js','server/health.js','server/air-quality.js','server/city-flow.js','server/parking.js','server/construction.js','server/flood.js'
];
let failed = false;
for (const file of required) {
  const p = path.join(root,file);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) { console.error('MISSING', file); failed = true; }
  else console.log('OK', file, fs.statSync(p).size);
}
for (const file of ['manifest.webmanifest','vercel.json']) {
  try { JSON.parse(fs.readFileSync(path.join(root,file),'utf8')); console.log('JSON OK',file); }
  catch (e) { console.error('JSON FAIL',file,e.message); failed = true; }
}
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const id of ['map','queryInput','voiceBtn','intelPanel','routeDrawer','cameraDrawer','settingsPanel','flowStatus','flowSignal','sweepFx','opsDrawer','opsBody','wallDrawer','wallGrid','wallMain','newsSignal','newsCount','bootSequence','bootStatus','signalTrace','targetLock','targetLockName','targetLockCoord','gridTelemetry','linkTelemetry','motionToggle','theaterStandby','navHud','navViewBtn','navImmersive','immersiveHeading','immersiveArrow','immersiveSpeed','immersiveCctv','navSpeed','navHeading','navRemaining','navEta','navAlert','navCameraHandoff','navCameraThumb','navLimitBadge','routeMode','routeOptions','threatAlert','threatReasons','targetBrief','poiSuggestions','airSignal','quakeSignal','originChip','originLabel','inlineCameraCard','inlineCameraStage','inlineCameraChoices','routeRecommendation','abOrigin','abTarget','abSwap','abRouteBtn','autoIntelCard','autoIntelOverview','autoTrafficFeed','autoNewsFeed','autoSignalFeed','situationCard','situationBrief','situationAqi','situationFlood','situationWork','situationParking','floodFeed','parkingFeed','constructionFeed','freshnessFeed','watchZoneBtn','watchZoneList','routeTimeMachine','routeFlowTrend','routeFlowHistory','routeTimeRange','routeTimeValue','nationalOverview','nationalCriticalCount','nationalEventCount','nationalCameraCount','nationalAvgFlow','nationalHotspotList','nationalPreviewStage','nationalPreviewTitle','nationalStatusText','nationalResetBtn']) {
  if (!html.includes(`id="${id}"`)) { console.error('DOM ID MISSING',id); failed = true; }
}
const source = required.filter((x) => x.endsWith('.js')).map((x) => fs.readFileSync(path.join(root,x),'utf8')).join('\n');
for (const forbidden of ['TDX_CLIENT_ID','TDX_CLIENT_SECRET','CWA_KEY','OPENAI_KEY']) {
  if (source.includes(forbidden)) { console.error('ZERO-KEY FAIL', forbidden); failed = true; }
}
if (!html.includes('0.39.0 HIGHWAY LIVE + NAV VISION')) { console.error('BUILD LABEL MISSING'); failed = true; }
for (const id of ['vehicleIntelToggle','privacyShieldToggle','cameraIntel']) {
  if (!html.includes(`id=\"${id}\"`)) { console.error('PRIVACY DOM MISSING', id); failed = true; }
}
if (!html.includes('NO PLATE OCR')) { console.error('PRIVACY LABEL MISSING'); failed = true; }
for (const mission of ['sweep','watch','theater']) {
  if (!html.includes(`data-mission=\"${mission}\"`)) { console.error('MISSION ENTRY MISSING', mission); failed = true; }
}
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
for (const fn of ['runAreaSweep','runSentinel','openCctvWall','buildMissionRouteBrief','runMissionMode','loadNews','newsListHtml','runBootSequence','signalAcquire','showTargetLock','flashSignal','updateMapTelemetry','setTheaterStandby','parseTravelIntent','selectRoute','forecastForArrival','umbrellaAdvice','missionVoiceBrief','speedAlertEarlyKm','announceSpeedCamera','assessRouteThreat','renderRouteOptions','runTheaterMode','setMapSource','localPoiMatches','tunnelLaneContext','renderInlineCctvResults','bootstrapDefaultCenter','preferredOrigin','renderAutoIntel','renderSituationIntel','loadExtendedIntel','areaThreatAssessment','renderFlowTimeMachine','toggleWatchZone','renderNationalOverview','selectNationalHotspot','enterNationalMode','exitNationalMode','nationalReason','refreshNationalSignals','searchCctvByText','openCctvSearchMatch','setNavigationViewMode','renderImmersiveNavigation']) {
  if (!app.includes(`function ${fn}`) && !app.includes(`async function ${fn}`)) { console.error('MISSION LOGIC MISSING', fn); failed = true; }
}
if (!app.includes("command === 'news'")) { console.error('LOCAL NEWS COMMAND MISSING'); failed = true; }
if (!app.includes('sentinelLayer')) { console.error('SENTINEL LAYER MISSING'); failed = true; }

if (!app.includes('function syncLocalPrivacyMask')) { console.error('LOCAL PRIVACY ROI LOGIC MISSING'); failed = true; }
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
if (!css.includes('.privacy-local-mask')) { console.error('LOCAL PRIVACY ROI STYLE MISSING'); failed = true; }
if (!css.includes('filter:none!important')) { console.error('FULL-FRAME PRIVACY BLUR OVERRIDE MISSING'); failed = true; }

if (!app.includes('handleSearch(transcript, { fromVoice: true })')) { console.error('VOICE MISSION CONTEXT MISSING'); failed = true; }
if (!app.includes("'lalaport南港'")) { console.error('LALAPORT ALIAS MISSING'); failed = true; }
if (!app.includes('ENF LIMIT')) { console.error('NAV LIMIT HUD MISSING'); failed = true; }

for (const snippet of ['CRITICAL TRAFFIC ALERT','CONGESTION CASCADE','data-map-source="satellite"','LIVE VISION ANALYTICS']) {
  if (!app.includes(snippet) && !html.includes(snippet)) { console.error('V12 FEATURE MISSING', snippet); failed = true; }
}
for (const shorthand of ["'101'","'a11'","'台大'","'宜大'","'北科大'","'北車'","'南科'","'晶華'"]) {
  if (!app.includes(shorthand)) { console.error('SHORTHAND MISSING', shorthand); failed = true; }
}


if (!app.includes("const NATIONAL_CENTER") || !app.includes("setView([NATIONAL_CENTER.lat, NATIONAL_CENTER.lon]")) { console.error('NATIONAL DEFAULT VIEW MISSING'); failed = true; }
if (!app.includes("loadFlow(NATIONAL_CENTER.lat, NATIONAL_CENTER.lon, false, 220)")) { console.error('NATIONAL FLOW BOOTSTRAP MISSING'); failed = true; }
if (!app.includes("{ draw:false }")) { console.error('NATIONAL DECLUTTER MISSING'); failed = true; }
if (!html.includes('TAIWAN NATIONAL GRID')) { console.error('NATIONAL WATCH UI MISSING'); failed = true; }

if (failed) process.exit(1);
console.log('SMOKE PASS');
