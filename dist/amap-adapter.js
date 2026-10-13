(function(root){
  'use strict';
  function loadSDK(key, securityCode, serviceHost) {
    if (!key.trim()) return Promise.reject(new Error('请填写 Web 端 JS API Key'));
    if (!securityCode.trim() && !serviceHost.trim()) return Promise.reject(new Error('请填写安全密钥或安全代理地址'));
    if (serviceHost.trim()) {
      let url;
      try {url=new URL(serviceHost.trim());} catch {return Promise.reject(new Error('安全代理地址必须是完整 URL'));}
      if (!['http:','https:'].includes(url.protocol) || !url.pathname.endsWith('/_AMapService')) return Promise.reject(new Error('代理地址需使用 http 或 https，并以 /_AMapService 结尾'));
    }
    if (root.AMap) return Promise.resolve(root.AMap);
    root._AMapSecurityConfig=serviceHost.trim()?{serviceHost:serviceHost.trim()}:{securityJsCode:securityCode.trim()};
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const timer=setTimeout(()=>{script.remove();reject(new Error('高德 SDK 加载超时，请检查网络、域名白名单及 Key'));},20000);
      script.src='https://webapi.amap.com/maps?v=2.0&key='+encodeURIComponent(key.trim())+'&plugin=AMap.PlaceSearch';
      script.onload=()=>{clearTimeout(timer);if(root.AMap)resolve(root.AMap);else reject(new Error('高德 SDK 未初始化，请检查 Key 并刷新重试'));};
      script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('无法加载高德 SDK，请检查网络后重试'));};
      document.head.append(script);
    });
  }
  function normalizePOI(poi) {
    const loc=poi.location;
    const lon=typeof loc?.getLng==='function'?loc.getLng():Number(loc?.lng);
    const lat=typeof loc?.getLat==='function'?loc.getLat():Number(loc?.lat);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
    return {name:String(poi.name||'未命名地点'),address:[poi.pname,poi.cityname,poi.adname,typeof poi.address==='string'?poi.address:''].filter(Boolean).join(' '),lat,lon};
  }
  function search(AMap,keyword,city) {
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('地点搜索超时，请重试')),15000);
      const service=new AMap.PlaceSearch({pageSize:8,city:city.trim()||undefined});
      service.search(keyword.trim(),(status,result)=>{
        clearTimeout(timer);
        if(status==='no_data'){resolve([]);return;}
        if(status!=='complete'){reject(new Error('搜索失败：'+String(result?.info||'请检查 Key、服务权限或安全密钥')));return;}
        resolve((result.poiList?.pois||[]).map(normalizePOI).filter(Boolean));
      });
    });
  }
  // Merge adjacent raster cells horizontally, preserving disjoint candidates.
  function rectangles(sampled) {
    const rows=new Map(),s=sampled.step,result=[];
    for(const p of sampled.cells){const row=Math.round(p.y/s-.5),col=Math.round(p.x/s-.5);if(!rows.has(row))rows.set(row,[]);rows.get(row).push(col);}
    for(const [row,cols] of rows){cols.sort((a,b)=>a-b);let start=cols[0],end=start;const push=()=>result.push({x0:start*s,x1:(end+1)*s,y0:row*s,y1:(row+1)*s});for(let i=1;i<cols.length;i++){if(cols[i]===end+1){end=cols[i];}else{push();start=end=cols[i];}}push();}
    return result;
  }
  function overlays(AMap,anchors,solution,sampled,toGeo,colors) {
    const items=[],xy=p=>{const g=toGeo(p);return [g.lon,g.lat];};
    anchors.forEach((a,i)=>{
      const color=colors[i%colors.length],outline=radius=>Array.from({length:120},(_,n)=>{const t=n*2*Math.PI/120;return xy({x:a.x+radius*Math.cos(t),y:a.y+radius*Math.sin(t)});});
      const outer=outline(a.distance+a.error),inner=outline(Math.max(0,a.distance-a.error)).reverse();
      items.push(new AMap.Polygon({path:a.distance>a.error?[outer,inner]:outer,fillColor:color,fillOpacity:.12,strokeWeight:0,zIndex:20}));
      items.push(new AMap.Circle({center:[a.lon,a.lat],radius:a.distance,strokeColor:color,strokeWeight:1,strokeOpacity:.85,fillOpacity:0,zIndex:21}));
      items.push(new AMap.Marker({position:[a.lon,a.lat],title:a.name||a.id,offset:new AMap.Pixel(-12,-12),content:'<span class="map-marker" style="background:'+color+'">'+a.id+'</span>',zIndex:100}));
    });
    if(sampled)rectangles(sampled).forEach(r=>items.push(new AMap.Polygon({path:[xy({x:r.x0,y:r.y0}),xy({x:r.x1,y:r.y0}),xy({x:r.x1,y:r.y1}),xy({x:r.x0,y:r.y1})],strokeWeight:0,fillColor:'#82a54f',fillOpacity:.6,zIndex:30})));
    if(solution)items.push(new AMap.Marker({position:xy(solution),title:'估算位置',offset:new AMap.Pixel(-12,-12),content:'<span class="map-marker" style="background:#243e35">+</span>',zIndex:110}));
    return items;
  }
  const api={loadSDK,normalizePOI,search,rectangles,overlays};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DistanceLensAMap=api;
})(typeof window!=='undefined'?window:globalThis);
