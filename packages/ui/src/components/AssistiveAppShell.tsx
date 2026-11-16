import React, { useMemo, useState } from 'react';
import { splitSentences } from '@assistivereader/core';
import { documentToBodyText } from '../data/sampleDocuments';
import { useAssistiveStore, type AssistiveStoreAdapters } from '../state/useAssistiveStore';
import { CalibrationWizardModal } from './CalibrationWizardModal';
import { GoalsTab } from './GoalsTab';
import { LicenseTab } from './LicenseTab';
import { ModesTab } from './ModesTab';
import { QuickMenuWidget } from './QuickMenuWidget';
import { ReaderWorkspace } from './ReaderWorkspace';
import { StatsTab } from './StatsTab';
import { TimerTab } from './TimerTab';
import { ToolsTab } from './ToolsTab';

type TabKey = 'modes' | 'tools' | 'timer' | 'stats' | 'goals' | 'license';

const TABS: Array<{ key: TabKey; label: string; emoji: string }> = [
  { key: 'modes', label: 'Modes', emoji: '🧠' },
  { key: 'tools', label: 'Tools', emoji: '🛠️' },
  { key: 'timer', label: 'Timer', emoji: '⏱️' },
  { key: 'stats', label: 'Stats', emoji: '📊' },
  { key: 'goals', label: 'Goals', emoji: '🎯' },
  { key: 'license', label: 'Pro', emoji: '🔑' },
];

interface AssistiveAppShellProps {
  adapters: AssistiveStoreAdapters;
  sidePanelOnly?: boolean;
}

export function AssistiveAppShell({ adapters, sidePanelOnly = false }: AssistiveAppShellProps) {
  const store = useAssistiveStore(adapters);
  const [activeTab, setActiveTab] = useState<TabKey>('modes');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'reader' | 'controls'>('reader');

  const bodyText = useMemo(() => documentToBodyText(store.activeDocument), [store.activeDocument]);
  const sentences = useMemo(() => splitSentences(bodyText), [bodyText]);

  const handleStartTTS = () => {
    store.startReadingAloud(bodyText, sentences);
  };

  if (!store.ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-700 text-sm font-medium">
        Loading AssistiveReader offline workspace…
      </div>
    );
  }

  const controlPanel = (
    <aside
      aria-label="AssistiveReader Controls"
      className={`flex flex-col bg-slate-50 text-slate-900 border-r border-slate-200 ${
        sidePanelOnly ? 'h-screen w-full' : 'w-full lg:w-[390px] lg:h-screen shrink-0'
      }`}
    >
      {/* Header */}
      <header className="relative px-4 pt-4 pb-3 shadow-sm overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/70 via-white to-purple-100/70 opacity-80" aria-hidden="true" />

        <div className="relative flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center p-1.5 border border-slate-200">
              <img src="/icon.png" alt="AssistiveReader" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-indigo-800 tracking-tight leading-none mb-1">
                AssistiveReader
              </h1>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                Local · No AI · Offline ({store.licenseResult.tier})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => store.updateSettings((prev) => ({ ...prev, uiDark: !prev.uiDark }))}
            aria-label={store.settings.uiDark ? 'Switch UI to light theme' : 'Switch UI to dark theme'}
            title="Toggle Control Panel Dark Mode"
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center transition-all shadow-sm border border-slate-200"
          >
            <span aria-hidden="true">{store.settings.uiDark ? '☀️' : '🌙'}</span>
          </button>
        </div>

        {/* Tab Bar */}
        <nav aria-label="Control panel sections">
          <div role="tablist" className="relative grid grid-cols-6 bg-slate-200/70 rounded-xl p-1 border border-slate-200/70">
            {TABS.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selected
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="text-sm" aria-hidden="true">{tab.emoji}</span>
                  <span className="leading-none text-[9px] uppercase tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Tab Body */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto p-4 bg-slate-50"
      >
        {activeTab === 'modes' && (
          <ModesTab
            store={store}
            onOpenCalibration={() => setWizardOpen(true)}
            onOpenLicense={() => setActiveTab('license')}
          />
        )}
        {activeTab === 'tools' && (
          <ToolsTab
            store={store}
            onStartTTS={handleStartTTS}
            onOpenLicense={() => setActiveTab('license')}
          />
        )}
        {activeTab === 'timer' && <TimerTab store={store} />}
        {activeTab === 'stats' && (
          <StatsTab store={store} onOpenLicense={() => setActiveTab('license')} />
        )}
        {activeTab === 'goals' && <GoalsTab store={store} />}
        {activeTab === 'license' && <LicenseTab store={store} />}
      </div>

      {/* Footer */}
      <footer className="px-4 py-2.5 border-t border-slate-200 bg-white">
        <p className="text-[10px] font-medium text-slate-500 text-center tracking-wide">
          AssistiveReader · 100% Local &amp; Private · WCAG 2.2 AA
        </p>
      </footer>
    </aside>
  );

  if (sidePanelOnly) {
    return (
      <>
        {controlPanel}
        <CalibrationWizardModal
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSaveProfile={(profile) => store.saveCustomProfile(profile)}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* Mobile Pane Switcher */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-3 py-2 shrink-0">
        <span className="text-sm font-extrabold text-indigo-800">AssistiveReader</span>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            aria-pressed={mobilePane === 'reader'}
            onClick={() => setMobilePane('reader')}
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              mobilePane === 'reader' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Reader
          </button>
          <button
            type="button"
            aria-pressed={mobilePane === 'controls'}
            onClick={() => setMobilePane('controls')}
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              mobilePane === 'controls' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Controls
          </button>
        </div>
      </div>

      {/* Left Control Dock */}
      <div className={`${mobilePane === 'controls' ? 'flex flex-1 overflow-hidden' : 'hidden'} lg:flex`}>
        {controlPanel}
      </div>

      {/* Right Interactive Reader */}
      <main className={`${mobilePane === 'reader' ? 'flex flex-1 overflow-hidden' : 'hidden'} lg:flex lg:flex-1`}>
        <ReaderWorkspace store={store} onOpenLicense={() => { setActiveTab('license'); setMobilePane('controls'); }} />
      </main>

      <QuickMenuWidget store={store} onStartTTS={handleStartTTS} />

      <CalibrationWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaveProfile={(profile) => store.saveCustomProfile(profile)}
      />
    </div>
  );
}
