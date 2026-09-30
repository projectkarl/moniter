import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
let failed=0; const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
for(const needle of ['lowLatencyMode: false','maxBufferLength: 30','liveSyncDurationCount: 3','recoverMediaError','function waitForVideoFrame(','function nextVisionCadence(','maxW = window.innerWidth <= 920 ? 360 : 480','model.detect(canvas, 18, 0.42)','runAuthorizedAnpr(found, canvas, tracking, cam).catch(()=>{})']) app.includes(needle)?ok(needle):bad(`missing ${needle}`);
for(const needle of ['即時分析','分析會自動降載，以維持影片播放順暢','2.4.0 CF']) html.includes(needle)?ok(needle):bad(`missing UI ${needle}`);
if(failed){console.error(`\nPLAYBACK UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nPLAYBACK UNIT PASSED: buffered HLS and adaptive non-blocking analysis wiring are present.');
