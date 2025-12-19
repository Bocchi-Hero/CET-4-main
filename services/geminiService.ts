
import { VocabularyWord, AIResponse } from '../types';
import { db } from './dbService';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const callDeepSeek = async (messages: { role: string; content: string }[], jsonMode: boolean = true): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('DeepSeek API Key not configured');
    return null;
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('DeepSeek API Error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('DeepSeek Request Error:', error);
    return null;
  }
};

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

  const prompt = `
作为语言学专家，分析英语单词 "${word.word}"。

请返回以下 JSON 格式：
{
  "mnemonic": "中文助记方法",
  "usageContext": "使用场景说明",
  "contextStory": "一个40词左右的生动语境故事（中英混合），用 **${word.word}** 加粗标记目标词",
  "etymology": [
    {"part": "词根/词缀", "type": "prefix/root/suffix", "meaning": "中文含义"}
  ],
  "cognates": ["同根词1", "同根词2", "同根词3"]
}

要求：
1. 将词源分解为前缀、词根、后缀，并给出各部分的中文含义
2. 提供一个有效的中文助记方法
3. 列出3-4个相关的英语同根词

只返回 JSON，不要其他内容。
`;

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是一个专业的英语词汇学习助手，擅长词源分析和记忆技巧。请始终返回有效的 JSON 格式。' },
      { role: 'user', content: prompt }
    ]);

    if (!result) return null;
    const parsed = JSON.parse(result) as AIResponse;
    
    // Cache the result
    try {
      await db.setAICache(word.word, parsed);
    } catch (e) {
      console.warn('Failed to cache AI response:', e);
    }

    return parsed;
  } catch (error) {
    console.error('DeepSeek Error:', error);
    return null;
  }
};

export const quickDefine = async (word: string): Promise<Partial<VocabularyWord> | null> => {
  const prompt = `
为中国英语学习者定义单词 "${word}"。

返回 JSON 格式：
{
  "translation": "中文翻译（简洁）",
  "phonetic": "音标",
  "example": "一个例句"
}

只返回 JSON。
`;

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是英语词典助手。返回简洁准确的定义。' },
      { role: 'user', content: prompt }
    ]);

    if (!result) return null;
    return JSON.parse(result);
  } catch (error) {
    console.error('QuickDefine Error:', error);
    return null;
  }
};

export const generateVocabularyBatch = async (count: number = 10, excludeWords: string[] = []): Promise<Partial<VocabularyWord>[]> => {
  const excludeList = excludeWords.slice(0, 50).join(', ');
  
  const prompt = `
生成 ${count} 个适合 CET-4（大学英语四级）考试的核心英语词汇。

要求：
- 聚焦学术和考试常见词汇
- 不要包含这些词：${excludeList || '无'}

返回 JSON 数组格式：
[
  {
    "word": "单词",
    "phonetic": "音标（如 /əˈbændən/）",
    "translation": "中文翻译（简洁）",
    "example": "一个高质量的四级水平例句",
    "frequency": "high/medium/low",
    "difficulty": "easy/medium/hard",
    "tags": ["academic", "verb", "cet4"]
  }
]

只返回 JSON 数组，不要其他内容。生成 ${count} 个不同的单词。
`;

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是 CET-4 词汇专家。生成适合四级考试的高质量词汇，返回 JSON 数组格式。' },
      { role: 'user', content: prompt }
    ]);

    if (!result) return [];
    
    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Batch Generation Error:', error);
    return [];
  }
};

export const filterOCRWords = async (rawWords: string[]): Promise<string[]> => {
  // 限制输入数量，避免 token 超限
  const inputWords = rawWords.slice(0, 100).join(', ');
  
  const prompt = `
分析以下 OCR 识别出的单词列表，筛选出有效的英语单词。

输入列表：${inputWords}

要求：
1. 过滤掉乱码、非单词字符、无意义的组合。
2. 纠正明显的 OCR 拼写错误（例如 'th1s' -> 'this'）。
3. 优先保留 CET-4/CET-6 考试常见的高频词汇。
4. 过滤掉过于简单的词（如 a, the, is, it 等）和纯数字。
5. 确保返回的都是合法的英语单词原型（lemma）。

返回 JSON 格式：
{
  "validWords": ["word1", "word2", "word3"]
}

只返回 JSON。
`;

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是英语词汇专家，擅长从 OCR 结果中提取有效词汇。' },
      { role: 'user', content: prompt }
    ]);

    if (!result) return [];
    const parsed = JSON.parse(result);
    return parsed.validWords || [];
  } catch (error) {
    console.error('OCR Filter Error:', error);
    return []; // 失败时返回空数组，或者可以考虑返回原始列表的子集
  }
};
