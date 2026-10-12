export function moveCallout(ids:string[],id:string,target:string,after=false){const next=ids.filter(x=>x!==id);if(!ids.includes(id)||!next.includes(target))return ids;next.splice(next.indexOf(target)+(after?1:0),0,id);return next}
export function restoreCallout(hidden:string[],id:string){return hidden.filter(x=>x!==id)}
