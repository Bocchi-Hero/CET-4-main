/**
 * 前端 AI 服务
 * 通过 API 路由调用后端 AI 功能，确保 API 密钥安全
 */

import { VocabularyWord, AIResponse } from '@/types';
import { db } from './dbService';

const API_BASE = '/api/ai';

/**
 * 生成单词的 AI 辅助记忆内容
 */
export const generateWordHelp = async (word: VocabularyWord): Promise<AIResponse | null> => {
  // Check cache first
  try {
    const cached = await db.getAICache(word.word);
    if (cached) {
      console.log('Using cached AI response for:', word.word);
      return cached;
    }
  } catch (e) {
    console.warn('Failed to check AI cache:', e);
  }

  try {
    const response = await fetch(`${API_BASE}/word-help`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      console.error('Word help API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Cache the result
    try {
      await db.setAICache(word.word, data);
    } catch (e) {
      console.warn('Failed to cache AI response:', e);
    }

    return data;
  } catch (error) {
    console.error('Word help fetch error:', error);
    return null;
  }
};

/**
 * 快速获取单词定义
 */
export const quickDefine = async (word: string): Promise<Partial<VocabularyWord> | null> => {
  try {
    const response = await fetch(`${API_BASE}/quick-define`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      console.error('Quick define API error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Quick define fetch error:', error);
    return null;
  }
};

/**
 * 批量生成词汇
 */
export const generateVocabularyBatch = async (
  count: number = 20,
  excludeWords: string[] = []
): Promise<Partial<VocabularyWord>[]> => {
  try {
    const response = await fetch(`${API_BASE}/generate-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count, excludeWords }),
    });

    if (!response.ok) {
      console.error('Generate batch API error:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Generate batch fetch error:', error);
    return [];
  }
};
