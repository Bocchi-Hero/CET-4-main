'use client';

import React, { useState, useRef } from 'react';
import { db } from '@/services/dbService';
import { quickDefine } from '@/services/geminiService';
import { VocabularyWord } from '@/types';

interface OCRViewProps {
  onBack: () => void;
}

const OCRView: React.FC<OCRViewProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<Partial<VocabularyWord> | null>(null);
  const [isLoadingDef, setIsLoadingDef] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        setImage(ev.target?.result as string);
        await processImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (dataUrl: string) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      // 动态导入 Tesseract
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(m.progress);
        },
      });
      const words = result.data.text
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && /^[a-zA-Z]+$/.test(w));
      
      const uniqueWords: string[] = Array.from(new Set(words));
      setTokens(uniqueWords);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTokenClick = async (token: string) => {
    setSelectedWord(token);
    setIsLoadingDef(true);
    setDefinition(null);
    const existing = await db.findWord(token);
    if (existing) {
        setDefinition(existing);
        setIsLoadingDef(false);
    } else {
        const def = await quickDefine(token);
        setDefinition(def);
        setIsLoadingDef(false);
    }
  };

  const addToLearnList = async () => {
    if (!selectedWord || !definition) return;
    const newWord: Partial<VocabularyWord> = {
        word: selectedWord,
        translation: definition.translation || '暂无释义',
        phonetic: definition.phonetic || '',
        example: definition.example || '',
        tags: ['scanned']
    };
    await db.addWord(newWord);
    setSelectedWord(null);
    setDefinition(null);
    alert(`"${selectedWord}" 已加入您的词库！`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-darkBg p-6 animate-fade-in flex flex-col transition-colors">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">拍照识词提取</h1>
        <button onClick={onBack} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors border dark:border-slate-700">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>
      </header>

      {!image ? (
        <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-[2.5rem] bg-gray-50 dark:bg-darkSurface/30">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-4 text-gray-400 group"
          >
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all border dark:border-slate-700">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path d="M15 12.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </div>
            <span className="font-bold">点击拍照或上传真题图片</span>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Smart Word Extraction</p>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-video bg-black/5 dark:bg-black/40 border dark:border-slate-800">
             <img src={image} className="w-full h-full object-contain" alt="Target" />
             {isProcessing && (
                 <div className="absolute inset-0 bg-white/80 dark:bg-darkBg/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-xs bg-gray-200 dark:bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-indigo-500 h-2 transition-all" style={{ width: `${progress * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest animate-pulse">Scanning • {Math.round(progress * 100)}%</span>
                 </div>
             )}
          </div>

          <div className="bg-white dark:bg-darkSurface rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 min-h-[200px] text-left">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-6">识别出的单词词元 (点击收藏)</h3>
            <div className="flex flex-wrap gap-3">
              {tokens.length > 0 ? tokens.map((t, i) => (
                <button 
                  key={i} 
                  onClick={() => handleTokenClick(t)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${selectedWord === t ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border dark:border-slate-700'}`}
                >
                  {t}
                </button>
              )) : !isProcessing && <p className="text-gray-400 italic text-sm">未检测到英文词汇，请尝试更清晰的图片。</p>}
            </div>
          </div>
        </div>
      )}

      {selectedWord && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 z-50">
             <div className="bg-white dark:bg-darkSurface w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border dark:border-slate-800 transition-colors">
                {isLoadingDef ? (
                    <div className="flex flex-col items-center py-10 gap-6">
                        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">AI 深度定义中...</p>
                    </div>
                ) : definition ? (
                    <div className="text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">{selectedWord}</h2>
                                <p className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{definition.phonetic}</p>
                            </div>
                            <button onClick={() => setSelectedWord(null)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">✕</button>
                        </div>
                        <p className="text-2xl font-black text-gray-800 dark:text-slate-200 mb-4">{definition.translation}</p>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-800 mb-10">
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-2">语境示例</p>
                            <p className="text-slate-500 dark:text-slate-400 italic text-sm leading-relaxed">&quot;{definition.example}&quot;</p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <button onClick={addToLearnList} className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95">加入核心词库</button>
                            <button onClick={() => setSelectedWord(null)} className="w-full py-4 text-slate-400 font-black text-sm uppercase tracking-widest">取消</button>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center">
                        <p className="text-gray-500 font-bold">无法抓取定义。</p>
                        <button onClick={() => setSelectedWord(null)} className="mt-6 px-10 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-xs uppercase tracking-widest">返回</button>
                    </div>
                )}
             </div>
          </div>
      )}
    </div>
  );
};

export default OCRView;
