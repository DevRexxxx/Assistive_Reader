/**
 * Rule-Based Sentence Splitting & Chunked Card Deck
 * Pure TypeScript — no DOM, no network.
 *
 * Handles abbreviations (Dr., Mr., e.g., i.e., U.S., etc.), decimal numbers,
 * ellipses, and closing quotes cleanly.
 */

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'rev', 'gen', 'col',
  'lt', 'sgt', 'capt', 'gov', 'pres', 'rep', 'sen', 'vs', 'etc', 'eg', 'ie',
  'fig', 'eq', 'vol', 'no', 'pp', 'ed', 'est', 'approx', 'inc', 'ltd', 'corp',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'u.s', 'u.k', 'e.u', 'a.m', 'p.m', 'ph.d', 'm.d', 'b.a', 'm.a', 'b.s', 'm.s',
]);

export interface TextChunk {
  index: number;
  sentences: string[];
  text: string;
  wordCount: number;
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;

    // Skip ellipsis runs '...'
    if (ch === '.' && (normalized[i + 1] === '.' || normalized[i - 1] === '.')) {
      continue;
    }

    // Skip decimal numbers like 3.14
    if (ch === '.' && /\d/.test(normalized[i - 1] || '') && /\d/.test(normalized[i + 1] || '')) {
      continue;
    }

    // Include trailing closing quotes / parens if immediately attached
    let endIdx = i + 1;
    while (endIdx < normalized.length && /["'”’)\]]/.test(normalized[endIdx])) {
      endIdx++;
    }

    const nextChar = normalized[endIdx];
    const isAtEnd = endIdx >= normalized.length;
    const followedBySpace = nextChar === ' ';

    if (!isAtEnd && !followedBySpace) {
      continue;
    }

    // Check abbreviation before period
    if (ch === '.') {
      const beforeDot = normalized.slice(start, i);
      const tokenMatch = beforeDot.match(/([A-Za-z.]+)$/);
      if (tokenMatch) {
        const candidate = tokenMatch[1].toLowerCase().replace(/^\.+|\.+$/g, '');
        // Single capital letter initial (e.g. "J. K. Rowling") or known abbreviation
        const strippedDots = candidate.replace(/\./g, '');
        if (
          ABBREVIATIONS.has(candidate) ||
          ABBREVIATIONS.has(strippedDots) ||
          /^[A-Z]$/.test(tokenMatch[1])
        ) {
          continue;
        }
      }
    }

    // Require next sentence (if any) to look like a sentence start or quote/number
    if (!isAtEnd) {
      const afterSpace = normalized.slice(endIdx).trimStart();
      if (afterSpace.length > 0 && /^[a-z]/.test(afterSpace) && ch === '.') {
        continue;
      }
    }

    const sentence = normalized.slice(start, endIdx).trim();
    if (sentence) {
      sentences.push(sentence);
    }
    start = endIdx;
    while (start < normalized.length && normalized[start] === ' ') {
      start++;
    }
    i = start - 1;
  }

  const tail = normalized.slice(start).trim();
  if (tail) {
    sentences.push(tail);
  }

  return sentences;
}

export function chunkTextIntoCards(text: string, sentencesPerCard: number = 2): TextChunk[] {
  const safeCount = Math.max(1, Math.min(6, Math.floor(sentencesPerCard)));
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: TextChunk[] = [];
  for (let i = 0; i < sentences.length; i += safeCount) {
    const slice = sentences.slice(i, i + safeCount);
    const joined = slice.join(' ');
    chunks.push({
      index: chunks.length,
      sentences: slice,
      text: joined,
      wordCount: joined.split(/\s+/).filter(Boolean).length,
    });
  }
  return chunks;
}
