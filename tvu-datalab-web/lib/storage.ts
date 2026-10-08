import {session} from './sysop-auth';
import { env } from 'cloudflare:workers';
import { defaults,ConfigSchema,normalizeConfig } from './model';
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function bucket(){const b=(env as any).BUCKET as R2Bucket;if(!b)throw new Error('저장소가 연결되지 않았습니다.');return b;}
export async function auth(req:Request){return !!await session(req,bucket())}
export async function guard(req:Request,write=false){if(!await auth(req))return json({error:'관리자 계정으로 로그인해야 합니다.'},403);if(write&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'요청 출처가 일치하지 않습니다.'},403);return null;}
export async function readConfig(key='published.json'){const obj=await bucket().get(key);return obj?{config:normalizeConfig(await obj.json()),etag:obj.etag,updated:obj.uploaded.toISOString()}:{config:defaults,etag:null,updated:null};}
export async function readBody(req:Request){const t=await req.text();if(t.length>4_000_000)throw new Error('설정은 4MB 이하만 저장할 수 있습니다.');return JSON.parse(t);}
export async function storeConfig(key:string,config:unknown,etag:string|null){const parsed=ConfigSchema.safeParse(config);if(!parsed.success)return json({error:parsed.error.issues.map(i=>i.message).join('; ')},400);const obj=await bucket().put(key,JSON.stringify(parsed.data),{httpMetadata:{contentType:'application/json'},onlyIf:etag?{etagMatches:etag}:{etagDoesNotMatch:'*'}});if(!obj)return json({error:'다른 편집 내용이 먼저 저장되었습니다. 새로 불러온 뒤 다시 편집해 주세요.'},409);return json({config:parsed.data,etag:obj.etag,updated:obj.uploaded.toISOString()});}
