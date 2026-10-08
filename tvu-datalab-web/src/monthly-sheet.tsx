'use client';
import {useState} from 'react';
import type {Config} from '../lib/model';
import type {Sheet} from '../lib/table-engine';
import {monthlyIdentity} from '../lib/monthly-identity';
import {partyRing} from '../lib/parties';
import {SheetView} from './dataset-view';
function Identity({sheet,row,leaders}:{sheet:Sheet;row:string[];leaders:Config['leaders']}){const [failed,setFailed]=useState('');const x=monthlyIdentity(sheet.id,row,leaders),l=x.leader;const content=<><span className="monthly-avatar" style={{background:partyRing(l?.party||'미확인')}}>{l?.photo&&failed!==l.photo?<img src={l.photo} alt={x.name} onError={()=>setFailed(l.photo)}/>:<span aria-label="사진 미등록">{x.name==='자료 미등록'||x.name==='단체장 미등록'?'?':x.name.slice(0,1)}</span>}</span><span><b>{x.name}</b><small>{x.education?'교육감':l?.role||'단체장 자료 확인 필요'}</small></span></>;return l?<a className="monthly-identity" href={'/#leader/'+encodeURIComponent(l.id)}>{content}</a>:<span className="monthly-identity">{content}</span>}
export default function MonthlySheet({sheet,leaders,animated=true}:{sheet:Sheet;leaders:Config['leaders'];animated?:boolean}){return <SheetView sheet={sheet} animated={animated} rowIdentity={r=><Identity sheet={sheet} row={sheet.rows[r]||[]} leaders={leaders}/>} identityTitle={sheet.id==='realmeter-education'?'교육감':'연결 단체장'}/>}
