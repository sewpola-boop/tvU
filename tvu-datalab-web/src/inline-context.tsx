'use client';
import {createContext,type ReactNode} from 'react';
import type {Config} from '../lib/model';
import type {Sheet} from '../lib/table-engine';
export const InlineContext=createContext<null|{block:(id:string,patch:Partial<Config['home']['blocks'][string]>)=>void;sheet:(id:string,patch:Partial<Sheet>)=>void;pick:(id:string)=>void;detach:(id:string,index:number)=>void;selectSheet:(id:string)=>void;selectedSheet:string;sheetEditor:(sheet:Sheet)=>ReactNode}>(null);
