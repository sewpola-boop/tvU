import regions from './regions.json';
import type {Config} from './model';
export const generalDistricts=regions.filter(r=>r.level==='district'&&regions.some(parent=>parent.id===r.parent&&parent.level==='city'&&parent.parent!=='KR'));
export const generalDistrictLabel=(id:string)=>{const r=regions.find(r=>r.id===id),parent=regions.find(p=>p.id===r?.parent);return r?((generalDistricts.some(g=>g.id===id)?parent?.name+' ':'')+r.name):id};
export function withGeneralDistrictSlots(config:Config):Config{
 const missing=generalDistricts.filter(r=>!config.leaders.some(l=>l.regionId===r.id));
 if(!missing.length)return config;
 return {...config,leaders:[...config.leaders,...missing.map(r=>({id:'general-district-'+r.id,name:'',party:'미확인',role:r.name+'청장',regionId:r.id,photo:'',career:'',source:'',level:'basic' as const,dataKey:generalDistrictLabel(r.id),asOf:'',historicalStatus:'pending' as const,policies:'',pledges:'',policySource:'',pledgeSource:'',photoSource:'',collectedAt:'',score:0,change:0}))]};
}
