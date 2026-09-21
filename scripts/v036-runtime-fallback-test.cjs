const assert = require('node:assert/strict');

function mockRes() {
  let done;
  const promise = new Promise((resolve) => { done = resolve; });
  return {
    headers:{}, code:0, body:null, promise,
    setHeader(k,v){this.headers[k]=v;},
    status(code){this.code=code; return this;},
    json(body){this.body=body; done({code:this.code, body});},
  };
}
function response(body, ok=true, status=200) {
  return { ok, status, headers:{get(){return null;}}, async text(){return JSON.stringify(body);} };
}
function encodePolyline6(coords) {
  let lastLat=0,lastLon=0,out='';
  const enc=(v)=>{v=v<0?~(v<<1):(v<<1);let s='';while(v>=0x20){s+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5;}return s+String.fromCharCode(v+63);};
  for(const [lon,lat] of coords){const ilat=Math.round(lat*1e6),ilon=Math.round(lon*1e6);out+=enc(ilat-lastLat)+enc(ilon-lastLon);lastLat=ilat;lastLon=ilon;}return out;
}
(async()=>{
  const originalFetch=global.fetch;
  try {
    delete require.cache[require.resolve('../server/route')];
    global.fetch = async (url) => {
      if(String(url).includes('router.project-osrm.org')) return response({message:'offline'},false,503);
      if(String(url).includes('valhalla1.openstreetmap.de')) return response({trip:{summary:{length:350,time:14400},legs:[{shape:encodePolyline6([[121.5654,25.033],[120.3014,22.6273]]),maneuvers:[{length:350,time:14400,street_names:['國道1號'],instruction:'沿國道1號行駛'}]}]}});
      throw new Error('unexpected url '+url);
    };
    const route=require('../server/route');
    let res=mockRes();
    route({method:'GET',query:{from:'121.5654,25.0330',to:'120.3014,22.6273'}},res);
    let out=await res.promise;
    assert.equal(out.code,200);
    assert.equal(out.body.routes[0].provider,'Valhalla');
    assert.equal(out.body.routes[0].highwayPreferred,true);
    console.log('PASS route survives OSRM outage with highway-biased Valhalla route');

    delete require.cache[require.resolve('../server/traffic')];
    global.fetch=async()=>{throw new Error('offline')};
    const traffic=require('../server/traffic');
    res=mockRes(); traffic({method:'GET',query:{lat:'25.03',lon:'121.56',radius:'60'}},res); out=await res.promise;
    assert.equal(out.code,200); assert.equal(out.body.degraded,true); assert.deepEqual(out.body.items,[]);
    console.log('PASS traffic outage degrades to non-fatal response');

    delete require.cache[require.resolve('../server/flow')];
    const flow=require('../server/flow');
    res=mockRes(); flow({method:'GET',query:{lat:'25.03',lon:'121.56',radius:'70'}},res); out=await res.promise;
    assert.equal(out.code,200); assert.equal(out.body.degraded,true); assert.equal(out.body.unavailable,true);
    console.log('PASS freeway flow outage degrades to non-fatal response');
  } finally { global.fetch=originalFetch; }
})().catch((e)=>{console.error(e);process.exit(1)});
