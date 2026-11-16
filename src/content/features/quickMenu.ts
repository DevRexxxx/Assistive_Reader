/**
 * Quick Menu Widget (Floating Action Button)
 * 
 * Injects a floating quick-access menu at the bottom corner of the page.
 * Allows toggling features without opening the side panel.
 * Keeps state in sync with chrome.storage.local.
 */

import { enableDarkMode, disableDarkMode } from './colorVision';
import { enableReaderView, disableReaderView } from './readerView';
import { enableReadingRuler, disableReadingRuler } from './readingRuler';
import { startTTS, stopTTS } from './tts';
import { enableMediaHider, disableMediaHider } from './mediaHider';

const QUICK_MENU_ID = 'ar-quick-menu-container';

const CSS = `
  #ar-quick-menu-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647; /* Max z-index */
    font-family: 'Inter', system-ui, sans-serif;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 12px;
    pointer-events: none;
  }

  .ar-fab {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    pointer-events: auto;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
    border: 2px solid rgba(255,255,255,0.2);
  }

  .ar-fab:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
  }

  .ar-menu-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px) scale(0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom right;
  }

  #ar-quick-menu-container.ar-open .ar-menu-list {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  .ar-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    padding: 8px 16px;
    border-radius: 100px;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid rgba(226, 232, 240, 0.8);
    transition: all 0.2s;
    pointer-events: auto;
  }

  .ar-menu-item:hover {
    background: #ffffff;
    transform: translateX(-4px);
    border-color: #cbd5e1;
  }

  .ar-menu-item.ar-active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  .ar-menu-icon {
    font-size: 16px;
  }

  /* Dark mode support for the menu itself */
  html.ar-color-active .ar-menu-item {
    background: rgba(30, 41, 59, 0.95);
    color: #e2e8f0;
    border-color: #334155;
  }
  html.ar-color-active .ar-menu-item:hover {
    background: #0f172a;
    border-color: #475569;
  }
  html.ar-color-active .ar-menu-item.ar-active {
    background: #1e1b4b;
    border-color: #6366f1;
    color: #a5b4fc;
  }
`;

type ToolKey = 'darkMode' | 'readerView' | 'ruler' | 'tts' | 'mediaHider';

const TOOLS = [
  { key: 'darkMode' as ToolKey, label: 'Dark Mode', icon: '🌙' },
  { key: 'readerView' as ToolKey, label: 'Reader View', icon: '📄' },
  { key: 'ruler' as ToolKey, label: 'Reading Ruler', icon: '📏' },
  { key: 'tts' as ToolKey, label: 'Read Aloud', icon: '🔊' },
  { key: 'mediaHider' as ToolKey, label: 'Hide Media', icon: '🖼️' },
];

let isOpen = false;
let currentToolsState: Record<string, boolean> = {};

export function injectQuickMenu(): void {
  if (document.getElementById(QUICK_MENU_ID)) return;

  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  const container = document.createElement('div');
  container.id = QUICK_MENU_ID;

  const fab = document.createElement('div');
  fab.className = 'ar-fab';
  fab.textContent = '♿';
  fab.title = 'AssistiveReader Quick Menu';

  const menuList = document.createElement('div');
  menuList.className = 'ar-menu-list';

  // Build buttons
  TOOLS.forEach(tool => {
    const btn = document.createElement('div');
    btn.className = 'ar-menu-item';
    btn.id = `ar-qm-btn-${tool.key}`;
    btn.innerHTML = `<span class="ar-menu-icon">${tool.icon}</span> ${tool.label}`;
    
    btn.addEventListener('click', () => {
      toggleTool(tool.key);
    });

    menuList.appendChild(btn);
  });

  let clickTimeout: ReturnType<typeof setTimeout> | null = null;

  fab.addEventListener('click', (e) => {
    if (e.detail === 1) {
      // Single click - wait briefly to see if it's a double click
      clickTimeout = setTimeout(() => {
        isOpen = !isOpen;
        if (isOpen) {
          container.classList.add('ar-open');
        } else {
          container.classList.remove('ar-open');
        }
      }, 250);
    } else if (e.detail === 2) {
      // Double click
      if (clickTimeout) clearTimeout(clickTimeout);
      
      // Close menu if open
      isOpen = false;
      container.classList.remove('ar-open');
      
      // Request background script to open side panel synchronously inside click handler!
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }).catch(() => {});
    }
  });

  container.appendChild(fab);
  container.appendChild(menuList);
  (document.body || document.documentElement).appendChild(container);

  // Initial state fetch
  chrome.storage.local.get(['ar_tools_state'], (result) => {
    if (result.ar_tools_state) {
      currentToolsState = result.ar_tools_state;
      updateMenuUI();
    }
  });

  // Listen for background state changes to keep UI in sync
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.ar_tools_state) {
      currentToolsState = changes.ar_tools_state.newValue || {};
      updateMenuUI();
    }
  });
}

function updateMenuUI() {
  TOOLS.forEach(tool => {
    const btn = document.getElementById(`ar-qm-btn-${tool.key}`);
    if (btn) {
      if (currentToolsState[tool.key]) {
        btn.classList.add('ar-active');
      } else {
        btn.classList.remove('ar-active');
      }
    }
  });
}

function toggleTool(key: ToolKey) {
  const isEnabled = !currentToolsState[key];
  currentToolsState[key] = isEnabled;
  updateMenuUI();

  // Save to storage (this will also update SidePanel UI)
  chrome.storage.local.get(['ar_tools_state'], (result) => {
    const state = result.ar_tools_state || {};
    state[key] = isEnabled;
    chrome.storage.local.set({ ar_tools_state: state });
  });

  // Apply immediately in the content script
  switch (key) {
    case 'darkMode':
      isEnabled ? enableDarkMode() : disableDarkMode();
      break;
    case 'readerView':
      isEnabled ? enableReaderView() : disableReaderView();
      break;
    case 'ruler':
      isEnabled ? enableReadingRuler() : disableReadingRuler();
      break;
    case 'tts':
      isEnabled ? startTTS() : stopTTS();
      break;
    case 'mediaHider':
      isEnabled ? enableMediaHider() : disableMediaHider();
      break;
  }
}
