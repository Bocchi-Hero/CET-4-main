'use client';

import React, { useState } from 'react';
import { UserStudyPlan } from '@/types';

interface StudyPlanModalProps {
  plan: UserStudyPlan;
  onSave: (newPlan: Partial<UserStudyPlan>) => void;
  onBack: () => void;
}

const StudyPlanModal: React.FC<StudyPlanModalProps> = ({ plan, onSave, onBack }) => {
  const [target, setTarget] = useState(plan.dailyTarget);
  const options = [10, 20, 50, 100];

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
      <div className="bg-white dark:bg-darkSurface rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border border-white dark:border-slate-800 transition-colors">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 text-center">定制计划</h2>
        <p className="text-slate-400 dark:text-slate-500 font-medium text-center mb-10 text-sm">设定每日新词掌握目标</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          {options.map(opt => (
            <button 
              key={opt}
              onClick={() => setTarget(opt)}
              className={`py-5 rounded-2xl font-black text-lg transition-all border-2 ${target === opt ? 'border-primary bg-primary text-white shadow-lg' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-100 dark:hover:border-slate-700'}`}
            >
              {opt} 词
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => onSave({ dailyTarget: target })}
            className="w-full py-5 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 dark:shadow-none"
          >
            保存并开始
          </button>
          <button 
            onClick={onBack}
            className="w-full py-5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanModal;
