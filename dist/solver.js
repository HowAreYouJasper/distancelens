(function (root) {
  'use strict';
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const residuals = (p, anchors) => anchors.map(a => distance(p, a) - a.distance);
  const feasible = (p, anchors) => anchors.every(a => Math.abs(distance(p, a) - a.distance) <= a.error + 1e-8);
  // Multi-start damped Gauss-Newton, with line search. All units are fictional meters.
  function solve(anchors, size = 2000) {
    if (anchors.length < 3) throw new Error('至少需要三个参考点');
    let best;
    const cost = p => residuals(p, anchors).reduce((sum, r) => sum + r * r, 0);
    for (let sx = 0; sx <= 4; sx++) for (let sy = 0; sy <= 4; sy++) {
      let p = {x: size * sx / 4, y: size * sy / 4};
      for (let iter = 0; iter < 100; iter++) {
        let xx = 1e-6, xy = 0, yy = 1e-6, bx = 0, by = 0;
        for (const a of anchors) {
          const d = distance(p, a); if (d < 1e-9) continue;
          const ux = (p.x - a.x) / d, uy = (p.y - a.y) / d, r = d - a.distance;
          xx += ux * ux; xy += ux * uy; yy += uy * uy; bx += ux * r; by += uy * r;
        }
        const det = xx * yy - xy * xy;
        const dx = (yy * bx - xy * by) / det, dy = (xx * by - xy * bx) / det;
        if (Math.hypot(dx, dy) < 1e-7) break;
        let step = 1, next;
        while (step > 1e-7) {
          next = {x: p.x - step * dx, y: p.y - step * dy};
          if (cost(next) < cost(p)) break;
          step /= 2;
        }
        if (step <= 1e-7) break;
        p = next;
      }
      const value = cost(p);
      if (!best || value < best.cost) best = {...p, cost: value};
    }
    return {...best, rms: Math.sqrt(best.cost / anchors.length), residuals: residuals(best, anchors)};
  }
  // Raster approximation inside the displayed domain, not an exact polygon intersection.
  function region(anchors, size = 2000, resolution = 240) {
    const cells = [], step = size / resolution;
    for (let row = 0; row < resolution; row++) for (let col = 0; col < resolution; col++) {
      const p = {x: (col + .5) * step, y: (row + .5) * step};
      if (feasible(p, anchors)) cells.push(p);
    }
    return {cells, step, area: cells.length * step * step};
  }
  // Local spherical equirectangular approximation, suitable for small-area demonstrations.
  function geographic(csv) {
    const lines = csv.trim().split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 3 || lines.length > 8) throw new Error('请输入 3 至 8 行参考点');
    const points = lines.map((line, i) => {
      const fields = line.trim().split(/[,，\s]+/);
      if (fields.length !== 3 || fields.some(v => v === '')) throw new Error(`第 ${i + 1} 行需要：纬度,经度,距离`);
      const [lat, lon, distance] = fields.map(Number);
      if (![lat, lon, distance].every(Number.isFinite) || Math.abs(lat) > 80 || Math.abs(lon) > 180 || distance < 0 || distance > 10000) throw new Error(`第 ${i + 1} 行超出范围：纬度 ±80°，经度 ±180°，距离 0 至 10000 m`);
      return {lat, lon, distance, id: String.fromCharCode(65 + i)};
    });
    const rad = Math.PI / 180, R = 6371008.8;
    const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lon0 = points[0].lon;
    const longitudeDelta = lon => ((lon - lon0 + 540) % 360) - 180;
    const projected = points.map(p => ({...p, x: R * longitudeDelta(p.lon) * rad * Math.cos(lat0 * rad), y: R * (p.lat - lat0) * rad}));
    if (projected.some(p => projected.some(q => distance(p, q) > 10000))) throw new Error('参考点间距必须在 10 km 以内，本版使用局部近似投影');
    const xs = projected.flatMap(p => [p.x - p.distance - 500, p.x + p.distance + 500]);
    const ys = projected.flatMap(p => [p.y - p.distance - 500, p.y + p.distance + 500]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const size = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY, 1000);
    const originX = (minX + Math.max(...xs) - size) / 2, originY = (minY + Math.max(...ys) - size) / 2;
    const anchors = projected.map(p => ({...p, x:p.x - originX, y:p.y - originY}));
    if (anchors.every(p => distance(p, anchors[0]) < 1)) throw new Error('参考点不能全部位于同一坐标');
    const projection = {lat0, lon0, originX, originY, radius:R};
    return {anchors, size, projection};
  }
  function toGeographic(p, projection) {
    const {lat0, lon0, originX, originY, radius:R} = projection, rad = Math.PI / 180;
    return {lat:lat0 + (p.y + originY) / (R * rad), lon:((lon0 + (p.x + originX) / (R * rad * Math.cos(lat0 * rad)) + 540) % 360) - 180};
  }
  const api = {distance, residuals, feasible, solve, region, geographic, toGeographic};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DistanceLens = api;
})(typeof window !== 'undefined' ? window : globalThis);
