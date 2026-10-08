'use client';
import {useEffect,useState} from 'react';
type Account={admin:boolean;user?:{name:string}|null};
let pending:Promise<Account>|undefined;
export function useAccount(){const [account,setAccount]=useState<Account|null>(null);useEffect(()=>{let active=true;const request=pending??=fetch('/api/me',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('로그인 상태 확인 실패');return r.json() as Promise<Account>}).catch(e=>{pending=undefined;throw e});request.then(a=>{if(active)setAccount(a)}).catch(()=>{if(active)setAccount({admin:false,user:null})});return()=>{active=false}},[]);return account}
