export function orderedIds(ids:string[],order:string[]){return [...order.filter((id,i)=>ids.includes(id)&&order.indexOf(id)===i),...ids.filter(id=>!order.includes(id))]}
export function moveBlock(ids:string[],from:string,to:string){if(from===to||!ids.includes(from)||!ids.includes(to))return ids;const next=ids.filter(id=>id!==from);next.splice(ids.indexOf(to),0,from);return next}
