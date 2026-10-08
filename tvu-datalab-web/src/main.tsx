import React from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from './dashboard';
import LoginScreen from './login-screen';
import Admin from './admin/editor';
import './style.css';
createRoot(document.getElementById('root')!).render(location.pathname==='/sysop'||location.pathname==='/admin'?<Admin/>:location.pathname==='/login'?<LoginScreen/>:location.pathname==='/signup'?<LoginScreen signup/>:<Dashboard/>);
