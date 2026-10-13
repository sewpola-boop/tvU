import type {Config} from './model';
import regions from './regions.json';
const scopes:[string,string][]=[['서울','11'],['부산','26'],['대구','27'],['인천','28'],['대전','30'],['울산','31'],['세종','36'],['경기','41'],['강원','42'],['충청북|충북','43'],['충청남|충남','44'],['전북|전라북','45'],['전남|전라남|전남광주','JN-GJ'],['경상북|경북','47'],['경상남|경남','48'],['제주','50']];
const canonical=(s:string)=>s.trim().replace(/서울특별시|서울시/g,'서울').replace(/부산광역시|부산시/g,'부산').replace(/대구광역시|대구시/g,'대구').replace(/인천광역시|인천시/g,'인천').replace(/대전광역시|대전시/g,'대전').replace(/울산광역시|울산시/g,'울산').replace(/세종특별자치시|세종시/g,'세종').replace(/경기도/g,'경기').replace(/강원특별자치도|강원도/g,'강원').replace(/충청북도|충북/g,'충청북').replace(/충청남도|충남/g,'충청남').replace(/전북특별자치도|전라북도|전라북|전북/g,'전북').replace(/전라남도|전남/g,'전라남').replace(/경상북도|경북/g,'경상북').replace(/경상남도|경남/g,'경상남').replace(/제주특별자치도|제주도/g,'제주').replace(/[\s·,()]/g,'');
const place=(role:string)=>canonical(role.replace(/도지사$|지사$|구청장$|군수$|시장$|청장$/,''));
const regionById=new Map(regions.map(r=>[r.id,r]));
function regionPath(id:string){const names:string[]=[];let r=regionById.get(id);for(let i=0;r&&i<4;i++){names.unshift(r.name);r=regionById.get(r.parent)}return canonical(names.join(' '))}
function scopeOf(text:string){const found=scopes.filter(([name])=>new RegExp(name).test(text));return found.length===1?found[0][1]:undefined}
function inScope(id:string,scope:string){if(scope==='JN-GJ')return id==='JN-GJ'||id.startsWith('29')||id.startsWith('46');return id.startsWith(scope)}
export function monthlyIdentity(sheetId:string,row:string[],leaders:Config['leaders'],context=''){
 const region=row[0]||'',named=sheetId.startsWith('realmeter-')?(row[1]||''):'';
 if(sheetId==='realmeter-education'){const found=leaders.filter(l=>l.name===named&&/교육감/.test(l.role));return {region,name:named||'자료 미등록',leader:found.length===1?found[0]:undefined,education:true}}
 if(/^(전국|대한민국|합계|총계|소계|전체)$/.test(region.trim()))return {region,name:'지역 합계',leader:undefined,education:false};
 const query=canonical(region),scope=scopeOf(region)||scopeOf(context),metroOnly=sheetId.startsWith('realmeter-')||sheetId==='recycling';
 const scored=leaders.filter(l=>!metroOnly||l.level==='metro').flatMap(l=>{if(named&&l.name!==named)return [];if(scope&&!inScope(l.regionId,scope))return [];const key=canonical(l.dataKey||''),full=regionPath(l.regionId),short=place(l.role);let score=0;if(l.id===region||l.regionId===region)score=150;else if(query&&(query===key||query===full))score=130;else if(query&&query===short)score=100;else if(query&&full.endsWith(query)&&/市|시|군|구/.test(region))score=90;else if(query&&canonical(l.name)===query)score=80;if(!score)return [];return [{leader:l,score}]});
 const best=Math.max(0,...scored.map(x=>x.score)),found=scored.filter(x=>x.score===best),leader=found.length===1?found[0].leader:undefined;
 return {region,name:named||leader?.name||'단체장 미등록',leader,education:false}
}
