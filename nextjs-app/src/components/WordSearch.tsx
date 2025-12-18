'use client';

import React, { useState } from 'react';
import { db } from '@/services/dbService';
import { quickDefine } from '@/services/geminiService';
import { VocabularyWord } from '@/types';

interface WordSearchProps {
  currentDatasetId: string;
  onBack: () => void;
}

const WordSearch: React.FC<WordSearchProps> = ({ currentDatasetId, onBack }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Partial<VocabularyWord> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'none' | 'local_match' | 'local_diff_tag' | 'ai'>('none');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);
    setMatchStatus('none');

    try {
      const allWords = await db.getFullVocabulary();
      const localMatch = allWords.find(w => w.word.toLowerCase() === query.toLowerCase().trim());

      if (localMatch) {
        setResult(localMatch);
        if (localMatch.tags && localMatch.tags.includes(currentDatasetId)) {
          setMatchStatus('local_match');
        } else {
          setMatchStatus('local_diff_tag');
        }
      } else {
        const aiDef = await quickDefine(query);
        if (aiDef) {
          setResult({ word: query, ...aiDef });
          setMatchStatus('ai');
        } else {
          setMatchStatus('none');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!result || isAdding) return;
    setIsAdding(true);
    try {
      if (matchStatus === 'local_diff_tag' && (result as VocabularyWord).id) {
          const updatedTags = [...new Set([...(result.tags || []), currentDatasetId])];
          await db.seedVocabulary([{ ...result, tags: updatedTags } as VocabularyWord]);
      } else {
          await db.addWord({
            ...result,
            tags: [currentDatasetId, 'manually-added'],
            frequency: 'medium'
          } as VocabularyWord);
      }
      alert(`"${result.word}" 已成功收录至 ${currentDatasetId}！`);
      onBack();
    } catch (e) {
      alert('操作失败');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex flex-col animate-slide-up transition-colors">
      <div className="p-6 max-w-2xl w-full mx-auto">
        <header className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">智能搜词</h2>
        </header>

        <form onSubmit={handleSearch} className="relative mb-10">
            <input 
              autoFocus
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入单词，支持 AI 实时翻译..."
              className="w-full bg-white dark:bg-darkSurface px-6 py-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 focus:border-primary dark:focus:border-indigo-500 outline-none text-lg font-medium shadow-xl shadow-slate-200/50 dark:shadow-none transition-all pr-20 text-slate-800 dark:text-slate-200"
            />
            <button type="submit" disabled={isSearching} className="absolute right-3 top-3 bottom-3 bg-primary text-white px-6 rounded-2xl font-bold">
              {isSearching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : '搜索'}
            </button>
        </form>

        {result && (
          <div className="bg-white dark:bg-darkSurface p-8 rounded-[2.5rem] shadow-xl border border-slate-50 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">{result.word}</h3>
                <p className="text-primary dark:text-indigo-400 font-mono font-bold mt-1">{result.phonetic}</p>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${matchStatus === 'local_match' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                {matchStatus === 'local_match' ? '已在库中' : matchStatus === 'local_diff_tag' ? '全库匹配' : 'AI 释义'}
              </span>
            </div>
            
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">{result.translation}</p>
            <p className="text-slate-500 dark:text-slate-400 italic leading-relaxed mb-10 border-l-4 border-slate-100 dark:border-slate-700 pl-4">&quot;{result.example}&quot;</p>

            {matchStatus !== 'local_match' && (
               <button onClick={handleAdd} disabled={isAdding} className="w-full py-4 bg-slate-900 dark:bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] transition-transform">
                 {isAdding ? '添加中...' : `将 "${result.word}" 加入 ${currentDatasetId}`}
               </button>
            )}
            
            {matchStatus === 'local_match' && (
              <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold text-center">
                单词已在您的学习清单中
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordSearch;
