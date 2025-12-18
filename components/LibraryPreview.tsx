
import React, { useState, useMemo } from 'react';
import { VocabularyWord } from '../types';
import { db } from '../services/dbService';

interface LibraryPreviewProps {
  words: VocabularyWord[];
  datasetName: string;
  onBack: () => void;
}

const LibraryPreview: React.FC<LibraryPreviewProps> = ({ words, datasetName, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'starred'>('all');
  const [search, setSearch] = useState('');
  const [localWords, setLocalWords] = useState(words);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleToggleStar = async (wordId: number) => {
    const newState = await db.toggleStar(wordId);
    setLocalWords(prev => prev.map(w => w.id === wordId ? { ...w, isStarred: newState } : w));
  };

  const filteredWords = useMemo(() => {
    return localWords
      .filter(w => {
        if (filter === 'starred') return w.isStarred;
        if (filter === 'all') return true;
        return w.frequency === filter;
      })
      .filter(w => w.word.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.word.localeCompare(b.word));
  }, [localWords, filter, search]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getFreqLabel = (f?: string) => {
    switch(f) {
      case 'high': return { text: '高频', color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', textC: 'text-rose-600 dark:text-rose-400' };
      case 'medium': return { text: '中频', color: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', textC: 'text-indigo-600 dark:text-indigo-400' };
      case 'low': return { text: '低频', color: 'bg-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', textC: 'text-slate-500 dark:text-slate-500' };
      default: return { text: '常用', color: 'bg-gray-300', bg: 'bg-gray-50 dark:bg-gray-800', textC: 'text-gray-400 dark:text-gray-500' };
    }
  };

  return (
    <div className="fixed inset-0 bg-softBg dark:bg-darkBg flex flex-col animate-fade-in z-50 overflow-hidden transition-colors">
      <header className="p-8 pt-12 bg-white dark:bg-darkSurface border-b border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none flex flex-col gap-6 shrink-0 transition-colors">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <button onClick={onBack} className="text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
               </button>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">{datasetName}</h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
                     当前展示: {filteredWords.length} 个单词条目
                  </p>
               </div>
            </div>
            <button onClick={onBack} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border dark:border-slate-700">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>
        
        <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[240px] relative">
                <input 
                  type="text" 
                  placeholder="在库中搜索单词..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-primary/20 dark:focus:border-indigo-500/30 transition-all text-slate-800 dark:text-slate-200"
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                {(['all', 'starred', 'high', 'medium', 'low'] as const).map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-white dark:bg-slate-900 text-primary dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
                    >
                        {f === 'all' ? '全部' : f === 'starred' ? '已收藏' : f === 'high' ? '高频' : f === 'medium' ? '中频' : '低频'}
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* A-Z 快捷导航 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-[60] hidden lg:flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        {alphabet.map(l => (
            <button key={l} onClick={() => scrollToLetter(l)} className="text-[10px] font-black text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-indigo-400 transition-colors w-6 h-6 flex items-center justify-center">
                {l}
            </button>
        ))}
      </div>

      <div className="p-8 overflow-y-auto flex-1 custom-scrollbar scroll-smooth pb-32">
        <div className="max-w-6xl mx-auto space-y-16">
          {alphabet.map(letter => {
              const letterWords = filteredWords.filter(w => w.word.toUpperCase().startsWith(letter));
              if (letterWords.length === 0) return null;
              
              return (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-32">
                      <div className="flex items-center gap-6 mb-8">
                          <span className="text-7xl font-black text-slate-100/50 dark:text-slate-800/50 select-none leading-none">{letter}</span>
                          <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {letterWords.map((w) => {
                            const freq = getFreqLabel(w.frequency);
                            return (
                                <div key={w.id} className="bg-white dark:bg-darkSurface p-8 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative text-left">
                                <button 
                                    onClick={() => handleToggleStar(w.id)}
                                    className={`absolute top-6 right-6 transition-all ${w.isStarred ? 'text-amber-400' : 'text-slate-200 dark:text-slate-800 hover:text-slate-300 dark:hover:text-slate-700'}`}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill={w.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                </button>
                                <div className="flex justify-between items-start mb-4 gap-2 pr-8">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors tracking-tighter truncate leading-tight">{w.word}</h3>
                                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-black tracking-widest uppercase block mt-1 leading-none">{w.phonetic || 'N/A'}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black text-white ${freq.color} shrink-0`}>{freq.text}</span>
                                </div>
                                <p className="text-md font-bold text-slate-700 dark:text-slate-300 mb-4 leading-relaxed line-clamp-2">{w.translation}</p>
                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed line-clamp-3">"{w.example}"</p>
                                </div>
                                </div>
                            );
                          })}
                      </div>
                  </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};

export default LibraryPreview;
