import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';

interface LeaderboardEntry {
  username: string;
  points: number;
  createdAt: string;
}

interface LeaderboardProps {
  currentUsername: string;
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUsername, onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await db.getLeaderboard();
        setEntries(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-200 dark:shadow-none';
    if (index === 1) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-200 dark:shadow-none';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-200 dark:shadow-none';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
  };

  const currentUserRank = entries.findIndex(e => e.username === currentUsername);

  return (
    <div className="min-h-screen bg-softBg dark:bg-darkBg animate-slide-up">
      <div className="max-w-xl mx-auto px-4 pt-12 pb-28">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack} 
            className="w-12 h-12 bg-white dark:bg-darkSurface rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-800 transition-all shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">🏆 积分排行榜</h1>
          <div className="w-12"></div>
        </div>

        {/* 当前用户排名 */}
        {currentUserRank >= 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-3xl mb-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black text-white">
                  {currentUserRank + 1}
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">你的排名</p>
                  <p className="text-2xl font-black text-white">{currentUsername}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm font-medium">积分</p>
                <p className="text-3xl font-black text-white">{entries[currentUserRank]?.points || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* 排行榜列表 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin"></div>
            <p className="text-slate-400 dark:text-slate-600 font-bold text-sm">加载中...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-4xl">🏆</div>
            <p className="text-slate-400 dark:text-slate-600 font-bold">暂无排行数据</p>
            <p className="text-slate-300 dark:text-slate-700 text-sm">开始学习积累积分吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div 
                key={entry.username}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  entry.username === currentUsername 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800' 
                    : 'bg-white dark:bg-darkSurface border border-slate-100 dark:border-slate-800'
                }`}
              >
                {/* 排名 */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${getRankStyle(index)}`}>
                  {index < 3 ? getRankIcon(index) : index + 1}
                </div>

                {/* 用户信息 */}
                <div className="flex-1">
                  <p className={`font-black ${entry.username === currentUsername ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {entry.username}
                    {entry.username === currentUsername && <span className="ml-2 text-xs text-indigo-400">(你)</span>}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">
                    加入于 {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                {/* 积分 */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span className={`text-xl font-black ${
                    index === 0 ? 'text-amber-500' : 
                    index === 1 ? 'text-slate-400' : 
                    index === 2 ? 'text-orange-500' : 
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {entry.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 积分规则说明 */}
        <div className="mt-8 p-6 bg-white dark:bg-darkSurface rounded-3xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">📜</span> 积分规则
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-xs font-black">+10</span>
              <span>完美记住一个单词</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-xs font-black">+20</span>
              <span>测试中答对一题</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
