const assert = require('node:assert/strict');
const { SOURCES, parseSourceText, parseOdsGeneric, searchRegistry, normalizeSearch } = require('../server/cctv-registry');

const tainanSource = SOURCES.find((x)=>x.id==='tainan');
const taichungSource = SOURCES.find((x)=>x.id==='taichung');
const taipeiSource = SOURCES.find((x)=>x.id==='taipei-position');
const freewaySource = SOURCES.find((x)=>x.id==='freeway');

const tainan = parseSourceText(JSON.stringify([{Location:'中西區民生路與中山路口',wgsx:'120.205',wgsy:'22.995',url:'https://cam.example/tainan.m3u8'}]), tainanSource);
assert.equal(tainan.length,1); assert.equal(tainan[0].access,'live'); assert.match(tainan[0].road,/民生路/);

const taichung = parseSourceText(JSON.stringify({data:[{cctvid:'TC01',roadsection:'臺灣大道與文心路口',px:120.646,py:24.166,url:'https://cam.example/tc.jpg',status:'1'}]}), taichungSource);
assert.equal(taichung.length,1); assert.equal(taichung[0].id,'taichung:TC01');

const taipeiCsv = '流水號,攝影機編號位置,WGSX,WGSY\n1,忠孝東路與基隆路口,121.565,25.041\n';
const taipei = parseSourceText(taipeiCsv,taipeiSource);
assert.equal(taipei.length,1); assert.equal(taipei[0].access,'position-only'); assert.equal(taipei[0].streamUrl,'');

const freewayXml = '<Root><CCTV><CCTVID>F01</CCTVID><VideoStreamURL>https://cam.example/f.m3u8</VideoStreamURL><PositionLon>121.75</PositionLon><PositionLat>24.86</PositionLat><RoadName>國道5號</RoadName><RoadDirection>南向</RoadDirection><LocationMile>28K</LocationMile></CCTV></Root>';
const freeway = parseSourceText(freewayXml,freewaySource);
assert.equal(freeway.length,1); assert.equal(freeway[0].mile,'28K');


function storedZip(name, text) {
  const file = Buffer.from(text, 'utf8');
  const fname = Buffer.from(name, 'utf8');
  // CRC is not validated by our reader; keep zero in this deterministic parser fixture.
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6); local.writeUInt16LE(0, 8);
  local.writeUInt32LE(0, 14); local.writeUInt32LE(file.length, 18); local.writeUInt32LE(file.length, 22);
  local.writeUInt16LE(fname.length, 26); local.writeUInt16LE(0, 28);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0, 8); central.writeUInt16LE(0, 10);
  central.writeUInt32LE(0, 16); central.writeUInt32LE(file.length, 20); central.writeUInt32LE(file.length, 24);
  central.writeUInt16LE(fname.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38); central.writeUInt32LE(0, 42);
  const centralOffset = local.length + fname.length + file.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length + fname.length, 12); eocd.writeUInt32LE(centralOffset, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([local, fname, file, central, fname, eocd]);
}

const chiayiCountySource = SOURCES.find((x)=>x.id==='chiayi-county');
const odsXml = `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet><table:table><table:table-row><table:table-cell><text:p>CCTVID</text:p></table:table-cell><table:table-cell><text:p>VideoStreamURL</text:p></table:table-cell><table:table-cell><text:p>PositionLon</text:p></table:table-cell><table:table-cell><text:p>PositionLat</text:p></table:table-cell><table:table-cell><text:p>RoadName</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>CY01</text:p></table:table-cell><table:table-cell><text:p>https://cam.example/cy.m3u8</text:p></table:table-cell><table:table-cell><text:p>120.30</text:p></table:table-cell><table:table-cell><text:p>23.47</text:p></table:table-cell><table:table-cell><text:p>太保市祥和一路與太保二路口</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>`;
const chiayiCounty = parseOdsGeneric(storedZip('content.xml', odsXml), chiayiCountySource);
assert.equal(chiayiCounty.length,1); assert.equal(chiayiCounty[0].access,'live'); assert.match(chiayiCounty[0].road,/太保/);

const all=[...tainan,...taichung,...taipei,...freeway,...chiayiCounty];
const hits=searchRegistry(all,'忠孝東路 與 基隆路 CCTV',10);
assert.equal(hits[0].id,taipei[0].id);
assert.equal(normalizeSearch('臺灣大道／文心路口監視器'),'台灣大道 文心路口');
assert.ok(SOURCES.length >= 9);
console.log('CCTV V27 REGISTRY PASS', SOURCES.map((x)=>x.id).join(','));
