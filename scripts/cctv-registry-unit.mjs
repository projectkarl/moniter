import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const { SOURCES, parseStandardXml, odsRowsFromContentXml }=require('../src/services/cctv-registry.js');
let failed=0; const ok=(x)=>console.log(`✓ ${x}`); const bad=(x)=>{failed++;console.error(`✗ ${x}`)};
const byId=new Map(SOURCES.map(x=>[x.id,x]));
for(const id of ['freeway','highway','tainan','taichung','taipei-position','new-taipei-position','taoyuan-position']) byId.has(id)?ok(`source ${id}`):bad(`missing source ${id}`);
String(byId.get('freeway')?.url||'').includes('freeway.gov.tw')?ok('freeway official endpoint'):bad('freeway endpoint not official');
String(byId.get('highway')?.url||'').includes('thb.gov.tw')?ok('highway official endpoint'):bad('highway endpoint not official');
const xml=`<CCTVList><UpdateTime>2026-09-30T12:00:00+08:00</UpdateTime><UpdateInterval>60</UpdateInterval><CCTVs><CCTV><CCTVID>A1</CCTVID><VideoStreamURL>https://example.gov.tw/live/a1.m3u8</VideoStreamURL><PositionLon>121.5</PositionLon><PositionLat>25.0</PositionLat><RoadName>測試路</RoadName></CCTV></CCTVs></CCTVList>`;
const parsed=parseStandardXml(xml,{id:'test',name:'TEST',region:'臺北市',access:'live',fields:{}});
(parsed.length===1 && parsed[0].streamUrl.includes('m3u8') && parsed[0].upstreamUpdatedAt.includes('2026-09-30') && parsed[0].upstreamUpdateInterval===60)?ok('standard XML stream + freshness parsed'):bad('standard XML parse/freshness failed');
const ods=`<office:document><table:table><table:table-row><table:table-cell><text:p>A</text:p></table:table-cell><table:table-cell><text:p>B</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>1</text:p></table:table-cell><table:table-cell><text:p>2</text:p></table:table-cell></table:table-row></table:table></office:document>`;
const rows=odsRowsFromContentXml(ods);
(rows.length===2 && rows[0].length===2 && rows[1][1]==='2')?ok('ODS columns remain aligned'):bad(`ODS column alignment failed ${JSON.stringify(rows)}`);
if(failed){console.error(`\nCCTV REGISTRY UNIT FAILED: ${failed}`);process.exit(1)}
console.log('\nCCTV REGISTRY UNIT PASSED: official source registry and parser integrity are consistent.');
