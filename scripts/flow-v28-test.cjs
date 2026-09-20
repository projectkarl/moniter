const assert = require('node:assert/strict');
const handler = require('../server/flow');
const live = `<Root><LiveTraffic><SectionID>S1</SectionID><TravelTime>60</TravelTime><TravelSpeed>24</TravelSpeed><CongestionLevelID>4</CongestionLevelID></LiveTraffic></Root>`;
const section = `<Root><Section><SectionID>S1</SectionID><SectionName>測試路段</SectionName><RoadName>國道一號</RoadName><RoadDirection>N</RoadDirection><SectionStart><LocationName>A交流道</LocationName><PositionLat>25.010</PositionLat><PositionLon>121.500</PositionLon></SectionStart><SectionEnd><LocationName>B交流道</LocationName><PositionLat>25.030</PositionLat><PositionLon>121.520</PositionLon></SectionEnd><SpeedLimit>100</SpeedLimit></Section></Root>`;
global.fetch = async (url)=>{
 const u=String(url);
 if(u.includes('LiveTraffic.xml')) return {ok:true,status:200,async text(){return live;}};
 if(u.includes('Section.xml')) return {ok:true,status:200,async text(){return section;}};
 if(u.includes('SectionShape.xml')) return {ok:false,status:503,async text(){return '';}};
 throw new Error('unexpected '+u);
};
function res(){return{code:0,body:null,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(v){this.body=v;return this}}}
(async()=>{
 const r=res(); await handler({method:'GET',query:{lat:'25.02',lon:'121.51',radius:'30'}},r);
 assert.equal(r.code,200);
 assert.equal(r.body.shapeAvailable,false);
 assert.equal(r.body.shapeFallbackAvailable,true);
 assert.equal(r.body.items.length,1);
 assert.equal(r.body.items[0].status,'congested');
 assert.equal(r.body.items[0].geometry.length,2);
 console.log('FLOW V28 FALLBACK PASS');
})().catch(e=>{console.error(e);process.exit(1)});
