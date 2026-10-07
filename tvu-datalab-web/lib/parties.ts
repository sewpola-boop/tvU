export const parties=['미확인','국민의힘','더불어민주당','개혁신당','조국혁신당','무소속'] as const;
export function partyRing(party:string){return ({국민의힘:'#e53935',더불어민주당:'#1976df',개혁신당:'#f58220',조국혁신당:'linear-gradient(135deg,#153d80 20%,#54c8eb 85%)',무소속:'#ffffff'} as Record<string,string>)[party]||'#c6c0cd'}
