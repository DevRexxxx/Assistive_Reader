/**
 * Reading Ruler — Line Focus Tool (v2 — Fixed)
 *
 * Creates a horizontal highlight band that follows the cursor,
 * dimming the rest of the page to prevent line-skipping.
 *
 * Fixes:
 *  - Clamped bottom mask height to prevent negative values
 *  - Keyboard arrow support for non-mouse users
 *  - Configurable ruler height
 */

let cleanupFn: (() => void) | null = null;

const RULER_HEIGHT = 100;

export function enableReadingRuler(): void {
  if (cleanupFn) return; // Already active

  const topMask = document.createElement('div');
  const bottomMask = document.createElement('div');
  const rulerLine = document.createElement('div');

  topMask.id = 'ar-ruler-top';
  bottomMask.id = 'ar-ruler-bottom';
  rulerLine.id = 'ar-ruler-line';

  const maskStyle = `
    position: fixed;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 999998;
    pointer-events: none;
    transition: height 0.06s ease-out, top 0.06s ease-out;
  `;

  topMask.style.cssText = maskStyle + 'top: 0; height: 0;';
  bottomMask.style.cssText = maskStyle + 'top: 100vh; height: 0;';

  rulerLine.style.cssText = `
    position: fixed;
    left: 0;
    right: 0;
    height: ${RULER_HEIGHT}px;
    border-top: 2px solid rgba(99, 102, 241, 0.6);
    border-bottom: 2px solid rgba(99, 102, 241, 0.6);
    background: rgba(99, 102, 241, 0.04);
    z-index: 999999;
    pointer-events: none;
    transition: top 0.06s ease-out;
    top: 0;
  `;

  const target = document.body || document.documentElement;
  target.appendChild(topMask);
  target.appendChild(bottomMask);
  target.appendChild(rulerLine);

  let lastY = 0;

  const updatePosition = (y: number) => {
    lastY = y;
    const vh = window.innerHeight;
    const topHeight = Math.max(0, y - RULER_HEIGHT / 2);
    const bottomTop = Math.min(vh, topHeight + RULER_HEIGHT);
    const bottomHeight = Math.max(0, vh - bottomTop);

    topMask.style.height = `${topHeight}px`;
    rulerLine.style.top = `${topHeight}px`;
    bottomMask.style.top = `${bottomTop}px`;
    bottomMask.style.height = `${bottomHeight}px`;
  };

  const trackMouse = (e: MouseEvent) => {
    updatePosition(e.clientY);
  };

  // Also support keyboard (arrow up/down) for accessibility
  const trackKeyboard = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      updatePosition(Math.min(window.innerHeight, lastY + 24));
    } else if (e.key === 'ArrowUp') {
      updatePosition(Math.max(0, lastY - 24));
    }
  };

  document.addEventListener('mousemove', trackMouse);
  document.addEventListener('keydown', trackKeyboard);

  // Initialize at center
  updatePosition(window.innerHeight / 2);

  cleanupFn = () => {
    document.removeEventListener('mousemove', trackMouse);
    document.removeEventListener('keydown', trackKeyboard);
    topMask.remove();
    bottomMask.remove();
    rulerLine.remove();
    cleanupFn = null;
  };
}

export function disableReadingRuler(): void {
  if (cleanupFn) {
    cleanupFn();
  }
}
