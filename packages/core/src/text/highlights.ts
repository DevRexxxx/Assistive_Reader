/**
 * Deterministic Extractive Key-Sentence Highlighter (TextRank + TF Scoring)
 * Pure TypeScript — NO AI, NO LLMs, NO network.
 *
 * Ranks existing sentences using word frequency + graph centrality so users
 * can spot key takeaways without generative summarization.
 */

import { splitSentences } from './sentences';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
  'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'to', 'with', 'as',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'this', 'that', 'these', 'those', 'it', 'its',
  'they', 'them', 'their', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her',
  'not', 'no', 'so', 'such', 'than', 'too', 'very', 'just', 'also', 'more',
]);

export interface KeySentenceResult {
  sentenceIndex: number;
  text: string;
  score: number;
}

function tokenizeContentWords(sentence: string): string[] {
  return (sentence.toLowerCase().match(/[a-z]{3,}/g) || []).filter(w => !STOP_WORDS.has(w));
}

function jaccardCosineSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let overlap = 0;
  for (const term of setA) {
    if (setB.has(term)) overlap++;
  }
  if (overlap === 0) return 0;
  return overlap / (Math.log(a.length + 1) + Math.log(b.length + 1) + 1);
}

export function extractKeySentences(text: string, maxSentences: number = 3): KeySentenceResult[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];
  if (sentences.length <= maxSentences) {
    return sentences.map((s, idx) => ({ sentenceIndex: idx, text: s, score: 1 }));
  }

  const tokenized = sentences.map(tokenizeContentWords);

  // Word frequency map across document
  const wordFreq = new Map<string, number>();
  for (const tokens of tokenized) {
    for (const t of tokens) {
      wordFreq.set(t, (wordFreq.get(t) || 0) + 1);
    }
  }
  const maxFreq = Math.max(1, ...wordFreq.values());

  // Pairwise similarity matrix + TextRank iterations
  const n = sentences.length;
  const simMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = jaccardCosineSimilarity(tokenized[i], tokenized[j]);
      simMatrix[i][j] = sim;
      simMatrix[j][i] = sim;
    }
  }

  let ranks = new Array<number>(n).fill(1 / n);
  const damping = 0.85;

  for (let iter = 0; iter < 12; iter++) {
    const nextRanks = new Array<number>(n).fill((1 - damping) / n);
    for (let i = 0; i < n; i++) {
      let sumOut = 0;
      for (let k = 0; k < n; k++) sumOut += simMatrix[i][k];
      if (sumOut === 0) continue;
      for (let j = 0; j < n; j++) {
        if (simMatrix[i][j] > 0) {
          nextRanks[j] += damping * ranks[i] * (simMatrix[i][j] / sumOut);
        }
      }
    }
    ranks = nextRanks;
  }

  // Combine TextRank with normalized TF density & slight lead bias
  const scored: KeySentenceResult[] = sentences.map((sentence, idx) => {
    const tokens = tokenized[idx];
    const tfAvg =
      tokens.length > 0
        ? tokens.reduce((acc, t) => acc + (wordFreq.get(t) || 0) / maxFreq, 0) / tokens.length
        : 0;
    const positionBonus = idx === 0 ? 0.12 : idx < 3 ? 0.05 : 0;
    const lengthPenalty = tokens.length < 4 ? 0.5 : 1.0;
    const score = (ranks[idx] * 2 + tfAvg + positionBonus) * lengthPenalty;

    return {
      sentenceIndex: idx,
      text: sentence,
      score: Number(score.toFixed(4)),
    };
  });

  // Select top N by score, then sort back into original reading order
  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, maxSentences))
    .sort((a, b) => a.sentenceIndex - b.sentenceIndex);

  return top;
}
