
import { VocabularyWord, TestQuestion } from '../types';
import React, { useState, useMemo, useEffect } from 'react';

interface TestModeProps {
  words: VocabularyWord[]; 
  allDatasetWords: VocabularyWord[]; 
  mode: 'MEANING' | 'CLOZE';
  onFinish: (correctCount: number, wrongWords: VocabularyWord[]) => void;
}

const TestMode: React.FC<TestModeProps> = ({ words, allDatasetWords, mode, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongWords, setWrongWords] = useState<VocabularyWord[]>([]);

  useEffect(() => {
    setIsLocked(true);
    const timer = setTimeout(() => setIsLocked(false), 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const currentQuestion = useMemo(() => {
    const word = words[currentIndex];
    if (!word) return null;

    const isMeaning = mode === 'MEANING';
    const correctAnswer = (isMeaning ? word.translation : word.word) || "";
    
    // 安全正则转义：防止单词中的符号（如空格、点）破坏正则逻辑
    const safeWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 改进正则：匹配单词及其后续的字母（如 abandoned, adapting），确保挖空彻底
    const regex = new RegExp(`\\b${safeWord}\\w*`, 'gi');
    
    // 渲染提示语，确保 fallback
    const exampleText = word.example || "No example provided.";
    const displayPrompt = isMeaning 
      ? word.word 
      : exampleText.replace(regex, ' ________ ');
    
    const distractors = allDatasetWords
      .filter(w => w.word.toLowerCase() !== word.word.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => isMeaning ? w.translation : w.word);
    
    const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
    return { word, options, correctAnswer, type: mode, displayPrompt } as TestQuestion;
  }, [currentIndex, words, mode, allDatasetWords]);

  const handleSelect = (option: string) => {
    if (isAnswered || isLocked || !currentQuestion) return;
    setSelectedOption(option);
    setIsAnswered(true);
    
    const correct = option === currentQuestion.correctAnswer;
    if (correct) setScore(s => s + 1);
    else setWrongWords(w => [...w, currentQuestion.word]);
    
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1);
        setIsAnswered(false);
        setSelectedOption(null);
      } else {
        onFinish(score + (correct ? 1 : 0), correct ? wrongWords : [...wrongWords, currentQuestion.word]);
      }
    }, 1200);
  };

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className={`bg-white dark:bg-darkSurface p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-6 transition-all duration-300 ${isLocked ? 'opacity-90' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-8">
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
              {mode === 'MEANING' ? '释义选择挑战' : '真题语境填空'}
            </p>
            <div className="px-3 py-1 bg-slate-900 dark:bg-primary text-white rounded-xl text-[10px] font-black tracking-tighter">
                第 {currentIndex + 1} 题
            </div>
        </div>
        
        <div className="mb-10 px-2">
            {mode === 'CLOZE' ? (
                <div className="text-slate-700 dark:text-slate-300 font-semibold text-lg leading-relaxed text-justify break-words bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                    " {currentQuestion.displayPrompt || '例句加载中...'} "
                </div>
            ) : (
                <h2 className="text-slate-900 dark:text-white font-black text-center leading-tight text-5xl tracking-tighter break-words">
                    {currentQuestion.displayPrompt || '...'}
                </h2>
            )}
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((opt, i) => {
            const isCorrect = opt === currentQuestion.correctAnswer;
            const isSelected = opt === selectedOption;
            const isDisabled = isAnswered || isLocked;

            let style = "w-full p-5 rounded-2xl border-2 text-left transition-all font-bold text-sm flex items-center gap-4 ";
            
            if (!isAnswered) {
              style += isLocked 
                ? "border-slate-50 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed" 
                : "border-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md";
            } else {
              if (isCorrect) style += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm";
              else if (isSelected) style += "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 shadow-sm";
              else style += "border-slate-50 dark:border-slate-800 text-slate-200 dark:text-slate-700 opacity-40";
            }

            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={isDisabled} className={style}>
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-tight break-words">{opt || '选项'}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="w-full bg-white dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100 dark:border-slate-700 mb-4">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>
      
      {isLocked && (
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] animate-pulse">
          准备下一题...
        </p>
      )}
    </div>
  );
};

export default TestMode;
