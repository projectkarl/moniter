const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('styles.css','utf8');
const app = fs.readFileSync('app.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');
function ok(cond, msg){ if(!cond){ console.error('FAIL', msg); process.exitCode=1; } else console.log('PASS', msg); }
ok(html.includes('0.39.0 HIGHWAY LIVE + NAV VISION'),'v0.37 build label');
ok(html.includes('SIDE INTELLIGENCE // 地圖外戰情'),'side intelligence label');
ok(html.includes('data-command="intel"'),'mobile intel action');
ok(css.includes('#app.intel-results-open #map{right:var(--v37-side-w)!important}'),'desktop map reserves side-intel width');
ok(css.includes('.intel.open{transform:translateX(0)!important;opacity:1!important;pointer-events:auto!important}'),'side intel open state');
ok(css.includes('.mobile-dock{grid-template-columns:repeat(4,1fr)!important}'),'four-action mobile dock');
ok(css.includes('.map-live-cctv-card:before'),'spy-style live CCTV card retained');
ok(app.includes('renderTargetCctvPreviews(place, r || [])'),'CCTV quick action renders on-map previews');
ok(app.includes("if (command === 'intel')"),'intel command toggles side drawer');
ok(app.includes('function syncIntelMapLayout()'),'map resize after side panel transition');
ok(app.includes('const mapWidth = Math.max(320, window.innerWidth - side);'),'large CCTV centers in map workspace');
ok(sw.includes('eye-taiwan-shell-v390'),'service worker v370');
if(!process.exitCode) console.log('V0.37 MAP OPS + SIDE INTEL PASS');
