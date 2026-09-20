import fs from 'node:fs';
const app = fs.readFileSync(new URL('../app.js', import.meta.url),'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url),'utf8');
const route = fs.readFileSync(new URL('../server/route.js', import.meta.url),'utf8');
const checks = [
  ['OSRM steps enabled', route.includes('steps=true') && route.includes('compactStep')],
  ['turn instruction DOM', ['navTurnArrow','navTurnText','navTurnDistance','navTurnRoad'].every(x=>html.includes(`id="${x}"`))],
  ['turn guidance logic', app.includes('nextNavigationStep') && app.includes('announceTurnStep') && app.includes('navTurnText')],
  ['look-ahead map follow', app.includes('routePointAtKm') && app.includes('lookAheadKm') && app.includes('state.map.panTo')],
  ['automatic reroute', app.includes('rerouteNavigation') && app.includes("'RECALCULATING'") && app.includes('offRouteHits >= 2')],
  ['navigation mode class', app.includes("classList.add('nav-driving')") && css.includes('#app.nav-driving')],
  ['speed alert preserved', app.includes('speedAlertEarlyKm') && app.includes('announceSpeedCamera') && app.includes('ENF LIMIT')],
  ['navigation right-panel layout', css.includes('#app.nav-driving #intelBody>:not(#navHud)')],
];
let failed=false;
for(const [name,ok] of checks){ console.log(ok?'PASS':'FAIL',name); if(!ok) failed=true; }
if(failed) process.exit(1);
console.log('NAV V26 PASS');
