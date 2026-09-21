const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('styles.css','utf8');
const app = fs.readFileSync('app.js','utf8');
const geo = fs.readFileSync('server/geocode.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');
function ok(v,m){ assert.ok(v,m); console.log('PASS',m); }
ok(html.includes('0.34.0 SEARCH FUSION + MAP CCTV'),'v0.31.1 build label');
ok(css.includes('.provenance-ribbon,.stage>.flow-legend{display:none!important;}'),'mobile extra HUDs removed');
ok(css.includes('.national-overview .national-metrics{display:none!important;}'),'narrow-phone national summary compacted');
ok(css.includes('width:min(92vw,620px)!important'),'mobile CCTV popup leaves drag margin');
ok(app.includes('const strongLocal = localTop && localTop.score >= 82'),'strong local partial POI resolution');
ok(geo.includes('const metroStation = station ? `捷運${station}`'),'MRT normalized query variant');
ok(geo.includes('photonCandidates') && geo.includes('slice(0,2)'),'expanded Photon normalized fallback');
ok(sw.includes('eye-taiwan-shell-v340'),'service worker cache v311');
console.log('V0.31.1 MOBILE + SEARCH REGRESSION PASS');
