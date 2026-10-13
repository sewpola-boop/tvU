import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ConfigSchema,defaults,normalizeStoredConfig} from '../model.bundle.mjs';
const records=JSON.parse(fs.readFileSync(new URL('../lib/nec-election-2026.json',import.meta.url)));
assert.equal(records.length,16);
assert.equal(new Set(records.map(r=>r.regionId)).size,16);
const template=defaults.leaders[0];
const leaders=records.map((r,i)=>({...template,id:'nec-'+i,level:'metro',name:r.name,regionId:r.regionId,career:'편집한 경력',party:'현재 정당',photo:'https://example.org/photo.png',election:undefined}));
leaders.push({...leaders[0],id:'successor',name:'후임자'});
leaders.push({...leaders[1],id:'duplicate',regionId:'46'});
leaders.push({...leaders[0],id:'basic',level:'basic'});
const input=ConfigSchema.parse({...defaults,home:{...defaults.home,editorRevision:4},leaders});
const before=structuredClone(input),result=normalizeStoredConfig(input);
assert.deepEqual(input,before,'do not mutate input');
assert.equal(result.leaders.filter(l=>l.election).length,16);
for(let i=0;i<16;i++){
  const {election,...rest}=result.leaders[i];
  const {election:oldElection,...original}=before.leaders[i];
  assert.deepEqual(rest,original,'preserve all editorial fields');
  assert.deepEqual(election,records[i]);
}
assert.deepEqual(normalizeStoredConfig(result),result,'idempotent');
assert.deepEqual(ConfigSchema.parse(result),result,'schema round trip');
assert.deepEqual({...result,leaders:[]},{...before,leaders:[]},'preserve unrelated content');
console.log('NEC: 16 records, identity checks, editorial preservation, idempotency and schema round trip passed');
