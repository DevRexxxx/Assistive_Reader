/**
 * Color Vision Accessibility (v2)
 *
 * Provides:
 *  - Dark Mode (force dark on any page)
 *  - Color Vision Deficiency (CVD) correction filters
 *  - Color overlays / tints for reading comfort
 *  - Saturation control
 *
 * Uses a unified CSS filter approach to prevent filter overwrites.
 */

export type CVDType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type OverlayColor = 'none' | 'yellow' | 'blue' | 'pink' | 'green' | 'peach' | 'aqua';

const COLOR_STYLE_ID = 'ar-unified-color-style';
const OVERLAY_ID = 'ar-color-overlay';
const SVG_FILTER_ID = 'ar-svg-filters';

// Unified State
let currentState = {
  darkMode: false,
  cvd: 'none' as CVDType,
  saturation: 100,
};

// Color correction matrices
const CVD_MATRICES: Record<string, string> = {
  protanopia: `
    0.567, 0.433, 0,     0, 0
    0.558, 0.442, 0,     0, 0
    0,     0.242, 0.758, 0, 0
    0,     0,     0,     1, 0
  `,
  deuteranopia: `
    0.625, 0.375, 0,     0, 0
    0.7,   0.3,   0,     0, 0
    0,     0.3,   0.7,   0, 0
    0,     0,     0,     1, 0
  `,
  tritanopia: `
    0.95, 0.05,  0,     0, 0
    0,    0.433, 0.567, 0, 0
    0,    0.475, 0.525, 0, 0
    0,    0,     0,     1, 0
  `,
};

function ensureSVGFilters(): void {
  if (document.getElementById(SVG_FILTER_ID)) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('id', SVG_FILTER_ID);
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS(svgNS, 'defs');

  for (const [name, matrix] of Object.entries(CVD_MATRICES)) {
    const filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', `ar-cvd-${name}`);

    const feMatrix = document.createElementNS(svgNS, 'feColorMatrix');
    feMatrix.setAttribute('type', 'matrix');
    feMatrix.setAttribute('values', matrix.trim());

    filter.appendChild(feMatrix);
    defs.appendChild(filter);
  }

  svg.appendChild(defs);
  
  if (document.body) {
    document.body.appendChild(svg);
  } else {
    // If running early, append to document.documentElement
    document.documentElement.appendChild(svg);
  }
}

function updateUnifiedStyle() {
  const htmlFilters: string[] = [];
  const mediaFilters: string[] = [];

  if (currentState.darkMode) {
    htmlFilters.push('invert(0.92) hue-rotate(180deg)');
    mediaFilters.push('invert(1) hue-rotate(180deg)');
  }
  
  if (currentState.cvd !== 'none') {
    ensureSVGFilters();
    htmlFilters.push(`url(#ar-cvd-${currentState.cvd})`);
  }
  
  if (currentState.saturation !== 100) {
    htmlFilters.push(`saturate(${currentState.saturation / 100})`);
    mediaFilters.push(`saturate(${100 / Math.max(currentState.saturation, 1)})`);
  }

  const htmlFilterStr = htmlFilters.length > 0 ? htmlFilters.join(' ') : 'none';
  const mediaFilterStr = mediaFilters.length > 0 ? mediaFilters.join(' ') : 'none';

  let css = `
    html {
      filter: ${htmlFilterStr} !important;
      ${currentState.darkMode ? 'background: #111 !important;' : ''}
    }
  `;

  if (currentState.darkMode) {
    css += `
      body {
        background-color: #1a1a2e !important;
      }
    `;
  }

  if (mediaFilters.length > 0) {
    css += `
      img:not([id*="ar-"]), video, picture, canvas, svg:not([id*="ar-"]),
      [style*="background-image"], iframe, embed, object {
        filter: ${mediaFilterStr} !important;
      }
    `;
  }

  let styleEl = document.getElementById(COLOR_STYLE_ID);
  
  if (htmlFilters.length === 0 && mediaFilters.length === 0 && !currentState.darkMode) {
    if (styleEl) styleEl.remove();
    return;
  }

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = COLOR_STYLE_ID;
    (document.head || document.documentElement).appendChild(styleEl);
  }
  styleEl.textContent = css;
}

export function enableDarkMode(): void {
  currentState.darkMode = true;
  updateUnifiedStyle();
}

export function disableDarkMode(): void {
  currentState.darkMode = false;
  updateUnifiedStyle();
}

export function applyCVDFilter(type: CVDType): void {
  currentState.cvd = type;
  updateUnifiedStyle();
}

export function removeCVDFilter(): void {
  currentState.cvd = 'none';
  updateUnifiedStyle();
}

export function applySaturation(level: number): void {
  currentState.saturation = level;
  updateUnifiedStyle();
}

export function removeSaturation(): void {
  currentState.saturation = 100;
  updateUnifiedStyle();
}

// ─── Color Overlay / Tint ────────────────────────────────────────────────────

const OVERLAY_COLORS: Record<string, string> = {
  yellow: 'rgba(255, 253, 208, 0.18)',
  blue:   'rgba(173, 216, 230, 0.15)',
  pink:   'rgba(255, 182, 193, 0.15)',
  green:  'rgba(144, 238, 144, 0.12)',
  peach:  'rgba(255, 218, 185, 0.16)',
  aqua:   'rgba(127, 255, 212, 0.12)',
};

export function applyColorOverlay(color: OverlayColor): void {
  removeColorOverlay();
  if (color === 'none') return;

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: ${OVERLAY_COLORS[color] || 'transparent'};
    z-index: 999997;
    pointer-events: none;
    mix-blend-mode: multiply;
    transition: background 0.3s ease;
  `;
  if (document.body) {
    document.body.appendChild(overlay);
  } else {
    document.documentElement.appendChild(overlay);
  }
}

export function removeColorOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}

export function removeAllColorFilters(): void {
  currentState = { darkMode: false, cvd: 'none', saturation: 100 };
  updateUnifiedStyle();
  removeColorOverlay();
  document.getElementById(SVG_FILTER_ID)?.remove();
}
