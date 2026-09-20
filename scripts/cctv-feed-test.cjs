const { Writable } = require('node:stream');
const xml = `<Root>
<CCTV><CCTVID>C1</CCTVID><VideoStreamURL>http://cam.example/live/master.m3u8</VideoStreamURL></CCTV>
<CCTV><CCTVID>C2</CCTVID><VideoStreamURL>https://cam.example/video.mp4</VideoStreamURL></CCTV>
</Root>`;
const playlist = `#EXTM3U\n#EXT-X-TARGETDURATION:4\nseg01.ts\n#EXT-X-ENDLIST`;
let lastHeaders = null;
function headers(type, extras={}){ return { get(name){ const k=String(name).toLowerCase(); if(k==='content-type') return type; return extras[k] ?? null; } }; }
function streamBytes(bytes=[1,2,3]){ return new ReadableStream({ start(c){ c.enqueue(new Uint8Array(bytes)); c.close(); } }); }
global.fetch = async (url, opts={}) => {
  const u = String(url); lastHeaders = opts.headers || {};
  if (u.includes('CCTV.xml')) return { ok:true, status:200, async text(){ return xml; } };
  if (u === 'http://cam.example/live/master.m3u8') return { ok:true, status:200, url:u, headers:headers('application/vnd.apple.mpegurl'), body:streamBytes(), async text(){ return playlist; } };
  if (u === 'https://cam.example/video.mp4') return { ok:true, status:206, url:u, headers:headers('video/mp4', {'content-range':'bytes 0-2/3','accept-ranges':'bytes','content-length':'3'}), body:streamBytes([0,0,0]), async arrayBuffer(){ return Uint8Array.from([0,0,0,24,102,116,121,112]).buffer; } };
  throw new Error(`Unexpected URL ${u}`);
};
const handler = require('../api/cctv-feed');
class MockRes extends Writable {
  constructor(){ super(); this.headers={}; this.statusCode=0; this.body=''; }
  _write(chunk, enc, cb){ this.body += Buffer.from(chunk).toString('binary'); cb(); }
  setHeader(k,v){ this.headers[k]=v; }
  status(code){ this.statusCode=code; return this; }
  send(body){ this.body += String(body); return this; }
  end(body=''){ this.body += String(body); return this; }
}
(async()=>{
  let res = new MockRes();
  await handler({method:'GET',query:{id:'freeway:C1'},headers:{}},res);
  if(res.statusCode!==200) throw new Error(`playlist status ${res.statusCode}`);
  if(!/application\/vnd\.apple\.mpegurl/.test(res.headers['Content-Type']||'')) throw new Error('playlist content type missing');
  if(!res.body.includes('/api/cctv-feed?id=freeway%3AC1&resource=')) throw new Error(`playlist not rewritten: ${res.body}`);

  res = new MockRes();
  await handler({method:'GET',query:{id:'freeway:C1',probe:'1'},headers:{}},res);
  const probe = JSON.parse(res.body);
  if(probe.kind!=='hls' || !probe.proxied) throw new Error(`bad probe ${res.body}`);

  res = new MockRes();
  await handler({method:'GET',query:{id:'freeway:C2',probe:'1'},headers:{}},res);
  const videoProbe = JSON.parse(res.body);
  if(videoProbe.kind!=='video') throw new Error(`video probe failed ${res.body}`);
  if(!String(lastHeaders.Range||lastHeaders.range||'').startsWith('bytes=')) throw new Error('probe range header missing');

  console.log('CCTV INLINE FEED PASS');
})().catch((e)=>{console.error(e);process.exit(1);});
