'use client';

import React from 'react';
import { User, AppState } from '@/types';

interface UserCenterProps {
  user: User;
  onNavigate: (state: AppState) => void;
  onLogout: () => void;
  totalWords: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const UserCenter: React.FC<UserCenterProps> = ({ 
  user, 
  onNavigate, 
  onLogout, 
  totalWords, 
  isDarkMode, 
  toggleDarkMode 
}) => {
  const registerDate = new Date(user.createdAt).toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 animate-slide-up space-y-8 pb-40">
      <div className="bg-white dark:bg-darkSurface p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-bl-full -mr-10 -mt-10"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-primary to-indigo-400 rounded-3xl flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-lg">
            {user.username[0].toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{user.username}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-300 text-[10px] font-black rounded-full uppercase">四级备考中</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 text-[10px] font-black rounded-full uppercase">注册于 {registerDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">词库管理</h3>
          <div className="bg-white dark:bg-darkSurface rounded-[2.2rem] border border-slate-50 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 shadow-sm transition-colors">
            <button onClick={() => onNavigate(AppState.IMPORT)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all px-8 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">外部词库导入</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">TXT Batch Import</p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700"><path d="m9 18 6-6-6-6"/></svg>
            </button>

            <button onClick={() => onNavigate(AppState.PREVIEW)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all px-8 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/></svg>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">库内容预览</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{totalWords} Words Active</p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">个性化设置</h3>
          <div className="bg-white dark:bg-darkSurface rounded-[2.2rem] border border-slate-50 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 shadow-sm transition-colors">
             <div className="p-6 flex items-center justify-between px-8">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{isDarkMode ? <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/> : <><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></>}</svg>
                 </div>
                 <div className="text-left">
                   <h4 className="font-bold text-slate-800 dark:text-slate-200">深色模式</h4>
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{isDarkMode ? 'Dark' : 'Light'} Mode</p>
                 </div>
               </div>
               <button 
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}
               >
                 <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
               </button>
             </div>
             
             <div className="p-6 flex items-center justify-between px-8">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                 </div>
                 <div className="text-left">
                   <h4 className="font-bold text-slate-800 dark:text-slate-200">关于应用</h4>
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">CET-4 Master v2.1.5 (Next.js)</p>
                 </div>
               </div>
               <span className="text-xs text-slate-300 dark:text-slate-700 font-black">AI POWERED</span>
             </div>
          </div>

          <button onClick={onLogout} className="w-full bg-rose-50 dark:bg-rose-900/10 p-6 rounded-[2.2rem] border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-3 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-rose-600 dark:text-rose-400 group-hover:rotate-12 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="font-black text-rose-600 dark:text-rose-400">注销登录</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCenter;
