import process from 'node:process';
const raw=process.env.BASE_URL || process.argv[2] || '';
if(!raw){ console.error('Usage: BASE_URL=https://your-worker.workers.dev npm run audit:cctv'); process.exit(2); }
const base=raw.replace(/\/$/,'');
const places=[
  ['Taipei',25.0330,121.5654],
  ['Taichung',24.1477,120.6736],
  ['Tainan',22.9948,120.1965],
  ['Freeway',24.9900,121.3000],
];
let hard=0, warnings=0;
async function json(path,timeout=15000){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),timeout); try{const r=await fetch(base+path,{signal:c.signal,headers:{accept:'application/json','cache-control':'no-cache'}}); const text=await r.text(); let d; try{d=JSON.parse(text)}catch{}; return {r,d,text};} finally{clearTimeout(t)} }
console.log(`CCTV live audit: ${base}`);
for(const [name,lat,lon] of places){
  try{
    const {r,d,text}=await json(`/api/data?action=cctv&lat=${lat}&lon=${lon}&radius=30&limit=36&bridge=0`);
    if(!r.ok || !Array.isArray(d?.items)){ console.error(`✗ ${name}: registry ${r.status} ${text.slice(0,120)}`); hard++; continue; }
    const items=d.items||[]; const playable=items.filter(x=>x?.streamUrl||x?.imageUrl); const pointOnly=items.length-playable.length;
    console.log(`✓ ${name}: ${items.length} official items · ${playable.length} media · ${pointOnly} point-only`);
    const sourceStatus=Array.isArray(d?.sourceStatus)?d.sourceStatus:[];
    for(const s of sourceStatus.slice(0,8)) console.log(`  ${s.ok && !s.stale?'✓':'△'} ${s.id||s.source}: ${s.count??0} · age ${s.cacheAgeSeconds??'?'}s${s.stale?' · STALE':''}${s.upstreamUpdatedAt?` · upstream ${s.upstreamUpdatedAt}`:''}`);
    let verified=0;
    for(const cam of playable.slice(0,5)){
      try{
        const q=await json(`/api/cctv-feed?id=${encodeURIComponent(cam.id)}&probe=1`,12000);
        if(q.r.ok && ['hls','mjpeg','image','video'].includes(q.d?.kind)){ verified++; console.log(`  ✓ ${cam.id}: ${q.d.kind}`); }
        else console.log(`  △ ${cam.id}: probe unavailable`);
      }catch(e){ console.log(`  △ ${cam.id}: ${e?.name||e}`); }
    }
    if(playable.length && !verified){ warnings++; console.log(`  △ ${name}: no playable probe among first ${Math.min(5,playable.length)} media candidates`); }
  }catch(e){ hard++; console.error(`✗ ${name}: ${e?.message||e}`); }
}
console.log(`\nRequired failures: ${hard}; upstream warnings: ${warnings}`);
if(hard) process.exit(1);
console.log('LIVE CCTV AUDIT COMPLETED');
