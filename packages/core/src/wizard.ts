/**
 * Calibration Wizard State Machine & Deterministic Profile Builder
 * Pure TypeScript — zero DOM, zero chrome.*, zero network.
 */

import { OVERLAY_COLORS } from './color/index';
import {
  validateProfile,
  type Profile,
  type ProfileContrast,
  type ProfileFontFamily,
  type ProfileOverlay,
} from './profiles/schema';

export type WizardStepId = 'font' | 'spacing' | 'color' | 'review';
export type WizardFontPreference = Exclude<ProfileFontFamily, 'system'>;
export type WizardSpacingPreference = 'compact' | 'balanced' | 'airy';
export type WizardSurfacePreference = 'crisp' | 'cream' | 'soft-mint' | 'calm-dark';
export type WizardLineWidthPreference = 'narrow' | 'medium' | 'wide';
export type WcagContrastLevel = 'AAA' | 'AA' | 'Below AA';

export interface WizardChoices {
  fontPreference: WizardFontPreference;
  spacingPreference: WizardSpacingPreference;
  surfacePreference: WizardSurfacePreference;
  overlayPreference: ProfileOverlay;
  lineWidthPreference: WizardLineWidthPreference;
  fontScaleOverride: number | null;
  lineHeightOverride: number | null;
  letterSpacingOverride: number | null;
  disableAnimations: boolean;
}

export interface WizardState {
  currentStepIndex: number;
  stepsCompleted: Record<WizardStepId, boolean>;
  choices: WizardChoices;
  profileName: string;
  sampleText: string;
  isSaved: boolean;
  validationErrors: string[];
}

export interface WizardOptionDescriptor<T extends string = string> {
  id: T;
  label: string;
  description: string;
  previewStyle: {
    fontFamily?: WizardFontPreference;
    fontScale?: number;
    lineHeight?: number;
    letterSpacingEm?: number;
    wordSpacingEm?: number;
    background?: string;
    textColor?: string;
    maxLineWidthCh?: number;
  };
}

export interface WizardStepDescriptor {
  id: WizardStepId;
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  announcement: string;
  choiceKey: 'fontPreference' | 'spacingPreference' | 'surfacePreference' | 'lineWidthPreference';
  selectedValue: string;
  options: WizardOptionDescriptor[];
}

export interface WizardPreviewMetrics {
  fontFamily: WizardFontPreference;
  fontScale: number;
  fontSizePx: number;
  lineHeight: number;
  letterSpacingEm: number;
  wordSpacingEm: number;
  maxLineWidthCh: number;
  background: string;
  textColor: string;
  overlay: ProfileOverlay;
  overlayRgba: string | null;
  saturation: number;
  disableAnimations: boolean;
  contrast: ProfileContrast;
  contrastRatio: number;
  wcagContrastLevel: WcagContrastLevel;
}

export const DEFAULT_WIZARD_SAMPLE_TEXT =
  'Reading feels calmer when spacing, typeface, and contrast match how your eyes naturally track across each line.';

export const WIZARD_SAMPLE_PASSAGES: ReadonlyArray<{ id: string; label: string; text: string }> = [
  {
    id: 'tracking',
    label: 'Line Tracking',
    text: DEFAULT_WIZARD_SAMPLE_TEXT,
  },
  {
    id: 'confusables',
    label: 'Letter Distinction',
    text: 'Bright paper bags held crisp baked bread beside quiet pebble paths and dappled ponds.',
  },
  {
    id: 'technical',
    label: 'Dense Science',
    text: 'Consistent line spacing reduces visual crowding and supports steady phonological decoding across complex paragraphs.',
  },
];

export const DEFAULT_WIZARD_CHOICES: WizardChoices = {
  fontPreference: 'inter',
  spacingPreference: 'balanced',
  surfacePreference: 'crisp',
  overlayPreference: 'none',
  lineWidthPreference: 'medium',
  fontScaleOverride: null,
  lineHeightOverride: null,
  letterSpacingOverride: null,
  disableAnimations: false,
};

