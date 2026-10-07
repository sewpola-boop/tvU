import {calculate} from './table-engine';
import type {Config} from './model';
export function compositeRanking(config:Config,scope:'basic'|'metro'){
 const rules=config.ranking.rules.filter(r=>r.enabled&&r.scope===scope&&r.weight>0);
 const leaders=config.leaders.filter(l=>l.level===scope&&l.name&&l.name!=='자료 확인 중');
 const maps=rules.map(rule=>{const values=new Map<string,number>();const duplicate=new Set<string>();
  if(rule.kind==='record'){for(const l of leaders){const row=config.records.filter(r=>r.regionId===l.regionId&&r.metric===rule.metric&&r.year===rule.year&&r.status!=='demo'&&(config.ranking.includeReference||r.status==='verified')).sort((a,b)=>b.year-a.year)[0];if(row)values.set(l.id,row.value)}}
  else{const sheet=config.datasets.find(s=>s.id===rule.datasetId);if(sheet&&!sheet.id.startsWith('demo-')&&!['realmeter-education','recycling'].includes(sheet.id)){const cells=calculate(sheet);for(const row of cells){const key=String(row[rule.keyColumn]?.value||'').trim(),v=row[rule.valueColumn];if(!key||!v||v.error||typeof v.value!=='number')continue;const found=leaders.filter(l=>[l.regionId,l.dataKey,l.name].filter(Boolean).includes(key));if(found.length!==1)continue;const l=found[0];if(sheet.id==='realmeter-general'&&String(row[1]?.value)!==l.name)continue;if(values.has(l.id))duplicate.add(l.id);else values.set(l.id,v.value)}for(const id of duplicate)values.delete(id)}}
  return {rule,values};
 });
 const complete=leaders.filter(l=>rules.length>0&&maps.every(m=>m.values.has(l.id)));
 const excluded=leaders.filter(l=>!complete.some(x=>x.id===l.id));
 if(complete.length<2)return {rows:[],excluded:leaders,rules,reason:rules.length?'동일한 모든 지표가 있는 지역이 2곳 이상 필요합니다.':'이 범위의 평가 지표를 관리자에서 선택하세요.'};
 const rows=complete.map(leader=>{const contributions=maps.map(({rule,values})=>{const value=values.get(leader.id)!;const all=complete.map(l=>values.get(l.id)!);const better=all.filter(v=>rule.direction==='high'?v>value:v<value).length;const equal=all.filter(v=>v===value).length;const rank=better+1;const percentile=100*(complete.length-1-better-(equal-1)/2)/(complete.length-1);return {title:rule.title,value,rank,percentile,weight:rule.weight}});const weight=contributions.reduce((a,x)=>a+x.weight,0);const score=Math.round(contributions.reduce((a,x)=>a+x.percentile*x.weight,0)/weight*10000)/10000;return {leader,score,rank:0,contributions}}).sort((a,b)=>b.score-a.score||a.leader.role.localeCompare(b.leader.role,'ko'));
 rows.forEach(row=>row.rank=1+rows.filter(x=>x.score>row.score).length);
 return {rows,excluded,rules,reason:''};
}
