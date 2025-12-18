'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppState, VocabularyWord, StudySessionStats, Difficulty, SessionType, RecallQuality, VocabDataset, UserStudyPlan, User } from '@/types';
import { DATASETS, APP_NAME } from '@/constants';
import Flashcard from '@/components/Flashcard';
import TestMode from '@/components/TestMode';
import StatsDashboard from '@/components/StatsDashboard';
import OCRView from '@/components/OCRView';
import WordSearch from '@/components/WordSearch';
import LibraryPreview from '@/components/LibraryPreview';
import ImportView from '@/components/ImportView'; 
import StudyPlanModal from '@/components/StudyPlanModal';
import AuthView from '@/components/AuthView';
import UserCenter from '@/components/UserCenter';
import { saveProgress, calculateStreak } from '@/services/sm2Service';
import { db } from '@/services/dbService';

const MainApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [sessionType, setSessionType] = useState<SessionType>(SessionType.STUDY);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [isPointsBumping, setIsPointsBumping] = useState(false);
  const [totalWordsCount, setTotalWordsCount] = useState(0);
  const [activeLibraryMistakeCount, setActiveLibraryMistakeCount] = useState(0);
  const [starredCount, setStarredCount] = useState(0);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const [currentDataset, setCurrentDataset] = useState<VocabDataset>(DATASETS[0]);
  const [currentLibWords, setCurrentLibWords] = useState<VocabularyWord[]>([]);
  const [studyPlan, setStudyPlan] = useState<UserStudyPlan>({ dailyTarget: 20, wordsLearnedToday: 0, lastUpdateDate: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [stats, setStats] = useState<StudySessionStats>({
    total: 0, correct: 0, incorrect: 0, streak: 0, difficulty: Difficulty.MEDIUM, wrongWords: []
  });

  // 初始化深色模式
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  // 深色模式控制
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        const savedUserJson = localStorage.getItem('vocab_master_user');
        if (savedUserJson) {
          const user = JSON.parse(savedUserJson) as User;
          handleLoginSuccess(user);
        } else {
          setAppState(AppState.AUTH);
          setIsReady(true);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        setIsReady(true);
      }
    };
    init();
  }, []);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('vocab_master_user', JSON.stringify(user));
    
    const savedDatasetId = localStorage.getItem(`active_dataset_${user.username}`);
    const savedDataset = DATASETS.find(d => d.id === savedDatasetId) || DATASETS[0];
    const savedPoints = parseInt(localStorage.getItem(`user_points_${user.username}`) || '0');
    setPoints(savedPoints);

    const savedPlan = localStorage.getItem(`user_study_plan_${user.username}`);
    const today = new Date().toISOString().split('T')[0];
    if (savedPlan) {
      const parsed = JSON.parse(savedPlan) as UserStudyPlan;
      if (parsed.lastUpdateDate !== today) {
        parsed.wordsLearnedToday = 0;
        parsed.lastUpdateDate = today;
      }
      setStudyPlan(parsed);
    } else {
      setStudyPlan({ dailyTarget: 20, wordsLearnedToday: 0, lastUpdateDate: today });
    }

    const existingInDb = await db.getFullVocabulary();
    if (existingInDb.length === 0) {
        await db.seedVocabulary(DATASETS[0].data);
    }
    
    setCurrentDataset(savedDataset);
    setAppState(AppState.HOME);
    await refreshData(user, savedDataset);
    setIsReady(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('vocab_master_user');
    setCurrentUser(null);
    setAppState(AppState.AUTH);
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const addPoints = (amount: number) => {
    if (!currentUser) return;
    setPoints(prev => {
      const next = prev + amount;
      localStorage.setItem(`user_points_${currentUser.username}`, next.toString());
      return next;
    });
    setIsPointsBumping(true);
    setTimeout(() => setIsPointsBumping(false), 300);
  };

  const updateStudyPlan = (newPlan: Partial<UserStudyPlan>) => {
    if (!currentUser) return;
    setStudyPlan(prev => {
      const next = { ...prev, ...newPlan };
      localStorage.setItem(`user_study_plan_${currentUser.username}`, JSON.stringify(next));
      return next;
    });
  };

  const refreshData = async (user: User | null = currentUser, dataset: VocabDataset = currentDataset) => {
    if (!user) return;
    try {
      const [s, allDBWords, mIds, allProgress] = await Promise.all([
        calculateStreak(user.username),
        db.getFullVocabulary(),
        db.getMistakeIds(user.username),
        db.getAllProgress(user.username)
      ]);
      setStreak(s);
      const currentLibraryWords = allDBWords.filter(w => (w.tags && (w.tags.includes(dataset.id) || w.tags.includes('imported') || w.tags.includes('scanned'))));
      setTotalWordsCount(currentLibraryWords.length);
      setActiveLibraryMistakeCount(currentLibraryWords.filter(w => mIds.includes(w.id)).length);
      setStarredCount(allDBWords.filter(w => w.isStarred).length);
      const now = new Date();
      setReviewDueCount(Object.values(allProgress).filter(p => {
        const isFromLib = currentLibraryWords.some(lw => lw.id === p.wordId);
        return isFromLib && new Date(p.nextReviewDate) <= now;
      }).length);
      setCurrentLibWords(currentLibraryWords);
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  };

  const handleSelectLibrary = async (dataset: VocabDataset) => {
    if (!currentUser) return;
    setIsReady(false);
    try {
        const existingInDb = await db.getFullVocabulary();
        if (!existingInDb.some(w => w.tags && w.tags.includes(dataset.id))) {
            await db.seedVocabulary(dataset.data);
        }
        setCurrentDataset(dataset);
        localStorage.setItem(`active_dataset_${currentUser.username}`, dataset.id);
        await refreshData(currentUser, dataset);
        setAppState(AppState.HOME);
    } catch (e) { console.error(e); } finally { setIsReady(true); }
  };

  const initSession = (type: SessionType) => {
    setSessionType(type);
    if (type === SessionType.REVIEW) startReviewSession();
    else setAppState(AppState.SETUP);
  };

  const startReviewSession = async () => {
    if (!currentUser) return;
    const allProgress = await db.getAllProgress(currentUser.username);
    const now = new Date();
    const dueWordIds = Object.values(allProgress).filter(p => new Date(p.nextReviewDate) <= now).map(p => p.wordId);
    const dueWords = currentLibWords.filter(w => dueWordIds.includes(w.id));
    if (dueWords.length === 0) { alert("暂无需要复习的单词！"); return; }
    setSessionWords(dueWords.sort(() => 0.5 - Math.random()));
    setCurrentWordIndex(0);
    setAppState(AppState.REVIEW_SESSION);
  };

  const startActiveSession = useCallback(async () => {
    if (!currentUser) return;
    const size = difficulty === Difficulty.EASY ? 5 : difficulty === Difficulty.MEDIUM ? 10 : 20;
    const allProgress = await db.getAllProgress(currentUser.username);
    const learnedIds = Object.keys(allProgress).map(Number);
    const unlearned = currentLibWords.filter(w => !learnedIds.includes(w.id));
    const pool = unlearned.length > 0 ? unlearned : currentLibWords;
    setSessionWords([...pool].sort(() => 0.5 - Math.random()).slice(0, size));
    setCurrentWordIndex(0);
    setAppState(sessionType === SessionType.STUDY ? AppState.STUDY : AppState.TEST);
  }, [difficulty, sessionType, currentLibWords, currentUser]);

  const startMistakeReview = async () => {
    if (!currentUser) return;
    const mIds = await db.getMistakeIds(currentUser.username);
    const currentMistakes = currentLibWords.filter(w => mIds.includes(w.id));
    if (currentMistakes.length === 0) { alert(`暂无错题！`); return; }
    setSessionWords(currentMistakes);
    setCurrentWordIndex(0);
    setAppState(AppState.MISTAKE_REVIEW);
  };

  const showStarredWords = async () => {
    if (!currentUser) return;
    const allWords = await db.getFullVocabulary();
    const starred = allWords.filter(w => w.isStarred);
    if (starred.length === 0) {
      alert("收藏夹为空！");
      return;
    }
    setSessionWords(starred);
    setCurrentWordIndex(0);
    setAppState(AppState.STARRED);
  };

  const handleRecallResult = async (quality: RecallQuality) => {
    const word = sessionWords[currentWordIndex];
    if (!word || !currentUser) return;
    await saveProgress(currentUser.username, word.id, quality);
    if (quality === RecallQuality.PERFECT) {
      addPoints(10);
      updateStudyPlan({ wordsLearnedToday: studyPlan.wordsLearnedToday + 1 });
    }
    if (quality <= RecallQuality.VAGUE) await db.addMistake(currentUser.username, word.id);
    else if (appState === AppState.MISTAKE_REVIEW && quality >= RecallQuality.FLUENT) await db.removeMistake(currentUser.username, word.id);
    
    if (currentWordIndex < sessionWords.length - 1) setCurrentWordIndex(prev => prev + 1);
    else { 
      await refreshData(); 
      setAppState(appState === AppState.MISTAKE_REVIEW || appState === AppState.REVIEW_SESSION ? AppState.HOME : AppState.POST_STUDY_TEST); 
    }
  };

  const handleTestFinish = async (correctCount: number, wrongWords: VocabularyWord[]) => {
    if (!currentUser) return;
    for (const w of wrongWords) await db.addMistake(currentUser.username, w.id);
    await refreshData();
    addPoints(correctCount * 20);
    setStats({ total: sessionWords.length, correct: correctCount, incorrect: sessionWords.length - correctCount, streak, difficulty, wrongWords });
    setAppState(AppState.SUMMARY);
  };

  if (!isReady) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-darkBg p-6">
      <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-6"></div>
      <p className="font-black text-slate-400 dark:text-slate-600 tracking-widest text-sm animate-pulse uppercase">Loading</p>
    </div>
  );

  if (appState === AppState.AUTH) return <AuthView onLoginSuccess={handleLoginSuccess} />;

  const renderBottomNav = () => {
    if (![AppState.HOME, AppState.USER_CENTER].includes(appState)) return null;
    return (
      <footer className="w-full mt-12 pb-12 animate-fade-in border-t border-slate-100 dark:border-slate-800 pt-12">
        <div className="max-w-xl mx-auto px-6 text-center">
            <div className="bg-white/50 dark:bg-darkSurface/50 backdrop-blur-md border border-slate-100 dark:border-slate-800 p-2 rounded-[2.5rem] flex items-center justify-around shadow-sm">
                <button 
                  onClick={() => { setAppState(AppState.HOME); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-[2rem] transition-all duration-300 ${appState === AppState.HOME ? 'bg-slate-900 dark:bg-primary text-white shadow-xl' : 'text-slate-400 dark:text-slate-600'}`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={appState === AppState.HOME ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span className="font-black text-[10px] uppercase tracking-widest">学习中心</span>
                </button>
                <button 
                  onClick={() => { setAppState(AppState.USER_CENTER); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-[2rem] transition-all duration-300 ${appState === AppState.USER_CENTER ? 'bg-slate-900 dark:bg-primary text-white shadow-xl' : 'text-slate-400 dark:text-slate-600'}`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={appState === AppState.USER_CENTER ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className="font-black text-[10px] uppercase tracking-widest">管理中心</span>
                </button>
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">滑到底部切换中心</p>
        </div>
      </footer>
    );
  };

  return (
    <div className="min-h-screen bg-softBg dark:bg-darkBg text-slate-800 dark:text-slate-200 transition-colors flex flex-col">
      <main className="flex-1">
          {appState === AppState.LIBRARY_SELECTION && (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-darkBg animate-slide-up">
              <div className="max-w-4xl w-full text-center">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-12 tracking-tighter">选择词库</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                  {DATASETS.map(ds => (
                    <button key={ds.id} onClick={() => handleSelectLibrary(ds)} className={`bg-white dark:bg-darkSurface p-8 rounded-[3rem] border-2 border-slate-50 dark:border-slate-800 hover:border-${ds.color}-500 hover:shadow-2xl transition-all flex flex-col items-center`}>
                      <div className={`w-20 h-20 rounded-3xl bg-${ds.color}-50 dark:bg-${ds.color}-900/30 text-${ds.color}-600 dark:text-${ds.color}-400 flex items-center justify-center mb-6`}><span className="text-3xl font-black">CET4</span></div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{ds.name}</h3>
                      <div className={`mt-auto px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-${ds.color}-500 text-white`}>立即激活</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {appState === AppState.HOME && currentUser && (
            <div className="max-w-6xl mx-auto px-6 py-12 animate-slide-up space-y-10">
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-[3]">
                  <button onClick={() => setAppState(AppState.SEARCH)} className="w-full h-full bg-white dark:bg-darkSurface px-8 py-5 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center gap-5 text-slate-400 dark:text-slate-500 font-semibold transition-all text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    搜索单词或查词...
                  </button>
                </div>
                <div className={`flex-[1] flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 px-8 py-5 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 shadow-sm transition-transform ${isPointsBumping ? 'scale-105' : ''}`}>
                   <div className="flex items-center gap-3 text-left">
                     <span className="text-3xl">💰</span>
                     <div><p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 leading-none">累计学分</p><span className="text-2xl font-black text-amber-900 dark:text-amber-200">{points}</span></div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 bg-white dark:bg-darkSurface p-8 rounded-[3rem] shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6 text-left">
                    <div><h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-1">{currentDataset.id}</h1><p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">{currentDataset.name}</p></div>
                    <button onClick={() => setAppState(AppState.LIBRARY_SELECTION)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-primary transition-all shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3 3 21"/></svg></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100/50 dark:border-slate-700/50 text-left"><span className="block text-2xl font-black text-slate-900 dark:text-white">{totalWordsCount}</span><span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">全库总数</span></div>
                    <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-3xl border border-rose-100/50 dark:border-rose-900/20 text-left"><span className="block text-2xl font-black text-rose-600 dark:text-rose-400">{reviewDueCount}</span><span className="text-[10px] font-bold text-rose-400 dark:text-slate-500 uppercase tracking-widest">到期复习</span></div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white dark:bg-darkSurface p-8 rounded-[3rem] shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-8">
                    <div><h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">今日进度</h2><p className="text-slate-400 dark:text-slate-500 text-sm font-bold tracking-tight">连续坚持 {streak} 天打卡</p></div>
                    <button onClick={() => setAppState(AppState.PLAN)} className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-primary font-black text-xs">调整目标</button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-end justify-between text-left">
                      <div><span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{studyPlan.wordsLearnedToday}</span><span className="text-slate-200 dark:text-slate-700 font-black text-2xl mx-2">/</span><span className="text-slate-400 dark:text-slate-600 font-black text-2xl">{studyPlan.dailyTarget}</span></div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-full overflow-hidden p-1 shadow-inner"><div className="bg-gradient-to-r from-primary to-indigo-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (studyPlan.wordsLearnedToday / (studyPlan.dailyTarget || 1)) * 100)}%` }} /></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onClick={() => initSession(SessionType.STUDY)} className="group bg-slate-900 dark:bg-slate-800 p-8 rounded-[3.5rem] shadow-2xl hover:-translate-y-2 transition-all text-left flex flex-col justify-between min-h-[260px]">
                  <div className="w-14 h-14 bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m19.07 4.93-14.14 14.14"/></svg></div>
                  <div><h2 className="text-3xl font-black text-white mb-2">深度学习</h2><p className="text-slate-400 font-medium text-xs leading-relaxed">基于 SM-2 科学算法，攻克生词记忆。</p></div>
                </button>
                <button onClick={() => initSession(SessionType.REVIEW)} className="group bg-white dark:bg-darkSurface p-8 rounded-[3.5rem] border-2 border-indigo-100 dark:border-slate-800 shadow-xl hover:-translate-y-2 transition-all text-left flex flex-col justify-between min-h-[260px]">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg></div>
                  <div><h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">智能复习</h2><p className="text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">复习今日到期的 {reviewDueCount} 个临界单词。</p></div>
                </button>
                <button onClick={() => initSession(SessionType.TEST)} className="group bg-emerald-500 dark:bg-emerald-600 p-8 rounded-[3.5rem] shadow-2xl hover:-translate-y-2 transition-all text-left flex flex-col justify-between min-h-[260px]">
                  <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-all"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg></div>
                  <div><h2 className="text-3xl font-black text-white mb-2">实战模拟</h2><p className="text-emerald-50 dark:text-emerald-100 font-medium text-xs leading-relaxed">填空与释义挑战，检验实战能力。</p></div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                <button onClick={() => setAppState(AppState.SCAN)} className="bg-white dark:bg-darkSurface p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-lg transition-all group px-8 border-l-4 border-l-indigo-500 text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    <div><h3 className="text-xl font-black text-slate-900 dark:text-white">拍照识词 (OCR)</h3><p className="text-sm text-slate-400 dark:text-slate-600 font-medium">真题图片一键提取生词</p></div>
                  </div>
                </button>
                <button onClick={showStarredWords} className="bg-white dark:bg-darkSurface p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-lg transition-all group px-8 border-l-4 border-l-amber-500 text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                    <div><h3 className="text-xl font-black text-slate-900 dark:text-white">生词收藏夹</h3><p className="text-sm text-slate-400 dark:text-slate-600 font-medium">已手动标记 {starredCount} 个单词</p></div>
                  </div>
                </button>
                <button onClick={startMistakeReview} className="bg-white dark:bg-darkSurface p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-lg transition-all group px-8 border-l-4 border-l-rose-500 text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="m10.29 3.86-8.47 14.14a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                    </div>
                    <div><h3 className="text-xl font-black text-slate-900 dark:text-white">顽固错题本</h3><p className="text-sm text-slate-400 dark:text-slate-600 font-medium">重点攻克 {activeLibraryMistakeCount} 个历史错词</p></div>
                  </div>
                </button>
                <button onClick={() => setAppState(AppState.STATS)} className="bg-white dark:bg-darkSurface p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-lg transition-all group px-8 border-l-4 border-l-blue-500 text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    </div>
                    <div><h3 className="text-xl font-black text-slate-900 dark:text-white">学情趋势图</h3><p className="text-sm text-slate-400 dark:text-slate-600 font-medium">查看记忆曲线与掌握率分析</p></div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {appState === AppState.USER_CENTER && currentUser && (
            <UserCenter 
              user={currentUser} 
              onNavigate={setAppState} 
              onLogout={handleLogout} 
              totalWords={totalWordsCount} 
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          )}

          {appState === AppState.PREVIEW && <LibraryPreview words={currentLibWords} datasetName={currentDataset.name} onBack={() => setAppState(AppState.USER_CENTER)} />}
          {appState === AppState.STARRED && <LibraryPreview words={sessionWords} datasetName="我的收藏" onBack={() => {setAppState(AppState.HOME); refreshData();}} />}
          {appState === AppState.STATS && currentUser && <StatsDashboard currentDataset={currentDataset} username={currentUser.username} onBack={() => setAppState(AppState.HOME)} />}
          {appState === AppState.SCAN && <OCRView onBack={() => setAppState(AppState.HOME)} />}
          {appState === AppState.SEARCH && <WordSearch currentDatasetId={currentDataset.id} onBack={() => setAppState(AppState.HOME)} />}
          {appState === AppState.IMPORT && <ImportView onSuccess={(count) => { alert(`成功导入 ${count} 个新词！`); setAppState(AppState.USER_CENTER); refreshData(); }} onBack={() => setAppState(AppState.USER_CENTER)} />}
          {appState === AppState.PLAN && <StudyPlanModal plan={studyPlan} onSave={(p) => { updateStudyPlan(p); setAppState(AppState.HOME); }} onBack={() => setAppState(AppState.HOME)} />}

          {appState === AppState.SETUP && (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-darkBg">
              <div className="bg-white dark:bg-darkSurface p-12 rounded-[3.5rem] shadow-2xl max-w-sm w-full text-center border dark:border-slate-800 transition-colors">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter">本轮训练词量</h2>
                <div className="space-y-4 mb-10">
                  <button onClick={() => setDifficulty(Difficulty.EASY)} className={`w-full p-6 rounded-3xl border-2 font-black transition-all ${difficulty === Difficulty.EASY ? 'border-primary bg-primary text-white shadow-xl' : 'border-slate-50 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}>5 个核心词</button>
                  <button onClick={() => setDifficulty(Difficulty.MEDIUM)} className={`w-full p-6 rounded-3xl border-2 font-black transition-all ${difficulty === Difficulty.MEDIUM ? 'border-primary bg-primary text-white shadow-xl' : 'border-slate-50 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}>10 个核心词</button>
                  <button onClick={() => setDifficulty(Difficulty.HARD)} className={`w-full p-6 rounded-3xl border-2 font-black transition-all ${difficulty === Difficulty.HARD ? 'border-primary bg-primary text-white shadow-xl' : 'border-slate-50 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}>20 个核心词</button>
                </div>
                <button onClick={startActiveSession} className="w-full py-5 bg-slate-900 dark:bg-primary text-white rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-all">进入训练</button>
              </div>
            </div>
          )}

          {(appState === AppState.STUDY || appState === AppState.MISTAKE_REVIEW || appState === AppState.REVIEW_SESSION) && (
            <div className="max-w-3xl mx-auto px-6 py-10 md:py-20 animate-fade-in">
              <nav className="flex justify-between items-center mb-10">
                <div className="px-6 py-3 bg-white dark:bg-darkSurface rounded-full shadow-lg border border-slate-50 dark:border-slate-800 text-sm font-black text-primary dark:text-indigo-400 shadow-sm">
                  {appState === AppState.REVIEW_SESSION ? '智能复习' : appState === AppState.MISTAKE_REVIEW ? '错题强化' : '深度识记'}: {currentWordIndex + 1} / {sessionWords.length}
                </div>
                <button onClick={() => {setAppState(AppState.HOME); refreshData();}} className="w-12 h-12 bg-white dark:bg-darkSurface rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 border dark:border-slate-800 transition-colors shadow-sm">✕</button>
              </nav>
              {sessionWords[currentWordIndex] && currentUser && (<Flashcard word={sessionWords[currentWordIndex]} username={currentUser.username} onResult={handleRecallResult} isActive={true} />)}
            </div>
          )}

          {(appState === AppState.POST_STUDY_TEST || appState === AppState.TEST) && (
            <div className="max-w-3xl mx-auto px-6 py-10 md:py-20 animate-fade-in">
              <nav className="flex justify-between items-center mb-10">
                <div className="px-6 py-3 bg-white dark:bg-darkSurface rounded-full shadow-lg border border-slate-50 dark:border-slate-800 text-sm font-black text-emerald-600 dark:text-emerald-400 shadow-sm">实战检验中...</div>
                <button onClick={() => {setAppState(AppState.HOME); refreshData();}} className="w-12 h-12 bg-white dark:bg-darkSurface rounded-2xl flex items-center justify-center text-slate-400 border dark:border-slate-800 shadow-sm">✕</button>
              </nav>
              {sessionWords.length > 0 && <TestMode words={sessionWords} allDatasetWords={currentLibWords} mode={appState === AppState.POST_STUDY_TEST ? 'MEANING' : 'CLOZE'} onFinish={handleTestFinish} />}
            </div>
          )}

          {appState === AppState.SUMMARY && (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-slide-up bg-white dark:bg-darkBg">
              <div className="w-32 h-32 rounded-[3rem] bg-emerald-500 text-white flex items-center justify-center mb-10 shadow-2xl shadow-emerald-100 dark:shadow-none transition-colors">
                <span className="text-4xl font-black">{Math.round((stats.correct / (stats.total || 1)) * 100)}%</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">本轮训练达标！</h2>
              <p className="text-slate-400 dark:text-slate-600 mb-12 text-lg font-medium">精准掌握了 {stats.correct} 个单词，继续保持</p>
              <button onClick={() => {setAppState(AppState.HOME); refreshData();}} className="px-16 py-6 bg-slate-900 dark:bg-primary text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all">返回中心</button>
            </div>
          )}
      </main>
      {renderBottomNav()}
    </div>
  );
};

export default MainApp;
