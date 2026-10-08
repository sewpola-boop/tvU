import type {Config} from './model';
import {compositeRanking} from './ranking';
export function rankingThemes(config:Config,scope:'basic'|'metro'){
 const rules=config.ranking.rules.filter(r=>r.enabled&&r.scope===scope&&r.weight>0);
 return [{id:'composite',title:'종합랭킹',result:compositeRanking(config,scope)},...rules.map(rule=>({id:rule.id,title:rule.title,result:compositeRanking({...config,ranking:{...config.ranking,rules:[rule]}},scope)}))];
}
export function rankComparisonKey(config:Config,scope:'basic'|'metro',theme:ReturnType<typeof rankingThemes>[number],leaderId:string){const rules=theme.result.rules.map(r=>[r.id,r.kind,r.datasetId,r.keyColumn,r.valueColumn,r.metric,r.year,r.direction,r.weight]);const cohort=theme.result.rows.map(r=>r.leader.id).sort();const signature=JSON.stringify([config.ranking.includeReference,rules,cohort]);let a=2166136261,b=3335557771;for(let i=0;i<signature.length;i++){a=Math.imul(a^signature.charCodeAt(i),16777619);b=Math.imul(b^signature.charCodeAt(i),2246822519)}return [scope,theme.id,(a>>>0).toString(16)+(b>>>0).toString(16),leaderId].join('|')}
export function captureRankingBaseline(config:Config){const ranks:Record<string,number>={};for(const scope of ['metro','basic'] as const)for(const theme of rankingThemes(config,scope))for(const row of theme.result.rows)ranks[rankComparisonKey(config,scope,theme,row.leader.id)]=row.rank;return ranks}
