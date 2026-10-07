const meta={general:{title:'단체장 직무수행 긍정평가',unit:'%',max:100},relative:{title:'정당 대비 상대지수',unit:'점',max:150},education:{title:'교육감 직무수행 긍정평가',unit:'%',max:100},life:{title:'주민생활 만족도',unit:'%',max:100}};
const aliases={서울:['서울특별시'],부산:['부산광역시'],대구:['대구광역시'],인천:['인천광역시'],대전:['대전광역시'],울산:['울산광역시'],세종:['세종특별자치시'],경기:['경기도'],강원:['강원도','강원특별자치도'],충북:['충청북도'],충남:['충청남도'],경북:['경상북도'],경남:['경상남도'],전북:['전라북도','전북특별자치도'],전남광주:['전남광주'],제주:['제주도','제주특별자치도']};
export function analyze(data,q,context={}){
 q=String(q||'').trim();const unsupported=message=>({supported:false,message,suggestions:['단체장 직무평가 상위 5명','서울과 부산 비교해줘','주민생활 만족도 하위 3곳']});
 if(!q||q.length>500)return unsupported('질문은 1~500자로 입력해 주세요.');
 const years=[...q.matchAll(/(20\d{2})\s*년/g)].map(x=>+x[1]),months=[...q.matchAll(/(\d{1,2})\s*월/g)].map(x=>+x[1]);
 if(years.some(x=>x!==2026)||months.some(x=>x!==7)||/전월|지난달|지난해|작년|추이|증가|감소|변화|최신|오늘|최근|추세|202[0-9][-./](?!0?7(?:\D|$))/.test(q))return unsupported('현재 등록된 자료는 2026년 7월 조사 한 시점뿐입니다. 다른 시점의 비교·증감·추이는 계산할 수 없습니다.');
 if(/왜|원인|예측|전망|공약|청렴|인구|재정|부동산|아파트|대통령|정당\s*지지율/.test(q))return unsupported('이 질문에 필요한 자료나 원인 분석 기능은 아직 없습니다. 현재는 등록된 4개 지표의 순위 조회와 지역별 수치 비교를 지원합니다.');
 let key=/교육감|교육\s*평가/.test(q)?'education':/생활|만족/.test(q)?'life':/정당|상대지수/.test(q)?'relative':/단체장|직무|긍정/.test(q)?'general':meta[context.metric]?context.metric:'general';
 let regions=Object.keys(aliases).filter(r=>q.includes(r)||aliases[r].some(a=>q.includes(a))||data.general.some(x=>x[0]===r&&q.includes(x[1]))||data.education.some(x=>x[0]===r&&q.includes(x[1])));
 if(!q.includes('전남광주')&&/전남|광주/.test(q))return unsupported('제공된 원문은 ‘전남광주’를 하나의 조사 단위로 표기합니다. 전남 또는 광주의 개별 수치는 없으므로 ‘전남광주’로 질문해 주세요.');
 const explicitRank=/상위|하위|순위|몇\s*위|전체|전국|1위|꼴찌|최하위|최고|최저|높은|낮은|top|bottom/i.test(q);
 if(!regions.length&&!explicitRank&&/다시|그럼|이들|두\s*지역|같은|비교/.test(q)&&Array.isArray(context.regions))regions=context.regions.filter(r=>aliases[r]);
 if(!regions.length&&!explicitRank&&!/교육감|단체장|직무|상대지수|생활|만족|정당/.test(q))return unsupported('질문에서 비교할 지표나 지역을 찾지 못했습니다. 예: ‘서울과 부산 직무평가 비교’, ‘교육감 평가 상위 5명’.');
 const m=meta[key],all=data[key];let rows=all.map((r,i)=>({region:r[0],name:r[1],value:r[2],rank:all.findIndex(x=>x[2]===r[2])+1,tied:all.filter(x=>x[2]===r[2]).length>1}));
 const bottom=/하위|최하위|꼴찌|최저|낮은|bottom/i.test(q);const n=q.match(/(?:상위|하위|top|bottom)\s*(\d{1,2})|(?:높은|낮은)\s*(\d{1,2})/i);let limit=n?Math.max(1,Math.min(16,+(n[1]||n[2]))):/1위|최고|최저|꼴찌/.test(q)?1:/전체|전국/.test(q)?16:5;
 let scope='';if(regions.length){rows=rows.filter(x=>regions.includes(x.region));scope=regions.join(' · ')+' 비교'}else{if(bottom)rows.reverse();const cutoff=rows[Math.min(limit,rows.length)-1]?.value;rows=rows.filter((r,i)=>i<limit||r.value===cutoff);scope=(bottom?'하위 ':'상위 ')+limit+'개 기준'+(rows.length>limit?' · 동률 포함':'')}
 if(!rows.length)return unsupported("선택한 지표·지역에 발행된 숫자가 없습니다. 관리자에서 표 데이터를 확인하세요.");const first=rows[0];let summary=regions.length===1?`${first.region} ${first.name}의 ${m.title}는 ${first.value.toFixed(1)}${m.unit}, ${first.tied?'공동 ':''}${first.rank}위입니다.`:regions.length?`${m.title} 기준, 선택한 지역 중 ${first.region}이 ${first.value.toFixed(1)}${m.unit}로 가장 높습니다.`:`${bottom?'선택한 하위 목록에서 수치가 가장 낮은':'수치가 가장 높은'} 지역은 ${first.region}${first.name?' '+first.name:''}이며 ${first.value.toFixed(1)}${m.unit}입니다.`;
 let difference=null;if(regions.length===2&&rows.length===2){difference=+(Math.abs(rows[0].value-rows[1].value)).toFixed(1);summary+=` 두 지역 차이는 ${difference.toFixed(1)}${key==='relative'?'점':'%p'}입니다.`}
 return {supported:true,metric:key,title:m.title,unit:m.unit,max:m.max,period:'2026년 7월',scope,summary,rows,difference,context:{metric:key,regions},notes:[key==='relative'?'100점은 지역 내 소속 정당 지지도와 직무평가가 같은 수준이라는 기준입니다. 100점을 넘으면 직무평가가 더 높습니다.':'각 지역의 비율을 비교합니다. 조사 오차가 있으므로 수치 순위만으로 유의한 우열을 단정할 수 없습니다.',key==='life'?'주민생활 만족도는 지역 지표이며 단체장 개인 점수가 아닙니다.':'다른 지표와 합산한 종합점수가 아닙니다.','사용자 제공 리얼미터 원문 전사 자료 · 원문 직접 대조 전'],suggestions:regions.length?['같은 지역을 정당 대비 상대지수로 비교해줘','같은 지역의 주민생활 만족도 비교해줘','전국 단체장 직무평가 상위 5명']:['서울과 부산 비교해줘','교육감 직무평가 상위 5명','주민생활 만족도 하위 3곳']};
}
