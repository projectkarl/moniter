const fs=require('fs');
const { approximateRegionByCoordinate, resolveCameraRegion }=require('../server/cctv-registry');
let failed=false; function ok(v,m){ if(!v){failed=true;console.error('FAIL:',m)} else console.log('PASS:',m) }
const app=fs.readFileSync('app.js','utf8'); const css=fs.readFileSync('styles.css','utf8'); const feed=fs.readFileSync('api/cctv-feed.js','utf8');
ok(approximateRegionByCoordinate(25.033968,121.564468)==='臺北市','Taipei 101 county inference');
ok(approximateRegionByCoordinate(25.0114,121.4618)==='新北市','Banqiao county inference');
ok(approximateRegionByCoordinate(24.757,121.753)==='宜蘭縣','Yilan county inference');
ok(approximateRegionByCoordinate(24.1477,120.6736)==='臺中市','Taichung county inference');
ok(resolveCameraRegion({lat:25.0339,lon:121.5644,road:'信義松智',region:'全台國道'}).region==='臺北市','generic nationwide source corrected by coordinate');
ok(resolveCameraRegion({lat:22.99,lon:120.22,road:'臺南市中西區民生路',region:'全台省道'}).region==='臺南市','explicit camera text outranks generic source');
ok(app.includes('layoutTargetCctvPreviews') && app.includes('rectsOverlap'),'map CCTV collision-aware layout');
ok(app.includes('openMapCctvPreview(cam)') && app.includes('openCctvPopup();'),'map CCTV click opens large popup directly');
ok(app.includes("renderCameraMedia(stage, cam, { fast:true, preview:true })"),'map previews use fast playback path');
ok(app.includes('armVideoAutoplay') && app.includes("setAttribute('playsinline','')"),'autoplay retry/playsinline present');
ok(feed.includes("obviousKind !== 'unknown'") && feed.includes('30 * 60 * 1000'),'feed skips redundant probes and caches media resolution');
ok(css.includes('點擊放大') && css.includes('translate3d(var(--cctv-dx'),'preview affordance and dynamic offsets styled');
if(failed) process.exit(1); console.log('V0.35 CCTV REGION + LAYOUT + PLAYBACK PASS');
