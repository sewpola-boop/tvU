import type {Config} from './model';
export function accessibleConfig(config:Config,plan:'free'|'plus'|'pro'|'admin'='free'):Config{
 if(plan==='admin')return config;
 const level={free:0,plus:1,pro:2},allowed=(access?:string)=>level[plan]>=level[(access||'free') as 'free'|'plus'|'pro'];
 const entries=Object.entries(config.home.blocks),denied=entries.filter(([,b])=>!allowed(b.access)),open=entries.filter(([,b])=>allowed(b.access));
 const ids=new Set(denied.flatMap(([,b])=>b.attachments.map(a=>a.datasetId))),publicIds=new Set(open.flatMap(([,b])=>b.attachments.map(a=>a.datasetId)));for(const id of publicIds)ids.delete(id);
 const news=new Set(denied.flatMap(([,b])=>b.newsIds||[]));for(const [,b] of open)for(const id of b.newsIds||[])news.delete(id);
 return {...config,datasets:config.datasets.filter(s=>!ids.has(s.id)),stories:config.stories.filter(s=>!news.has(s.id)),ranking:{...config.ranking,rules:config.ranking.rules.filter(r=>!ids.has(r.datasetId))},home:{...config.home,blocks:Object.fromEntries(entries.map(([id,b])=>[id,allowed(b.access)?{...b,locked:false}:{...b,locked:true,body:'',attachments:[],newsIds:[],photos:[],rankingTheme:undefined}]))}};
}
