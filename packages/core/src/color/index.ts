/**
 * Color Vision Deficiency (CVD) Matrices, Overlays & Saturation Helpers
 * Pure TypeScript — zero DOM, zero chrome.*, zero network.
 */

export type CVDType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type OverlayColor = 'none' | 'yellow' | 'blue' | 'pink' | 'green' | 'peach' | 'aqua';

export interface CVDDefinition {
  type: Exclude<CVDType, 'none'>;
  label: string;
  description: string;
  matrix: readonly number[]; // 20-element 4x5 SVG feColorMatrix
}

export const CVD_MATRICES: Record<Exclude<CVDType, 'none'>, CVDDefinition> = {
  protanopia: {
    type: 'protanopia',
    label: 'Protanopia',
    description: 'Red-weak color perception support',
    matrix: [
      0.567, 0.433, 0,     0, 0,
      0.558, 0.442, 0,     0, 0,
      0,     0.242, 0.758, 0, 0,
      0,     0,     0,     1, 0,
    ],
  },
  deuteranopia: {
    type: 'deuteranopia',
    label: 'Deuteranopia',
    description: 'Green-weak color perception support',
    matrix: [
      0.625, 0.375, 0,   0, 0,
      0.7,   0.3,   0,   0, 0,
      0,     0.3,   0.7, 0, 0,
      0,     0,     0,   1, 0,
    ],
  },
  tritanopia: {
    type: 'tritanopia',
    label: 'Tritanopia',
    description: 'Blue-weak color perception support',
    matrix: [
      0.95, 0.05,  0,     0, 0,
      0,    0.433, 0.567, 0, 0,
      0,    0.475, 0.525, 0, 0,
      0,    0,     0,     1, 0,
    ],
  },
};

export const OVERLAY_COLORS: Record<Exclude<OverlayColor, 'none'>, { label: string; rgba: string; swatchHex: string }> = {
  yellow: { label: 'Yellow', rgba: 'rgba(255, 253, 208, 0.22)', swatchHex: '#fef08a' },
  blue:   { label: 'Blue',   rgba: 'rgba(173, 216, 230, 0.18)', swatchHex: '#bfdbfe' },
  pink:   { label: 'Pink',   rgba: 'rgba(255, 182, 193, 0.18)', swatchHex: '#fbcfe8' },
  green:  { label: 'Green',  rgba: 'rgba(144, 238, 144, 0.15)', swatchHex: '#bbf7d0' },
  peach:  { label: 'Peach',  rgba: 'rgba(255, 218, 185, 0.20)', swatchHex: '#fed7aa' },
  aqua:   { label: 'Aqua',   rgba: 'rgba(127, 255, 212, 0.15)', swatchHex: '#99f6e4' },
};

export function clampSaturation(level: number): number {
  if (!Number.isFinite(level)) return 100;
  return Math.max(0, Math.min(200, Math.round(level)));
}

export function formatMatrixString(matrix: readonly number[]): string {
  return matrix.join(' ');
}

export interface ColorFilterOptions {
  darkMode: boolean;
  cvd: CVDType;
  saturation: number;
}

export function buildCssFilterStrings(opts: ColorFilterOptions): {
  surfaceFilter: string;
  mediaCounterFilter: string;
} {
  const surface: string[] = [];
  const media: string[] = [];

  if (opts.darkMode) {
    surface.push('invert(0.92) hue-rotate(180deg)');
    media.push('invert(1) hue-rotate(180deg)');
  }

  if (opts.cvd !== 'none') {
    surface.push(`url(#ar-cvd-${opts.cvd})`);
  }

  const sat = clampSaturation(opts.saturation);
  if (sat !== 100) {
    surface.push(`saturate(${sat / 100})`);
    media.push(`saturate(${(100 / Math.max(sat, 1)).toFixed(3)})`);
  }

  return {
    surfaceFilter: surface.length > 0 ? surface.join(' ') : 'none',
    mediaCounterFilter: media.length > 0 ? media.join(' ') : 'none',
  };
}
