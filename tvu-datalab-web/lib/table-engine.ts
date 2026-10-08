export type Sheet={id:string;title:string;note:string;visible:boolean;view:'table'|'striped'|'ranking'|'comparison'|'cards'|'bar'|'vertical'|'paired'|'line'|'mixed'|'pie'|'stacked'|'waterfall'|'histogram'|'bubble'|'scatter'|'population'|'radar3'|'radar4'|'radar5'|'radar6'|'radar7'|'radar8';valueColumn:number;limit:number;columns:{name:string;unit:string;formula:string}[];rows:string[][]};
export const columnLetter=(i:number)=>String.fromCharCode(65+i);
export function calculate(s:Sheet){
 const cache=new Map<string,string|number>(),active=new Set<string>();
 function cell(r:number,c:number):string|number{
  const key=`${r}:${c}`;if(cache.has(key))return cache.get(key)!;
  if(r<0||r>=s.rows.length||c<0||c>=s.columns.length)throw Error('참조 범위 오류');
  if(active.has(key))throw Error('순환 참조');if(active.size>100)throw Error('참조 깊이 초과');active.add(key);
  try{const raw=s.columns[c].formula?s.columns[c].formula.replaceAll('{row}',String(r+1)):s.rows[r][c]||'';
   const v=raw.trim().startsWith('=')?expression(raw.trim().slice(1)):raw.trim()!==''&&Number.isFinite(Number(raw.replaceAll(',','')))?Number(raw.replaceAll(',','')):raw;
   cache.set(key,v);return v;
  }finally{active.delete(key)}
 }
 function numeric(r:number,c:number){const v=cell(r,c);if(typeof v!=='number')throw Error(v===''?'빈 셀 참조':'숫자가 아닌 셀 참조');return v}
 function expression(src:string):number{
  const tokens=src.toUpperCase().match(/\d+(?:\.\d*)?|\.\d+|[A-Z]+\d+|[A-Z]+|[+\-*/^(),:%]|\S/g)||[];let pos=0;
  const ref=(t:string)=>{const m=/^([A-Z])([1-9]\d*)$/.exec(t);if(!m)throw Error('셀 주소 오류');return [Number(m[2])-1,m[1].charCodeAt(0)-65]};
  function atom():number{let t=tokens[pos++];if(t==='+'||t==='-')return(t==='-'?-1:1)*atom();let n:number;
   if(t==='('){n=add();if(tokens[pos++]!==')')throw Error('닫는 괄호 필요')}
   else if(/^\d|^\./.test(t||''))n=Number(t);
   else if(/^[A-Z]\d+$/.test(t||'')){const [r,c]=ref(t);n=numeric(r,c)}
   else if(['SUM','AVG','AVERAGE','MIN','MAX','ROUND','ABS'].includes(t)){
    if(tokens[pos++]!=='(')throw Error('함수 괄호 필요');const values:number[]=[];
    if(tokens[pos]!==')')while(true){if(/^[A-Z]\d+$/.test(tokens[pos]||'')&&tokens[pos+1]===':'){
     const [r1,c1]=ref(tokens[pos++]);pos++;const [r2,c2]=ref(tokens[pos++]);if(r2<r1||c2<c1||(r2-r1+1)*(c2-c1+1)>10000)throw Error('범위 오류');
     for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){const v=cell(r,c);if(v==='')continue;if(typeof v!=='number')throw Error('범위에 숫자가 아닌 값');values.push(v)}
    }else values.push(add());if(tokens[pos]!==',')break;pos++}
    if(tokens[pos++]!==')'||!values.length)throw Error('함수 인수 오류');
    const sum=values.reduce((a,b)=>a+b,0);n=t==='SUM'?sum:t==='AVG'||t==='AVERAGE'?sum/values.length:t==='MIN'?Math.min(...values):t==='MAX'?Math.max(...values):t==='ABS'?Math.abs(values[0]):Math.round(values[0]*10**(values[1]||0))/10**(values[1]||0);
    if((t==='ABS'&&values.length!==1)||(t==='ROUND'&&(values.length>2||!Number.isInteger(values[1]||0)||Math.abs(values[1]||0)>10)))throw Error('함수 인수 오류');
   }else throw Error('지원하지 않는 수식');
   while(tokens[pos]==='%'){pos++;n/=100}return n;
  }
  function power():number{let n=atom();if(tokens[pos]==='^'){pos++;n=n**power()}return n}
  function mul():number{let n=power();while(['*','/'].includes(tokens[pos])){const op=tokens[pos++],v=power();if(op==='/'&&v===0)throw Error('0으로 나눌 수 없음');n=op==='*'?n*v:n/v}return n}
  function add():number{let n=mul();while(['+','-'].includes(tokens[pos])){const op=tokens[pos++],v=mul();n=op==='+'?n+v:n-v}return n}
  const result=add();if(pos!==tokens.length||!Number.isFinite(result))throw Error('수식 또는 결과 오류');return result;
 }
 return s.rows.map((row,r)=>s.columns.map((_,c)=>{try{return {value:cell(r,c),error:''}}catch(e){return {value:'',error:(e as Error).message}}}));
}
