import {ConfigSchema,normalizeConfig,type Config} from './model';

// Release defaults are for new installations. Existing administrator records
// remain authoritative, even when a new release includes collected profiles.
export function normalizeStoredConfig(input:unknown):Config{
 const saved=ConfigSchema.parse(input);
 const next=normalizeConfig({...saved,catalogVersion:1,partyRevision:1});
 const existing=new Map(saved.leaders.map(leader=>[leader.id,leader]));
 return {...next,leaders:next.leaders.map(leader=>{
  const original=existing.get(leader.id);
  if(!original)return leader;
  // Only the explicitly supported administrative-area alias migration changes
  // linkage fields. Names, photos, parties, facts and all editorial data survive.
  return {...original,regionId:leader.regionId,role:leader.role,dataKey:leader.dataKey};
 })};
}
