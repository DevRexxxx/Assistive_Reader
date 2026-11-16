import React, { useState } from 'react';
import type { AssistiveStore, ToolsToggleState } from '../state/useAssistiveStore';

interface QuickMenuWidgetProps {
  store: AssistiveStore;
  onStartTTS: () => void;
}

const QUICK_ITEMS: Array<{ key: keyof ToolsToggleState; label: string; icon: string }> = [
  { key: 'darkMode', label: 'Dark Mode', icon: '🌙' },
  { key: 'readerView', label: 'Reader View', icon: '📄' },
  { key: 'ruler', label: 'Reading Ruler', icon: '📏' },
  { key: 'tts', label: 'Read Aloud', icon: '🔊' },
  { key: 'mediaHider', label: 'Hide Media', icon: '🖼️' },
];

export function QuickMenuWidget({ store, onStartTTS }: QuickMenuWidgetProps) {
  const [open, setOpen] = useState(false);
  const { settings, toggleTool, stopReadingAloud } = store;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col-reverse items-end gap-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Toggle Quick Accessibility Menu"
        title="Quick Accessibility Menu"
        className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center border-2 border-white/30"
      >
        ♿
      </button>

      {open && (
        <div className="flex flex-col gap-2 animate-fade-in" role="menu" aria-label="Quick tools">
          {QUICK_ITEMS.map((item) => {
            const active = settings.tools[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="menuitemcheckbox"
                aria-checked={active}
                onClick={() => {
                  if (item.key === 'tts') {
                    active ? stopReadingAloud() : onStartTTS();
                  } else {
                    toggleTool(item.key);
                  }
                }}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold shadow-md border transition-all ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
