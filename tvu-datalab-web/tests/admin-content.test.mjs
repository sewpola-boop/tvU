import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {registerMember,rejoinDate} from '../member.bundle.mjs';
const dir=await mkdtemp(path.join(tmpdir(),'tvu-admin-test-')),origin='http://127.0.0.1:3187';
const hash=s=>createHash('sha256').update(s).digest('hex');
const store={async get(key){try{const text=await readFile(path.join(dir,key),'utf8');return {etag:hash(text),json:async()=>JSON.parse(text)}}catch(e){if(e.code==='ENOENT')return null;throw e}},async put(key,text,options){const old=await this.get(key);if(options?.onlyIf?.etagDoesNotMatch==='*'&&old)return null;await mkdir(path.dirname(path.join(dir,key)),{recursive:true});await writeFile(path.join(dir,key),text);return {etag:hash(text)}},async delete(key){await rm(path.join(dir,key),{force:true})}};
let child;async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'3187',PUBLIC_ORIGIN:origin,PREVIEW_PASSWORD:''},stdio:['ignore','pipe','pipe']});await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited')}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Startup timeout')),5000);t.unref()})])}
async function stop(){child.kill();await once(child,'exit')}
let cookie='';async function api(url,method='GET',body,authenticated=true,requestOrigin=origin){const response=await fetch(origin+url,{method,headers:{Origin:requestOrigin,'Content-Type':'application/json',...(authenticated&&cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')}}
try{
 assert.equal((await registerMember(new Request(origin),store,{username:'testmember',password:'test-pass-123',name:'테스트',profile:{phone:'01012345678',address:'테스트 주소'}})).status,201);
 await start();
 const initial=await api('/api/intro-layout');assert.equal(initial.status,200);assert.equal(initial.body.etag,null);
 assert.equal((await api('/api/intro-layout','PUT',{etag:null,layout:{}},false)).status,403);
 assert.equal((await api('/api/members','DELETE',{},false)).status,403);
 const memberLogin=await api('/api/auth/login','POST',{username:'testmember',password:'test-pass-123'},false);assert.equal(memberLogin.status,200);const memberCookie=memberLogin.cookie.match(/__Host-tvu_member=[a-f0-9]+/)[0];
 const login=await api('/api/auth/login','POST',{username:'admin',password:'1111'},false);assert.equal(login.status,200);cookie=login.cookie.match(/__Host-tvu_sysop=[a-f0-9]+/)[0];
 const member=(await api('/api/members')).body.members[0];const deletion={username:member.username,etag:member.etag,password:'incorrect'};
 assert.equal((await api('/api/members','DELETE',deletion)).status,403);assert.equal((await api('/api/members')).body.members[0].name,'테스트');
 assert.equal((await api('/api/members','DELETE',{...deletion,password:'1111',etag:'stale'})).status,409);
 const deleted=await api('/api/members','DELETE',{...deletion,password:'1111'});assert.equal(deleted.status,200);assert.ok(Date.parse(deleted.body.deletedAt));
 const tombstone=await store.get('auth/members/'+hash(member.username));assert.deepEqual(Object.keys(await tombstone.json()).sort(),['deletedAt','deletedBy','rejoinAvailableAt','status','username','version','withdrawnAt']);
 const after=(await api('/api/members')).body.members[0];assert.equal(after.deletedAt,deleted.body.deletedAt);assert.equal(after.profile.phone,'');
 assert.equal((await api('/api/members','PUT',{...member,name:'복원'})).status,410);
 assert.equal((await api('/api/members','DELETE',{...deletion,password:'1111'})).status,410);
 assert.equal((await api('/api/auth/login','POST',{username:'testmember',password:'test-pass-123'},false)).status,401);
 const me=await fetch(origin+'/api/me',{headers:{Cookie:memberCookie}}).then(r=>r.json());assert.equal(me.role,'guest');
 const schema=JSON.parse(await readFile(new URL('../public/intro-schema.json',import.meta.url),'utf8'));
 const layout=initial.body.layout;layout.texts[Object.keys(schema.texts)[0]]='<script>alert(1)</script> 수정한 제목';layout.order.reverse();layout.hidden=['guide'];layout.images.hero={url:'https://example.com/a.png',alt:'샘플',fit:'cover'};layout.styles.hero={spacing:'spacious',align:'center'};
 assert.equal((await api('/api/intro-layout','PUT',{etag:null,layout},true,'https://invalid.example')).status,403);
 const saved=await api('/api/intro-layout','PUT',{etag:null,layout});assert.equal(saved.status,200);assert.ok(saved.body.etag);
 assert.deepEqual((await api('/api/intro-layout','GET',undefined,false)).body.layout,layout);
 assert.equal((await api('/api/intro-layout','PUT',{etag:null,layout})).status,409);
 const invalid=structuredClone(layout);invalid.images.hero.url='javascript:alert(1)';assert.equal((await api('/api/intro-layout','PUT',{etag:saved.body.etag,layout:invalid})).status,400);
 const badText=structuredClone(layout);badText.texts.unknown='no';assert.equal((await api('/api/intro-layout','PUT',{etag:saved.body.etag,layout:badText})).status,400);
 await stop();await start();assert.deepEqual((await api('/api/intro-layout')).body.layout,layout);assert.equal((await api('/api/members')).body.members[0].status,'deleted');

 assert.equal(rejoinDate('2026-11-30T03:00:00.000Z'),'2027-02-28T03:00:00.000Z');
 const consentVersion=(await api('/api/auth/signup-settings')).body.consentVersion;
 const signup={username:'testmember',password:'new-pass-123',name:'새 회원',terms:true,privacy:true,consentVersion,profile:{regionId:'11500',address:'서울 강서구 테스트 주소',birthDate:'1990-01-01',email:'test@example.com'}};
 const pending=await api('/api/auth/signup','POST',signup,false);assert.equal(pending.status,202);assert.equal(pending.body.pending,true);assert.ok(pending.body.rejoinAvailableAt);
 assert.equal((await api('/api/auth/login','POST',{username:signup.username,password:signup.password},false)).status,403);
 let current=(await api('/api/members')).body.members[0];assert.equal(current.status,'rejoin_pending');
 assert.equal((await api('/api/members/approve','POST',current,false)).status,403);
 assert.equal((await api('/api/members/approve','POST',{...current,etag:'stale'})).status,409);
 assert.equal((await api('/api/members/approve','POST',current)).status,200);
 assert.equal((await api('/api/auth/login','POST',{username:signup.username,password:signup.password},false)).status,200);
 current=(await api('/api/members')).body.members[0];
 assert.equal((await api('/api/members','DELETE',{...current,password:'1111'})).status,200);
 assert.equal((await api('/api/auth/signup','POST',signup,false)).status,202);
 // Advance only the isolated test record to the end of its waiting period.
 const memberKey='auth/members/'+hash(signup.username),obj=await store.get(memberKey),record=await obj.json();record.rejoinAvailableAt='2026-01-01T00:00:00.000Z';await store.put(memberKey,JSON.stringify(record));
 assert.equal((await api('/api/auth/login','POST',{username:signup.username,password:signup.password},false)).status,200);
 current=(await api('/api/members')).body.members[0];assert.equal((await api('/api/members','DELETE',{...current,password:'1111'})).status,200);
 let old=await (await store.get(memberKey)).json();old.withdrawnAt='2026-01-01T00:00:00.000Z';old.deletedAt=old.withdrawnAt;old.rejoinAvailableAt=rejoinDate(old.withdrawnAt);await store.put(memberKey,JSON.stringify(old));
 assert.equal((await api('/api/auth/signup','POST',signup,false)).status,201);
 current=(await api('/api/members')).body.members[0];assert.equal((await api('/api/members','DELETE',{...current,password:'1111'})).status,200);
 current=(await api('/api/members')).body.members[0];assert.ok(Date.parse(current.rejoinAvailableAt)>Date.now());
 assert.equal((await api('/api/members/approve','POST',current)).status,200);
 assert.equal((await api('/api/auth/signup','POST',signup,false)).status,201);
 const adminBefore=await readFile(path.join(dir,'auth/sysop.json'),'utf8'),stateBefore=(await api('/api/state')).body;
 const reset={password:'1111',confirm:'RESET_NON_ADMIN_MEMBERS'};
 assert.equal((await api('/api/members/reset','POST',reset,false)).status,403);
 assert.equal((await api('/api/members/reset','POST',{...reset,password:'wrong'})).status,403);
 const preview=await api('/api/members/reset','POST',reset);assert.equal(preview.body.count,1);
 assert.equal((await api('/api/members/reset','POST',{...reset,fingerprint:'stale'})).status,409);
 const cleared=await api('/api/members/reset','POST',{...reset,fingerprint:preview.body.fingerprint});assert.equal(cleared.body.resetCount,1);
 assert.equal((await api('/api/members')).body.members.length,0);assert.equal((await api('/api/me')).body.admin,true);
 assert.equal(await readFile(path.join(dir,'auth/sysop.json'),'utf8'),adminBefore);assert.deepEqual((await api('/api/state')).body,stateBefore);
 assert.equal((await api('/api/auth/signup','POST',signup,false)).status,201);
 console.log('PASS: rejoin pending/approval/three-month expiry/month-end, new cooldown per withdrawal, tombstone preapproval, password-protected reset preview/conflict, admin and content preservation');
 console.log('PASS: admin authorization, password rejection, deletion CAS, privacy erasure, session invalidation, deleted record, layout authorization/origin, save/conflict/validation, restart persistence');
}finally{if(child?.exitCode===null)await stop();await rm(dir,{recursive:true,force:true})}
