import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import assert from 'node:assert/strict';
import {defaults,normalizeStoredConfig} from '../model.bundle.mjs';

const dir=await fs.mkdtemp(os.tmpdir()+'/tvu-preserve-'),origin='http://127.0.0.1:32974';
const config=structuredClone(defaults);
config.catalogVersion=0;config.partyRevision=0;config.regionRevision=0;config.incheonRevision=0;
const target=config.leaders.find(l=>l.name==='민형배');
Object.assign(target,{regionId:'unmapped-전남광주',dataKey:'전남광주',role:'전남광주시장',name:'민형배',party:'미확인',partyColor:'#123456',partySource:'https://example.test/my-party',photo:'/api/logo?key=12345678-1234-1234-1234-123456789abc.png',photoSource:'https://example.test/my-photo',career:'관리자 직접 입력 경력',policies:'직접 입력 정책',pledges:'직접 입력 공약',source:'https://example.test/my-career',collectedAt:'2026-09-15',historicalStatus:'pending',crimeFacts:'관리자가 확인한 사실',crimeStatus:'none',crimeSource:'https://example.test/facts',crimeCheckedAt:'2026-10-01'});
config.content.title='운영자가 수정한 홈페이지';
config.datasets[0].rows=[['직접 입력한 지역','918.7']];
const original=JSON.stringify(config);
await fs.writeFile(dir+'/published.json',original);
await fs.writeFile(dir+'/draft.json',original);
await fs.mkdir(dir+'/logos');await fs.writeFile(dir+'/logos/12345678-1234-1234-1234-123456789abc.png','stored-photo');
await fs.mkdir(dir+'/raw');await fs.writeFile(dir+'/raw/source.bin','stored-source');
let child,token='';
async function start(){child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'32974',PUBLIC_ORIGIN:origin,DATA_DIR:dir,PREVIEW_PASSWORD:'',OPENAI_CHAT_ENABLED:'false'},stdio:'ignore'});for(let i=0;i<60;i++){try{if((await fetch(origin+'/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,50))}throw Error('Server not ready')}
async function stop(){const c=child;child=null;const done=new Promise(r=>c.once('exit',r));c.kill();await done}
async function request(url,method='GET',value){const r=await fetch(origin+url,{method,headers:{Origin:origin,...(token?{Cookie:token}:{}),...(value?{'Content-Type':'application/json'}:{})},body:value?JSON.stringify(value):undefined});return {r,b:await r.json()}}
try{
 const normalized=normalizeStoredConfig(config),next=normalized.leaders.find(l=>l.id===target.id);
 for(const [key,value] of Object.entries(target))if(!['regionId','role','dataKey'].includes(key))assert.deepEqual(next[key],value,'Preserve '+key);
 assert.equal(next.regionId,'JN-GJ');assert.deepEqual(normalized.datasets[0].rows,config.datasets[0].rows);
 assert.deepEqual(normalizeStoredConfig(normalized),normalized);
 for(let run=0;run<2;run++){
  await start();
  if(!token){const login=await request('/api/auth/login','POST',{username:'admin',password:'1111'});assert.equal(login.r.status,200);token=login.r.headers.getSetCookie().find(c=>c.startsWith('__Host-tvu_sysop=')).split(';')[0]}
  assert.equal((await request('/api/me')).b.admin,true,'Admin account/session survives restart');
  for(const endpoint of ['/api/state','/api/draft']){const result=await request(endpoint);assert.equal(result.r.status,200);assert.deepEqual(result.b.config.leaders.find(l=>l.id===target.id),next);assert.equal(result.b.config.content.title,config.content.title);assert.deepEqual(result.b.config.datasets[0].rows,config.datasets[0].rows)}
  assert.equal(await fs.readFile(dir+'/published.json','utf8'),original);assert.equal(await fs.readFile(dir+'/draft.json','utf8'),original);
  assert.equal(await fs.readFile(dir+'/logos/12345678-1234-1234-1234-123456789abc.png','utf8'),'stored-photo');assert.equal(await fs.readFile(dir+'/raw/source.bin','utf8'),'stored-source');
  const backups=(await fs.readdir(dir+'/history')).filter(f=>f.startsWith('deploy-'));assert.equal(backups.length,2);for(const f of backups)assert.equal(await fs.readFile(dir+'/history/'+f,'utf8'),original);
  await stop();
 }
 console.log('운영 데이터 보존: 프로필 전 항목·사용자 수치·초안/발행본 원문·사진/원자료·관리자 세션·재시작·원문 백업 통과');
}finally{if(child)await stop();await fs.rm(dir,{recursive:true,force:true})}
