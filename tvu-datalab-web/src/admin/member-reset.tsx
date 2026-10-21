'use client';
import {useEffect,useRef,useState} from 'react';

export default function MemberReset({onClose,onDone}:{onClose:()=>void;onDone:(count:number)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState<{count:number;fingerprint:string}|null>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close()},[]);
 async function submit(){
  if(busy||!password||(preview&&confirmation!=='전체 회원 초기화'))return;
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/members/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password,confirm:'RESET_NON_ADMIN_MEMBERS',...(preview?{fingerprint:preview.fingerprint}:{})})});
   const b=await r.json();
   if(!r.ok){if(r.status===409){setPreview(null);setConfirmation('')}throw Error(b.error||'초기화 요청을 처리하지 못했습니다.')}
   if(b.preview){setPreview({count:b.count,fingerprint:b.fingerprint});return}
   setPassword('');onDone(b.resetCount);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <dialog ref={dialog} className="member-reset-dialog member-delete-dialog" aria-labelledby="member-reset-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}>
  <form onSubmit={e=>{e.preventDefault();void submit()}}>
   <h2 id="member-reset-title">전체 회원 초기화</h2>
   <p>관리자 계정을 제외한 <strong>모든 회원정보</strong>를 초기화합니다. 검색·필터와 관계없이 전체 회원이 대상입니다.</p>
   <p>가입·탈퇴·삭제·승인 대기 기록과 회원 로그인 정보가 삭제됩니다. 복원할 수 없으며, 기존 아이디로 3개월 대기 없이 새로 가입할 수 있습니다.</p>
   <p>관리자 계정과 사이트 콘텐츠·지자체장 정보·사진은 유지됩니다.</p>
   <label>현재 관리자 비밀번호<input autoFocus type="password" autoComplete="current-password" required maxLength={128} disabled={busy} value={password} onChange={e=>{setPassword(e.target.value);setPreview(null);setConfirmation('')}}/></label>
   {preview&&<div className="member-reset-summary" role="status"><strong>초기화 대상: {preview.count.toLocaleString('ko-KR')}건</strong><p>{preview.count?'삭제 기록을 포함한 전체 회원 기록 수입니다. 아래 문구를 입력한 후 초기화하세요.':'초기화할 회원정보가 없습니다.'}</p></div>}
   {!!preview?.count&&<label>확인 문구: 전체 회원 초기화<input autoComplete="off" required disabled={busy} value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="전체 회원 초기화"/></label>}
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="actions"><button type="button" disabled={busy} onClick={onClose}>취소</button><button className="danger" disabled={busy||!password||(!!preview&&(preview.count===0||confirmation!=='전체 회원 초기화'))}>{busy?'처리 중…':preview?'전체 회원 초기화 실행':'초기화 대상 확인'}</button></div>
  </form>
 </dialog>
}
