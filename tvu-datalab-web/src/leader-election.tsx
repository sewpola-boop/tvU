import './leader-election.css';
import type {Config} from '../lib/model';

export function LeaderElection({leader}:{leader:Config['leaders'][number]}) {
  const e=leader.election;
  if(!e||e.name!==leader.name||e.regionId!==leader.regionId)return null;
  return <details className="nec-election panel">
    <summary>선관위 공식 프로필 · 당선 정보</summary>
    <p className="tiny muted">{e.electionName} · {e.electionDate} · {e.district}</p>
    <dl>
      <dt>생년월일</dt><dd>{e.birthDate}</dd>
      <dt>학력</dt><dd>{e.education}</dd>
      <dt>선거 당시 정당</dt><dd>{e.party}</dd>
      <dt>득표 결과</dt><dd>{e.votes.toLocaleString('ko-KR')}표 · {e.voteShare.toFixed(2)}%</dd>
      <dt>선관위 신고 경력</dt><dd style={{whiteSpace:'pre-line'}}>{e.career}</dd>
    </dl>
    <p className="tiny muted">선거 당시 신고 자료입니다. 경력의 ‘현’ 표기와 소속 정당은 현재와 다를 수 있습니다.</p>
    <a className="text-link" href={e.source} target="_blank" rel="noreferrer">중앙선거관리위원회 당선인 명부 ↗</a>
    <p className="tiny muted">원문에서 시·도지사선거 선택 후 검색 · 확인일 {e.checkedAt}</p>
  </details>;
}
