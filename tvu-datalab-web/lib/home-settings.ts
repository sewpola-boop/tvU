export type BlockSetting={collapsed:boolean;highlight:boolean};
export const isMonthly=(id:string)=>id==='recycling'||id.startsWith('realmeter-');
export function blockSetting(id:string,settings:Record<string,BlockSetting>):BlockSetting{return settings[id]||{collapsed:false,highlight:false}}
