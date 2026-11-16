import type { StorageAdapter } from '../types';

export class LocalStorageAdapter implements StorageAdapter {
  private memoryFallback = new Map<string, unknown>();
  private listeners = new Set<(key: string, newValue: unknown) => void>();

  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) {
          return JSON.parse(raw) as T;
        }
      }
    } catch {
      // Fallback to in-memory store
    }
    return this.memoryFallback.has(key) ? (this.memoryFallback.get(key) as T) : fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.memoryFallback.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignore quota / private browsing errors
    }
    for (const listener of this.listeners) {
      listener(key, value);
    }
  }

  subscribe(listener: (key: string, newValue: unknown) => void): () => void {
    this.listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.newValue !== null) {
        try {
          listener(e.key, JSON.parse(e.newValue));
        } catch {
          // Ignore invalid JSON
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }
    return () => {
      this.listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }
}
