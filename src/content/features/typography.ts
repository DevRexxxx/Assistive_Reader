/**
 * Custom Typography Controls (v2 — Fixed)
 *
 * Allows granular control of font-size, line-height, letter-spacing,
 * and contrast via injected CSS.
 *
 * Fix: Heading sizes now use separate rules with higher specificity
 *      to avoid !important conflicts with the base rule.
 */

const TYPO_STYLE_ID = 'ar-typography';

export interface TypographySettings {
  fontSize: number;       // px (14-32)
  lineHeight: number;     // multiplier (1.2-3.0)
  letterSpacing: number;  // em (0-0.2)
  contrast: 'normal' | 'high' | 'inverted';
}

const CONTRAST_MAP: Record<string, string> = {
  normal: '',
  high: `
    body { background: #ffffff !important; color: #000000 !important; }
    p, span, li, td, th, a, label, blockquote, div {
      color: #000000 !important;
    }
    a { color: #0000cc !important; text-decoration: underline !important; }
  `,
  inverted: `
    html { filter: invert(1) hue-rotate(180deg) !important; }
    img, video, picture, canvas, svg, [style*="background-image"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }
  `,
};

export function applyTypography(settings: TypographySettings): void {
  removeTypography();
  const style = document.createElement('style');
  style.id = TYPO_STYLE_ID;

  const baseFontSize = settings.fontSize;

  style.textContent = `
    /* Base typography */
    body, p, span, li, td, th, a, label, blockquote, div {
      line-height: ${settings.lineHeight} !important;
      letter-spacing: ${settings.letterSpacing}em !important;
    }

    /* Body text size */
    p, span, li, td, th, a, label, blockquote, div {
      font-size: ${baseFontSize}px !important;
    }

    /* Heading hierarchy — separate rules to avoid specificity conflicts */
    h1 { font-size: ${Math.round(baseFontSize * 2.0)}px !important; line-height: ${settings.lineHeight} !important; letter-spacing: ${settings.letterSpacing}em !important; }
    h2 { font-size: ${Math.round(baseFontSize * 1.6)}px !important; line-height: ${settings.lineHeight} !important; letter-spacing: ${settings.letterSpacing}em !important; }
    h3 { font-size: ${Math.round(baseFontSize * 1.35)}px !important; line-height: ${settings.lineHeight} !important; letter-spacing: ${settings.letterSpacing}em !important; }
    h4 { font-size: ${Math.round(baseFontSize * 1.15)}px !important; line-height: ${settings.lineHeight} !important; letter-spacing: ${settings.letterSpacing}em !important; }
    h5 { font-size: ${Math.round(baseFontSize * 1.05)}px !important; line-height: ${settings.lineHeight} !important; letter-spacing: ${settings.letterSpacing}em !important; }
    h6 { font-size: ${baseFontSize}px !important; line-height: ${settings.lineHeight} !important; letter-spacing: ${settings.letterSpacing}em !important; }

    /* Contrast mode */
    ${CONTRAST_MAP[settings.contrast] || ''}
  `;

  (document.head || document.documentElement).appendChild(style);
}

export function removeTypography(): void {
  const style = document.getElementById(TYPO_STYLE_ID);
  if (style) style.remove();
}
