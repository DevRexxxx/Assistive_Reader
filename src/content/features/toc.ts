/**
 * Table of Contents Generator
 *
 * Scrapes H1-H3 headings from the page and injects a sticky,
 * collapsible ToC sidebar to help build a mental map of the document.
 */

const TOC_ID = 'ar-toc-panel';

export function enableToC(): void {
  if (document.getElementById(TOC_ID)) return;

  const headings = document.querySelectorAll('h1, h2, h3');
  if (headings.length < 2) return; // Not enough structure

  // Build ToC data
  const items: { level: number; text: string; el: Element }[] = [];
  headings.forEach((h) => {
    const level = parseInt(h.tagName[1]);
    const text = h.textContent?.trim() || '';
    if (text && level <= 3) {
      // Add an ID if missing
      if (!h.id) {
        h.id = 'ar-toc-' + items.length;
      }
      items.push({ level, text, el: h });
    }
  });

  if (items.length < 2) return;

  // Create panel
  const panel = document.createElement('div');
  panel.id = TOC_ID;
  panel.style.cssText = `
    position: fixed;
    top: 80px;
    right: 16px;
    width: 260px;
    max-height: calc(100vh - 120px);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    z-index: 999995;
    overflow-y: auto;
    font-family: 'Inter', system-ui, sans-serif;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px 12px 0 0;
  `;
  header.innerHTML = `
    <span style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em;">
      📑 Contents
    </span>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background: none; border: none; cursor: pointer;
    color: #94a3b8; font-size: 14px; padding: 2px 6px;
    border-radius: 4px; transition: color 0.2s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.color = '#475569'; };
  closeBtn.onmouseout = () => { closeBtn.style.color = '#94a3b8'; };
  closeBtn.onclick = () => disableToC();
  header.appendChild(closeBtn);

  // Links list
  const list = document.createElement('div');
  list.style.cssText = 'padding: 8px 12px 12px;';

  items.forEach((item) => {
    const link = document.createElement('a');
    link.textContent = item.text;
    link.href = `#${item.el.id}`;
    const indent = (item.level - 1) * 12;
    link.style.cssText = `
      display: block;
      padding: 6px 8px 6px ${8 + indent}px;
      font-size: ${item.level === 1 ? '13px' : '12px'};
      font-weight: ${item.level === 1 ? '600' : '400'};
      color: ${item.level === 1 ? '#0f172a' : '#475569'};
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
    link.onmouseover = () => {
      link.style.background = '#f1f5f9';
      link.style.color = '#4f46e5';
    };
    link.onmouseout = () => {
      link.style.background = 'transparent';
      link.style.color = item.level === 1 ? '#0f172a' : '#475569';
    };
    link.onclick = (e) => {
      e.preventDefault();
      item.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    list.appendChild(link);
  });

  panel.appendChild(header);
  panel.appendChild(list);
  (document.body || document.documentElement).appendChild(panel);
}

export function disableToC(): void {
  const panel = document.getElementById(TOC_ID);
  if (panel) panel.remove();
}
