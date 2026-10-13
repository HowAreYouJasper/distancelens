'use strict';
const $=id=>document.getElementById(id), S=DistanceLens, G=DistanceLensAMap;
const colors=['#2f6d77','#b96a44','#7e8548','#597e9a','#a98636','#746957','#456e58','#9a7370'];
let points=[],anchors=[],solution=null,sampled=null,projection=null,size=2000,AMapSDK=null,amap=null,mapOverlays=[];
const canvas=$('map'),ctx=canvas.getContext('2d');
function validatePoint(p){
  if(![p.lat,p.lon,p.distance,p.error].every(Number.isFinite)||Math.abs(p.lat)>80||Math.abs(p.lon)>180||p.distance<0||p.distance>10000||p.error<1||p.error>500)throw new Error('请检查输入：纬度 ±80°，经度 ±180°，距离 0 至 10000 m，误差 1 至 500 m');
}
function serialize(list){return list.map(p=>[p.lat,p.lon,p.distance].join(',')).join('\n');}
function invalidate(){
  solution=null;sampled=null;
  $('status').textContent=points.length>=3?'输入已更新，请计算':'等待至少三个已知地点';
  ['coordinates','rms','area'].forEach(id=>$(id).textContent='待计算');
  $('explanation').textContent='输入三个地点和距离后计算。距离有误差，结果也会有偏差，不能保证实际位置。';
  $('export').disabled=true;
  if(points.length>=3){const g=S.geographic(serialize(points));anchors=g.anchors.map((a,i)=>({...a,name:points[i].name,error:points[i].error}));projection=g.projection;size=g.size;}
  else{anchors=[];projection=null;size=2000;}
  $('plot-subtitle').textContent=projection?Math.round(size).toLocaleString()+' 米范围 · '+$('coordinate-system').value:'添加三个地点后，距离圆会出现在这里';
  $('plot-empty').hidden=anchors.length>0;
  draw();refreshMap(false);
}
function refreshControls(){
  $('point-count').textContent=points.length+' / 8';
  $('coordinate-system').disabled=points.length>0;
  const hasInvalidInput=[...$('anchors').querySelectorAll('input')].some(input=>!input.validity.valid);
  $('calculate').disabled=points.length<3||hasInvalidInput;
  $('calculate-hint').textContent=hasInvalidInput?'请先修正地点列表中的距离或误差。':points.length<3?'还需添加 '+(3-points.length)+' 个地点，至少三个地点才能计算。':'已添加 '+points.length+' 个地点，可以计算。';
  $('search-entry').disabled=$('coordinate-system').value==='WGS84';
  $('clear').disabled=!points.length;
  const compatible=$('coordinate-system').value==='GCJ-02';
  $('search').disabled=!AMapSDK||!compatible;
  $('map-view').disabled=!AMapSDK||!compatible;
  $('coordinate-label').textContent='估算纬度, 经度 ('+$('coordinate-system').value+')';
  if(!compatible){showView(false);setEntryMode(false);}
}
function renderPoints(){
  $('anchors').replaceChildren();
  if(!points.length){const p=document.createElement('p');p.className='empty-list';p.textContent='还没有地点。添加后，会列在这里。';$('anchors').append(p);}
  points.forEach((p,i)=>{
    const card=document.createElement('div');card.className='anchor-card';
    const title=document.createElement('div');title.className='anchor-title';
    const dot=document.createElement('span');dot.className='dot';dot.style.color=colors[i];dot.textContent=String.fromCharCode(65+i);
    const name=document.createElement('strong');name.textContent=p.name||'已知地点 '+String.fromCharCode(65+i);
    const remove=document.createElement('button');remove.className='text-button';remove.textContent='移除';remove.setAttribute('aria-label','移除已知地点 '+String.fromCharCode(65+i));remove.onclick=()=>{points.splice(i,1);renderPoints();invalidate();};
    title.append(dot,name,remove);card.append(title);
    const coords=document.createElement('small');coords.textContent=p.lat.toFixed(6)+', '+p.lon.toFixed(6);card.append(coords);
    const fields=document.createElement('div');fields.className='two-columns';
    for(const [key,label,max] of [['distance','距离，米',10000],['error','误差，±米',500]]){
      const wrap=document.createElement('label');wrap.className='field';wrap.textContent=label;
      const input=document.createElement('input');input.type='number';input.required=true;input.min=key==='error'?1:0;input.max=max;input.step='any';input.value=p[key];input.setAttribute('aria-label','已知地点 '+String.fromCharCode(65+i)+' '+label);
      const updateInput=revertInvalid=>{try{if(!input.value.trim())throw new Error('数值不能为空');const next={...p,[key]:Number(input.value)};validatePoint(next);Object.assign(p,next);$('input-error').textContent='';invalidate();}catch(e){if(revertInvalid)input.value=p[key];$('input-error').textContent=e.message;invalidate();}refreshControls();};
      input.oninput=()=>updateInput(false);
      input.onchange=()=>updateInput(true);
      wrap.append(input);fields.append(wrap);
    }
    card.append(fields);$('anchors').append(card);
  });
  refreshControls();
}
function calculate(){
  try{
    points.forEach(validatePoint);const g=S.geographic(serialize(points));anchors=g.anchors.map((a,i)=>({...a,name:points[i].name,error:points[i].error}));projection=g.projection;size=g.size;
    solution=S.solve(anchors,size);sampled=S.region(anchors,size);const geo=S.toGeographic(solution,projection);
    $('coordinates').textContent=geo.lat.toFixed(6)+'°, '+geo.lon.toFixed(6)+'°';
    $('rms').textContent=solution.rms.toFixed(1)+' m';
    $('area').textContent=sampled.area?Math.round(sampled.area).toLocaleString()+' m²':'未找到';
    $('status').textContent=sampled.cells.length?'找到可能的位置范围':'未找到共同范围';
    $('explanation').textContent=(sampled.cells.length?'绿色范围是目前找到的、符合全部距离误差的地方。':'目前没有找到共同范围。请检查地点、距离和误差，也可能是重叠范围太窄。')+' 十字标记是估算位置，不一定落在绿色范围内。结果有近似误差，小数位数不代表准确程度。';
    $('plot-subtitle').textContent=Math.round(size).toLocaleString()+' 米范围 · '+$('coordinate-system').value;
    $('input-error').textContent='';$('export').disabled=false;draw();refreshMap(true);
  }catch(e){$('input-error').textContent=e.message;}
}
function draw(){
  const rect=canvas.parentElement.getBoundingClientRect(),width=rect.width,height=rect.height,dpr=window.devicePixelRatio||1;
  if(width<1||height<1)return;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const margin=42,scale=Math.max(1,Math.min(width-2*margin,height-2*margin))/size,left=(width-size*scale)/2,top=(height-size*scale)/2,X=x=>left+x*scale,Y=y=>top+(size-y)*scale;
  ctx.fillStyle='#eef0e5';ctx.fillRect(left,top,size*scale,size*scale);ctx.font='10px "Segoe UI",sans-serif';
  for(let i=0;i<=8;i++){const n=i*size/8;ctx.strokeStyle='#dce1d1';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(n),top);ctx.lineTo(X(n),Y(0));ctx.moveTo(left,Y(n));ctx.lineTo(X(size),Y(n));ctx.stroke();if(anchors.length&&i%2===0){ctx.fillStyle='#75816d';ctx.textAlign='center';ctx.fillText(Math.round(n),X(n),Y(0)+19);ctx.textAlign='right';ctx.fillText(Math.round(n),left-8,Y(n)+3);}}
  if(!anchors.length)return;
  ctx.save();ctx.beginPath();ctx.rect(left,top,size*scale,size*scale);ctx.clip();
  anchors.forEach((a,i)=>{const inner=Math.max(0,a.distance-a.error)*scale,outer=(a.distance+a.error)*scale;ctx.beginPath();ctx.arc(X(a.x),Y(a.y),outer,0,Math.PI*2);if(inner>0)ctx.arc(X(a.x),Y(a.y),inner,0,Math.PI*2,true);ctx.fillStyle=colors[i]+'18';ctx.fill('evenodd');ctx.strokeStyle=colors[i]+'d0';ctx.beginPath();ctx.arc(X(a.x),Y(a.y),a.distance*scale,0,Math.PI*2);ctx.stroke();});
  if(sampled){ctx.fillStyle='#759646aa';sampled.cells.forEach(p=>ctx.fillRect(X(p.x-sampled.step/2),Y(p.y+sampled.step/2),sampled.step*scale+.3,sampled.step*scale+.3));}
  anchors.forEach((a,i)=>{ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(X(a.x),Y(a.y),5,0,Math.PI*2);ctx.fill();ctx.font='600 12px "Segoe UI",sans-serif';ctx.textAlign='left';ctx.fillText(a.id,X(a.x)+10,Y(a.y)-10);});
  if(solution){ctx.strokeStyle='#243e35';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(solution.x)-6,Y(solution.y));ctx.lineTo(X(solution.x)+6,Y(solution.y));ctx.moveTo(X(solution.x),Y(solution.y)-6);ctx.lineTo(X(solution.x),Y(solution.y)+6);ctx.stroke();}ctx.restore();
}
function showView(useMap){
  $('map').hidden=useMap;$('amap').hidden=!useMap;
  $('plot-empty').hidden=useMap||anchors.length>0;
  $('geometry-view').classList.toggle('active',!useMap);$('map-view').classList.toggle('active',useMap);
  $('geometry-view').setAttribute('aria-pressed',String(!useMap));$('map-view').setAttribute('aria-pressed',String(useMap));
  if(useMap&&amap){if(typeof amap.resize==='function')amap.resize();}else draw();
}
function refreshMap(fit){
  if(!amap)return;if(mapOverlays.length)amap.remove(mapOverlays);mapOverlays=[];
  if($('coordinate-system').value!=='GCJ-02')return;
  if(anchors.length&&projection)mapOverlays=G.overlays(AMapSDK,anchors,solution,sampled,p=>S.toGeographic(p,projection),colors);
  else mapOverlays=points.map((p,i)=>new AMapSDK.Marker({position:[p.lon,p.lat],title:p.name||String.fromCharCode(65+i)}));
  if(mapOverlays.length){amap.add(mapOverlays);if(fit)amap.setFitView(mapOverlays,false,[40,40,40,40]);}
}
$('point-form').onsubmit=e=>{e.preventDefault();try{if(points.length>=8)throw new Error('最多添加 8 个已知地点');const p={name:$('point-name').value.trim(),lat:Number($('latitude').value),lon:Number($('longitude').value),distance:Number($('distance').value),error:Number($('tolerance').value)};validatePoint(p);const next=[...points,p];if(next.length>=3)S.geographic(serialize(next));points=next;$('input-error').textContent='';$('point-form').reset();$('search-results').replaceChildren();renderPoints();invalidate();refreshMap(true);}catch(error){$('input-error').textContent=error.message;}};
$('import').onclick=()=>{try{const lines=$('csv').value.trim().split(/\r?\n/).filter(v=>v.trim());const next=lines.map((line,i)=>{const fields=line.trim().split(/[,，\s]+/);if(fields.length<3||fields.length>4)throw new Error('第 '+(i+1)+' 行格式错误');const [lat,lon,distance,error='35']=fields;return {lat:Number(lat),lon:Number(lon),distance:Number(distance),error:Number(error),name:''};});next.forEach(validatePoint);S.geographic(serialize(next));points=next;$('input-error').textContent='';renderPoints();invalidate();calculate();}catch(e){$('input-error').textContent=e.message;}};
$('calculate').onclick=()=>{calculate();if(solution&&window.matchMedia('(max-width:760px)').matches)document.querySelector('.result').scrollIntoView({block:'center'});};
$('clear').onclick=()=>{points=[];anchors=[];$('input-error').textContent='';renderPoints();invalidate();};
$('coordinate-system').onchange=()=>{$('search-results').replaceChildren();$('latitude').value='';$('longitude').value='';$('point-name').value='';$('search-status').textContent=$('coordinate-system').value==='WGS84'?'GPS 坐标只在画圆视图显示。请重新填写 GPS 经纬度，不要混用高德坐标。':'请填写高德 GCJ-02 坐标，或连接高德搜索地点。';refreshControls();invalidate();};
$('geometry-view').onclick=()=>showView(false);
$('map-view').onclick=()=>showView(true);
$('connect').onclick=async()=>{const button=$('connect');button.disabled=true;$('connection-status').textContent='正在连接高德地图…';try{
  AMapSDK=await G.loadSDK($('api-key').value,$('security-code').value,$('service-host').value);
  $('amap').hidden=false;amap=new AMapSDK.Map('amap',{zoom:11,viewMode:'2D'});
  $('connection-status').textContent='地图已连接，可以搜索地址。如果搜索失败，请检查 Key 的搜索权限。';
  $('api-key').value='';$('security-code').value='';$('api-key').disabled=true;$('security-code').disabled=true;$('service-host').disabled=true;button.textContent='已连接，刷新可重新配置';
  $('api-state').textContent='已连接';$('api-settings').open=false;
  refreshControls();refreshMap(true);if($('coordinate-system').value==='GCJ-02')setEntryMode(true);showView($('coordinate-system').value==='GCJ-02');
}catch(e){$('connection-status').textContent=e.message;button.disabled=false;showView(false);}};
let searchRequest=0;
$('search').onclick=async()=>{const keyword=$('keyword').value.trim();if(!keyword){$('search-status').textContent='请输入地点名称或地址';return;}const request=++searchRequest;$('search').disabled=true;$('search-status').textContent='搜索中…';$('search-results').replaceChildren();try{
  const found=await G.search(AMapSDK,keyword,$('city').value);if(request!==searchRequest)return;
  $('search-status').textContent=found.length?'选择准确地点，再填写距离。':'未找到地点，请细化关键词或更换城市。';
  found.forEach(p=>{const button=document.createElement('button');button.className='search-result';const name=document.createElement('span');name.textContent=p.name;const address=document.createElement('small');address.textContent=p.address;button.append(name,address);button.onclick=()=>{$('point-name').value=p.name;$('latitude').value=p.lat;$('longitude').value=p.lon;$('distance').focus();$('search-status').textContent='已选择：'+p.name;if(amap){amap.setZoomAndCenter(15,[p.lon,p.lat]);showView(true);}};$('search-results').append(button);});
}catch(e){$('search-status').textContent=e.message;}finally{if(request===searchRequest)refreshControls();}};
$('keyword').onkeydown=e=>{if(e.key==='Enter'&&!$('search').disabled){e.preventDefault();$('search').click();}};
$('export').onclick=()=>{if(!solution)return;const data={schemaVersion:3,coordinateSystem:$('coordinate-system').value,projection,anchors,estimate:{...solution,geographic:S.toGeographic(solution,projection)},region:sampled};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='distancelens-result.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function setEntryMode(searchMode){
  $('address-search').hidden=!searchMode;
  $('search-results').hidden=!searchMode;
  $('manual-entry').classList.toggle('active',!searchMode);
  $('search-entry').classList.toggle('active',searchMode);
  $('manual-entry').setAttribute('aria-pressed',String(!searchMode));
  $('search-entry').setAttribute('aria-pressed',String(searchMode));
  $('point-name').placeholder=searchMode?'选择地址后自动填入':'给这个地点起个名字';
  if(searchMode&&!AMapSDK)$('api-settings').open=true;
}
$('manual-entry').onclick=()=>setEntryMode(false);
$('search-entry').onclick=()=>setEntryMode(true);
$('open-map-settings').onclick=()=>{$('api-settings').open=true;$('api-settings').scrollIntoView({block:'center'});};
document.querySelector('a[href="#method"]').onclick=()=>{$('method').open=true;};
new ResizeObserver(()=>{draw();if(amap&&typeof amap.resize==='function')amap.resize();}).observe(canvas.parentElement);
refreshControls();invalidate();
