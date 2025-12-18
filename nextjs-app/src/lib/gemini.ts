/**
 * 服务端 Gemini 服务
 * API 密钥只在服务端可用，不会暴露给客户端
 */

import { GoogleGenAI, Type } from "@google/genai";
import { VocabularyWord, AIResponse } from '@/types';

// 初始化 Gemini AI - 仅在服务端执行
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWordHelp = async (word: VocabularyWord): Promise<AIResponse | null> => {
  const genAI = getGenAI();
  if (!genAI) return null;

  try {
    const textPrompt = `
      As a linguistics expert, analyze the English word "${word.word}".
      1. Breakdown its etymology into prefixes, roots, and suffixes with their specific meanings in Chinese.
      2. Provide a mnemonic in Chinese.
      3. Provide a vivid 40-word context story (Chinese/English mixed) with **${word.word}** bolded.
      4. List 3-4 related English cognates (same root).
      
      Return ONLY valid JSON.
    `;

    const textResponse = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mnemonic: { type: Type.STRING },
            usageContext: { type: Type.STRING },
            contextStory: { type: Type.STRING },
            etymology: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  part: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['prefix', 'root', 'suffix'] },
                  meaning: { type: Type.STRING }
                },
                required: ["part", "type", "meaning"]
              }
            },
            cognates: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["mnemonic", "usageContext", "contextStory", "etymology", "cognates"]
        }
      }
    });

    const aiData = JSON.parse(textResponse.text ?? '{}') as AIResponse;

    // 图片生成可选
    try {
      const imageResponse = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `A clear, high-quality visual mnemonic for the word "${word.word}" which means "${word.translation}". Minimalist style, vibrant colors, single central object representing the word's meaning. No text.`,
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts ?? []) {
        if ((part as any).inlineData) {
          aiData.imageUrl = `data:image/png;base64,${(part as any).inlineData.data}`;
          break;
        }
      }
    } catch (imgErr) {
      console.warn("Image generation failed, continuing with text only", imgErr);
    }

    return aiData;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const quickDefine = async (word: string): Promise<Partial<VocabularyWord> | null> => {
  const genAI = getGenAI();
  if (!genAI) return null;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Define the English word "${word}" for a Chinese learner. Return JSON with: translation, phonetic, example sentence.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ["translation", "phonetic", "example"]
        }
      }
    });
    return JSON.parse(response.text ?? '{}');
  } catch (e) {
    console.error("Quick Define Error:", e);
    return null;
  }
};

export const generateVocabularyBatch = async (count: number = 20, excludeWords: string[] = []): Promise<Partial<VocabularyWord>[]> => {
  const genAI = getGenAI();
  if (!genAI) return [];

  try {
    const prompt = `
      Generate ${count} essential English vocabulary words specifically for the CET-4 (College English Test Band 4) exam.
      Focus on academic and common exam words.
      Do NOT include these words: ${excludeWords.slice(0, 50).join(', ')}.
      
      Return a JSON array where each object contains:
      - word (string)
      - phonetic (KK phonetic symbol string)
      - translation (Chinese meaning, concise)
      - example (A high-quality CET-4 level example sentence)
      - frequency ('high', 'medium', or 'low')
      - difficulty ('easy', 'medium', or 'hard')
      - tags (array of strings, e.g., ['academic', 'verb', 'cet4'])
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              translation: { type: Type.STRING },
              example: { type: Type.STRING },
              frequency: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["word", "phonetic", "translation", "example", "frequency", "difficulty", "tags"]
          }
        }
      }
    });

    return JSON.parse(response.text ?? '[]');
  } catch (error) {
    console.error("Batch Generation Error:", error);
    return [];
  }
};
