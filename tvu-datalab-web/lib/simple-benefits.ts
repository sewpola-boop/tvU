export function simpleBenefits(p:{age:number|null;metroId:string;maritalStatus?:string;hasChildren?:string;gender?:string}){
 const notes:string[]=[],items:{title:string;amount:number;assumption:string;source:string}[]=[];
 if(p.metroId==='11'&&p.age!==null&&p.age>=19&&p.age<=34)items.push({title:'서울 청년수당',amount:3000000,assumption:'미취업·소득 등 요건 충족 후 선정되어 6개월 전액 지급되는 경우. 2026년 정기모집 마감 · 다음 공고 참고.',source:'https://mediahub.seoul.go.kr/news/article/newsArticlePrintPopup.do?articleNo=2017342'});
 else if(p.metroId==='11'&&p.age!==null&&p.age>=35&&p.age<=39)items.push({title:'서울 청년월세지원',amount:2400000,assumption:'무주택 월세·소득·임차 조건을 충족하고 선정되어 12개월 최대 지원받는 경우. 2026년 정기모집 마감 · 다음 공고 참고.',source:'https://housing.seoul.go.kr/site/main/content/sh01_060513'});
 if(p.age!==null&&p.age>=65)items.push({title:'기초연금〔국가〕',amount:4196400,assumption:'월 최대 349,700원 × 12개월 단순 환산. 소득인정액·연금·부부 감액 등을 적용하기 전 예시.',source:'https://www.bokjiro.go.kr'});
 if(p.hasChildren==='yes')notes.push('육아 지원 후보가 있습니다. 자녀의 나이를 알 수 없어 부모급여·아동수당·교육급여는 금액에 합산하지 않았습니다.');
 if(p.maritalStatus==='married')notes.push('신혼부부 주거지원은 혼인기간·소득·주거형태 확인이 필요합니다. 대출 한도는 지원금 합계에서 제외합니다.');
 if(p.metroId!=='11')notes.push('서울 외 지역 자체 지원은 준비 중이며 국가 지원만 표시합니다.');
 notes.push('성별만으로 임신·출산·장애 여부를 추정하지 않습니다. 모르는 소득·취업·주거 조건을 충족한 것으로 판정하지 않습니다.');
 return {items,total:items.reduce((n,x)=>n+x.amount,0),notes};
}
