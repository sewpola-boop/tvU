'use client';
import {createContext,type ReactNode} from 'react';
import type {Config} from '../lib/model';
import type {Sheet} from '../lib/table-engine';
export const InlineContext=createContext<null|{ranking?:(patch:Partial<Config['ranking']>)=>void;block:(id:string,patch:Partial<Config['home']['blocks'][string]>)=>void;sheet:(id:string,patch:Partial<Sheet>)=>void;pick:(id:string,kind?:'data'|'news'|'ranking'|'photo')=>void;detach:(id:string,index:number)=>void;selectSheet:(id:string)=>void;selectedSheet:string;sheetEditor:(sheet:Sheet)=>ReactNode;selectedBlock:string;editBlock:(id:string)=>void;addBlock:(after:string|null)=>void;setting:(id:string,patch:{collapsed?:boolean;highlight?:boolean})=>void;removeBlock:(id:string)=>void}>(null);
