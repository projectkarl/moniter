function storedZip(name, text) {
  const file=Buffer.from(text,'utf8'), fname=Buffer.from(name,'utf8');
  const local=Buffer.alloc(30); local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0,6); local.writeUInt16LE(0,8); local.writeUInt32LE(file.length,18); local.writeUInt32LE(file.length,22); local.writeUInt16LE(fname.length,26);
  const central=Buffer.alloc(46); central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6); central.writeUInt16LE(0,8); central.writeUInt16LE(0,10); central.writeUInt32LE(file.length,20); central.writeUInt32LE(file.length,24); central.writeUInt16LE(fname.length,28); central.writeUInt32LE(0,42);
  const offset=local.length+fname.length+file.length; const eocd=Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50,0); eocd.writeUInt16LE(1,8); eocd.writeUInt16LE(1,10); eocd.writeUInt32LE(central.length+fname.length,12); eocd.writeUInt32LE(offset,16);
  return Buffer.concat([local,fname,file,central,fname,eocd]);
}
const cyOdsXml = `<?xml version="1.0"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet><table:table><table:table-row><table:table-cell><text:p>CCTVID</text:p></table:table-cell><table:table-cell><text:p>VideoStreamURL</text:p></table:table-cell><table:table-cell><text:p>PositionLon</text:p></table:table-cell><table:table-cell><text:p>PositionLat</text:p></table:table-cell><table:table-cell><text:p>RoadName</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>CY01</text:p></table:table-cell><table:table-cell><text:p>https://cam.example/cy.m3u8</text:p></table:table-cell><table:table-cell><text:p>120.30</text:p></table:table-cell><table:table-cell><text:p>23.47</text:p></table:table-cell><table:table-cell><text:p>太保市祥和一路與太保二路口</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>`;
const cyOds = storedZip('content.xml', cyOdsXml);

const xml = '<Root><CCTV><CCTVID>F1</CCTVID><VideoStreamURL>https://cam.example/f1.m3u8</VideoStreamURL><PositionLon>121.70</PositionLon><PositionLat>24.80</PositionLat><RoadName>國道5號</RoadName></CCTV></Root>';
const tainan = JSON.stringify([{Location:'民生路與中山路口',wgsx:120.205,wgsy:22.995,url:'https://cam.example/tn.m3u8'}]);
const taichung = JSON.stringify({data:[{cctvid:'TC1',roadsection:'臺灣大道與文心路口',px:120.646,py:24.166,url:'https://cam.example/tc.jpg'}]});
const ntpc = JSON.stringify([{cctv_id:'N1',address:'新北大道與中原路口',latitude:25.06,longitude:121.46}]);
const taipei = '流水號,攝影機編號位置,WGSX,WGSY\n1,忠孝東路與基隆路口,121.565,25.041\n';
const keelung = 'CCTVID,RoadName,PositionLon,PositionLat,VideoStreamURL\nK1,信一路與義一路口,121.744,25.131,https://cam.example/kl.m3u8\n';
const taoyuan = '編號,監控點名稱,經度,緯度,管轄分局\nT1,中正路與復興路口,121.31,24.99,桃園分局\n';

global.fetch = async (url) => {
  const u = String(url);
  let body = xml, binary = null;
  if (u.includes('ws-tm.cyhg.gov.tw')) binary = cyOds;
  else if (u.includes('tainan')) body = tainan;
  else if (u.includes('taichung')) body = taichung;
  else if (u.includes('ntpc')) body = ntpc;
  else if (u.includes('taipei')) body = taipei;
  else if (u.includes('klcg')) body = keelung;
  else if (u.includes('tycg')) body = taoyuan;
  const buf = binary || Buffer.from(String(body),'utf8');
  return { ok:true, status:200, headers:{get(){return null;}}, async text(){ return binary ? binary.toString('binary') : body; }, async arrayBuffer(){ return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); } };
};

const handler = require('../server/cctv');
function res(){
  return { headers:{}, code:0, body:null,
    setHeader(k,v){this.headers[k]=v;},
    status(c){this.code=c;return this;},
    json(v){this.body=v;return this;}
  };
}
(async()=>{
  let r=res();
  await handler({method:'GET',query:{q:'忠孝東路 與 基隆路 CCTV',limit:'20'}},r);
  if(r.code!==200) throw new Error(`query status ${r.code}`);
  if(!r.body.items?.some((x)=>String(x.road || x.name).includes('忠孝東路') && !x.streamUrl)) throw new Error('position-only Taipei CCTV should be returned for local search');
  if(r.body.coverage?.activeSourceCount !== r.body.coverage?.sourceCount) throw new Error('source coverage status missing');
  if(!r.body.coverage?.liveCount || !(r.body.coverage?.positionOnlyCount > 0)) throw new Error('live + position-only coverage contract missing');

  r=res();
  await handler({method:'GET',query:{q:'民生路 中山路口',limit:'20'}},r);
  if(r.code!==200 || !r.body.items?.some((x)=>String(x.road).includes('民生路') && x.streamUrl)) throw new Error('live intersection lookup failed');

  r=res();
  await handler({method:'GET',query:{lat:'25.041',lon:'121.565',radius:'2',limit:'50'}},r);
  if(r.code!==200) throw new Error('nearby lookup status failed');
  if(!r.body.discovery?.nearbyUrl?.includes('twipcam.com/nearby?lat=25.041000&lon=121.565000')) throw new Error('twipcam coordinate discovery missing');
  if(!r.body.items?.some((x)=>x.verifiedFallback && String(x.name).includes('101'))) throw new Error('Taipei 101 verified CCTV fallback missing');
  if(!r.body.discovery?.widgetUrl?.includes('twipcam.com/widget/v1/query-cam-list-by-coordinate')) throw new Error('embeddable CCTV widget discovery missing');
  console.log('CCTV V29 API SEARCH PASS');
})().catch((e)=>{console.error(e);process.exit(1);});
