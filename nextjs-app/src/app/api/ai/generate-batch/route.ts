/**
 * API Route: /api/ai/generate-batch
 * 批量生成词汇
 * API 密钥安全存储在服务端
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateVocabularyBatch } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count: number = body.count || 20;
    const excludeWords: string[] = body.excludeWords || [];

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 50' },
        { status: 400 }
      );
    }

    const result = await generateVocabularyBatch(count, excludeWords);

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'AI service unavailable or API key not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate Batch API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
