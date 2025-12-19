'use client';

import { VocabularyWord, TestQuestion } from '@/types';
import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/services/dbService';

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
  const [enhancedQuestions, setEnhancedQuestions] = useState<TestQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const prepareQuestions = async () => {
      setIsLoading(true);
      const questions: TestQuestion[] = [];

      for (const word of words) {
        const isMeaning = mode === 'MEANING';
        const correctAnswer = (isMeaning ? word.translation : word.word) || "";
        
        let displayPrompt = "";
        
        if (isMeaning) {
          displayPrompt = word.word;
        } else {
          // 默认使用例句
          let rawText = word.example || "No example provided.";
          
          // 尝试从 AI 缓存获取更丰富的语境
          try {
            const cached = await db.getAICache(word.word);
            if (cached && cached.contextStory) {
              rawText = cached.contextStory;
            }
          } catch (e) {
            console.warn("Failed to load AI cache for test", e);
          }

          // 智能挖空逻辑
          const safeWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(\\*\\*)?${safeWord}\\w*(\\*\\*)?`, 'gi');
          displayPrompt = rawText.replace(regex, ' ________ ');
        }

        const distractors = allDatasetWords
          .filter(w => w.word.toLowerCase() !== word.word.toLowerCase())
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(w => isMeaning ? w.translation : w.word);
        
        const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
        
        questions.push({ 
          word, 
          options, 
          correctAnswer, 
          type: mode, 
          displayPrompt 
        });
      }
      
      setEnhancedQuestions(questions);
      setIsLoading(false);
    };

    prepareQuestions();
  }, [words, mode, allDatasetWords]);

  useEffect(() => {
    setIsLocked(true);
    const timer = setTimeout(() => setIsLocked(false), 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const currentQuestion = useMemo(() => {
    return enhancedQuestions[currentIndex] || null;
  }, [currentIndex, enhancedQuestions]);

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

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-slide-up flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold">正在生成测试题目...</p>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className={`bg-white dark:bg-darkSurface p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-6 transition-opacity duration-300 ${isLocked ? 'opacity-90' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-8">
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
              {mode === 'MEANING' ? '释义选择挑战' : 'CET-4 真题语境填空'}
            </p>
            <div className="px-3 py-1 bg-slate-900 dark:bg-primary text-white rounded-xl text-[10px] font-black tracking-tighter">
                QUESTION {currentIndex + 1}
            </div>
        </div>
        
        <div className="mb-10 px-2">
            {mode === 'CLOZE' ? (
                <div className="text-slate-700 dark:text-slate-300 font-semibold text-lg leading-relaxed text-justify word-break-all bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                    &quot; {currentQuestion.displayPrompt} &quot;
                </div>
            ) : (
                <h2 className="text-slate-900 dark:text-white font-black text-center leading-tight text-5xl tracking-tighter word-break-all">
                    {currentQuestion.displayPrompt}
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
              style += isLocked ? "border-slate-50 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed" : "border-slate-50 dark:border-slate-800 hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md";
            } else {
              if (isCorrect) style += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm";
              else if (isSelected) style += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 shadow-sm";
              else style += "border-slate-50 dark:border-slate-800 text-slate-200 dark:text-slate-700 opacity-40";
            }

            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={isDisabled} className={style}>
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-tight word-break-all">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="w-full bg-white dark:bg-darkSurface h-2.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100 dark:border-slate-800 mb-4">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>
      
      {isLocked && (
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] animate-pulse">
          PREPARING NEXT CHALLENGE...
        </p>
      )}
    </div>
  );
};

export default TestMode;
