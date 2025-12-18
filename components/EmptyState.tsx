import React from 'react';

interface EmptyStateProps {
  type: 'review' | 'mistake' | 'starred' | 'search' | 'default';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  const getConfig = () => {
    switch (type) {
      case 'review':
        return {
          icon: '🎉',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          defaultTitle: '暂无待复习',
          defaultDesc: '太棒了！你已经完成了所有复习任务',
          accentColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'mistake':
        return {
          icon: '✨',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
          iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
          defaultTitle: '错题本为空',
          defaultDesc: '继续保持！没有错误记录说明你学得很扎实',
          accentColor: 'text-indigo-600 dark:text-indigo-400'
        };
      case 'starred':
        return {
          icon: '⭐',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          defaultTitle: '收藏夹为空',
          defaultDesc: '学习时点击星标即可收藏重点单词',
          accentColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'search':
        return {
          icon: '🔍',
          bgColor: 'bg-slate-50 dark:bg-slate-800/50',
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          defaultTitle: '未找到结果',
          defaultDesc: '换个关键词试试吧',
          accentColor: 'text-slate-600 dark:text-slate-400'
        };
      default:
        return {
          icon: '📚',
          bgColor: 'bg-slate-50 dark:bg-slate-800/50',
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          defaultTitle: '暂无数据',
          defaultDesc: '开始学习来创建记录吧',
          accentColor: 'text-slate-600 dark:text-slate-400'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 ${config.bgColor} rounded-3xl animate-fade-in`}>
      {/* 图标 */}
      <div className={`w-24 h-24 ${config.iconBg} rounded-3xl flex items-center justify-center mb-6 shadow-sm`}>
        <span className="text-5xl">{config.icon}</span>
      </div>
      
      {/* 标题 */}
      <h3 className={`text-xl font-black ${config.accentColor} mb-2`}>
        {title || config.defaultTitle}
      </h3>
      
      {/* 描述 */}
      <p className="text-slate-400 dark:text-slate-500 text-sm text-center max-w-xs leading-relaxed mb-6">
        {description || config.defaultDesc}
      </p>
      
      {/* 操作按钮（可选） */}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
            type === 'review' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
            type === 'mistake' ? 'bg-indigo-500 text-white hover:bg-indigo-600' :
            type === 'starred' ? 'bg-amber-500 text-white hover:bg-amber-600' :
            'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800'
          }`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
