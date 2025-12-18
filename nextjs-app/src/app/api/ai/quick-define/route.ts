/**
 * API Route: /api/ai/quick-define
 * 快速获取单词定义
 * API 密钥安全存储在服务端
 */

import { NextRequest, NextResponse } from 'next/server';
import { quickDefine } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const word: string = body.word;

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid word parameter' },
        { status: 400 }
      );
    }

    const result = await quickDefine(word.trim());

    if (!result) {
      return NextResponse.json(
        { error: 'AI service unavailable or API key not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Quick Define API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
