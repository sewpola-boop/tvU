import type {Sheet} from './table-engine';
export function workbookTable(input:unknown[][],header:number):Pick<Sheet,'columns'|'rows'|'valueColumn'>{
 if(!Number.isInteger(header)||header<0||header>=input.length)throw Error('제목 행을 선택하세요.');
 const values=input.map(row=>row.map(v=>v==null?'':v instanceof Date?v.toISOString().slice(0,10):String(v)));
 const width=Math.max(...values.map(r=>r.length));if(width>26)throw Error('현재 표는 최대 26열입니다. 사용할 열만 남긴 엑셀을 올려주세요.');
 const rows=values.slice(header+1).filter(r=>r.some(v=>v.trim()));if(!rows.length)throw Error('제목 행 아래에 데이터가 없습니다.');if(rows.length>500)throw Error('현재 표는 최대 500행입니다. 파일을 나누어 등록하세요.');if(values.some(r=>r.some(v=>v.length>500)))throw Error('셀당 최대 500자입니다. 긴 문장은 요약해 주세요.');
 const columns=Array.from({length:width},(_,i)=>({name:(values[header][i]||`${i+1}열`).slice(0,100),unit:'',formula:''}));
 const normalized=rows.map(r=>columns.map((_,i)=>r[i]||''));const valueColumn=Math.max(0,columns.findIndex((_,i)=>i>0&&normalized.some(r=>r[i].trim()&&Number.isFinite(Number(r[i].replace(/,/g,''))))));
 return {columns,rows:normalized,valueColumn};
}
export function csvRows(text:string):string[][]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('CSV 따옴표가 닫히지 않았습니다.');if(cell||row.length){row.push(cell);rows.push(row)}return rows;}
