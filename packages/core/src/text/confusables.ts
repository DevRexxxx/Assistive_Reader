/**
 * Confusable-Letter Highlighting
 * Pure TypeScript — no DOM, no network.
 *
 * Highlights user-selected visually similar characters (default b/d/p/q)
 * with distinct high-contrast colors to assist visual differentiation.
 */

export interface ConfusableColorRule {
  char: string;
  color: string;
  background: string;
}

export const DEFAULT_CONFUSABLE_RULES: ConfusableColorRule[] = [
  { char: 'b', color: '#1d4ed8', background: 'rgba(219, 234, 254, 0.7)' },
  { char: 'd', color: '#b91c1c', background: 'rgba(254, 226, 226, 0.7)' },
  { char: 'p', color: '#047857', background: 'rgba(209, 250, 229, 0.7)' },
  { char: 'q', color: '#7e22ce', background: 'rgba(243, 232, 255, 0.7)' },
];

export interface ConfusableSegment {
  text: string;
  rule: ConfusableColorRule | null;
}

export function segmentConfusableLetters(
  text: string,
  rules: ConfusableColorRule[] = DEFAULT_CONFUSABLE_RULES
): ConfusableSegment[] {
  if (!text) return [];
  if (rules.length === 0) return [{ text, rule: null }];

  const lookup = new Map<string, ConfusableColorRule>();
  for (const r of rules) {
    if (r.char.length === 1) {
      lookup.set(r.char.toLowerCase(), r);
    }
  }

  const segments: ConfusableSegment[] = [];
  let buffer = '';

  for (const ch of text) {
    const matched = lookup.get(ch.toLowerCase());
    if (matched) {
      if (buffer) {
        segments.push({ text: buffer, rule: null });
        buffer = '';
      }
      segments.push({ text: ch, rule: matched });
    } else {
      buffer += ch;
    }
  }

  if (buffer) {
    segments.push({ text: buffer, rule: null });
  }

  return segments;
}
