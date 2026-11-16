/**
 * Text-to-Speech with Word Highlighting (v2 — Fixed)
 *
 * Uses the Web Speech API to read page text aloud while highlighting
 * each word as it's spoken. Essential for severe Dyslexia / visual processing.
 *
 * Fixes:
 *  - Uses charIndex from onboundary for accurate word-to-span sync
 *  - Chrome 15-second timeout workaround via pause/resume keepalive
 *  - Handles edge cases: empty text, speech synthesis not available
 */

const TTS_HIGHLIGHT_CLASS = 'ar-tts-highlight';
const TTS_STYLE_ID = 'ar-tts-styles';

let wordSpans: HTMLSpanElement[] = [];
let originalContent: { parent: HTMLElement; html: string } | null = null;
let isActive = false;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let fullText = '';
let wordMap: { start: number; end: number; spanIndex: number }[] = [];
let currentRate = 0.9;

export function setTTSRate(rate: number): void {
  currentRate = rate;
}

function injectTTSStyles(): void {
  if (document.getElementById(TTS_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = TTS_STYLE_ID;
  style.textContent = `
    .${TTS_HIGHLIGHT_CLASS} {
      background: linear-gradient(135deg, #fef08a, #fde047) !important;
      color: #1a1a1a !important;
      border-radius: 3px;
      padding: 1px 3px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      transition: background 0.1s ease;
    }
    .ar-tts-word {
      transition: background 0.08s ease;
      border-radius: 2px;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

export function startTTS(): void {
  if (isActive) {
    stopTTS();
    return;
  }

  // Check browser support
  if (!window.speechSynthesis) {
    console.warn('[AssistiveReader] SpeechSynthesis not available.');
    return;
  }

  injectTTSStyles();
  window.speechSynthesis.cancel();

  // Find main content
  const source =
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('main') ||
    document.body;

  if (!source) return;

  // Get clean text BEFORE modifying DOM
  const textContent = getCleanText(source as HTMLElement);
  if (!textContent.trim()) return;

  fullText = textContent;

  // Tokenize the content into word spans for highlighting
  const container = source as HTMLElement;
  originalContent = { parent: container, html: container.innerHTML };
  wrapWordsInSpans(container);

  // Build charIndex → spanIndex mapping from fullText
  buildWordMap(textContent);

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(textContent);
  utterance.rate = currentRate;
  utterance.pitch = 1.0;

  // Use a local/native voice for reliable onboundary events
  const voices = window.speechSynthesis.getVoices();
  const localVoice = voices.find(v => v.localService && v.lang.startsWith('en'));
  if (localVoice) {
    utterance.voice = localVoice;
  }

  utterance.onboundary = (event: SpeechSynthesisEvent) => {
    if (event.name === 'word') {
      // Clear all previous highlights
      wordSpans.forEach(s => s.classList.remove(TTS_HIGHLIGHT_CLASS));

      // Use charIndex to find the correct word span
      const charIdx = event.charIndex;
      const match = wordMap.find(w => charIdx >= w.start && charIdx < w.end);

      if (match && match.spanIndex < wordSpans.length) {
        const span = wordSpans[match.spanIndex];
        span.classList.add(TTS_HIGHLIGHT_CLASS);
        // Scroll smoothly to current word
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  utterance.onend = () => {
    cleanupHighlights();
    isActive = false;
  };

  utterance.onerror = (e) => {
    // 'interrupted' is normal when user stops manually
    if (e.error !== 'interrupted') {
      console.warn('[AssistiveReader] TTS error:', e.error);
    }
    cleanupHighlights();
    isActive = false;
  };

  isActive = true;
  window.speechSynthesis.speak(utterance);

  // Chrome workaround: Chrome kills speech after ~15 seconds.
  // Pause/resume every 10s to keep it alive.
  startKeepAlive();
}

export function stopTTS(): void {
  stopKeepAlive();
  window.speechSynthesis.cancel();
  cleanupHighlights();
  isActive = false;
}

export function pauseTTS(): void {
  stopKeepAlive();
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  }
}

export function resumeTTS(): void {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    startKeepAlive();
  }
}

export function isTTSActive(): boolean {
  return isActive;
}

// ─── Chrome Keepalive Workaround ─────────────────────────────────────────────

function startKeepAlive(): void {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000); // Every 10 seconds
}

function stopKeepAlive(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// ─── Word Mapping ────────────────────────────────────────────────────────────

function buildWordMap(text: string): void {
  wordMap = [];
  // Match each word and record its start/end character index
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let spanIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    wordMap.push({
      start: match.index,
      end: match.index + match[0].length,
      spanIndex: spanIdx,
    });
    spanIdx++;
  }
}

// ─── DOM Helpers ─────────────────────────────────────────────────────────────

function getCleanText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  ['script', 'style', 'noscript', 'nav', 'footer', 'aside', 'iframe'].forEach(tag => {
    clone.querySelectorAll(tag).forEach(e => e.remove());
  });
  return clone.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function wrapWordsInSpans(container: HTMLElement): void {
  wordSpans = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    textNodes.push(n as Text);
    n = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    const tokens = text.split(/(\s+)/);
    const fragment = document.createDocumentFragment();

    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        fragment.appendChild(document.createTextNode(token));
      } else if (token) {
        const span = document.createElement('span');
        span.className = 'ar-tts-word';
        span.textContent = token;
        wordSpans.push(span);
        fragment.appendChild(span);
      }
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  }
}

function cleanupHighlights(): void {
  stopKeepAlive();

  if (originalContent) {
    try {
      originalContent.parent.innerHTML = originalContent.html;
    } catch {
      // DOM may have changed — do manual cleanup
      wordSpans.forEach(s => {
        s.classList.remove(TTS_HIGHLIGHT_CLASS);
        s.classList.remove('ar-tts-word');
      });
    }
    originalContent = null;
  }
  wordSpans = [];
  wordMap = [];
  fullText = '';

  const style = document.getElementById(TTS_STYLE_ID);
  if (style) style.remove();
}
