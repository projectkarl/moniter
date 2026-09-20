import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const required = [
  'index.html','styles.css','app.js','manifest.webmanifest','sw.js','vercel.json',
  'api/_utils.js','api/geocode.js','api/weather.js','api/route.js','api/cctv.js','api/traffic.js','api/flow.js','api/lane-flow.js','api/news.js','api/speed-cameras.js','api/flights.js','api/earthquakes.js','api/health.js'
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
for (const id of ['map','queryInput','voiceBtn','intelPanel','routeDrawer','cameraDrawer','settingsPanel','flowStatus','flowSignal','sweepFx','opsDrawer','opsBody','wallDrawer','wallGrid','wallMain','newsSignal','newsCount','bootSequence','bootStatus','signalTrace','targetLock','targetLockName','targetLockCoord','gridTelemetry','linkTelemetry','motionToggle','theaterStandby','navHud','navSpeed','navHeading','navRemaining','navEta','navAlert','navCameraHandoff','navCameraThumb','navLimitBadge','routeMode','routeOptions','threatAlert','threatReasons','targetBrief','poiSuggestions','airSignal','quakeSignal']) {
  if (!html.includes(`id="${id}"`)) { console.error('DOM ID MISSING',id); failed = true; }
}
const source = required.filter((x) => x.endsWith('.js')).map((x) => fs.readFileSync(path.join(root,x),'utf8')).join('\n');
for (const forbidden of ['TDX_CLIENT_ID','TDX_CLIENT_SECRET','CWA_KEY','OPENAI_KEY']) {
  if (source.includes(forbidden)) { console.error('ZERO-KEY FAIL', forbidden); failed = true; }
}
if (!html.includes('0.12.0 PRE-MISSION COMMAND')) { console.error('BUILD LABEL MISSING'); failed = true; }
for (const id of ['vehicleIntelToggle','privacyShieldToggle','cameraIntel']) {
  if (!html.includes(`id=\"${id}\"`)) { console.error('PRIVACY DOM MISSING', id); failed = true; }
}
if (!html.includes('NO PLATE OCR')) { console.error('PRIVACY LABEL MISSING'); failed = true; }
for (const mission of ['sweep','mission','watch','sentinel','theater']) {
  if (!html.includes(`data-mission=\"${mission}\"`)) { console.error('MISSION ENTRY MISSING', mission); failed = true; }
}
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
for (const fn of ['runAreaSweep','runSentinel','openCctvWall','buildMissionRouteBrief','runMissionMode','loadNews','newsListHtml','runBootSequence','signalAcquire','showTargetLock','flashSignal','updateMapTelemetry','setTheaterStandby','parseTravelIntent','selectRoute','forecastForArrival','umbrellaAdvice','missionVoiceBrief','speedAlertEarlyKm','announceSpeedCamera','assessRouteThreat','renderRouteOptions','runTheaterMode','setMapSource','localPoiMatches','tunnelLaneContext']) {
  if (!app.includes(`function ${fn}`) && !app.includes(`async function ${fn}`)) { console.error('MISSION LOGIC MISSING', fn); failed = true; }
}
if (!app.includes("command === 'news'")) { console.error('LOCAL NEWS COMMAND MISSING'); failed = true; }
if (!app.includes('sentinelLayer')) { console.error('SENTINEL LAYER MISSING'); failed = true; }

if (!app.includes('handleSearch(transcript, { fromVoice: true })')) { console.error('VOICE MISSION CONTEXT MISSING'); failed = true; }
if (!app.includes("'lalaport南港'")) { console.error('LALAPORT ALIAS MISSING'); failed = true; }
if (!app.includes('ENF LIMIT')) { console.error('NAV LIMIT HUD MISSING'); failed = true; }

for (const snippet of ['CRITICAL TRAFFIC ALERT','CONGESTION CASCADE','data-map-source="satellite"','LIVE VISION ANALYTICS']) {
  if (!app.includes(snippet) && !html.includes(snippet)) { console.error('V12 FEATURE MISSING', snippet); failed = true; }
}
for (const shorthand of ["'101'","'a11'","'台大'","'宜大'","'北科大'","'北車'","'南科'","'晶華'"]) {
  if (!app.includes(shorthand)) { console.error('SHORTHAND MISSING', shorthand); failed = true; }
}

if (failed) process.exit(1);
console.log('SMOKE PASS');
