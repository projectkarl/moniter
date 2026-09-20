const handlers = {
  weather: require('../api/weather'),
  route: require('../api/route'),
  cctv: require('../api/cctv'),
  traffic: require('../api/traffic'),
  flow: require('../api/flow'),
  news: require('../api/news'),
  speed: require('../api/speed-cameras'),
  lane: require('../api/lane-flow'),
  flights: require('../api/flights'),
  quakes: require('../api/earthquakes'),
};
const xmlCctv = `<Root><CCTV><CCTVID>C1</CCTVID><VideoStreamURL>https://example.com/cam.jpg</VideoStreamURL><PositionLon>121.55</PositionLon><PositionLat>25.03</PositionLat><RoadName>N5</RoadName><RoadDirection>S</RoadDirection></CCTV></Root>`;
const xmlLive = `<Root><LiveTraffic><SectionID>S1</SectionID><TravelTime>90</TravelTime><TravelSpeed>22</TravelSpeed><CongestionLevelID>4</CongestionLevelID><CongestionLevel>壅塞</CongestionLevel></LiveTraffic></Root>`;
const xmlSection = `<Root><Section><SectionID>S1</SectionID><SectionName>A-B</SectionName><RoadName>N5</RoadName><Start>A</Start><End>B</End><SpeedLimit>90</SpeedLimit></Section></Root>`;
const rssNews = `<?xml version="1.0"?><rss><channel><item><title>宜蘭市交通改善工程啟動</title><description>宜蘭市重要道路進行改善。</description><link>https://www.cna.com.tw/news/aloc/123.aspx</link><pubDate>Sun, 20 Sep 2026 04:00:00 GMT</pubDate></item></channel></rss>`;
const speedCsv = `CityName,RegionName,Address,DeptNm,BranchNm,Longitude,Latitude,direct,limit\n臺北市,南港區,經貿二路,測試警局,測試分局,121.615,25.057,東向,50`;

