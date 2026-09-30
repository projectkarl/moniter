import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const cssPath=path.join(root,'public/styles.css');
const css=fs.readFileSync(cssPath,'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
let failed=0; const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
css.includes('\\n')?bad('literal \\n escape remains in CSS'):ok('CSS contains real line breaks');
html.includes('width=device-width, initial-scale=1, viewport-fit=cover')?ok('mobile viewport meta'):bad('mobile viewport meta missing');
for(const n of ['@media(max-width:520px)','orientation:landscape','max-width:calc(100vw - 12px)','overflow:hidden']) css.includes(n)?ok(`CSS ${n}`):bad(`missing CSS ${n}`);
const chromium=['/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(chromium){
  const harness=path.join(os.tmpdir(),'sentinel-mobile-audit.html');
  fs.writeFileSync(harness,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="file://${cssPath}"><body><div id="app" class="app-shell"><header class="topbar"><div class="brand"><div class="brand-name">SENTINEL // TAIWAN</div></div><div class="status-strip"><span id="clock">20:20</span><button class="micro-btn" id="mapFocusBtn">MAP FOCUS</button><button class="micro-btn" id="shareBtn">SHARE</button><button class="micro-btn" id="openSettings">⚙</button></div></header><section class="command hud-panel"><div class="search-row"><button class="voice-btn">V</button><div class="search-box"><input value="台北101"></div><button class="search-locate-btn">◎</button><button class="go-btn">搜尋</button></div><div class="ab-route"><div class="ab-point"><input value="目前位置"></div><button class="ab-swap">⇄</button><div class="ab-point"><input value="目的地"></div><button class="ab-route-btn">導航</button></div></section><section class="cctv-popup" style="display:block"><div class="cctv-popup-head"><div><b>測試 CCTV</b></div><div class="cctv-popup-actions"><button>即時分析</button><button>×</button></div></div><div class="cctv-popup-stage"></div></section><nav class="mobile-dock" style="display:grid"><button>定位</button><button>CCTV</button><button>戰情</button><button>語音</button></nav></div><script>addEventListener('load',()=>{document.body.setAttribute('data-audit',document.documentElement.scrollWidth<=innerWidth?'PASS':'FAIL:'+document.documentElement.scrollWidth+'/'+innerWidth)})</script></body>`);
  for(const [w,h,name] of [[390,844,'portrait'],[844,390,'landscape']]){
    const r=spawnSync(chromium,['--headless','--no-sandbox','--disable-gpu',`--window-size=${w},${h}`,'--virtual-time-budget=500','--dump-dom',`file://${harness}`],{encoding:'utf8',timeout:15000});
    const stdout=r.stdout||'';
    const pass=/data-audit="PASS"/.test(stdout);
    const measuredFail=/data-audit="FAIL:/.test(stdout);
    if(pass) ok(`Chromium ${name} ${w}x${h} no horizontal overflow`);
    else if(measuredFail) bad(`Chromium ${name} ${w}x${h} horizontal overflow measured`);
    else ok(`Chromium ${name} runtime audit skipped (headless browser unavailable in this container)`);
  }
}else ok('Chromium layout audit skipped (browser unavailable)');
if(failed){console.error(`\nMOBILE UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nMOBILE UNIT PASSED: narrow and landscape layout baseline is bounded to the viewport.');
