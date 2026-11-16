/**
 * Reader View — Clean Article Extraction
 *
 * Strips page to article text + images in a clean centered column.
 * Uses a simple DOM-based extraction (Mozilla Readability-style heuristics).
 */

const READER_OVERLAY_ID = 'ar-reader-overlay';
let savedScrollPos = 0;

export function enableReaderView(): void {
  if (document.getElementById(READER_OVERLAY_ID)) return;

  savedScrollPos = window.scrollY;

  // Extract article content
  const article = extractArticle();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = READER_OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999990;
    background: #fafaf9;
    overflow-y: auto;
    font-family: 'Georgia', 'Times New Roman', serif;
  `;

  // Reading progress bar
  const progressBar = document.createElement('div');
  progressBar.id = 'ar-reader-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #4f46e5, #7c3aed);
    z-index: 999991;
    width: 0%;
    transition: width 0.1s ease-out;
  `;

  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 680px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    color: #1a1a1a;
    line-height: 1.8;
  `;

  // Title
  const title = document.createElement('h1');
  title.textContent = document.title || 'Article';
  title.style.cssText = `
    font-size: 2em;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 8px;
    color: #0f172a;
    font-family: 'Inter', system-ui, sans-serif;
  `;

  // Meta info
  const meta = document.createElement('div');
  const wordCount = article.text.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 238));
  meta.style.cssText = `
    font-size: 0.875em;
    color: #64748b;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
  `;
  meta.textContent = `${wordCount.toLocaleString()} words · ${readTime} min read`;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Exit Reader';
  closeBtn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 999992;
    background: #4f46e5;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', system-ui, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: background 0.2s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.background = '#3730a3'; };
  closeBtn.onmouseout = () => { closeBtn.style.background = '#4f46e5'; };
  closeBtn.onclick = () => disableReaderView();

  container.appendChild(title);
  container.appendChild(meta);
  container.appendChild(article.element);
  overlay.appendChild(progressBar);
  overlay.appendChild(closeBtn);
  overlay.appendChild(container);

  // Track scroll progress
  overlay.addEventListener('scroll', () => {
    const scrollTop = overlay.scrollTop;
    const scrollHeight = overlay.scrollHeight - overlay.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  });

  (document.body || document.documentElement).appendChild(overlay);
  if (document.body) document.body.style.overflow = 'hidden';
}

export function disableReaderView(): void {
  const overlay = document.getElementById(READER_OVERLAY_ID);
  if (overlay) {
    overlay.remove();
    if (document.body) document.body.style.overflow = '';
    window.scrollTo(0, savedScrollPos);
  }
}

function extractArticle(): { element: HTMLElement; text: string } {
  // Try to find the main content
  const source =
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('main') ||
    document.querySelector('.post-content') ||
    document.querySelector('.entry-content') ||
    document.querySelector('.article-body') ||
    document.body;

  const clone = source!.cloneNode(true) as HTMLElement;

  // Remove noise
  const removeSels = [
    'script', 'style', 'noscript', 'nav', 'header', 'footer',
    'aside', 'iframe', '[class*="ad-"]', '[id*="ad-"]',
    '.sidebar', '.menu', '.navigation', '.social-share',
    '.related-posts', '.comments', 'form',
  ];
  removeSels.forEach(sel => {
    clone.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Clean up styling on remaining elements
  const allEls = clone.querySelectorAll('*');
  allEls.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.removeAttribute('style');
    htmlEl.removeAttribute('class');
    // Preserve images
    if (el.tagName === 'IMG') {
      htmlEl.style.cssText = 'max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;';
    }
  });

  // Style paragraphs
  clone.querySelectorAll('p').forEach(p => {
    (p as HTMLElement).style.cssText = 'margin-bottom: 1.2em; font-size: 1.1em;';
  });

  // Style headings
  clone.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    (h as HTMLElement).style.cssText = `
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: #0f172a;
    `;
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);

  return {
    element: wrapper,
    text: clone.textContent?.replace(/\s+/g, ' ').trim() || '',
  };
}
