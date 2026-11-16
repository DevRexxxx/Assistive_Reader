/**
 * Deterministic Readability Metrics (Flesch-Kincaid, Gunning Fog, SMOG)
 * Pure TypeScript — no DOM, no AI, no network.
 */

import { splitSentences } from './sentences';

export type ReadabilityBand =
  | 'Easy to scan'
  | 'Conversational'
  | 'Standard'
  | 'Detailed'
  | 'Dense';

export interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  complexWordCount: number;
  estimatedReadTimeMinutes: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFogIndex: number;
  smogIndex: number;
  band: ReadabilityBand;
}

export function countWordSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  // Strip silent trailing -e, -es, -ed (unless -le preceded by consonant)
  let processed = clean;
  if (/(?:[^laeiouy]es|ed)$/.test(processed)) {
    processed = processed.replace(/(?:es|ed)$/, '');
  } else if (/[^l]e$/.test(processed)) {
    processed = processed.replace(/e$/, '');
  }

  const vowelGroups = processed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

export function computeReadability(text: string): ReadabilityMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      complexWordCount: 0,
      estimatedReadTimeMinutes: 0,
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      gunningFogIndex: 0,
      smogIndex: 0,
      band: 'Easy to scan',
    };
  }

  const sentences = splitSentences(trimmed);
  const sentenceCount = Math.max(1, sentences.length);
  const words = trimmed.match(/[A-Za-z0-9\u00C0-\u024F'-]+/g) || [];
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      complexWordCount: 0,
      estimatedReadTimeMinutes: 0,
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      gunningFogIndex: 0,
      smogIndex: 0,
      band: 'Easy to scan',
    };
  }

  let syllableCount = 0;
  let complexWordCount = 0;

  for (const w of words) {
    const s = countWordSyllables(w);
    const effectiveSyllables = Math.max(1, s);
    syllableCount += effectiveSyllables;
    if (effectiveSyllables >= 3) {
      complexWordCount += 1;
    }
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;

  const fleschReadingEase = Math.max(
    0,
    Math.min(100, Number((206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord).toFixed(1)))
  );

  const fleschKincaidGrade = Math.max(
    0,
    Number((0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59).toFixed(1))
  );

  const gunningFogIndex = Math.max(
    0,
    Number((0.4 * (wordsPerSentence + 100 * (complexWordCount / wordCount))).toFixed(1))
  );

  const smogIndex = Math.max(
    0,
    Number((1.043 * Math.sqrt(complexWordCount * (30 / sentenceCount)) + 3.1291).toFixed(1))
  );

  let band: ReadabilityBand = 'Standard';
  if (fleschReadingEase >= 80) band = 'Easy to scan';
  else if (fleschReadingEase >= 65) band = 'Conversational';
  else if (fleschReadingEase >= 50) band = 'Standard';
  else if (fleschReadingEase >= 35) band = 'Detailed';
  else band = 'Dense';

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    complexWordCount,
    estimatedReadTimeMinutes: Math.max(1, Math.ceil(wordCount / 220)),
    fleschReadingEase,
    fleschKincaidGrade,
    gunningFogIndex,
    smogIndex,
    band,
  };
}
