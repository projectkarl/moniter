import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
let failed=0; const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
for(const needle of [
  'async function resolveCameraPlayback(',
  "&resolve=1",
  'function renderResolvedMedia(',
  "setPlaybackPath(stage,sourcePath,'hls')",
  'lowLatencyMode:true',
  'liveSyncDurationCount:2',
  'maxBufferLength:8',
  'function installPlaybackGuard(',
  'performance.now()-lastProgressAt > 9000',
  'function drawLatestAnalysisFrame(',
  'snapshotProxyUrl',
  'ctx.getImageData(0,0,1,1)',
  'requestVideoFrameCallback',
  'state.visionCadenceMs=window.innerWidth<=920?620:420',
  'cameraPlaybackPriority(a)-cameraPlaybackPriority(b)',
  "const bridgeQuery = options.bridge === true ? '&bridge=1' : '&bridge=0'",
]) app.includes(needle)?ok(needle):bad(`missing ${needle}`);
for(const forbidden of ["video.addEventListener('pause', onPause)",'highBufferWatchdogPeriod: 2','maxBufferLength: 24','LIVE SENSOR // INLINE','ANPR MODE','PLATE SHIELD']) !app.includes(forbidden)?ok(`removed ${forbidden}`):bad(`legacy playback behavior remains: ${forbidden}`);
for(const needle of ['即時分析','INITIAL 1.0 CF','官方來源優先 · 即時影像','即時監視器']) html.includes(needle)?ok(needle):bad(`missing UI ${needle}`);
if(failed){console.error(`\nPLAYBACK UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nPLAYBACK UNIT PASSED: direct-source-first playback, proxy fallback and latest-frame analysis wiring are present.');
