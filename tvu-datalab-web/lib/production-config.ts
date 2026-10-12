import previewEditorial from './preview-editorial.json';
import previewLayout from './preview-layout.json';
import {withGeneralDistrictSlots} from './general-districts';
import {ConfigSchema,normalizeConfig,type Config} from './model';

// Release defaults are for new installations. Existing administrator records
// remain authoritative, even when a new release includes collected profiles.
export function normalizeStoredConfig(input:unknown):Config{
 const saved=ConfigSchema.parse(input);
 let next=normalizeConfig({...saved,catalogVersion:1,partyRevision:1});
 // Match the verified preview layout, keeping data and editorial content local.
 if(next.home.editorRevision<2){const blocks={...next.home.blocks};for(const [id,b] of Object.entries(blocks))blocks[id]={...b,x:undefined,y:undefined,column:undefined,row:undefined};for(const [id,geometry] of Object.entries(previewLayout.blocks)){const old=blocks[id]||{title:'',body:'',attachments:[]};blocks[id]={...old,span:undefined,height:undefined,...geometry,...(['monthly','map','stories'].includes(id)?{title:''}:{})} as Config['home']['blocks'][string]}
 next={...next,home:{...next.home,editorRevision:2,placement:previewLayout.placement as 'free'|'grid',mode:previewLayout.mode as 'horizontal'|'vertical',columns:previewLayout.columns,freeLayout:false,order:previewLayout.order,blocks,settings:{...next.home.settings,...previewLayout.settings}},mapStyle:{...next.mapStyle,calloutOrders:previewLayout.calloutOrders,hiddenCallouts:previewLayout.hiddenCallouts}}}
 if(next.home.editorRevision<3){const stories=previewEditorial.stories.map(s=>({...s,id:'preview:'+s.id}));const blocks={...next.home.blocks,watch:{...(next.home.blocks.watch||{title:'',body:'',attachments:[]}),preferEditorial:true}};next=ConfigSchema.parse({...next,stories:[...next.stories.filter(s=>!s.id.startsWith('preview:')).map(s=>({...s,visible:false})),...stories],home:{...next.home,editorRevision:3,blocks}})}
 const existing=new Map(saved.leaders.map(leader=>[leader.id,leader]));
 return withGeneralDistrictSlots({...next,leaders:next.leaders.map(leader=>{
  const original=existing.get(leader.id);
  if(!original)return leader;
  // Only the explicitly supported administrative-area alias migration changes
  // linkage fields. Names, photos, parties, facts and all editorial data survive.
  return {...original,regionId:leader.regionId,role:leader.role,dataKey:leader.dataKey};
 })});
}
