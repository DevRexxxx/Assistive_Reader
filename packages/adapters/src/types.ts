import type { LicenseVerificationResult } from '@assistivereader/core';

export interface StorageAdapter {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  subscribe(listener: (key: string, newValue: unknown) => void): () => void;
}

export interface TTSVoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TTSSpeakOptions {
  rate: number;
  voiceURI?: string;
  onWordBoundary?: (charIndex: number) => void;
  onSentenceChange?: (sentenceIndex: number) => void;
  onEnd?: () => void;
  onError?: (reason: string) => void;
}

export interface TTSVoiceStatus {
  supported: boolean;
  voices: TTSVoiceInfo[];
  localVoicesCount: number;
  onlyNetworkVoices: boolean;
  selectedVoice: TTSVoiceInfo | null;
}

export interface TTSAdapter {
  getVoiceStatus(preferredVoiceURI?: string): TTSVoiceStatus;
  speak(text: string, sentences: string[], options: TTSSpeakOptions): void;
  stop(): void;
  pause(): void;
  resume(): void;
  onVoicesChanged(cb: () => void): () => void;
}

export interface ExportAdapter {
  downloadTextFile(filename: string, content: string, mimeType: string): void;
}

export interface LicenseAdapter {
  loadKey(): Promise<string>;
  saveKey(key: string): Promise<void>;
  clearKey(): Promise<void>;
  verify(key: string): LicenseVerificationResult;
}
