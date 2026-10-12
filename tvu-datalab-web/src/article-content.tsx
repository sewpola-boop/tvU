'use client';
import type {Config} from '../lib/model';
import {ArticleHTML,ArticlePhotos,ArticleThumbnail} from './article-editor';
import {RankingBoard} from './ranking-board';
export function ArticleContent({story,config}:{story:Config['stories'][number];config:Config}){return <div className={'article-reading-grid '+(!story.showRanking?'no-article-ranking':'')}><article className="panel article-reading"><span className="section-label">데이터에서 시작하는 질문 · EDITORIAL</span><h1>{story.title}</h1>{story.subtitle&&<p className="article-subtitle">{story.subtitle}</p>}<ArticleThumbnail article={story}/>{story.html?<><p className="article-lead">{story.body}</p><ArticleHTML html={story.html}/></>:<div className="article-html article-text">{story.body}</div>}<ArticlePhotos photos={story.photos}/><a className="button subtle" href="/">← 다른 데이터와 기사 보기</a></article>{story.showRanking&&<aside className="article-ranking"><RankingBoard onlyTheme="composite" config={config}/></aside>}</div>}
