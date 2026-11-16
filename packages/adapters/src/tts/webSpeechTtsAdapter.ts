import type { TTSAdapter, TTSSpeakOptions, TTSVoiceInfo, TTSVoiceStatus } from '../types';

export class WebSpeechTTSAdapter implements TTSAdapter {
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private isCancelled = false;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  getVoiceStatus(preferredVoiceURI?: string): TTSVoiceStatus {
    if (!this.isSupported()) {
      return {
        supported: false,
        voices: [],
        localVoicesCount: 0,
        onlyNetworkVoices: false,
        selectedVoice: null,
      };
    }

    const rawVoices = window.speechSynthesis.getVoices();
    const voices: TTSVoiceInfo[] = rawVoices.map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      localService: v.localService,
      default: v.default,
    }));

    const localVoices = voices.filter((v) => v.localService);
    const preferred = preferredVoiceURI
      ? voices.find((v) => v.voiceURI === preferredVoiceURI) || null
      : null;
    const defaultLocal =
      localVoices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      localVoices[0] ||
      null;
    const fallbackVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;

    return {
      supported: true,
      voices,
      localVoicesCount: localVoices.length,
      onlyNetworkVoices: voices.length > 0 && localVoices.length === 0,
      selectedVoice: preferred || defaultLocal || fallbackVoice,
    };
  }

  speak(text: string, sentences: string[], options: TTSSpeakOptions): void {
    if (!this.isSupported()) {
      options.onError?.('Speech synthesis is unavailable in this browser.');
      return;
    }

    this.stop();
    this.isCancelled = false;

    const status = this.getVoiceStatus(options.voiceURI);
    const nativeVoices = window.speechSynthesis.getVoices();
    const targetNativeVoice = status.selectedVoice
      ? nativeVoices.find((v) => v.voiceURI === status.selectedVoice!.voiceURI)
      : undefined;

    const queue = sentences.length > 0 ? sentences : [text];
    let currentIdx = 0;
    let cumulativeOffset = 0;

    const speakNext = () => {
      if (this.isCancelled || currentIdx >= queue.length) {
        this.stopKeepAlive();
        if (!this.isCancelled) options.onEnd?.();
        return;
      }

      const sentence = queue[currentIdx];
      options.onSentenceChange?.(currentIdx);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = options.rate;
      utterance.pitch = 1.0;
      if (targetNativeVoice) {
        utterance.voice = targetNativeVoice;
      }

      const sentenceStartOffset = cumulativeOffset;
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word') {
          options.onWordBoundary?.(sentenceStartOffset + event.charIndex);
        }
      };

      utterance.onend = () => {
        if (this.isCancelled) return;
        cumulativeOffset += sentence.length + 1;
        currentIdx += 1;
        speakNext();
      };

      utterance.onerror = (ev) => {
        if (this.isCancelled || ev.error === 'interrupted' || ev.error === 'canceled') {
          return;
        }
        this.stopKeepAlive();
        options.onError?.(ev.error || 'tts-error');
      };

      window.speechSynthesis.speak(utterance);
    };

    this.startKeepAlive();
    speakNext();
  }

  stop(): void {
    this.isCancelled = true;
    this.stopKeepAlive();
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  pause(): void {
    this.stopKeepAlive();
    if (this.isSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.startKeepAlive();
    }
  }

  onVoicesChanged(cb: () => void): () => void {
    if (!this.isSupported()) return () => {};
    window.speechSynthesis.addEventListener?.('voiceschanged', cb);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', cb);
    };
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.isSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}
