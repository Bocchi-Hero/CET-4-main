'use client';

import React, { useState, useEffect } from 'react';
import { VocabularyWord, AIResponse, RecallQuality, WordProgress } from '@/types';
import { generateWordHelp } from '@/services/geminiService';
import { db } from '@/services/dbService';

interface FlashcardProps {
  word: VocabularyWord;
  username: string;
  onResult: (quality: RecallQuality) => void;
  isActive: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, username, onResult, isActive }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [progress, setProgress] = useState<WordProgress | null>(null);
  const [isStarred, setIsStarred] = useState(word.isStarred || false);

  useEffect(() => {
    setIsFlipped(false);
    setIsAnimating(false);
    setAiData(null);
    setIsStarred(word.isStarred || false);
    const fetchProgress = async () => {
      const p = await db.getProgress(username, word.id);
      setProgress(p);
    };
    fetchProgress();
  }, [word, username]);

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(prev => !prev);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = await db.toggleStar(word.id);
    setIsStarred(newState);
  };

  const handleAskAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiData || loadingAi) return;
    setLoadingAi(true);
    const data = await generateWordHelp(word);
    setAiData(data);
    setLoadingAi(false);
  };

  const getWordFontSize = (w: string) => {
    if (w.length > 15) return 'text-3xl';
    if (w.length > 10) return 'text-4xl';
    return 'text-6xl';
  };

  const isNew = !progress || progress.repetition === 0;

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      <div className="h-[520px] perspective-1000">
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={handleFlip}
        >
          {/* FRONT */}
          <div className="absolute inset-0 bg-white dark:bg-darkSurface rounded-[3rem] shadow-xl border border-slate-50 dark:border-slate-800 backface-hidden flex flex-col items-center justify-center p-10 transition-colors">
            <button onClick={toggleStar} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:text-amber-400 transition-all z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className={isStarred ? "text-amber-400" : ""}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </button>
            <h2 className={`${getWordFontSize(word.word)} font-black text-slate-900 dark:text-white mb-6 tracking-tighter text-center word-break-all leading-tight px-4`}>
              {word.word}
            </h2>
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <span className="text-slate-400 dark:text-slate-500 font-black tracking-widest text-xs uppercase">{word.phonetic || 'N/A'}</span>
            </div>
            
            <div className="absolute bottom-12 flex flex-col items-center gap-3">
              <div className="px-10 py-4 bg-primary text-white rounded-full font-black text-lg shadow-lg border-4 border-white dark:border-slate-800">
                点击翻转查看
              </div>
              <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
                REVEAL MEANING
              </p>
            </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 bg-white dark:bg-darkSurface rounded-[3rem] shadow-xl border border-slate-50 dark:border-slate-800 backface-hidden rotate-y-180 flex flex-col p-10 overflow-hidden transition-colors">
            <button onClick={toggleStar} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:text-amber-400 transition-all z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className={isStarred ? "text-amber-400" : ""}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </button>
            <div className="mb-8 text-center relative">
              <div className="flex justify-center gap-2 mb-3">
                  {isNew && (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full tracking-widest">NEW</span>
                  )}
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full border border-indigo-100 dark:border-indigo-800 tracking-widest uppercase">
                    Core Vocab
                  </span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">
                {word.word}
              </h3>
              <p className={`text-3xl font-black leading-tight word-break-all inline-block pb-1 border-b-4 dark:text-white ${isNew ? 'border-amber-300 dark:border-amber-700' : 'border-indigo-300 dark:border-indigo-700'}`}>
                {word.translation}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {loadingAi ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">AI Decoding</p>
                  </div>
                ) : aiData ? (
                  <div className="space-y-6 animate-fade-in">
                    {aiData.imageUrl && (
                      <div className="rounded-[2rem] overflow-hidden shadow-sm border border-slate-50 dark:border-slate-800">
                        <img src={aiData.imageUrl} className="w-full h-36 object-cover" alt="mnemonic" />
                      </div>
                    )}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-3">AI 联想</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">&quot;{aiData.contextStory}&quot;</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-[10px] font-black text-emerald-300 dark:text-emerald-700 uppercase tracking-widest mb-2">真题例句</p>
                        <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium leading-relaxed">{word.example}</p>
                    </div>
                    <button 
                        onClick={handleAskAI}
                        className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm shadow-xl shadow-slate-200 dark:shadow-none hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                    >
                        <span>✨</span>
                        <span>AI 辅助记忆</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-10 grid grid-cols-2 gap-4 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button 
          onClick={() => onResult(RecallQuality.FORGOT)} 
          className="py-6 rounded-[2.2rem] font-black text-xl border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 transition-all active:scale-95 shadow-sm"
        >
          <span className="text-2xl mb-1 block">❌</span>
          <span>不认识</span>
        </button>
        <button 
          onClick={() => onResult(RecallQuality.PERFECT)} 
          className="py-6 rounded-[2.2rem] font-black text-xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 transition-all active:scale-95 shadow-sm"
        >
          <span className="text-2xl mb-1 block">✅</span>
          <span>认识了</span>
        </button>
      </div>
    </div>
  );
};

export default Flashcard;
