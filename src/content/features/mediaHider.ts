/**
 * Media Hider (v3 — Persistent + Dynamic)
 *
 * Blurs/grays all images and videos until hovered.
 * Reduces sensory overload for Autism / ADHD users.
 *
 * v3 improvements:
 *  - MutationObserver watches for dynamically loaded media (ads, lazy images)
 *  - Auto-wraps new media elements as they appear
 *  - Persists across page refreshes via chrome.storage auto-apply
 */

const MEDIA_HIDE_STYLE_ID = 'ar-media-hider';

const MEDIA_HIDE_CSS = `
/* Hide media with blur + gray — reveal on hover */
img:not([id*="ar-"]):not(.ar-fab-icon),
video,
picture,
figure img,
[class*="thumbnail"],
[class*="ad-"] img,
[class*="ad_"] img,
[id*="ad-"] img,
[id*="ad_"] img,
iframe[src*="ad"],
iframe[src*="doubleclick"],
iframe[src*="googlesyndication"],
svg:not([id*="ar-"]) {
  filter: grayscale(1) brightness(0.6) blur(10px) !important;
  opacity: 0.25 !important;
  transition: filter 0.3s ease, opacity 0.3s ease !important;
}

img:not([id*="ar-"]):not(.ar-fab-icon):hover,
video:hover,
picture:hover,
figure:hover img,
[class*="thumbnail"]:hover,
svg:not([id*="ar-"]):hover {
  filter: none !important;
  opacity: 1 !important;
}

/* Wrapper for media with overlay label */
.ar-media-wrapper {
  position: relative;
  display: inline-block;
}

.ar-media-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(241, 245, 249, 0.9);
  color: #475569;
  font-size: 11px;
  font-family: 'Inter', system-ui, sans-serif;
  padding: 6px 12px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.ar-media-wrapper:hover .ar-media-overlay {
  opacity: 0;
}
`;

let wrappedElements: { el: HTMLElement; parent: HTMLElement; wrapper: HTMLElement }[] = [];
let mediaObserver: MutationObserver | null = null;

function wrapMediaElement(htmlEl: HTMLElement): void {
  // Skip tiny images (likely icons)
  if (htmlEl.offsetWidth < 50 || htmlEl.offsetHeight < 50) return;
  // Skip if already wrapped
  if (htmlEl.parentElement?.classList.contains('ar-media-wrapper')) return;
  // Skip our own UI elements
  if (htmlEl.closest('#ar-quick-menu-container')) return;

  const wrapper = document.createElement('span');
  wrapper.className = 'ar-media-wrapper';

  const overlay = document.createElement('span');
  overlay.className = 'ar-media-overlay';
  overlay.textContent = '🖼️ Hover to reveal';

  const parent = htmlEl.parentElement;
  if (parent) {
    parent.insertBefore(wrapper, htmlEl);
    wrapper.appendChild(htmlEl);
    wrapper.appendChild(overlay);
    wrappedElements.push({ el: htmlEl, parent, wrapper });
  }
}

function wrapAllMedia(): void {
  const mediaEls = document.querySelectorAll('img:not([id*="ar-"]):not(.ar-fab-icon), video');
  mediaEls.forEach(el => {
    const htmlEl = el as HTMLElement;
    wrapMediaElement(htmlEl);
  });
}

function startMediaObserver(): void {
  if (mediaObserver) return;

  mediaObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        // Check if the added node itself is media
        if (node.matches('img:not([id*="ar-"]):not(.ar-fab-icon), video')) {
          // Delay slightly to let the element get dimensions
          setTimeout(() => wrapMediaElement(node), 100);
        }

        // Check children of the added node for media
        const childMedia = node.querySelectorAll('img:not([id*="ar-"]):not(.ar-fab-icon), video');
        childMedia.forEach(child => {
          setTimeout(() => wrapMediaElement(child as HTMLElement), 100);
        });
      }
    }
  });

  mediaObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function stopMediaObserver(): void {
  if (mediaObserver) {
    mediaObserver.disconnect();
    mediaObserver = null;
  }
}

export function enableMediaHider(): void {
  if (document.getElementById(MEDIA_HIDE_STYLE_ID)) return;

  // Inject CSS
  const style = document.createElement('style');
  style.id = MEDIA_HIDE_STYLE_ID;
  style.textContent = MEDIA_HIDE_CSS;
  (document.head || document.documentElement).appendChild(style);

  // Wrap visible images/videos with overlay labels
  wrappedElements = [];
  wrapAllMedia();

  // Start watching for dynamically added media (ads, lazy-loaded images, etc.)
  startMediaObserver();
}

export function disableMediaHider(): void {
  // Stop watching for new media
  stopMediaObserver();

  // Remove CSS
  const style = document.getElementById(MEDIA_HIDE_STYLE_ID);
  if (style) style.remove();

  // Unwrap elements
  for (const { el, parent, wrapper } of wrappedElements) {
    try {
      if (wrapper.parentElement) {
        wrapper.parentElement.insertBefore(el, wrapper);
        wrapper.remove();
      }
    } catch {
      // DOM may have changed
    }
  }
  wrappedElements = [];
}
