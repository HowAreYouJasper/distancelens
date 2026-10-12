const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../dist/solver.js');
const truth={x:1080,y:920};
function fixtures(error=35){return [[350,400],[1640,420],[420,1660],[1610,1540]].map(([x,y])=>({x,y,error,distance:S.distance(truth,{x,y})}));}
test('exact distances recover known synthetic target',()=>{const p=S.solve(fixtures());assert.ok(S.distance(p,truth)<1e-5);assert.ok(p.rms<1e-5);});
test('rounded distances recover within one meter',()=>{const a=fixtures();a.forEach(p=>p.distance=Math.round(p.distance));assert.ok(S.distance(S.solve(a),truth)<1);});
test('sampled region satisfies every constraint',()=>{const a=fixtures(),r=S.region(a);assert.ok(r.cells.length>0);assert.ok(r.cells.every(p=>S.feasible(p,a)));});
test('incompatible distances have no sampled overlap',()=>{const a=fixtures(5);a[0].distance=0;a[1].distance=0;assert.equal(S.region(a).cells.length,0);assert.ok(S.solve(a).rms>100);});
test('larger tolerances cannot shrink sampled feasible region',()=>{assert.ok(S.region(fixtures(70)).area>=S.region(fixtures(35)).area);});
test('collinear anchors preserve mirror ambiguity',()=>{const a=[250,700,1250,1750].map(x=>({x,y:1000,error:5,distance:S.distance(truth,{x,y:1000})}));assert.ok(S.feasible(truth,a));assert.ok(S.feasible({x:1080,y:1080},a));assert.ok(S.solve(a).rms<1e-5);});
test('insufficient anchors are rejected',()=>assert.throws(()=>S.solve(fixtures().slice(0,2))));
test('geographic conversion round-trips reference coordinates',()=>{const g=S.geographic('30,110,500\n30.005,110,500\n30,110.005,500');for(const a of g.anchors){const p=S.toGeographic(a,g.projection);assert.ok(Math.abs(p.lat-a.lat)<1e-9);assert.ok(Math.abs(p.lon-a.lon)<1e-9);}});
test('rejects malformed, nonfinite, too-distant and coincident inputs',()=>{for(const input of ['x,110,20\n30,110,30\n30,110,40','30,110,-1\n30,110,30\n30,110,40','30,110,20\n40,110,30\n30,111,40','30,110,20\n30,110,30\n30,110,40'])assert.throws(()=>S.geographic(input));});
test('handles nearby points across antimeridian',()=>{const g=S.geographic('30,179.99,500\n30,-179.99,500\n30.005,179.99,500');assert.ok(g.size<5000);g.anchors.forEach(a=>assert.ok(Math.abs(S.toGeographic(a,g.projection).lon-a.lon)<1e-9));});
