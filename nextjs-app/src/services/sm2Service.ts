/**
 * SM-2 间隔重复算法服务
 */

import { WordProgress, RecallQuality } from '@/types';
import { db } from './dbService';

export const getInitialProgress = (userId: string, wordId: number): WordProgress => ({
  userId,
  wordId,
  interval: 0,
  repetition: 0,
  efactor: 2.5,
  nextReviewDate: new Date().toISOString(),
});

export const calculateSM2 = (quality: RecallQuality, progress: WordProgress): WordProgress => {
  let { interval, repetition, efactor } = progress;

  if (quality >= RecallQuality.VAGUE) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * efactor);
    }
    repetition++;
  } else {
    repetition = 0;
    interval = 1;
  }

  const q = quality as number;
  efactor = efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (efactor < 1.3) efactor = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ...progress,
    interval,
    repetition,
    efactor,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: new Date().toISOString()
  };
};

export const saveProgress = async (username: string, wordId: number, quality: RecallQuality) => {
  const currentProgress = await db.getProgress(username, wordId) || getInitialProgress(username, wordId);
  const updatedProgress = calculateSM2(quality, currentProgress);
  
  await db.putProgress(username, updatedProgress);
  await recordActivity(username);
  
  return updatedProgress;
};

const recordActivity = async (username: string) => {
  const today = new Date().toISOString().split('T')[0];
  const log = await db.getActivityLog(username);
  const currentCount = log[today] || 0;
  await db.putActivity(username, today, currentCount + 1);
};

export const calculateStreak = async (username: string): Promise<number> => {
  const log = await db.getActivityLog(username);
  const dates = Object.keys(log).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  let current = new Date(dates[0]);

  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    const diffDays = Math.round(Math.abs(current.getTime() - d.getTime()) / 86400000);
    
    if (diffDays <= 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }
  return streak;
};
