import React, { useState, useEffect } from 'react';
import { ModesTab } from './components/ModesTab';
import { ToolsTab } from './components/ToolsTab';
import { TimerTab } from './components/TimerTab';
import { StatsTab } from './components/StatsTab';
import { GoalsTab } from './components/GoalsTab';

// ─── Tab Configuration ───────────────────────────────────────────────────────

type TabKey = 'modes' | 'tools' | 'timer' | 'stats' | 'goals';

interface TabConfig {
  key: TabKey;
  label: string;
  emoji: string;
}

const TABS: TabConfig[] = [
  { key: 'modes', label: 'Modes',  emoji: '🧠' },
  { key: 'tools', label: 'Tools',  emoji: '🛠️' },
  { key: 'timer', label: 'Timer',  emoji: '⏱️' },
  { key: 'stats', label: 'Stats',  emoji: '📊' },
  { key: 'goals', label: 'Goals',  emoji: '🎯' },
];

// ─── Main Shell ──────────────────────────────────────────────────────────────

export function SidePanel() {
  const [activeTab, setActiveTab] = useState<TabKey>('modes');
  const [isUiDark, setIsUiDark] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['ar_ui_dark'], (result) => {
      if (result.ar_ui_dark) {
        setIsUiDark(true);
        document.documentElement.classList.add('ar-ui-dark');
      }
    });
  }, []);

  const toggleUiDark = () => {
    const newValue = !isUiDark;
    setIsUiDark(newValue);
    if (newValue) {
      document.documentElement.classList.add('ar-ui-dark');
    } else {
      document.documentElement.classList.remove('ar-ui-dark');
    }
    chrome.storage.local.set({ ar_ui_dark: newValue });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Premium Glass Header ── */}
      <div className="relative px-4 pt-5 pb-4 shadow-sm overflow-hidden border-b border-slate-200">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-purple-100 opacity-80" />
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000" />
        
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center p-1.5 border border-slate-100/50 backdrop-blur-md">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight leading-none mb-1">
                AssistiveReader
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Premium Accessibility</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={toggleUiDark}
              title="Toggle Extension Dark Mode"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-md transition-all shadow-sm border border-white/20"
            >
              <span style={{ filter: 'invert(1) hue-rotate(180deg)', display: 'inline-block' }}>{isUiDark ? '☀️' : '🌙'}</span>
            </button>
            <button
              onClick={() => window.close()}
              title="Minimize to Quick Access"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-indigo-100 flex items-center justify-center backdrop-blur-md transition-all shadow-sm border border-white/20 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="relative flex bg-slate-200/50 backdrop-blur-md rounded-xl p-1 shadow-inner border border-slate-200/50">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] scale-100 border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 scale-95 border border-transparent'
              }`}
            >
              <span className={`text-sm transition-transform duration-300 ${activeTab === tab.key ? 'scale-110' : 'scale-100 grayscale opacity-70'}`}>{tab.emoji}</span>
              <span className="leading-none text-[9px] uppercase tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 backdrop-blur-3xl">
        <div className="animate-fade-in-up">
          {activeTab === 'modes' && <ModesTab />}
          {activeTab === 'tools' && <ToolsTab />}
          {activeTab === 'timer' && <TimerTab />}
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'goals' && <GoalsTab />}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-slate-200/60 bg-white/80 backdrop-blur-md">
        <p className="text-[10px] font-medium text-slate-400 text-center tracking-wide">
          AssistiveReader v5.0 &copy; 2026
        </p>
      </div>
    </div>
  );
}
