const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../dist/amap-adapter.js');
test('normalizes SDK POIs and drops missing coordinates',()=>{
  const p=G.normalizePOI({name:'测试地点',location:{getLng:()=>110,getLat:()=>30},address:'测试地址'});
  assert.equal(p.lat,30);assert.equal(p.lon,110);assert.equal(p.name,'测试地点');
  assert.equal(G.normalizePOI({name:'区域结果'}),null);
});
test('merges only contiguous cells in the same row',()=>{
  const r=G.rectangles({step:10,cells:[{x:5,y:5},{x:15,y:5},{x:35,y:5},{x:5,y:15}]});
  assert.equal(r.length,3);assert.deepEqual(r[0],{x0:0,x1:20,y0:0,y1:10});
  assert.equal(r.reduce((s,v)=>s+(v.x1-v.x0)*(v.y1-v.y0),0),400);
});
test('creates annulus holes, distance circles and candidate overlays',()=>{
  class Overlay{constructor(options){this.options=options;}}
  const SDK={Polygon:Overlay,Circle:Overlay,Marker:Overlay,Pixel:class{}};
  const items=G.overlays(SDK,[{id:'A',name:'测试点',x:0,y:0,lat:30,lon:110,distance:100,error:10}],{x:2,y:3},{step:10,cells:[{x:5,y:5}]},p=>({lat:p.y,lon:p.x}),['#91b9f7']);
  assert.equal(items.length,5);assert.equal(items[0].options.path.length,2);
  assert.equal(items[0].options.path[0].length,120);assert.equal(items[1].options.radius,100);
  assert.deepEqual(items[4].options.position,[2,3]);
});
test('search distinguishes no results from API errors',async()=>{
  const SDK={PlaceSearch:class{search(k,cb){cb('no_data',{});}}};
  assert.deepEqual(await G.search(SDK,'test',''),[]);
  const failing={PlaceSearch:class{search(k,cb){cb('error',{info:'INVALID_USER_KEY'});}}};
  await assert.rejects(G.search(failing,'test',''),/INVALID_USER_KEY/);
});
test('SDK setup rejects missing credentials before any network request',async()=>{
  await assert.rejects(G.loadSDK('','',''),/JS API Key/);
  await assert.rejects(G.loadSDK('test','',''),/安全密钥/);
  await assert.rejects(G.loadSDK('test','','javascript:bad'),/代理地址/);
});
