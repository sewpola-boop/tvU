import type {Config} from './model';
import records from './nec-election-2026.json';

// Match both jurisdiction and person: election results must never be attached
// to a successor, a namesake, or a historical/duplicate regional entry.
export function withNECElectionFacts(config:Config):Config {
  return {...config,leaders:config.leaders.map(leader=>{
    if(leader.level!=='metro')return leader;
    const record=records.find(r=>r.regionId===leader.regionId&&r.name===leader.name);
    if(!record||leader.election)return leader;
    return {...leader,election:record};
  })};
}
