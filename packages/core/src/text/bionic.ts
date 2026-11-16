/**
 * Pure Bionic Reading Word Segmentation
 * No DOM, no chrome.*, no network.
 *
 * Bolds the leading fixation anchor (~40% of alphanumeric characters, min 1 char)
 * for words with 3 or more core characters. Leaves whitespace and short words intact.
 */

export interface BionicToken {
  isWhitespace: boolean;
  leadingPunctuation: string;
  bold: string;
  normal: string;
  trailingPunctuation: string;
  raw: string;
}

const WORD_PARTS_REGEX = /^([^A-Za-z0-9\u00C0-\u024F]*)([A-Za-z0-9\u00C0-\u024F'-]+)([^A-Za-z0-9\u00C0-\u024F]*)$/;

export function segmentBionicWord(token: string): BionicToken {
  if (/^\s+$/.test(token) || token.length === 0) {
    return {
      isWhitespace: true,
      leadingPunctuation: '',
      bold: '',
      normal: token,
      trailingPunctuation: '',
      raw: token,
    };
  }

  const match = token.match(WORD_PARTS_REGEX);
  if (!match) {
    return {
      isWhitespace: false,
      leadingPunctuation: '',
      bold: '',
      normal: token,
      trailingPunctuation: '',
      raw: token,
    };
  }

  const [, leadingPunctuation, coreWord, trailingPunctuation] = match;

  if (coreWord.length < 3) {
    return {
      isWhitespace: false,
      leadingPunctuation,
      bold: '',
      normal: coreWord,
      trailingPunctuation,
      raw: token,
    };
  }

  const prefixLength = Math.max(1, Math.ceil(coreWord.length * 0.4));
  return {
    isWhitespace: false,
    leadingPunctuation,
    bold: coreWord.slice(0, prefixLength),
    normal: coreWord.slice(prefixLength),
    trailingPunctuation,
    raw: token,
  };
}

export function segmentBionicText(text: string): BionicToken[] {
  if (!text) return [];
  const parts = text.split(/(\s+)/);
  return parts.filter(p => p.length > 0).map(segmentBionicWord);
}
