import React, { useState } from 'react';
import { buildCalibratedProfile, type CalibrationChoices, type Profile } from '@assistivereader/core';

interface CalibrationWizardModalProps {
  open: boolean;
  onClose: () => void;
  onSaveProfile: (profile: Profile) => void;
}

const SAMPLE_TEXT =
  'Reading feels calmer when spacing, typeface, and contrast match how your eyes naturally track across each line.';

export function CalibrationWizardModal({ open, onClose, onSaveProfile }: CalibrationWizardModalProps) {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<CalibrationChoices>({
    fontPreference: 'inter',
    spacingPreference: 'balanced',
    surfacePreference: 'crisp',
    lineWidthPreference: 'medium',
  });
  const [profileName, setProfileName] = useState('My Comfort Profile');

  if (!open) return null;

  const steps = [
    {
      title: 'Step 1 of 4: Pick the easiest typeface to scan',
      subtitle: 'Choose the sample where letter shapes stand apart clearly.',
      options: [
        {
          id: 'inter',
          label: 'Clean Sans (Inter)',
          fontFamily: "'Inter', system-ui, sans-serif",
          sample: SAMPLE_TEXT,
        },
        {
          id: 'opendyslexic',
          label: 'Weighted Base (OpenDyslexic)',
          fontFamily: "'OpenDyslexic', sans-serif",
          sample: SAMPLE_TEXT,
        },
        {
          id: 'serif',
          label: 'Editorial Serif (Georgia)',
          fontFamily: "Georgia, 'Times New Roman', serif",
          sample: SAMPLE_TEXT,
        },
      ] as const,
      selected: choices.fontPreference,
      onSelect: (val: CalibrationChoices['fontPreference']) =>
        setChoices((prev) => ({ ...prev, fontPreference: val })),
    },
    {
      title: 'Step 2 of 4: Pick comfortable line & letter spacing',
      subtitle: 'Notice how much breathing room feels best between lines.',
      options: [
        {
          id: 'compact',
          label: 'Compact',
          style: { lineHeight: 1.5, letterSpacing: '0em' },
          sample: SAMPLE_TEXT,
        },
        {
          id: 'balanced',
          label: 'Balanced',
          style: { lineHeight: 1.85, letterSpacing: '0.04em' },
          sample: SAMPLE_TEXT,
        },
        {
          id: 'airy',
          label: 'Airy & Wide',
          style: { lineHeight: 2.2, letterSpacing: '0.11em' },
          sample: SAMPLE_TEXT,
        },
      ] as const,
      selected: choices.spacingPreference,
      onSelect: (val: CalibrationChoices['spacingPreference']) =>
        setChoices((prev) => ({ ...prev, spacingPreference: val })),
    },
    {
      title: 'Step 3 of 4: Choose background warmth & contrast',
      subtitle: 'Select the page surface with the least glare.',
      options: [
        {
          id: 'crisp',
          label: 'Crisp White',
          style: { backgroundColor: '#ffffff', color: '#0f172a' },
          sample: SAMPLE_TEXT,
        },
        {
          id: 'cream',
          label: 'Warm Cream Paper',
          style: { backgroundColor: '#fdfbf7', color: '#1f2937' },
          sample: SAMPLE_TEXT,
        },
        {
          id: 'calm-dark',
          label: 'Calm Slate Dark',
          style: { backgroundColor: '#111827', color: '#f1f5f9' },
          sample: SAMPLE_TEXT,
        },
      ] as const,
      selected: choices.surfacePreference,
      onSelect: (val: CalibrationChoices['surfacePreference']) =>
        setChoices((prev) => ({ ...prev, surfacePreference: val })),
    },
    {
      title: 'Step 4 of 4: Pick column line length & name your profile',
      subtitle: 'Shorter lines reduce eye travel when returning to the left margin.',
      options: [
        { id: 'narrow', label: 'Focused Column (~50 chars)', widthClass: 'max-w-[34ch]', sample: SAMPLE_TEXT },
        { id: 'medium', label: 'Balanced Column (~65 chars)', widthClass: 'max-w-[46ch]', sample: SAMPLE_TEXT },
        { id: 'wide', label: 'Wide Column (~82 chars)', widthClass: 'max-w-full', sample: SAMPLE_TEXT },
      ] as const,
      selected: choices.lineWidthPreference,
      onSelect: (val: CalibrationChoices['lineWidthPreference']) =>
        setChoices((prev) => ({ ...prev, lineWidthPreference: val })),
    },
  ];

  const currentStep = steps[step];

  const handleFinish = () => {
    const profile = buildCalibratedProfile(choices, profileName);
    onSaveProfile(profile);
    setStep(0);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="calibration-title" className="text-base font-bold text-slate-900">
              {currentStep.title}
            </h2>
            <p className="text-xs text-slate-600 mt-1">{currentStep.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calibration wizard"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Step progress pills */}
        <div className="flex gap-1.5 mb-5" aria-hidden="true">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                idx <= step ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {currentStep.options.map((opt) => {
            const isSelected = currentStep.selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => (currentStep.onSelect as (v: string) => void)(opt.id)}
                aria-pressed={isSelected}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Choose'}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-lg border border-slate-200/70 text-sm ${
                    'widthClass' in opt ? opt.widthClass : ''
                  }`}
                  style={{
                    fontFamily: 'fontFamily' in opt ? opt.fontFamily : undefined,
                    ...('style' in opt ? opt.style : {}),
                  }}
                >
                  {opt.sample}
                </div>
              </button>
            );
          })}
        </div>

        {step === steps.length - 1 && (
          <div className="mt-4">
            <label htmlFor="wizard-profile-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Profile Name
            </label>
            <input
              id="wizard-profile-name"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Evening Study"
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              Save & Apply Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
