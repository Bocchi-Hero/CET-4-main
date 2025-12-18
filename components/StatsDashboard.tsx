
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { calculateStreak } from '../services/sm2Service';
import { db } from '../services/dbService';
import { WordProgress, VocabDataset, VocabularyWord } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatsDashboardProps {
  currentDataset: VocabDataset;
  username: string;
  onBack: () => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ currentDataset, username, onBack }) => {
  const [progress, setProgress] = useState<Record<number, WordProgress>>({});
  const [activityLog, setActivityLog] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [currentLibraryWords, setCurrentLibraryWords] = useState<VocabularyWord[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const [p, a, s, allDBWords] = await Promise.all([
        db.getAllProgress(username),
        db.getActivityLog(username),
        calculateStreak(username),
        db.getFullVocabulary()
      ]);
      
      const filtered = allDBWords.filter(w => 
        currentDataset.data.some(dw => dw.word.toLowerCase() === w.word.toLowerCase()) || (w.tags && w.tags.includes(currentDataset.id))
      );
      
      setCurrentLibraryWords(filtered);
      setProgress(p);
      setActivityLog(a);
      setStreak(s);
    };
    loadStats();
  }, [currentDataset, username]);

  const progressValues = Object.values(progress) as WordProgress[];
  const currentProgress = progressValues.filter(p => 
    currentLibraryWords.some(lw => lw.id === p.wordId)
  );
  
  const masteredCount = currentProgress.filter(p => p.repetition >= 5).length;
  const learningCount = currentProgress.filter(p => p.repetition > 0 && p.repetition < 5).length;
  const newCount = Math.max(0, currentLibraryWords.length - masteredCount - learningCount);

  const doughnutData = {
    labels: ['精通', '学习中', '未开始'],
    datasets: [{
      data: [masteredCount, learningCount, newCount],
      backgroundColor: ['#10B981', '#6366F1', '#F3F4F6'],
      borderColor: ['#059669', '#4F46E5', '#E5E7EB'],
      borderWidth: 1,
    }],
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const lineData = {
    labels: last7Days.map(date => date.split('-').slice(1).join('/')),
    datasets: [{
      fill: true,
      label: '学习行为',
      data: last7Days.map(date => activityLog[date] || 0),
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.4,
      pointRadius: 4,
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkBg p-6 pt-12 animate-fade-in overflow-y-auto transition-colors">
      <div className="max-w-4xl mx-auto pb-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">学情看板</h1>
            <p className="text-gray-500">{username} 的学习档案</p>
          </div>
          <button onClick={onBack} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-gray-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3">🔥</div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">坚持打卡</span>
            <span className="text-3xl font-black text-slate-900">{streak} 天</span>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">📚</div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">已学词汇</span>
            <span className="text-3xl font-black text-slate-900">{currentProgress.length} 词</span>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">🏆</div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">掌握率</span>
            <span className="text-3xl font-black text-slate-900">{Math.round((masteredCount / (currentLibraryWords.length || 1)) * 100)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">掌握程度分布</h3>
            <div className="max-w-[200px] mx-auto">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, cutout: '75%' }} />
            </div>
            <div className="mt-8 space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="flex items-center gap-2 font-medium text-slate-600"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>已精通</span>
                 <span className="font-bold">{masteredCount}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="flex items-center gap-2 font-medium text-slate-600"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>学习中</span>
                 <span className="font-bold">{learningCount}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="flex items-center gap-2 font-medium text-slate-600"><div className="w-2.5 h-2.5 bg-gray-200 rounded-full"></div>未开始</span>
                 <span className="font-bold">{newCount}</span>
               </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">活跃度热点图</h3>
            <div className="h-[240px]">
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
