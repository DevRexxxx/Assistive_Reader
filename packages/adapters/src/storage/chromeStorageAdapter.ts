import type { StorageAdapter } from '../types';

export class ChromeStorageAdapter implements StorageAdapter {
  async get<T>(key: string, fallback: T): Promise<T> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return fallback;
    }
    const result = await chrome.storage.local.get([key]);
    return (result[key] as T) ?? fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return;
    }
    await chrome.storage.local.set({ [key]: value });
  }

  subscribe(listener: (key: string, newValue: unknown) => void): () => void {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
      return () => {};
    }
    const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local') return;
      for (const [key, change] of Object.entries(changes)) {
        listener(key, change.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
}
