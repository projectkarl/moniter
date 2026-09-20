const xml = `<Root><CCTV><CCTVID>C1</CCTVID><VideoStreamURL>http://cam.example/live/master.m3u8</VideoStreamURL></CCTV></Root>`;
const playlist = `#EXTM3U\n#EXT-X-TARGETDURATION:4\nseg01.ts\n#EXT-X-ENDLIST`;
function headers(type){ return { get(name){ return String(name).toLowerCase()==='content-type' ? type : null; } }; }
global.fetch = async (url) => {
  const u = String(url);
  if (u.includes('CCTV.xml')) return { ok:true, status:200, async text(){ return xml; } };
  if (u === 'http://cam.example/live/master.m3u8') return { ok:true, status:200, url:u, headers:headers('application/vnd.apple.mpegurl'), body:{}, async text(){ return playlist; } };
  throw new Error(`Unexpected URL ${u}`);
};
const handler = require('../api/cctv-feed');
const out = { headers:{}, statusCode:0, body:'' };
const res = {
  setHeader(k,v){ out.headers[k]=v; },
  status(code){ out.statusCode=code; return this; },
  send(body){ out.body=String(body); return this; },
  end(body=''){ out.body += String(body); return this; },
};
(async()=>{
  await handler({method:'GET',query:{id:'freeway:C1'}},res);
  if(out.statusCode!==200) throw new Error(`status ${out.statusCode}`);
  if(!/application\/vnd\.apple\.mpegurl/.test(out.headers['Content-Type']||'')) throw new Error('playlist content type missing');
  if(!out.body.includes('/api/cctv-feed?id=freeway%3AC1&resource=')) throw new Error(`playlist not rewritten: ${out.body}`);
  if(!out.body.includes('seg01.ts')) throw new Error('segment missing');
  console.log('CCTV INLINE FEED PASS');
})().catch((e)=>{console.error(e);process.exit(1);});
