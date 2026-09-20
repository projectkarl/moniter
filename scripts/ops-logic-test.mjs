import fs from 'node:fs';
import vm from 'node:vm';

let source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
source = source.replace(/\}\)\(\);\s*$/, `globalThis.__OPS_TEST__ = { findFlowAnomalies, routePosition, parseTravelIntent, selectRoute, umbrellaAdvice, forecastForArrival, speedAlertEarlyKm, localPoiMatches, assessRouteThreat, tunnelLaneContext, routeOperationalScore, areaThreatAssessment, flowTrend };\n})();`);
const sandbox = {
  globalThis: null,
  window: { matchMedia() { return { matches:false }; } },
  document: { addEventListener() {}, getElementById() { return null; } },
  navigator: {},
  console,
  setTimeout, clearTimeout,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'app.js' });
const { findFlowAnomalies, routePosition, parseTravelIntent, selectRoute, umbrellaAdvice, forecastForArrival, speedAlertEarlyKm, localPoiMatches, assessRouteThreat, tunnelLaneContext, routeOperationalScore, areaThreatAssessment, flowTrend } = sandbox.__OPS_TEST__ || {};
if (!findFlowAnomalies || !routePosition || !parseTravelIntent || !selectRoute || !umbrellaAdvice || !forecastForArrival || !speedAlertEarlyKm || !localPoiMatches || !assessRouteThreat || !tunnelLaneContext || !routeOperationalScore || !areaThreatAssessment || !flowTrend) throw new Error('Ops test hooks unavailable');

const flow = [
  { road: 'N5', travelSpeed: 18, speedLimit: 90 },
  { road: 'N5', travelSpeed: 72, speedLimit: 90 },
  { road: 'N5', travelSpeed: 80, speedLimit: 90 },
];
const anomalies = findFlowAnomalies(flow);
if (anomalies.length !== 1 || anomalies[0].severity !== 'HIGH') throw new Error(`Sentinel mismatch: ${JSON.stringify(anomalies)}`);

const route = { geometry: { coordinates: [[121.50,25.00],[121.55,25.05],[121.60,25.10]] } };
const near = routePosition(route, { lat: 25.051, lon: 121.551 });
const far = routePosition(route, { lat: 24.0, lon: 120.0 });
if (!(near.distance < 1 && near.progress > 0.2 && near.progress < 0.8)) throw new Error(`Route position mismatch: ${JSON.stringify(near)}`);
if (!(far.distance > 100)) throw new Error(`Route distance mismatch: ${JSON.stringify(far)}`);


const voice = parseTravelIntent('我等下要去LaLaport南港，現在會塞車嗎需要帶傘嗎');
if (!voice || voice.origin !== '我的位置' || voice.target !== 'LaLaport南港' || !voice.wantsTraffic || !voice.wantsWeather || !voice.wantsUmbrella || voice.preference !== 'recommended') {
  throw new Error(`Voice intent mismatch: ${JSON.stringify(voice)}`);
}

const arrow = parseTravelIntent('北車 → 101');
if (!arrow || arrow.origin !== '北車' || arrow.target !== '101') throw new Error(`Arrow point-to-point intent failed: ${JSON.stringify(arrow)}`);

const fastestIntent = parseTravelIntent('從台北車站到桃園機場最快怎麼走');
if (!fastestIntent || fastestIntent.origin !== '台北車站' || fastestIntent.target !== '桃園機場' || fastestIntent.preference !== 'fastest') {
  throw new Error(`Fastest intent mismatch: ${JSON.stringify(fastestIntent)}`);
}
const routeChoices = [
  { distance: 11000, duration: 1500, id: 'short' },
  { distance: 12500, duration: 1200, id: 'fast' },
];
if (selectRoute(routeChoices, 'shortest')?.id !== 'short') throw new Error('Shortest route selection failed');
if (selectRoute(routeChoices, 'fastest')?.id !== 'fast') throw new Error('Fastest route selection failed');
if (!umbrellaAdvice({ precipitationProbability: 70, precipitation: 0, weatherCode: 2 }).shouldCarry) throw new Error('Umbrella high-rain rule failed');
if (umbrellaAdvice({ precipitationProbability: 5, precipitation: 0, weatherCode: 1 }).shouldCarry) throw new Error('Umbrella dry rule failed');
const forecast = forecastForArrival({ hourly: [
  { time: new Date(Date.now() + 10 * 60000).toISOString(), temperature: 28, precipitationProbability: 10 },
  { time: new Date(Date.now() + 70 * 60000).toISOString(), temperature: 26, precipitationProbability: 80 },
]}, 65);
if (forecast?.temperature !== 26) throw new Error(`Arrival forecast failed: ${JSON.stringify(forecast)}`);
if (!(speedAlertEarlyKm(95) > speedAlertEarlyKm(60) && speedAlertEarlyKm(60) > speedAlertEarlyKm(30))) throw new Error('Adaptive speed alert distance failed');


const farPoi = localPoiMatches('遠百');
if (farPoi.length < 4 || !farPoi.some((x) => /板橋/.test(x.label)) || !farPoi.some((x) => /台中/.test(x.label))) throw new Error('Local POI branch suggestions failed');
const threat = assessRouteThreat({ traffic:[{road:'國5',description:'事故占用車道'},{road:'國5',description:'回堵'}], flow:[{travelSpeed:18},{travelSpeed:22},{travelSpeed:31}], anomalies:[{severity:'HIGH',travelSpeed:18,road:'國5'},{severity:'HIGH',travelSpeed:22,road:'國5'}], avgSpeed:24, minSpeed:18 }, { precipitationProbability:80 });
if (threat.level !== 'red' || threat.reasons.length < 3) throw new Error(`Critical threat logic failed: ${JSON.stringify(threat)}`);
const tunnel = tunnelLaneContext({name:'蘭潭隧道 CCTV',road:'國道3號',lat:23.4,lon:120.5},{road:'國道3號'});
if (!tunnel.active || !/蘭潭/.test(tunnel.name)) throw new Error(`Generic tunnel context failed: ${JSON.stringify(tunnel)}`);
const cleanScore = routeOperationalScore({ duration:2400, intel:{ traffic:[], anomalies:[], avgSpeed:80 } });
const riskScore = routeOperationalScore({ duration:2300, intel:{ traffic:[{}], anomalies:[{severity:'HIGH'}], avgSpeed:30 } });
if (!(riskScore > cleanScore)) throw new Error('Operational route scoring failed');
const area = areaThreatAssessment({weather:{current:{precipitationProbability:80}},traffic:[{title:'事故'}],construction:[{impactTraffic:true}],aqi:{aqi:130},flood:[]});
if(area.level==='nominal') throw new Error('Area threat assessment failed');
if(flowTrend([{avg:80,slow:0},{avg:42,slow:3}]).code!=='EXPANDING') throw new Error('Flow trend expansion failed');
if(flowTrend([{avg:35,slow:4},{avg:62,slow:1}]).code!=='RECOVERING') throw new Error('Flow trend recovery failed');
console.log('OPS LOGIC PASS');