const SPACING_PRESETS: Record<
  WizardSpacingPreference,
  { label: string; description: string; lineHeight: number; letterSpacing: number; wordSpacing: number; fontScale: number }
> = {
  compact: {
    label: 'Compact',
    description: 'Tighter vertical rhythm with standard letter spacing.',
    lineHeight: 1.5,
    letterSpacing: 0.0,
    wordSpacing: 0.02,
    fontScale: 0.95,
  },
  balanced: {
    label: 'Balanced',
    description: 'Comfortable everyday spacing for steady scanning.',
    lineHeight: 1.8,
    letterSpacing: 0.04,
    wordSpacing: 0.08,
    fontScale: 1.05,
  },
  airy: {
    label: 'Airy & Wide',
    description: 'Generous line height and wider letter spacing to ease crowding.',
    lineHeight: 2.2,
    letterSpacing: 0.12,
    wordSpacing: 0.2,
    fontScale: 1.15,
  },
};

const SURFACE_PRESETS: Record<
  WizardSurfacePreference,
  {
    label: string;
    description: string;
    background: string;
    textColor: string;
    saturation: number;
    defaultOverlay: ProfileOverlay;
    contrast: ProfileContrast;
    disableAnimations: boolean;
  }
> = {
  crisp: {
    label: 'Crisp White',
    description: 'Clean high-contrast neutral white page.',
    background: '#ffffff',
    textColor: '#0f172a',
    saturation: 100,
    defaultOverlay: 'none',
    contrast: 'normal',
    disableAnimations: false,
  },
  cream: {
    label: 'Warm Cream Paper',
    description: 'Soft ivory warmth that cuts harsh blue-white screen glare.',
    background: '#fdfbf7',
    textColor: '#1f2937',
    saturation: 92,
    defaultOverlay: 'yellow',
    contrast: 'normal',
    disableAnimations: false,
  },
  'soft-mint': {
    label: 'Soft Sage Calm',
    description: 'Low-glare pale mint surface with gentler color saturation.',
    background: '#f2f7f4',
    textColor: '#132a1e',
    saturation: 78,
    defaultOverlay: 'none',
    contrast: 'normal',
    disableAnimations: true,
  },
  'calm-dark': {
    label: 'Calm Slate Dark',
    description: 'Deep matte slate surface with reduced motion and soft contrast.',
    background: '#111827',
    textColor: '#f1f5f9',
    saturation: 80,
    defaultOverlay: 'none',
    contrast: 'normal',
    disableAnimations: true,
  },
};

const LINE_WIDTH_PRESETS: Record<WizardLineWidthPreference, { label: string; description: string; ch: number }> = {
  narrow: {
    label: 'Focused Column (~50 chars)',
    description: 'Short horizontal sweep helps prevent skipping lines on return.',
    ch: 50,
  },
  medium: {
    label: 'Balanced Column (~65 chars)',
    description: 'Classic readable book measure for sustained reading.',
    ch: 65,
  },
  wide: {
    label: 'Wide Column (~82 chars)',
    description: 'Fewer line wraps for larger monitors or dense technical notes.',
    ch: 82,
  },
};

const FONT_PRESETS: Record<WizardFontPreference, { label: string; description: string }> = {
  inter: {
    label: 'Clean Sans (Inter)',
    description: 'Open-aperture sans-serif designed for crisp screen legibility.',
  },
  opendyslexic: {
    label: 'Weighted Base (OpenDyslexic)',
    description: 'Bottom-weighted letterforms built as an option to reduce visual flipping.',
  },
  serif: {
    label: 'Editorial Serif (Georgia)',
    description: 'Traditional serif strokes that distinguish similar vertical stems.',
  },
  mono: {
    label: 'Fixed-Width Mono',
    description: 'Equal character widths for predictable rhythmic eye tracking.',
  },
};

