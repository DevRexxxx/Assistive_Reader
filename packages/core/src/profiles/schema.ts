/**
 * Declarative Reading Profiles & Calibration Rules
 * Pure TypeScript — zero DOM, zero chrome.*, zero network.
 */

export type BuiltInProfileId = 'adhd' | 'dyslexia' | 'autism';
export type ProfileOverlay = 'none' | 'yellow' | 'blue' | 'pink' | 'green' | 'peach' | 'aqua';
export type ProfileContrast = 'normal' | 'high' | 'inverted';
export type ProfileFontFamily = 'system' | 'inter' | 'opendyslexic' | 'serif' | 'mono';

export interface Profile {
  id: string;
  name: string;
  description: string;
  emoji: string;
  isBuiltIn: boolean;
  fontFamily: ProfileFontFamily;
  fontScale: number;          // multiplier e.g. 1.0 = 18px base
  lineHeight: number;         // 1.2 - 3.0
  letterSpacing: number;      // em, 0 - 0.25
  wordSpacing: number;        // em, 0 - 0.4
  maxLineWidthCh: number;     // characters per line, 45 - 90
  background: string;         // hex color or 'inherit'
  textColor: string;          // hex color or 'inherit'
  dimLevel: number;           // 0 (no dim) to 0.85 (adhd dim unfocused blocks)
  disableAnimations: boolean;
  saturation: number;         // 0 - 200 (100 = normal)
  overlay: ProfileOverlay;
  contrast: ProfileContrast;
  hideDistractions: boolean;
}

export const BUILT_IN_PROFILES: Record<BuiltInProfileId, Profile> = {
  adhd: {
    id: 'adhd',
    name: 'ADHD Focus Mode',
    description: 'Hides distractions, dims inactive paragraphs and highlights the block you focus on.',
    emoji: '🎯',
    isBuiltIn: true,
    fontFamily: 'inter',
    fontScale: 1.0,
    lineHeight: 1.75,
    letterSpacing: 0.01,
    wordSpacing: 0.04,
    maxLineWidthCh: 65,
    background: '#ffffff',
    textColor: '#0f172a',
    dimLevel: 0.7,
    disableAnimations: false,
    saturation: 100,
    overlay: 'none',
    contrast: 'normal',
    hideDistractions: true,
  },
  dyslexia: {
    id: 'dyslexia',
    name: 'Dyslexia Read Mode',
    description: 'OpenDyslexic typeface, warm cream paper tint, and generous letter & line spacing.',
    emoji: '📖',
    isBuiltIn: true,
    fontFamily: 'opendyslexic',
    fontScale: 1.1,
    lineHeight: 2.0,
    letterSpacing: 0.12,
    wordSpacing: 0.2,
    maxLineWidthCh: 60,
    background: '#fdfbf7',
    textColor: '#1a1a1a',
    dimLevel: 0,
    disableAnimations: false,
    saturation: 95,
    overlay: 'none',
    contrast: 'normal',
    hideDistractions: false,
  },
  autism: {
    id: 'autism',
    name: 'Autism Calm Mode',
    description: 'Stops motion and animations, softens visual saturation, and uses a calm palette.',
    emoji: '🧘',
    isBuiltIn: true,
    fontFamily: 'inter',
    fontScale: 1.0,
    lineHeight: 1.8,
    letterSpacing: 0.02,
    wordSpacing: 0.05,
    maxLineWidthCh: 68,
    background: '#f5f7fa',
    textColor: '#1e293b',
    dimLevel: 0,
    disableAnimations: true,
    saturation: 60,
    overlay: 'none',
    contrast: 'normal',
    hideDistractions: true,
  },
};

const VALID_FONTS: ProfileFontFamily[] = ['system', 'inter', 'opendyslexic', 'serif', 'mono'];
const VALID_OVERLAYS: ProfileOverlay[] = ['none', 'yellow', 'blue', 'pink', 'green', 'peach', 'aqua'];
const VALID_CONTRASTS: ProfileContrast[] = ['normal', 'high', 'inverted'];

export interface ProfileValidationResult {
  valid: boolean;
  errors: string[];
  profile?: Profile;
}

