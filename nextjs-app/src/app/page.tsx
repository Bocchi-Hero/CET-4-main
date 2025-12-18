'use client';

import dynamic from 'next/dynamic';

// 动态导入主应用组件，禁用 SSR（因为使用了 IndexedDB）
const MainApp = dynamic(() => import('@/components/MainApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-darkBg p-6">
      <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-6"></div>
      <p className="font-black text-slate-400 dark:text-slate-600 tracking-widest text-sm animate-pulse uppercase">Loading</p>
    </div>
  ),
});

export default function Home() {
  return <MainApp />;
}
