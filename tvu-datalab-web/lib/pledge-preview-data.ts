import {jongnoPledgePreview} from './jongno-pledge-data';
import type {Config} from './model';
export const pledgePreviewSource='https://policy.nec.go.kr/plc/commiment/initUELCommiment.do?menuId=WINNR2#none';
export const seoulPledgePreview={name:'오세훈',pledgeElection:'제9회 전국동시지방선거',pledges:'',pledgeSource:pledgePreviewSource,pledgeItems:[
{id:'nec-seoul-2026-1',category:'주택1',title:'멈췄던 공급에 속도를! 압도적 주택공급',body:'□ 목표\n2031년까지 31만 호 착공.\n\n□ 이행방법\n핵심 정비구역 관리, 인허가 단축, 강북·서남권 개발 인센티브.\n\n□ 이행기간\n3년 내 8.5만 호, 2031년까지 전체 목표 추진.\n\n□ 재원\n민간 정비사업 중심. 행정 시스템 구축은 시 재정 활용.',source:pledgePreviewSource},
{id:'nec-seoul-2026-2',category:'주택2',title:'무너진 주거이동 안전망을 복원하겠습니다',body:'□ 목표\n공공주택 공급과 민간임대 지원 확대.\n\n□ 이행방법\n공공주택 약 13만 호, 임대 건설·이주주택 지원, 보증금·월세 지원 확대.\n\n□ 이행기간\n2031년까지.\n\n□ 재원\n서울시 예산과 주택진흥기금 등.',source:pledgePreviewSource},
{id:'nec-seoul-2026-3',category:'교통',title:'이동의 답답함을 풀어내는 서울 교통 대전환',body:'□ 목표\n통근 시간과 교통비 부담 완화.\n\n□ 이행방법\n강북·서남권 교통망 투자, 철도망 확충, 배차간격 개선, 기후동행패스 추진.\n\n□ 이행기간\n민선 9기부터 2037년까지.\n\n□ 재원\n시·교통공사 예산, 국고, 신규 기금 등.',source:pledgePreviewSource},
{id:'nec-seoul-2026-4',category:'복지',title:'더 따뜻한 서울, 약자와의 동행 시즌 2',body:'□ 목표\n생애주기별 돌봄 강화.\n\n□ 이행방법\n돌봄가구 소득·자산 지원, 서울런 확대, 초등돌봄 확충, 노후·방문진료 지원.\n\n□ 이행기간\n민선 9기. 일부 사업은 사회보장 협의 이후.\n\n□ 재원\n서울시 재정.',source:pledgePreviewSource},
{id:'nec-seoul-2026-5',category:'산업일자리',title:'매년 100만 기회, 내일이 더 기대되는 서울',body:'□ 목표\n연간 100만 일자리 창출·고용 유발 목표.\n\n□ 이행방법\n권역별 산업 육성, 투자펀드·해외투자, 직업훈련, 공공일자리, 관광 활성화.\n\n□ 이행기간\n민선 9기 중 매년.\n\n□ 재원\n서울시 재정과 펀드.',source:pledgePreviewSource}
]};
export function withSeoulPledgePreview(config:Config):Config{return {...config,leaders:config.leaders.map(l=>{
if((l.pledgeImportRevision||0)>=1)return l;
const item=l.name==='유찬종'&&l.role==='종로구청장'?jongnoPledgePreview:l.name==='오세훈'&&(l.role==='서울시장'||l.role==='서울특별시장')?seoulPledgePreview:null;
return item?{...l,pledgeImportRevision:1,pledgeItems:l.pledgeItems===undefined?item.pledgeItems:l.pledgeItems,pledgeElection:l.pledgeElection||item.pledgeElection,pledgeSource:item.pledgeSource}:l;
})}}
