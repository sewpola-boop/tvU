const topics=[/인구|고령|세대|외국인|남자|여자|출생|출산|전입|전출|인구밀도/,/재활용|폐기물|쓰레기/,/리얼미터|직무평가|지지도|지지율|만족도|상대지수/,/청렴|부패/,/재정|채무|예산|세입|세출/,/공약|매니페스토/];
export const explicitTopics=(text:string)=>topics.flatMap((test,i)=>test.test(text)?[i]:[]);
export function sameTopic(question:string,description:string){const requested=explicitTopics(question);return !requested.length||requested.some(i=>topics[i].test(description))}
export const listAll=(q:string)=>/구별|시별|군별|지역별|지자체별|전체|모든|각\s*(구|시|군|지역|지자체)/.test(q)&&!/(상위|하위)\s*\d+/.test(q);

const locations=['서울','부산','대구','인천','대전','울산','세종','광주','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
export function sameLocation(question:string,data:string){const wanted=locations.filter(name=>question.includes(name));return !wanted.length||wanted.some(name=>data.includes(name))||/전국|대한민국/.test(data)}
// A broad topic match is insufficient for a specific requested measure.
export function specificMetricMatches(question:string,description:string){const rules:[RegExp,RegExp][]=[[/남자|남성|남성인구|남자인구/,/남자|남성|남(?:성)?\s*인구|\bmale\b|koreans\(male\)/i],[/여자|여성|여성인구|여자인구/,/여자|여성|여(?:성)?\s*인구|female/i],[/고령|65세|노인/,/고령|65세|노인/],[/출생|출산/,/출생|출산/],[/전입/,/전입/],[/전출/,/전출/],[/자살/,/자살/],[/실업/,/실업/],[/고용률/,/고용률/],[/청렴/,/청렴/]];return rules.every(([q,d])=>!q.test(question)||d.test(description))}
export function requestedLocalRegions(question:string){return [...new Set(question.match(/[가-힣]{2,}(?:구|군|시)(?=\s|의|은|는|에서|별|$)/g)||[])].filter(s=>!['서울시','부산시','대구시','인천시','대전시','울산시','세종시','광주시','도시','지자체시'].includes(s)&&!s.endsWith('인구'))}
