import { handleCctvFeed } from '../src/cctv-feed.js';

const originalFetch = globalThis.fetch;
const calls = [];
const env = { CCTV_PROXY_SECRET:'unit-test-secret-1234567890' };
const wrapper = `<!doctype html><html><script>player.loadSource('https://media.example.com/live/cam/master.m3u8')</script></html>`;
const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=512000\nhttps://cdn.example.net/live/cam/level.m3u8\n';
const level = '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\nhttps://segments.example-cdn.org/cam/seg001.ts\n';

globalThis.fetch = async (input, init={}) => {
  const url = String(input);
  calls.push({url, headers:init.headers || {}});
  if (url === 'https://www.twipcam.com/cam/test-public-cam') {
    return new Response(wrapper, {status:200, headers:{'content-type':'text/html; charset=utf-8','set-cookie':'sid=abc; Path=/; Secure'}});
  }
  if (url === 'https://media.example.com/live/cam/master.m3u8') {
    return new Response(master, {status:200, headers:{'content-type':'application/vnd.apple.mpegurl'}});
  }
  if (url === 'https://cdn.example.net/live/cam/level.m3u8') {
    return new Response(level, {status:200, headers:{'content-type':'application/vnd.apple.mpegurl'}});
  }
  if (url === 'https://segments.example-cdn.org/cam/seg001.ts') {
    return new Response(new Uint8Array([0x47,0x40,0x00,0x10]), {status:200, headers:{'content-type':'video/mp2t'}});
  }
  throw new Error(`unexpected fetch ${url}`);
};

let fail = 0;
function assert(cond, msg) { if (!cond) { fail++; console.error('✗', msg); } else console.log('✓', msg); }
try {
  const id = 'twipcam:test-public-cam';
  const probe = await handleCctvFeed(new Request(`https://sentinel.invalid/api/cctv-feed?id=${encodeURIComponent(id)}&probe=1`), env);
  const pd = await probe.json();
  assert(probe.ok && pd.kind === 'hls' && pd.cloudflareNative === true, 'wrapper discovery resolves to HLS');

  const p1 = await handleCctvFeed(new Request(`https://sentinel.invalid/api/cctv-feed?id=${encodeURIComponent(id)}`), env);
  const t1 = await p1.text();
  const nestedPath = t1.split('\n').find(x => x.startsWith('/api/cctv-feed?'));
  assert(p1.ok && nestedPath && nestedPath.includes('sig=') && t1.includes('cdn.example.net'), 'master playlist rewrites cross-CDN child with signed proxy URL');

  const p2 = await handleCctvFeed(new Request('https://sentinel.invalid' + nestedPath), env);
  const t2 = await p2.text();
  const segPath = t2.split('\n').find(x => x.startsWith('/api/cctv-feed?'));
  assert(p2.ok && segPath && segPath.includes('sig=') && t2.includes('segments.example-cdn.org'), 'child playlist cross-CDN segments stay signed and playable');

  const seg = await handleCctvFeed(new Request('https://sentinel.invalid' + segPath, {headers:{range:'bytes=0-3'}}), env);
  const bytes = new Uint8Array(await seg.arrayBuffer());
  assert(seg.ok && bytes[0] === 0x47, 'media segment streams through Worker across CDN host');

  const wrapperCall = calls.find(x => x.url.includes('twipcam.com/cam/'));
  const mediaCall = calls.find(x => x.url.endsWith('master.m3u8'));
  assert(!!wrapperCall && !!mediaCall, 'wrapper and media were both requested');
  assert(String(mediaCall?.headers?.Cookie || '').includes('sid=abc'), 'wrapper cookie is forwarded to media request');
  assert(String(mediaCall?.headers?.Referer || '').includes('twipcam.com/cam/'), 'wrapper referer is forwarded to media request');

  const rejected = await handleCctvFeed(new Request(`https://sentinel.invalid/api/cctv-feed?id=${encodeURIComponent(id)}&resource=${encodeURIComponent('https://evil.example.net/x.ts')}`), env);
  assert(rejected.status === 403, 'unsigned arbitrary cross-host resource remains rejected');

  const tampered = new URL('https://sentinel.invalid' + segPath);
  tampered.searchParams.set('resource','https://evil.example.net/x.ts');
  const tamperedRes = await handleCctvFeed(new Request(tampered), env);
  assert(tamperedRes.status === 403, 'signed URL cannot be tampered into an open proxy');
} finally {
  globalThis.fetch = originalFetch;
}
if (fail) process.exit(1);
console.log(`\nCCTV UNIT PASSED: ${calls.length} mocked upstream request(s).`);
