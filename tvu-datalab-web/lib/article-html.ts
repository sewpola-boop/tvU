const tags=new Set('p br h2 h3 h4 strong b em i u s ul ol li blockquote table thead tbody tr th td figure figcaption img a hr div span'.split(' '));
export function articleURL(value:string){return /^https:\/\//i.test(value)||/^\/(?![\\/])/.test(value)||/^#[a-z0-9/_-]*$/i.test(value)}
export function sanitizeArticleHTML(source:string,doc:Document):string{
 const input=doc.createElement('template');input.innerHTML=source;
 const output=doc.createElement('div');
 const copy=(node:Node,parent:Node)=>{
  if(node.nodeType===3){parent.appendChild(doc.createTextNode(node.textContent||''));return}
  if(node.nodeType!==1)return;const el=node as Element,tag=el.tagName.toLowerCase();
  if(!tags.has(tag))return;
  const clean=doc.createElement(tag);
  for(const attr of ['alt','title'])if(el.hasAttribute(attr))clean.setAttribute(attr,el.getAttribute(attr)!.slice(0,1000));
  if(tag==='img'){const src=el.getAttribute('src')||'';if(!articleURL(src)||src.startsWith('#'))return;clean.setAttribute('src',src);clean.setAttribute('loading','lazy')}
  if(tag==='a'){const href=el.getAttribute('href')||'';if(articleURL(href))clean.setAttribute('href',href);clean.setAttribute('rel','noopener noreferrer')}
  const style=(el as HTMLElement).style;const fonts=['sans-serif','serif','Malgun Gothic','Arial'];const family=style?.fontFamily?.replace(/["']/g,'');if(fonts.includes(family))clean.style.fontFamily=family;const size=style?.fontSize;if(/^(?:[8-9]|[1-6][0-9]|7[0-2])pt$/.test(size||''))clean.style.fontSize=size;if(tag==='img'){const width=style?.width;if(/^(?:[1-9][0-9]|100)%$/.test(width||'')){clean.style.width=width;clean.style.height='auto'}}
  const align=style?.textAlign;if(['left','center','right','justify'].includes(align))clean.style.textAlign=align;
  for(const child of Array.from(node.childNodes))copy(child,clean);
  parent.appendChild(clean);
 };
 for(const child of Array.from(input.content.childNodes))copy(child,output);
 return output.innerHTML;
}
