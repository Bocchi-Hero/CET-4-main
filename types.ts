
export interface VocabularyWord {
  id: number;
  word: string;
  phonetic: string;
  translation: string;
  example: string;
  tags: string[];
  frequency?: 'high' | 'medium' | 'low';
  difficulty?: 'easy' | 'medium' | 'hard';
  isStarred?: boolean;
}

export interface User {
  username: string;
  password?: string;
  createdAt: string;
  points?: number;
  avatar?: string;
}

export enum AppState {
  AUTH = 'AUTH',
  LIBRARY_SELECTION = 'LIBRARY_SELECTION',
  HOME = 'HOME',
  USER_CENTER = 'USER_CENTER',
  SETUP = 'SETUP',
  STUDY = 'STUDY',
  POST_STUDY_TEST = 'POST_STUDY_TEST',
  MISTAKE_REVIEW = 'MISTAKE_REVIEW',
  REVIEW_SESSION = 'REVIEW_SESSION', 
  PLAN = 'PLAN', 
  TEST = 'TEST',
  SUMMARY = 'SUMMARY',
  STATS = 'STATS',
  SCAN = 'SCAN',
  PREVIEW = 'PREVIEW',
  SEARCH = 'SEARCH',
  IMPORT = 'IMPORT',
  STARRED = 'STARRED',
  LEADERBOARD = 'LEADERBOARD'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum SessionType {
  STUDY = 'STUDY',
  TEST = 'TEST',
  REVIEW = 'REVIEW'
}

export enum RecallQuality {
  FORGOT = 0,
  VAGUE = 3,
  FLUENT = 4,
  PERFECT = 5
}

export interface WordProgress {
  wordId: number;
  userId: string;
  interval: number;
  repetition: number;
  efactor: number;
  nextReviewDate: string;
  lastReviewDate?: string;
}

export interface EtymologyPart {
  part: string;
  type: 'prefix' | 'root' | 'suffix';
  meaning: string;
}

export interface AIResponse {
  mnemonic: string;
  usageContext: string;
  contextStory: string;
  etymology: EtymologyPart[];
  cognates: string[];
  imageUrl?: string;
}

/* Added VocabDataset interface to fix import errors across multiple files */
export interface VocabDataset {
  id: string;
  name: string;
  description: string;
  color: string;
  data: VocabularyWord[];
}

/* Added TestQuestion interface to fix import error in TestMode.tsx */
export interface TestQuestion {
  word: VocabularyWord;
  options: string[];
  correctAnswer: string;
  type: 'MEANING' | 'CLOZE';
  displayPrompt: string;
}

export interface StudySessionStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  difficulty: Difficulty;
  wrongWords: VocabularyWord[];
}

export interface UserStudyPlan {
  dailyTarget: number;
  wordsLearnedToday: number;
  lastUpdateDate: string;
}
