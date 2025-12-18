/**
 * IndexedDB 数据库服务
 * 用于本地存储用户数据、学习进度等
 */

import { VocabularyWord, WordProgress, User } from '@/types';

const DB_NAME = 'VocabMasterDB_v5'; 
const DB_VERSION = 5;

export class DBService {
  private _db: IDBDatabase | null;

  constructor() {
    this._db = null;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'username' });
        }
        if (!db.objectStoreNames.contains('vocabulary')) {
          db.createObjectStore('vocabulary', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' }); 
        }
        if (!db.objectStoreNames.contains('activity')) {
          db.createObjectStore('activity', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('mistakes')) {
          db.createObjectStore('mistakes', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this._db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject('IndexedDB failed to open');
    });
  }

  // --- Auth Methods ---
  async registerUser(user: User): Promise<void> {
    const existing = await this.perform('users', 'readonly', (store) => store.get(user.username));
    if (existing) throw new Error("用户名已存在");
    return this.perform('users', 'readwrite', (store) => store.add(user));
  }

  async loginUser(username: string, password?: string): Promise<User | null> {
    const user: User = await this.perform('users', 'readonly', (store) => store.get(username));
    if (user && user.password === password) return user;
    return null;
  }

  // --- Scoped Progress Methods ---
  async putProgress(username: string, progress: WordProgress): Promise<void> {
    const id = `${username}_${progress.wordId}`;
    return this.perform('progress', 'readwrite', (store) => store.put({ ...progress, id }));
  }

  async getProgress(username: string, wordId: number): Promise<WordProgress | null> {
    const id = `${username}_${wordId}`;
    return this.perform('progress', 'readonly', (store) => store.get(id));
  }

  async getAllProgress(username: string): Promise<Record<number, WordProgress>> {
    const list: (WordProgress & { id: string })[] = await this.perform('progress', 'readonly', (store) => store.getAll());
    return list
      .filter(item => item.id.startsWith(`${username}_`))
      .reduce((acc, curr) => ({ ...acc, [curr.wordId]: curr }), {});
  }

  async putActivity(username: string, date: string, count: number): Promise<void> {
    const id = `${username}_${date}`;
    return this.perform('activity', 'readwrite', (store) => store.put({ id, date, count }));
  }

  async getActivityLog(username: string): Promise<Record<string, number>> {
    const list: { id: string, date: string, count: number }[] = await this.perform('activity', 'readonly', (store) => store.getAll());
    return list
      .filter(item => item.id.startsWith(`${username}_`))
      .reduce((acc, curr) => ({ ...acc, [curr.date]: curr.count }), {});
  }

  async toggleStar(wordId: number): Promise<boolean> {
    const word = await this.perform('vocabulary', 'readonly', (store) => store.get(wordId));
    if (!word) return false;
    const newState = !word.isStarred;
    await this.perform('vocabulary', 'readwrite', (store) => store.put({ ...word, isStarred: newState }));
    return newState;
  }

  async seedVocabulary(words: VocabularyWord[]): Promise<void> {
    if (!this._db) await this.init();
    return new Promise((resolve, reject) => {
        if (!this._db) return reject("DB not initialized");
        const transaction = this._db.transaction('vocabulary', 'readwrite');
        const store = transaction.objectStore('vocabulary');
        words.forEach(word => store.put(word));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this._db) await this.init();
    const stores = ['vocabulary', 'progress', 'mistakes', 'activity', 'users'];
    return new Promise((resolve, reject) => {
      if (!this._db) return reject("DB not initialized");
      const transaction = this._db.transaction(stores, 'readwrite');
      stores.forEach(s => transaction.objectStore(s).clear());
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async addWord(word: Partial<VocabularyWord>): Promise<number> {
    const current = await this.getFullVocabulary();
    const nextId = current.length > 0 ? Math.max(...current.map(w => w.id)) + 1 : 1;
    const finalWord = { ...word, id: nextId, isStarred: false };
    return this.perform('vocabulary', 'readwrite', (store) => store.add(finalWord));
  }

  async findWord(wordStr: string): Promise<VocabularyWord | null> {
    const list: VocabularyWord[] = await this.perform('vocabulary', 'readonly', (store) => store.getAll());
    return list.find(w => w.word.toLowerCase().trim() === wordStr.toLowerCase().trim()) || null;
  }

  async getFullVocabulary(): Promise<VocabularyWord[]> {
    return this.perform('vocabulary', 'readonly', (store) => store.getAll());
  }

  async addMistake(username: string, wordId: number): Promise<void> {
    const id = `${username}_${wordId}`;
    return this.perform('mistakes', 'readwrite', (store) => store.put({ id, wordId, addedAt: new Date().toISOString() }));
  }

  async removeMistake(username: string, wordId: number): Promise<void> {
    const id = `${username}_${wordId}`;
    return this.perform('mistakes', 'readwrite', (store) => store.delete(id));
  }

  async getMistakeIds(username: string): Promise<number[]> {
    const items: { id: string, wordId: number }[] = await this.perform('mistakes', 'readonly', (store) => store.getAll());
    return items
      .filter(item => item.id.startsWith(`${username}_`))
      .map(i => i.wordId);
  }

  private async perform(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<any> {
    if (!this._db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this._db) return reject("DB init failed");
      const transaction = this._db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DBService();
