import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
let failed=0; const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
const required=[
  'const key = `TURN:${next.index}`',
  'const key = `SPEED:${cam.id}`',
  "speak(`${lead}${action}。`, true)",
  "speak(`前方約 ${meters} 公尺有公開測速執法點${limit}。`, true)",
];
for(const n of required) app.includes(n)?ok(n):bad(`missing ${n}`);
for(const n of ['TURN:${next.index}:${threshold}','SPEED:${cam.id}:${threshold}','提早提醒','再次提醒']) !app.includes(n)?ok(`removed repeated cue ${n}`):bad(`repeated cue remains ${n}`);
!app.includes('導航情報模式已啟動。行車請以道路現場標誌與官方號誌為準。')?ok('navigation start speech removed'):bad('navigation start speech still present');

!app.includes("speak('警告。規劃路線偵測到嚴重壅塞或交通事件。已顯示原因與替代路線。', true)")?ok('traffic-risk speech removed during navigation'):bad('traffic-risk speech still present');
!app.includes('speak(`路線已重新規劃，預計剩餘約 ${Math.round(selected.duration/60)} 分鐘。`, true)')?ok('reroute speech removed'):bad('reroute speech still present');
if(failed){console.error(`\nNAV UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nNAV UNIT PASSED: turn and speed-camera speech are one-shot near-event cues.');