const xmlVD = `<Root><VD><VDID>VD1</VDID><PositionLon>121.55</PositionLon><PositionLat>25.03</PositionLat><RoadName>國道5號</RoadName><RoadDirection>S</RoadDirection><LaneNum>2</LaneNum><LocationType>Tunnel</LocationType></VD></Root>`;
const xmlVDLive = `<Root><VDLive><VDID>VD1</VDID><DataCollectTime>2026-09-20T12:00:00+08:00</DataCollectTime><Lane><LaneID>1</LaneID><Occupancy>35</Occupancy><Vehicle><Volume>20</Volume><Speed>42</Speed></Vehicle></Lane><Lane><LaneID>2</LaneID><Occupancy>18</Occupancy><Vehicle><Volume>17</Volume><Speed>68</Speed></Vehicle></Lane></VDLive></Root>`;
const xmlShape = `<Root><SectionShape><SectionID>S1</SectionID><Geometry>LINESTRING (121.53 25.02, 121.55 25.03, 121.57 25.04)</Geometry></SectionShape></Root>`;
function response(body, isJson=true){ return { ok:true, status:200, async text(){return isJson?JSON.stringify(body):body;} }; }
global.fetch = async (url) => {
  url=String(url);
  if(url.includes('open-meteo')) return response({current:{time:'2026-09-20T12:00',temperature_2m:28,apparent_temperature:30,precipitation:0,weather_code:2,wind_speed_10m:8},hourly:{time:['2026-09-20T12:00','2026-09-20T13:00'],temperature_2m:[28,27],precipitation:[0,0.2],precipitation_probability:[20,65],weather_code:[2,61],wind_speed_10m:[8,10]}});
  if(url.includes('nominatim.openstreetmap.org/reverse')) return response({display_name:'宜蘭市, 宜蘭縣, 台灣',address:{city:'宜蘭市',county:'宜蘭縣'}});
  if(url.includes('feeds.feedburner.com/rsscna/')) return response(rssNews,false);
  if(url.includes('api.gdeltproject.org')) return response({articles:[{title:'Yilan local transportation update',url:'https://example.com/yilan-news',seendate:'20260920T040000Z',domain:'example.com'}]});
  if(url.includes('router.project-osrm.org')) return response({routes:[{distance:12000,duration:1500,geometry:{type:'LineString',coordinates:[[121.5,25],[121.6,25.1]]}}]});
  if(url.includes('CCTV.xml') || url.includes('opendataCCTVs.xml') || url.includes('CCTV2_Info.ashx')) return response(xmlCctv,false);
  if(url.includes('opdadm.moi.gov.tw')) return response(speedCsv,false);
  if(url.includes('roadData/opendata')) return response([{UID:'T1',y1:25.03,x1:121.55,road:'N5',roadtype:'事故',comment:'測試事件'}]);
  if(url.endsWith('/LiveTraffic.xml')) return response(xmlLive,false);
  if(url.endsWith('/Section.xml')) return response(xmlSection,false);
  if(url.endsWith('/SectionShape.xml')) return response(xmlShape,false);
  if(url.endsWith('/VDLive.xml')) return response(xmlVDLive,false);
  if(url.endsWith('/VD.xml')) return response(xmlVD,false);
  if(url.includes('api.adsb.lol')) return response({ac:[{hex:'abc123',flight:'TEST123',lat:25.05,lon:121.57,alt_baro:12000,gs:280,track:90}]});
  if(url.includes('earthquake.usgs.gov')) return response({features:[{id:'q1',geometry:{coordinates:[121.6,25.1,12]},properties:{mag:4.2,place:'Taiwan test',time:Date.now()}}]});
  throw new Error('Unexpected URL '+url);
};
function run(handler, query){
  return new Promise((resolve,reject)=>{
    const out={headers:{}, statusCode:null, body:null};
    const res={setHeader(k,v){out.headers[k]=v;},status(s){out.statusCode=s;return this;},json(b){out.body=b;resolve(out);}};
    Promise.resolve(handler({method:'GET',query},res)).catch(reject);
  });
}
(async()=>{
  const cases = [
    ['weather',{lat:'25.03',lon:'121.55'}],
    ['route',{from:'121.5,25',to:'121.6,25.1'}],
    ['cctv',{lat:'25.03',lon:'121.55',radius:'20'}],
    ['traffic',{lat:'25.03',lon:'121.55',radius:'20'}],
    ['flow',{lat:'25.03',lon:'121.55',radius:'20'}],
    ['news',{lat:'24.75',lon:'121.75'}],
    ['speed',{lat:'25.057',lon:'121.615',radius:'20'}],
    ['lane',{lat:'25.03',lon:'121.55',radius:'20'}],
    ['flights',{lat:'25.03',lon:'121.55',radius:'120'}],
    ['quakes',{lat:'25.03',lon:'121.55',radius:'300'}],
  ];
  for (const [name,query] of cases){
    const r=await run(handlers[name],query);
    if(r.statusCode!==200) throw new Error(name+' status '+r.statusCode+' '+JSON.stringify(r.body));
    if(name==='cctv' && !r.body.items?.length) throw new Error('cctv empty');
    if(name==='traffic' && !r.body.items?.length) throw new Error('traffic empty');
    if(name==='flow' && (!r.body.items?.length || r.body.items[0].status!=='congested')) throw new Error('flow parse failed');
    if(name==='route' && !r.body.routes?.length) throw new Error('route empty');
    if(name==='weather' && (r.body.current?.temperature!==28 || r.body.hourly?.length!==2)) throw new Error('weather parse failed');
    if(name==='speed' && (!r.body.items?.length || r.body.items[0].limit!==50)) throw new Error('speed camera parse failed');
    if(name==='news' && (!r.body.items?.length || !r.body.location?.label)) throw new Error('news parse failed');
    if(name==='lane' && (!r.body.items?.length || r.body.items[0].lanes?.length!==2 || !r.body.items[0].lanes.some((x)=>x.probability>50))) throw new Error('lane-flow parse failed');
    if(name==='flights' && !r.body.items?.length) throw new Error('flights parse failed');
    if(name==='quakes' && !r.body.items?.length) throw new Error('quakes parse failed');
    console.log('API PASS',name);
  }
})().catch((e)=>{console.error(e);process.exit(1);});
