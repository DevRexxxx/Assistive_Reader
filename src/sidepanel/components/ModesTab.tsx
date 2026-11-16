import React, { useCallback, useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PersonaKey = 'adhd' | 'dyslexia' | 'autism';

interface PersonaConfig {
  key: PersonaKey;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
}

interface ModesState {
  personas: Record<PersonaKey, boolean>;
  bionicReading: boolean;
}

// ─── Persona Definitions ─────────────────────────────────────────────────────

const PERSONAS: PersonaConfig[] = [
  {
    key: 'adhd',
    title: 'ADHD Focus Mode',
    description: 'Hides distractions, dims content and reveals on hover.',
    emoji: '🎯',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    key: 'dyslexia',
    title: 'Dyslexia Read Mode',
    description: 'OpenDyslexic font, cream background, generous spacing.',
    emoji: '📖',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    key: 'autism',
    title: 'Autism Calm Mode',
    description: 'Stops animations, mutes colors for a calmer experience.',
    emoji: '🧘',
    gradient: 'from-violet-400 to-purple-500',
  },
];

const DEFAULT_STATE: ModesState = {
  personas: { adhd: false, dyslexia: false, autism: false },
  bionicReading: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ModesTab() {
  const [state, setState] = useState<ModesState>(DEFAULT_STATE);
  const [initialized, setInitialized] = useState(false);

  // Load persisted state
  useEffect(() => {
    chrome.storage.sync.get(['assistiveReaderState'], (result) => {
      if (result.assistiveReaderState) {
        setState(result.assistiveReaderState);
      }
      setInitialized(true);
    });
  }, []);

  // Persist state
  useEffect(() => {
    if (!initialized) return;
    chrome.storage.sync.set({ assistiveReaderState: state });
  }, [state, initialized]);

  // Re-apply on load
  useEffect(() => {
    if (!initialized) return;
    for (const persona of PERSONAS) {
      if (state.personas[persona.key]) {
        chrome.runtime.sendMessage({ type: 'APPLY_PERSONA', persona: persona.key });
      }
    }
    if (state.bionicReading) {
      chrome.runtime.sendMessage({ type: 'APPLY_BIONIC' });
    }
  }, [initialized]);

  const togglePersona = useCallback((key: PersonaKey) => {
    const isActive = state.personas[key];
    setState(prev => ({
      ...prev,
      personas: { ...prev.personas, [key]: !isActive },
    }));
    chrome.runtime.sendMessage({
      type: isActive ? 'REMOVE_PERSONA' : 'APPLY_PERSONA',
      persona: key,
    });
    if (!isActive) {
      chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', field: 'modeActivation', mode: key });
    }
  }, [state]);

  const toggleBionic = useCallback(() => {
    setState(prev => ({ ...prev, bionicReading: !prev.bionicReading }));
    chrome.runtime.sendMessage({
      type: state.bionicReading ? 'REMOVE_BIONIC' : 'APPLY_BIONIC',
    });
  }, [state]);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Persona Toggles */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Reading Modes
        </h2>
        {PERSONAS.map((persona, i) => {
          const isActive = state.personas[persona.key];
          return (
            <button
              key={persona.key}
              id={`toggle-${persona.key}`}
              onClick={() => togglePersona(persona.key)}
              className={`flex items-center justify-between p-4 mb-3 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
                isActive
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-xl shadow-sm`}>
                  {persona.emoji}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{persona.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{persona.description}</div>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ml-2 ${
                isActive ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bionic Reading */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Reading Enhancements
        </h2>
        <button
          id="toggle-bionic"
          onClick={toggleBionic}
          className={`flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
            state.bionicReading
              ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl shadow-sm">
              ⚡
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Bionic Reading</div>
              <div className="text-xs text-slate-500 leading-relaxed">Bolds word beginnings to guide your eyes faster.</div>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ml-2 ${
            state.bionicReading ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
              state.bionicReading ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
        </button>
      </div>
    </div>
  );
}
