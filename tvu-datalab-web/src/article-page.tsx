'use client';
import {useEffect,useState} from 'react';
import {ConfigSchema,type Config} from '../lib/model';
import {ArticleContent} from './article-content';
import ArticleComments from './article-comments';
import AccountNav from './account-nav';
export default function ArticlePage(){const [config,setConfig]=useState<Config|null>(null),[id,setId]=useState(''),[error,setError]=useState('');useEffect(()=>{setId(new URLSearchParams(location.search).get('id')||'');fetch('/api/state',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('기사를 불러오지 못했습니다.');const data=await r.json() as {config:unknown};setConfig(ConfigSchema.parse(data.config))}).catch(e=>setError(e.message));window.scrollTo(0,0)},[]);const story=config?.stories.find(s=>s.id===id);return <div className="app"><header className="topbar"><a className="brand" href="/">{config?.appearance.brandName||'지방정부 tvU 데이터랩'}</a><nav><a className="button" href="/">← 메인으로</a><AccountNav/></nav></header><main className="article-page">{error?<p role="alert">{error}</p>:!config?<p>기사를 불러오는 중…</p>:!story?<><h1>기사를 찾을 수 없습니다.</h1><p>삭제되었거나 구독이 필요한 기사일 수 있습니다.</p><a href="/#subscribe">프리미엄 구독 보기</a></>:<><ArticleContent story={story} config={config}/><ArticleComments articleId={story.id}/></>}</main></div>}
