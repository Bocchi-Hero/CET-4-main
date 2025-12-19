'use client';

import React, { useState, useRef } from 'react';
import { db } from '@/services/dbService';
import { VocabularyWord } from '@/types';

interface ImportViewProps {
  onSuccess: (count: number) => void;
  onBack: () => void;
}

const ImportView: React.FC<ImportViewProps> = ({ onSuccess, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sanitize = (str: string) => {
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  };

  const parseTxt = (text: string): VocabularyWord[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const words: VocabularyWord[] = [];

    lines.forEach((line, index) => {
      const parts = line.split('/').map(p => sanitize(p));
      if (parts.length >= 2) {
        words.push({
          id: Date.now() + index,
          word: parts[0],
          phonetic: parts[1] || "",
          translation: parts[2] || "暂无释义",
          example: parts[3] || "No example sentence provided.",
          frequency: 'medium',
          difficulty: 'medium',
          tags: ['imported', 'custom-lib']
        });
      }
    });

    if (words.length === 0) throw new Error("无法解析。请确保文件格式为：单词/音标/翻译/例句");
    return words;
  };

  const readFileContent = (file: File, encoding: string = 'UTF-8'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("文件读取失败"));
      reader.readAsText(file, encoding);
    });
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    
    if (!file.name.endsWith('.txt')) {
      setError("目前仅支持 .txt 文件");
      setIsProcessing(false);
      return;
    }

    try {
      // 尝试使用 UTF-8 读取
      let text = await readFileContent(file, 'UTF-8');
      
      // 检测乱码：如果包含替换字符 ()，尝试使用 GBK
      if (text.includes('\uFFFD')) {
        console.log("检测到 UTF-8 乱码，尝试使用 GBK 读取...");
        try {
          const gbkText = await readFileContent(file, 'GBK');
          text = gbkText;
        } catch (e) {
          console.warn("GBK 读取失败，回退到 UTF-8");
        }
      }

      const newWords = parseTxt(text);
      
      const existingWords = await db.getFullVocabulary();
      const existingSet = new Set(existingWords.map(w => w.word.toLowerCase().trim()));
      const uniqueNewWords = newWords.filter(w => !existingSet.has(w.word.toLowerCase().trim()));
      
      if (uniqueNewWords.length === 0) {
        throw new Error("这些单词已在您的词库中，无需重复导入。");
      }

      await db.seedVocabulary([...existingWords, ...uniqueNewWords]);
      onSuccess(uniqueNewWords.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      const allWords = await db.getFullVocabulary();
      const exportList = allWords.filter(w => w.tags && (w.tags.includes('imported') || w.tags.includes('scanned')));
      
      if (exportList.length === 0) {
        alert("暂无手动导入的单词可供备份。");
        return;
      }

      const txtContent = exportList.map(w => 
        `${w.word}/${w.phonetic}/${w.translation}/${w.example}`
      ).join('\n');

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab_backup_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("备份导出失败");
    }
  };

  const handleClearDatabase = async () => {
    const confirmed = window.confirm("⚠️ 彻底清空警报！\n这将删除所有 AI 生成的词汇、导入词汇、学习进度和错题记录，且无法恢复。确定继续吗？");
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await db.clearAllData();
      alert("所有本地数据已抹除。");
      window.location.reload(); 
    } catch (e) {
      alert("操作失败: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex flex-col items-center justify-center p-6 animate-slide-up transition-colors">
      <div className="max-w-xl w-full bg-white dark:bg-darkSurface rounded-[3rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
        <header className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">词库导入中心</h2>
          <p className="text-slate-400 dark:text-slate-500 font-medium italic">格式要求：单词/音标/翻译/例句</p>
        </header>

        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-4 border-dashed rounded-[2.5rem] p-12 transition-all cursor-pointer flex flex-col items-center gap-6 ${isDragging ? 'border-primary bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-darkSurface'}`}
        >
          {isProcessing ? (
            <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-700 border-t-primary rounded-full animate-spin"></div>
          ) : (
            <div className="text-center">
               <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
               </div>
               <p className="font-black text-slate-700 dark:text-slate-300">选择 TXT 文件</p>
               <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">支持拖拽上传</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} className="hidden" accept=".txt" />
        </div>

        {error && <p className="text-rose-500 text-center text-sm font-bold mt-4 animate-pulse">{error}</p>}

        <div className="mt-10 space-y-4">
          <button onClick={handleExport} className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            📤 导出备份 (仅手动添加的词)
          </button>
          <button onClick={handleClearDatabase} className="w-full py-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors">
            ⚠️ 彻底清空本地数据
          </button>
          <button onClick={onBack} className="w-full py-4 text-slate-400 dark:text-slate-500 font-black text-sm uppercase tracking-widest">
            返回
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportView;
