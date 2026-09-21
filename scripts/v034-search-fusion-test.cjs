const fs = require('fs');
let failed = false;
function ok(cond, msg){ if(!cond){ console.error('FAIL:', msg); failed=true; } else console.log('PASS:', msg); }

const app = fs.readFileSync('app.js','utf8');
const geo = fs.readFileSync('server/geocode.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const sw = fs.readFileSync('sw.js','utf8');
ok(html.includes('0.40.1 CCTV VISIBLE FIRST'),'v0.34 build label');
ok(sw.includes('eye-taiwan-shell-v401'),'service worker cache v340');
ok(app.includes("'華南總行': { name: '華南商業銀行總行'"),'front-end verified Huanan shorthand');
ok(app.includes("['華南商業銀行總行','華南商業銀行總行 臺北市信義區松仁路123號'"),'Huanan HQ search suggestion');
ok(geo.includes('VERIFIED_PLACES') && geo.includes('rankResults') && geo.includes('dedupeResults'),'search fusion/ranking pipeline');
ok(geo.includes('華南銀行總行') && geo.includes('25.0343') && geo.includes('121.5692'),'verified Huanan HQ target');
ok(geo.includes('Nominatim') && geo.includes('Photon') && geo.includes('normalizedQueries'),'multi-provider normalized search');
ok(geo.includes('銀行總行') && geo.includes('總部') && geo.includes('總公司'),'corporate shorthand expansions');

async function invoke(q, fetchImpl){
  global.fetch = fetchImpl;
  delete require.cache[require.resolve('../server/geocode')];
  delete require.cache[require.resolve('../server/_utils')];
  const handler = require('../server/geocode');
  let statusCode=200, payload=null;
  const res={
    setHeader(){},
    status(n){ statusCode=n; return this; },
    json(v){ payload=v; return this; }
  };
  await handler({method:'GET',query:{q}},res);
  return {statusCode,payload};
}

(async()=>{
  const wrongBranch = async (url)=>({
    ok:true,status:200,headers:{get(){return null;}},
    async text(){
      if(String(url).includes('nominatim')) return JSON.stringify([{display_name:'華南銀行 高雄某分行',lat:'22.63',lon:'120.30',type:'bank',category:'amenity',importance:0.8}]);
      return JSON.stringify({features:[]});
    }
  });
  const a = await invoke('華南總行', wrongBranch);
  ok(a.statusCode===200,'Huanan shorthand returns HTTP 200');
  ok(a.payload?.results?.[0]?.name==='華南商業銀行總行','verified HQ outranks wrong upstream branch');
  ok(Math.abs(a.payload?.results?.[0]?.lat-25.0343)<0.00001 && Math.abs(a.payload?.results?.[0]?.lon-121.5692)<0.00001,'verified HQ coordinates preserved');

  const down = async ()=>{ throw new Error('provider down'); };
  const b = await invoke('華南銀行總行', down);
  ok(b.statusCode===200 && b.payload?.results?.length>0,'verified landmark still resolves when open providers are unavailable');

  if(failed) process.exit(1);
  console.log('V0.34 SEARCH FUSION PASS');
})().catch((e)=>{ console.error(e); process.exit(1); });
