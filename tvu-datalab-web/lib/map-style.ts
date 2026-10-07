export const defaultMapColors:Record<string,string>={'국민의힘':'#e53935','더불어민주당':'#1976df','개혁신당':'#f58220','조국혁신당':'#153d80','무소속':'#ffffff','미확인':'#ddd5ee'};
export type MapRegion={id:string;name:string;parent:string;level:string;generalDistrict?:boolean;polygons:number[][][][]};
export function bounds(regions:MapRegion[]){const pts=regions.flatMap(r=>r.polygons.flat(2));return {minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))}}
export function nearbyRegions(current:MapRegion,all:MapRegion[]){const b=bounds([current]),dx=(b.maxX-b.minX)*.35,dy=(b.maxY-b.minY)*.35;return all.filter(r=>r.id!==current.id&&r.level===current.level&&r.parent!=='KR').filter(r=>{const n=bounds([r]);return n.maxX>=b.minX-dx&&n.minX<=b.maxX+dx&&n.maxY>=b.minY-dy&&n.minY<=b.maxY+dy})}
export const nextZoom=(zoom:number,delta:number)=>Math.max(1,Math.min(4,zoom*Math.exp(-Math.max(-100,Math.min(100,delta))*.003)));
