const fs=require('fs');
const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
function ok(v,m){ if(!v){ console.error('FAIL',m); process.exitCode=1; } else console.log('PASS',m); }
ok(html.includes('0.38.0 ORIGINAL SOURCE + SCENIC FUSION'),'v0.33 build label');
ok(app.includes('cctvPreviewLayer'),'dedicated map CCTV preview layer');
ok(app.includes('renderTargetCctvPreviews(place, value(4, []))'),'search target auto-renders nearby CCTV cards');
ok(app.includes('targetCctvPreviewCandidates'),'nearest-camera cap present');
ok(css.includes('.map-live-cctv-card'),'map live CCTV card CSS present');
ok(app.includes('routeFreewayProfile'),'freeway corridor classifier present');
ok(app.includes("label:'一高優先'") && app.includes("label:'二高優先'"),'N1/N3 route labels present');
ok(app.includes('chooseTwoNavigationRoutes'),'two-route selector present');
ok(app.includes('state.routeCandidates = chooseTwoNavigationRoutes(routePool, { longTrip })'),'route planner keeps two comparable routes');
ok(!app.includes('national-hotspot-tag ${h.status'),'large national numeric hotspot labels removed');
ok(sw.includes('eye-taiwan-shell-v380'),'service worker cache v330');
if(!process.exitCode) console.log('V0.33 MAP CCTV + DUAL ROUTE PASS');