const STEP_IDS: readonly WizardStepId[] = ['font', 'spacing', 'color', 'review'];

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function parseHexColor(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(normalized)) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return [r, g, b];
  }
  if (/^[0-9a-f]{6}$/i.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Deterministic WCAG 2.2 relative luminance contrast ratio (1.0 - 21.0).
 */
export function computeWcagContrastRatio(fgHex: string, bgHex: string): number {
  const fg = parseHexColor(fgHex);
  const bg = parseHexColor(bgHex);
  if (!fg || !bg) return 1;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export function classifyWcagContrast(ratio: number): WcagContrastLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Below AA';
}

export function createInitialWizardState(
  seedChoices?: Partial<WizardChoices>,
  initialName = 'My Comfort Profile'
): WizardState {
  const surfacePref = seedChoices?.surfacePreference ?? DEFAULT_WIZARD_CHOICES.surfacePreference;
  const surface = SURFACE_PRESETS[surfacePref] ?? SURFACE_PRESETS.crisp;

  const choices: WizardChoices = {
    ...DEFAULT_WIZARD_CHOICES,
    overlayPreference: surface.defaultOverlay,
    disableAnimations: surface.disableAnimations,
    ...seedChoices,
  };

  return {
    currentStepIndex: 0,
    stepsCompleted: {
      font: false,
      spacing: false,
      color: false,
      review: false,
    },
    choices,
    profileName: initialName,
    sampleText: DEFAULT_WIZARD_SAMPLE_TEXT,
    isSaved: false,
    validationErrors: [],
  };
}

export function getWizardSteps(state: WizardState): WizardStepDescriptor[] {
  const totalSteps = STEP_IDS.length;
  return [
    {
      id: 'font',
      stepNumber: 1,
      totalSteps,
      title: 'Step 1 of 4: Pick the easiest typeface to scan',
      subtitle: 'Choose the typeface where individual letter shapes stand apart clearly.',
      announcement: 'Step 1 of 4: Typeface selection',
      choiceKey: 'fontPreference',
      selectedValue: state.choices.fontPreference,
      options: (Object.keys(FONT_PRESETS) as WizardFontPreference[]).map((id) => ({
        id,
        label: FONT_PRESETS[id].label,
        description: FONT_PRESETS[id].description,
        previewStyle: { fontFamily: id },
      })),
    },
    {
      id: 'spacing',
      stepNumber: 2,
      totalSteps,
      title: 'Step 2 of 4: Test line & letter spacing',
      subtitle: 'Compare breathing room between lines and fine-tune text size if needed.',
      announcement: 'Step 2 of 4: Spacing and text size',
      choiceKey: 'spacingPreference',
      selectedValue: state.choices.spacingPreference,
      options: (Object.keys(SPACING_PRESETS) as WizardSpacingPreference[]).map((id) => ({
        id,
        label: SPACING_PRESETS[id].label,
        description: SPACING_PRESETS[id].description,
        previewStyle: {
          fontScale: SPACING_PRESETS[id].fontScale,
          lineHeight: SPACING_PRESETS[id].lineHeight,
          letterSpacingEm: SPACING_PRESETS[id].letterSpacing,
          wordSpacingEm: SPACING_PRESETS[id].wordSpacing,
        },
      })),
    },
    {
      id: 'color',
      stepNumber: 3,
      totalSteps,
      title: 'Step 3 of 4: Choose page surface, contrast & tint',
      subtitle: 'Pick the background warmth and optional soft tint overlay with the least glare.',
      announcement: 'Step 3 of 4: Surface color, contrast, and tint',
      choiceKey: 'surfacePreference',
      selectedValue: state.choices.surfacePreference,
      options: (Object.keys(SURFACE_PRESETS) as WizardSurfacePreference[]).map((id) => ({
        id,
        label: SURFACE_PRESETS[id].label,
        description: SURFACE_PRESETS[id].description,
        previewStyle: {
          background: SURFACE_PRESETS[id].background,
          textColor: SURFACE_PRESETS[id].textColor,
        },
      })),
    },
    {
      id: 'review',
      stepNumber: 4,
      totalSteps,
      title: 'Step 4 of 4: Pick column width, review & save',
      subtitle: 'Test your combined settings together, choose a comfortable line width, and save.',
      announcement: 'Step 4 of 4: Line width, live review, and save profile',
      choiceKey: 'lineWidthPreference',
      selectedValue: state.choices.lineWidthPreference,
      options: (Object.keys(LINE_WIDTH_PRESETS) as WizardLineWidthPreference[]).map((id) => ({
        id,
        label: LINE_WIDTH_PRESETS[id].label,
        description: LINE_WIDTH_PRESETS[id].description,
        previewStyle: {
          maxLineWidthCh: LINE_WIDTH_PRESETS[id].ch,
        },
      })),
    },
  ];
}

export function getCurrentWizardStep(state: WizardState): WizardStepDescriptor {
  const steps = getWizardSteps(state);
  const idx = clamp(Math.floor(state.currentStepIndex), 0, steps.length - 1);
  return steps[idx];
}

export function selectWizardOption<K extends keyof WizardChoices>(
  state: WizardState,
  key: K,
  value: WizardChoices[K]
): WizardState {
  const nextChoices: WizardChoices = {
    ...state.choices,
    [key]: value,
  };

  // When changing spacing preset, reset manual spacing/scale overrides so preset applies cleanly
  if (key === 'spacingPreference') {
    nextChoices.fontScaleOverride = null;
    nextChoices.lineHeightOverride = null;
    nextChoices.letterSpacingOverride = null;
  }

  // Clamp fine-tune numeric overrides within Profile schema bounds
  if (key === 'fontScaleOverride' && typeof value === 'number') {
    nextChoices.fontScaleOverride = Math.round(clamp(value, 0.75, 2.0) * 100) / 100;
  }
  if (key === 'lineHeightOverride' && typeof value === 'number') {
    nextChoices.lineHeightOverride = Math.round(clamp(value, 1.2, 3.0) * 100) / 100;
  }
  if (key === 'letterSpacingOverride' && typeof value === 'number') {
    nextChoices.letterSpacingOverride = Math.round(clamp(value, 0, 0.25) * 1000) / 1000;
  }

  // When switching surface preset, sync recommended overlay & motion default unless explicitly overridden later
  if (key === 'surfacePreference') {
    const surface = SURFACE_PRESETS[value as WizardSurfacePreference];
    if (surface) {
      nextChoices.overlayPreference = surface.defaultOverlay;
      nextChoices.disableAnimations = surface.disableAnimations;
    }
  }

  return {
    ...state,
    choices: nextChoices,
    isSaved: false,
    validationErrors: [],
  };
}

export function setWizardProfileName(state: WizardState, name: string): WizardState {
  return {
    ...state,
    profileName: name,
    isSaved: false,
    validationErrors: [],
  };
}

export function setWizardSampleText(state: WizardState, text: string): WizardState {
  return {
    ...state,
    sampleText: text,
  };
}

export function nextWizardStep(state: WizardState): WizardState {
  const currentId = STEP_IDS[clamp(state.currentStepIndex, 0, STEP_IDS.length - 1)];
  const nextIndex = clamp(state.currentStepIndex + 1, 0, STEP_IDS.length - 1);
  return {
    ...state,
    currentStepIndex: nextIndex,
    stepsCompleted: {
      ...state.stepsCompleted,
      [currentId]: true,
    },
  };
}

export function prevWizardStep(state: WizardState): WizardState {
  return {
    ...state,
    currentStepIndex: clamp(state.currentStepIndex - 1, 0, STEP_IDS.length - 1),
  };
}

export function goToWizardStep(state: WizardState, stepIndex: number): WizardState {
  return {
    ...state,
    currentStepIndex: clamp(Math.floor(stepIndex), 0, STEP_IDS.length - 1),
  };
}

export function resetWizardState(seedChoices?: Partial<WizardChoices>): WizardState {
  return createInitialWizardState(seedChoices);
}

export function getWizardPreviewMetrics(state: WizardState): WizardPreviewMetrics {
  const spacing = SPACING_PRESETS[state.choices.spacingPreference] ?? SPACING_PRESETS.balanced;
  const surface = SURFACE_PRESETS[state.choices.surfacePreference] ?? SURFACE_PRESETS.crisp;
  const width = LINE_WIDTH_PRESETS[state.choices.lineWidthPreference] ?? LINE_WIDTH_PRESETS.medium;

  const fontScale = state.choices.fontScaleOverride ?? spacing.fontScale;
  const lineHeight = state.choices.lineHeightOverride ?? spacing.lineHeight;
  const letterSpacingEm = state.choices.letterSpacingOverride ?? spacing.letterSpacing;
  const overlay = state.choices.overlayPreference;
  const overlayRgba = overlay !== 'none' ? OVERLAY_COLORS[overlay]?.rgba ?? null : null;

  const contrastRatio = computeWcagContrastRatio(surface.textColor, surface.background);

  return {
    fontFamily: state.choices.fontPreference,
    fontScale,
    fontSizePx: Math.round(18 * fontScale),
    lineHeight,
    letterSpacingEm,
    wordSpacingEm: spacing.wordSpacing,
    maxLineWidthCh: width.ch,
    background: surface.background,
    textColor: surface.textColor,
    overlay,
    overlayRgba,
    saturation: surface.saturation,
    disableAnimations: state.choices.disableAnimations,
    contrast: surface.contrast,
    contrastRatio,
    wcagContrastLevel: classifyWcagContrast(contrastRatio),
  };
}

export function buildWizardPreviewProfile(state: WizardState, timestampMs = Date.now()): Profile {
  const metrics = getWizardPreviewMetrics(state);
  const safeName = state.profileName.trim() || 'My Comfort Profile';
  const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';

  return {
    id: `custom-${slug}-${timestampMs.toString(36)}`,
    name: safeName,
    description: `Calibrated: ${metrics.fontFamily} font, ${state.choices.spacingPreference} spacing (${metrics.fontSizePx}px), ${state.choices.surfacePreference} surface, ${state.choices.lineWidthPreference} column.`,
    emoji: '✨',
    isBuiltIn: false,
    fontFamily: metrics.fontFamily,
    fontScale: metrics.fontScale,
    lineHeight: metrics.lineHeight,
    letterSpacing: metrics.letterSpacingEm,
    wordSpacing: metrics.wordSpacingEm,
    maxLineWidthCh: metrics.maxLineWidthCh,
    background: metrics.background,
    textColor: metrics.textColor,
    dimLevel: 0,
    disableAnimations: metrics.disableAnimations,
    saturation: metrics.saturation,
    overlay: metrics.overlay,
    contrast: metrics.contrast,
    hideDistractions: false,
  };
}

export function finalizeWizardProfile(
  state: WizardState,
  timestampMs = Date.now()
): { valid: boolean; profile?: Profile; errors: string[]; nextState: WizardState } {
  const candidate = buildWizardPreviewProfile(state, timestampMs);
  const validation = validateProfile(candidate);

  if (!validation.valid || !validation.profile) {
    return {
      valid: false,
      errors: validation.errors,
      nextState: {
        ...state,
        isSaved: false,
        validationErrors: validation.errors,
      },
    };
  }

  return {
    valid: true,
    profile: validation.profile,
    errors: [],
    nextState: {
      ...state,
      isSaved: true,
      validationErrors: [],
      stepsCompleted: {
        font: true,
        spacing: true,
        color: true,
        review: true,
      },
    },
  };
}
