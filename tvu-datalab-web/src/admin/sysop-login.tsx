'use client';
import LoginScreen from '../login-screen';
export default function SysopLogin({onLogin}:{onLogin:()=>void}){return <LoginScreen onAdmin={onLogin}/>}
