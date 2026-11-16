import React from 'react';
import { BUILT_IN_PROFILES, type BuiltInProfileId } from '@assistivereader/core';
import type { AssistiveStore, SyllableDisplayMode } from '../state/useAssistiveStore';

interface ModesTabProps {
  store: AssistiveStore;
  onOpenCalibration: () => void;
  onOpenLicense: () => void;
}

const PERSONA_ORDER: Array<{ key: BuiltInProfileId; gradient: string }> = [
  { key: 'adhd', gradient: 'from-amber-400 to-orange-500' },
  { key: 'dyslexia', gradient: 'from-emerald-400 to-teal-500' },
  { key: 'autism', gradient: 'from-violet-400 to-purple-500' },
];

export function ModesTab({ store, onOpenCalibration, onOpenLicense }: ModesTabProps) {
  const { settings, toggleBuiltInPersona, selectCustomProfile, deleteCustomProfile, updateSettings, canUse } = store;

  const canSyllables = canUse('syllableSplitting');
  const canConfusables = canUse('confusableLetters');
  const canWizard = canUse('calibrationWizard');

  return (
    <div className="animate-fade-in space-y-5">
      {/* Calibration CTA */}
      <div className="glass-card rounded-xl p-3.5 border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 to-purple-50/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-indigo-900">Find Your Reading Comfort</div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Compare spacing, fonts, and tints side by side to build a customizable reading support profile.
            </p>
          </div>
          {!canWizard && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Pro
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={canWizard ? onOpenCalibration : onOpenLicense}
          className="mt-2.5 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          {canWizard ? '✨ Launch Calibration Wizard' : '🔒 Unlock Calibration Wizard (Pro)'}
        </button>
      </div>

      {/* Built-in Personas */}
      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Customizable Profiles
        </h2>
        <div className="space-y-2.5">
          {PERSONA_ORDER.map(({ key, gradient }) => {
            const profile = BUILT_IN_PROFILES[key];
            const isActive = settings.builtInPersonas[key];
            return (
              <button
                key={key}
                type="button"
                id={`toggle-${key}`}
                role="switch"
                aria-checked={isActive}
                onClick={() => toggleBuiltInPersona(key)}
                className={`flex items-center justify-between p-3.5 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
                  isActive
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/90'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-sm shrink-0`} aria-hidden="true">
                    {profile.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{profile.name}</div>
                    <div className="text-xs text-slate-600 leading-relaxed">{profile.description}</div>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ml-2 ${
                    isActive ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Saved Custom Profiles */}
      {settings.customProfiles.length > 0 && (
        <section aria-labelledby="custom-profiles-heading">
          <h2 id="custom-profiles-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Your Custom Profiles
          </h2>
          <div className="space-y-2">
            {settings.customProfiles.map((cp) => {
              const isActive = settings.activeCustomProfileId === cp.id;
              return (
                <div
                  key={cp.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/80 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectCustomProfile(isActive ? null : cp.id)}
                    className="flex-1 text-left flex items-center gap-2.5"
                    aria-pressed={isActive}
                  >
                    <span className="text-lg" aria-hidden="true">{cp.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{cp.name}</div>
                      <div className="text-[11px] text-slate-500">{cp.description}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCustomProfile(cp.id)}
                    aria-label={`Delete custom profile ${cp.name}`}
                    className="ml-2 px-2 py-1 text-xs text-slate-400 hover:text-rose-600 rounded"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Deterministic Reading Enhancements */}
      <section aria-labelledby="enhancements-heading" className="space-y-3">
        <h2 id="enhancements-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Reading Support Cues
        </h2>

        {/* Bionic Reading (Free) */}
        <button
          type="button"
          id="toggle-bionic"
          role="switch"
          aria-checked={settings.bionicReading}
          onClick={() => updateSettings((prev) => ({ ...prev, bionicReading: !prev.bionicReading }))}
          className={`flex items-center justify-between p-3.5 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
            settings.bionicReading
              ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/90'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl shadow-sm shrink-0" aria-hidden="true">
              ⚡
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Bionic Reading</div>
              <div className="text-xs text-slate-600 leading-relaxed">
                Optional bold fixation anchors on word openings.
              </div>
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ml-2 ${
              settings.bionicReading ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'
            }`}
            aria-hidden="true"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                settings.bionicReading ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Syllable Splitting (Pro) */}
        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-semibold text-slate-800">Syllable Splitting</div>
              <div className="text-[11px] text-slate-500">Liang-pattern syllable breaks for decoding support.</div>
            </div>
            {!canSyllables && (
              <button
                type="button"
                onClick={onOpenLicense}
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
              >
                Pro
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Syllable display mode">
            {([
              { id: 'off', label: 'Off' },
              { id: 'middot', label: 'Middots (re·ad)' },
              { id: 'alternating', label: 'Color Pairs' },
            ] as Array<{ id: SyllableDisplayMode; label: string }>).map((opt) => {
              const active = settings.syllableMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.id !== 'off' && !canSyllables) {
                      onOpenLicense();
                      return;
                    }
                    updateSettings((prev) => ({ ...prev, syllableMode: opt.id }));
                  }}
                  aria-pressed={active}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confusable Letters (Pro) */}
        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Confusable-Letter Tints</div>
              <div className="text-[11px] text-slate-500">Color-codes mirrored characters (e.g. b / d / p / q).</div>
            </div>
            {canConfusables ? (
              <button
                type="button"
                role="switch"
                aria-checked={settings.confusableLetters}
                aria-label="Toggle confusable letter tints"
                onClick={() =>
                  updateSettings((prev) => ({ ...prev, confusableLetters: !prev.confusableLetters }))
                }
                className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ${
                  settings.confusableLetters ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    settings.confusableLetters ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLicense}
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
              >
                Pro
              </button>
            )}
          </div>
          {canConfusables && settings.confusableLetters && (
            <div className="mt-2.5">
              <label htmlFor="confusable-chars-input" className="block text-[11px] font-medium text-slate-600 mb-1">
                Highlighted Letters (up to 4)
              </label>
              <input
                id="confusable-chars-input"
                type="text"
                maxLength={6}
                value={settings.confusableChars}
                onChange={(e) =>
                  updateSettings((prev) => ({ ...prev, confusableChars: e.target.value.toLowerCase() }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-mono"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
