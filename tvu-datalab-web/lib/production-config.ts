import {withGeneralDistrictSlots} from './general-districts';
import {ConfigSchema,normalizeConfig,type Config} from './model';

// Release defaults are for new installations. Existing administrator records
// remain authoritative, even when a new release includes collected profiles.
export function normalizeStoredConfig(input:unknown):Config{
 const saved=ConfigSchema.parse(input);
 let next=normalizeConfig({...saved,catalogVersion:1,partyRevision:1});
 // Upgrade only layout geometry; never copy preview records or editorial fields.
 if(next.home.editorRevision<1){const monthly=next.home.blocks.monthly;next={...next,home:{...next.home,editorRevision:1,placement:'free',mode:'horizontal',blocks:{...next.home.blocks,...(monthly?{monthly:{...monthly,x:25,y:undefined,span:7,height:undefined,autoFit:true,arrangement:monthly.arrangement||'horizontal'}}:{})}}}}
 const existing=new Map(saved.leaders.map(leader=>[leader.id,leader]));
 return withGeneralDistrictSlots({...next,leaders:next.leaders.map(leader=>{
  const original=existing.get(leader.id);
  if(!original)return leader;
  // Only the explicitly supported administrative-area alias migration changes
  // linkage fields. Names, photos, parties, facts and all editorial data survive.
  return {...original,regionId:leader.regionId,role:leader.role,dataKey:leader.dataKey};
 })});
}