export function validateProfile(input: unknown): ProfileValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Profile must be a non-null object.'] };
  }

  const p = input as Record<string, unknown>;

  if (typeof p.id !== 'string' || p.id.trim().length === 0) errors.push('id must be a non-empty string.');
  if (typeof p.name !== 'string' || p.name.trim().length === 0) errors.push('name must be a non-empty string.');
  if (typeof p.description !== 'string') errors.push('description must be a string.');
  if (typeof p.emoji !== 'string' || p.emoji.trim().length === 0) errors.push('emoji must be a non-empty string.');
  if (typeof p.isBuiltIn !== 'boolean') errors.push('isBuiltIn must be a boolean.');

  if (!VALID_FONTS.includes(p.fontFamily as ProfileFontFamily)) {
    errors.push(`fontFamily must be one of: ${VALID_FONTS.join(', ')}.`);
  }
  if (typeof p.fontScale !== 'number' || p.fontScale < 0.7 || p.fontScale > 2.2) {
    errors.push('fontScale must be a number between 0.7 and 2.2.');
  }
  if (typeof p.lineHeight !== 'number' || p.lineHeight < 1.1 || p.lineHeight > 3.5) {
    errors.push('lineHeight must be a number between 1.1 and 3.5.');
  }
  if (typeof p.letterSpacing !== 'number' || p.letterSpacing < 0 || p.letterSpacing > 0.4) {
    errors.push('letterSpacing must be a number between 0 and 0.4.');
  }
  if (typeof p.wordSpacing !== 'number' || p.wordSpacing < 0 || p.wordSpacing > 0.6) {
    errors.push('wordSpacing must be a number between 0 and 0.6.');
  }
  if (typeof p.maxLineWidthCh !== 'number' || p.maxLineWidthCh < 35 || p.maxLineWidthCh > 110) {
    errors.push('maxLineWidthCh must be a number between 35 and 110.');
  }
  if (typeof p.background !== 'string' || p.background.trim().length === 0) {
    errors.push('background must be a color string.');
  }
  if (typeof p.textColor !== 'string' || p.textColor.trim().length === 0) {
    errors.push('textColor must be a color string.');
  }
  if (typeof p.dimLevel !== 'number' || p.dimLevel < 0 || p.dimLevel > 0.9) {
    errors.push('dimLevel must be a number between 0 and 0.9.');
  }
  if (typeof p.disableAnimations !== 'boolean') errors.push('disableAnimations must be a boolean.');
  if (typeof p.saturation !== 'number' || p.saturation < 0 || p.saturation > 200) {
    errors.push('saturation must be a number between 0 and 200.');
  }
  if (!VALID_OVERLAYS.includes(p.overlay as ProfileOverlay)) {
    errors.push(`overlay must be one of: ${VALID_OVERLAYS.join(', ')}.`);
  }
  if (!VALID_CONTRASTS.includes(p.contrast as ProfileContrast)) {
    errors.push(`contrast must be one of: ${VALID_CONTRASTS.join(', ')}.`);
  }
  if (typeof p.hideDistractions !== 'boolean') errors.push('hideDistractions must be a boolean.');

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    profile: p as unknown as Profile,
  };
}

// ─── Calibration Wizard (Deterministic Rule Mapping, No ML) ──────────────────

export interface CalibrationChoices {
  fontPreference: 'inter' | 'opendyslexic' | 'serif';
  spacingPreference: 'compact' | 'balanced' | 'airy';
  surfacePreference: 'crisp' | 'cream' | 'calm-dark';
  lineWidthPreference: 'narrow' | 'medium' | 'wide';
}

export function buildCalibratedProfile(choices: CalibrationChoices, customName: string): Profile {
  const safeName = customName.trim() || 'My Comfort Profile';
  const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';

  const spacingMap: Record<CalibrationChoices['spacingPreference'], { lineHeight: number; letterSpacing: number; wordSpacing: number; fontScale: number }> = {
    compact:  { lineHeight: 1.5, letterSpacing: 0.0,  wordSpacing: 0.02, fontScale: 0.95 },
    balanced: { lineHeight: 1.8, letterSpacing: 0.04, wordSpacing: 0.08, fontScale: 1.05 },
    airy:     { lineHeight: 2.2, letterSpacing: 0.12, wordSpacing: 0.20, fontScale: 1.15 },
  };

  const surfaceMap: Record<CalibrationChoices['surfacePreference'], { background: string; textColor: string; saturation: number; overlay: ProfileOverlay; contrast: ProfileContrast }> = {
    crisp:       { background: '#ffffff', textColor: '#0f172a', saturation: 100, overlay: 'none', contrast: 'normal' },
    cream:       { background: '#fdfbf7', textColor: '#1f2937', saturation: 92,  overlay: 'yellow', contrast: 'normal' },
    'calm-dark': { background: '#111827', textColor: '#f1f5f9', saturation: 80,  overlay: 'none', contrast: 'normal' },
  };

  const widthMap: Record<CalibrationChoices['lineWidthPreference'], number> = {
    narrow: 50,
    medium: 65,
    wide: 82,
  };

  const spacing = spacingMap[choices.spacingPreference];
  const surface = surfaceMap[choices.surfacePreference];

  return {
    id: `custom-${slug}-${Date.now().toString(36)}`,
    name: safeName,
    description: `Calibrated: ${choices.fontPreference} font, ${choices.spacingPreference} spacing, ${choices.surfacePreference} surface, ${choices.lineWidthPreference} column.`,
    emoji: '✨',
    isBuiltIn: false,
    fontFamily: choices.fontPreference,
    fontScale: spacing.fontScale,
    lineHeight: spacing.lineHeight,
    letterSpacing: spacing.letterSpacing,
    wordSpacing: spacing.wordSpacing,
    maxLineWidthCh: widthMap[choices.lineWidthPreference],
    background: surface.background,
    textColor: surface.textColor,
    dimLevel: 0,
    disableAnimations: choices.surfacePreference === 'calm-dark',
    saturation: surface.saturation,
    overlay: surface.overlay,
    contrast: surface.contrast,
    hideDistractions: false,
  };
}
