import type {Config} from './model';
export function accessibleConfig(config:Config,plan:'free'|'plus'|'pro'|'admin'='free'):Config{
 if(plan==='admin')return config;
 const level={free:0,plus:1,pro:2},allowed=(access?:string)=>level[plan]>=level[(access||'free') as 'free'|'plus'|'pro'];
 const entries=Object.entries(config.home.blocks),denied=entries.filter(([,b])=>!allowed(b.access)),open=entries.filter(([,b])=>allowed(b.access));
 const protectedAttachments=entries.flatMap(([,b])=>b.attachments.filter(a=>!allowed(b.access)||!allowed(a.access))),ids=new Set(protectedAttachments.map(a=>a.datasetId)),publicIds=new Set(open.flatMap(([,b])=>b.attachments.filter(a=>allowed(a.access)).map(a=>a.datasetId)));for(const id of publicIds)ids.delete(id);
 const news=new Set(denied.flatMap(([,b])=>b.newsIds||[]));for(const [,b] of open)for(const id of b.newsIds||[])news.delete(id);
 const blocks=Object.fromEntries(entries.map(([id,b])=>[id,allowed(b.access)?{...b,locked:false,attachments:b.attachments.map(a=>({...a,locked:!allowed(a.access),title:config.datasets.find(s=>s.id===a.datasetId)?.title||a.title}))}:{...b,locked:true,body:'',attachments:[],newsIds:[],photos:[],rankingTheme:undefined}]));
 for(const id of ids){const s=config.datasets.find(s=>s.id===id);if(s?.visible)blocks['dataset:'+id]={...blocks['dataset:'+id],title:s.title,body:'',attachments:[],access:protectedAttachments.find(a=>a.datasetId===id)?.access||denied.find(([,b])=>b.attachments.some(a=>a.datasetId===id))?.[1].access||'plus',locked:true}}
 return {...config,datasets:config.datasets.map(s=>ids.has(s.id)?{...s,rows:[],note:'',metadata:undefined}:s),stories:config.stories.filter(s=>!news.has(s.id)),ranking:{...config.ranking,rules:config.ranking.rules.filter(r=>!ids.has(r.datasetId))},home:{...config.home,blocks}};
}
