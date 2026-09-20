const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('app.js','utf8');
function values(attr){return [...new Set([...html.matchAll(new RegExp(`${attr}="([^"]+)"`,'g'))].map(x=>x[1]))];}
function ok(v,m){assert.ok(v,m);console.log('PASS',m)}
const commands=values('data-command');
for(const v of commands) ok(js.includes(`command === '${v}'`),`command handler ${v}`);
const missions=values('data-mission');
for(const v of missions) ok(js.includes(`mode === '${v}'`),`mission handler ${v}`);
const rails=values('data-rail');
for(const v of rails) ok(js.includes(`key === '${v}'`) || v==='overview',`rail handler ${v}`);
ok(missions.includes('mission'),'MISSION route brief exposed in UI');
ok(missions.includes('sentinel'),'SENTINEL anomaly monitor exposed in UI');
ok(html.includes('cockpitToggleBtn') && js.includes("$('cockpitToggleBtn')?.addEventListener"),'3D cockpit control wired');
ok(html.includes('provenanceRibbon') && js.includes("$('provenanceRibbon')?.addEventListener"),'source provenance control wired');
ok(html.includes('voiceMarkupToggle') && js.includes("bindToggle('voiceMarkupToggle'"),'voice markup wired');
console.log('UI HANDLER PARITY PASS');
