
import React, { useState } from 'react';
import { db } from '../services/dbService';
import { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('请填写完整信息');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const user = await db.loginUser(username, password);
        if (user) {
          onLoginSuccess(user);
        } else {
          setError('用户名或密码错误');
        }
      } else {
        if (password !== confirmPassword) {
          setError('两次密码不一致');
          return;
        }
        const newUser: User = {
          username,
          password,
          createdAt: new Date().toISOString()
        };
        await db.registerUser(newUser);
        onLoginSuccess(newUser);
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 pt-12 bg-softBg dark:bg-darkBg transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-darkSurface rounded-[3.5rem] shadow-2xl p-10 md:p-14 animate-slide-up border border-slate-50 dark:border-slate-800 transition-colors">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary dark:text-indigo-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            {isLogin ? '欢迎回来' : '开启旅程'}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-medium">
            {isLogin ? '登录以继续您的 CET-4 备考' : '创建一个账户管理您的学习进度'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-2 ml-4">用户名</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 px-6 py-4 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-2 ml-4">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 px-6 py-4 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
              placeholder="请输入密码"
            />
          </div>

          {!isLogin && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-2 ml-4">确认密码</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 px-6 py-4 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                placeholder="请再次输入密码"
              />
            </div>
          )}

          {error && <p className="text-rose-500 text-center text-xs font-black animate-pulse">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-900 dark:bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isLoading && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
            {isLogin ? '登 录' : '注 册'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-primary dark:text-indigo-400 font-black text-sm hover:underline"
          >
            {isLogin ? '没有账户？立即注册' : '已有账户？点此登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
