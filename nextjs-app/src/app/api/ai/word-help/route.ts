/**
 * API Route: /api/ai/word-help
 * 生成单词的 AI 辅助记忆内容
 * API 密钥安全存储在服务端
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWordHelp } from '@/lib/gemini';
import { VocabularyWord } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const word: VocabularyWord = body.word;

    if (!word || !word.word) {
      return NextResponse.json(
        { error: 'Missing word data' },
        { status: 400 }
      );
    }

    const result = await generateWordHelp(word);

    if (!result) {
      return NextResponse.json(
        { error: 'AI service unavailable or API key not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Word Help API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
