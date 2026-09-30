import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
let failed=0; const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
for(const needle of [
  'function installPlaybackGuard(',
  "video.addEventListener('pause', onPause)",
  "video.addEventListener('waiting', onWaiting)",
  'hls?.startLoad?.(-1)',
  'highBufferWatchdogPeriod: 2',
  'nudgeMaxRetry: 5',
  'fragLoadingMaxRetry: 6',
  "clearCameraStage($('inlineCameraStage'));",
  "if (cam && $('inlineCameraStage')) renderCameraMedia($('inlineCameraStage'), cam);",
  'function waitForVideoFrame(',
  'runAuthorizedAnpr(found, canvas, tracking, cam).catch(()=>{})'
]) app.includes(needle)?ok(needle):bad(`missing ${needle}`);
for(const needle of ['即時分析','2.5.0 CF','持續播放 · 即時分析']) html.includes(needle)?ok(needle):bad(`missing UI ${needle}`);
if(failed){console.error(`\nPLAYBACK UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nPLAYBACK UNIT PASSED: continuous playback guard, HLS stall recovery and single-stream popup wiring are present.');
