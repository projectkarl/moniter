import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
let failed = 0;
const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
const alphaFix=(s='')=>String(s).replace(/0/g,'O').replace(/1/g,'I').replace(/2/g,'Z').replace(/5/g,'S').replace(/8/g,'B').replace(/6/g,'G');
const digitFix=(s='')=>String(s).replace(/[OQ]/g,'0').replace(/[IL]/g,'1').replace(/Z/g,'2').replace(/S/g,'5').replace(/[BG]/g,m=>m==='B'?'8':'6');
function normalizePlateText(text=''){
  const pieces=[String(text).toUpperCase().replace(/[^A-Z0-9]/g,''),...String(text).toUpperCase().split(/\s+/).map(x=>x.replace(/[^A-Z0-9]/g,''))].filter(Boolean);
  const seen=new Set();
  for(const raw of pieces){
    if(raw.length<5||raw.length>8||seen.has(raw))continue; seen.add(raw);
    let m=raw.match(/^([A-Z]{2,3})(\d{3,4})$/); if(m)return `${m[1]}-${m[2]}`;
    m=raw.match(/^(\d{3,4})([A-Z]{2,3})$/); if(m)return `${m[1]}-${m[2]}`;
    m=raw.match(/^([A-Z]{1,2})(\d{2,4})([A-Z]{1,2})$/); if(m)return `${m[1]}${m[2]}-${m[3]}`;
    for(const split of [2,3]){ if(raw.length-split<3||raw.length-split>4)continue; const a=alphaFix(raw.slice(0,split)),n=digitFix(raw.slice(split)); if(/^[A-Z]{2,3}$/.test(a)&&/^\d{3,4}$/.test(n))return `${a}-${n}`; }
    for(const split of [3,4]){ if(raw.length-split<2||raw.length-split>3)continue; const n=digitFix(raw.slice(0,split)),a=alphaFix(raw.slice(split)); if(/^\d{3,4}$/.test(n)&&/^[A-Z]{2,3}$/.test(a))return `${n}-${a}`; }
  }
  return '';
}
const cases=[['ABC1234','ABC-1234'],['abc-1234','ABC-1234'],['1234 AB','1234-AB'],['AB 123','AB-123'],['ABC12S4','ABC-1254'],['12O4AB','1204-AB'],['@@@','']];
for(const [input,want] of cases){ const got=normalizePlateText(input); got===want?ok(`normalize ${input} -> ${got||'empty'}`):bad(`normalize ${input}: ${got} != ${want}`); }
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
for(const needle of ['isAnprAuthorizedCamera','runAuthorizedAnpr','tesseract.js@7.0.0','state.anprReads','state.anprVotes','AUTHORIZED ANPR','function otsuThreshold(','function enhancePlateCanvas(','function rotatePlateCanvas(','function keystonePlateCanvas(','function voteAnprRead(','skewAngles','keystoneStrengths','stableVotes','NIGHT']) app.includes(needle)?ok(`app ${needle}`):bad(`app missing ${needle}`);
if(/return Boolean\(id && anprAuthorizedIds\(\)\.has\(id\)\)/.test(app))ok('ANPR requires explicit allowlist ID'); else bad('ANPR authorization must require explicit allowlist ID');
const config=fs.readFileSync(path.join(root,'public/anpr-config.js'),'utf8');
/ANPR_AUTHORIZED_IDS\s*=\s*\[\s*\]/.test(config)?ok('default allowlist is empty'):bad('default allowlist must be empty');
for(const needle of ['stableVotes: 2','skewAngles: [0, -4, 4, -7, 7]','keystoneStrengths: [0, -0.10, 0.10, -0.16, 0.16]','maxVehicles: 2']) config.includes(needle)?ok(`config ${needle}`):bad(`config missing ${needle}`);
if(failed){console.error(`\nANPR UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nANPR UNIT PASSED: allowlisted on-device OCR, night enhancement, skew compensation and multi-frame voting wiring are present.');
