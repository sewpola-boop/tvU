import React from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from './dashboard';
import Admin from './admin/editor';
import './style.css';
createRoot(document.getElementById('root')!).render(location.pathname==='/sysop'||location.pathname==='/admin'?<Admin/>:<Dashboard/>);
