import React, { useEffect, useMemo, useState } from 'react';
import {
  OVERLAY_COLORS,
  WIZARD_SAMPLE_PASSAGES,
  createInitialWizardState,
  finalizeWizardProfile,
  getCurrentWizardStep,
  getWizardPreviewMetrics,
  getWizardSteps,
  goToWizardStep,
  nextWizardStep,
  prevWizardStep,
  resetWizardState,
  selectWizardOption,
  setWizardProfileName,
  setWizardSampleText,
  type Profile,
  type ProfileOverlay,
  type WizardFontPreference,
  type WizardState,
} from '@assistivereader/core';

export interface CalibrationWizardProps {
  onSaveProfile: (profile: Profile) => void;
  onCancel?: () => void;
  initialState?: WizardState;
}

const FONT_CSS_MAP: Record<WizardFontPreference, string> = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  opendyslexic: "'OpenDyslexic', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const OVERLAY_KEYS: ProfileOverlay[] = ['none', 'yellow', 'blue', 'pink', 'green', 'peach', 'aqua'];

export function CalibrationWizard({ onSaveProfile, onCancel, initialState }: CalibrationWizardProps) {
  const [state, setState] = useState<WizardState>(() => initialState ?? createInitialWizardState());
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const steps = useMemo(() => getWizardSteps(state), [state]);
  const currentStep = useMemo(() => getCurrentWizardStep(state), [state]);
  const preview = useMemo(() => getWizardPreviewMetrics(state), [state]);

  useEffect(() => {
    setLiveAnnouncement(currentStep.announcement);
  }, [currentStep.announcement]);

  const handleOptionSelect = (optionId: string) => {
    setState((prev) => selectWizardOption(prev, currentStep.choiceKey, optionId as never));
  };

  const handleRadioKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const opts = currentStep.options;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = opts[(idx + 1) % opts.length];
      handleOptionSelect(next.id);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = opts[(idx - 1 + opts.length) % opts.length];
      handleOptionSelect(prev.id);
    }
  };

  const handleSave = () => {
    const result = finalizeWizardProfile(state);
    setState(result.nextState);
    if (result.valid && result.profile) {
      setLiveAnnouncement(`Saved and applied profile ${result.profile.name}.`);
      onSaveProfile(result.profile);
    }
  };

  const handleReset = () => {
    setState(resetWizardState());
    setLiveAnnouncement('Wizard choices reset to defaults.');
  };

  const isLastStep = state.currentStepIndex === steps.length - 1;

  return (
    <div className="space-y-4">
      {/* Screen-reader announcement for step changes and save confirmations */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="calibration-title" className="text-base font-bold text-slate-900">
            {currentStep.title}
          </h2>
          <p className="text-xs text-slate-600 mt-1">{currentStep.subtitle}</p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close calibration wizard"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Accessible Interactive Step Indicator */}
      <nav aria-label="Calibration steps">
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const isCurrent = idx === state.currentStepIndex;
            const isDone = state.stepsCompleted[step.id];
            const labels: Record<string, string> = {
              font: '1. Font',
              spacing: '2. Spacing',
              color: '3. Color',
              review: '4. Review',
            };
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setState((prev) => goToWizardStep(prev, idx))}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold border text-center transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isDone
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {labels[step.id] || `Step ${step.stepNumber}`}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Options (Accessible Radiogroup) */}
      <div
        role="radiogroup"
        aria-labelledby="calibration-title"
        className={currentStep.id === 'font' || currentStep.id === 'color' ? 'grid sm:grid-cols-2 gap-2.5' : 'space-y-2.5'}
      >
        {currentStep.options.map((opt, idx) => {
          const isSelected = currentStep.selectedValue === opt.id;
          const cardFont =
            opt.previewStyle.fontFamily ? FONT_CSS_MAP[opt.previewStyle.fontFamily] : FONT_CSS_MAP[preview.fontFamily];
          const cardBg = opt.previewStyle.background ?? preview.background;
          const cardFg = opt.previewStyle.textColor ?? preview.textColor;
          const cardLineHeight = opt.previewStyle.lineHeight ?? preview.lineHeight;
          const cardLetterSpacing =
            opt.previewStyle.letterSpacingEm !== undefined
              ? `${opt.previewStyle.letterSpacingEm}em`
              : `${preview.letterSpacingEm}em`;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleOptionSelect(opt.id)}
              onKeyDown={(e) => handleRadioKeyDown(e, idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Choose'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">{opt.description}</p>
              <div
                className="p-2.5 rounded-lg border border-slate-200/80 text-xs overflow-hidden"
                style={{
                  fontFamily: cardFont,
                  backgroundColor: cardBg,
                  color: cardFg,
                  lineHeight: cardLineHeight,
                  letterSpacing: cardLetterSpacing,
                  maxWidth: opt.previewStyle.maxLineWidthCh ? `${opt.previewStyle.maxLineWidthCh}ch` : undefined,
                }}
              >
                {state.sampleText}
              </div>
            </button>
          );
        })}
      </div>

      {/* Step 2 Fine-Tune Controls */}
      {currentStep.id === 'spacing' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 grid sm:grid-cols-3 gap-3">
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <label htmlFor="wizard-font-size">Text Size</label>
              <span className="font-mono text-indigo-700">{preview.fontSizePx}px</span>
            </div>
            <input
              id="wizard-font-size"
              type="range"
              min="14"
              max="34"
              step="1"
              value={preview.fontSizePx}
              onChange={(e) =>
                setState((prev) => selectWizardOption(prev, 'fontScaleOverride', Number(e.target.value) / 18))
              }
              className="w-full accent-indigo-600"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <label htmlFor="wizard-line-height">Line Height</label>
              <span className="font-mono text-indigo-700">{preview.lineHeight.toFixed(1)}×</span>
            </div>
            <input
              id="wizard-line-height"
              type="range"
              min="1.2"
              max="3.0"
              step="0.1"
              value={preview.lineHeight}
              onChange={(e) =>
                setState((prev) => selectWizardOption(prev, 'lineHeightOverride', Number(e.target.value)))
              }
              className="w-full accent-indigo-600"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <label htmlFor="wizard-letter-spacing">Letter Spacing</label>
              <span className="font-mono text-indigo-700">{preview.letterSpacingEm.toFixed(2)}em</span>
            </div>
            <input
              id="wizard-letter-spacing"
              type="range"
              min="0"
              max="0.22"
              step="0.01"
              value={preview.letterSpacingEm}
              onChange={(e) =>
                setState((prev) => selectWizardOption(prev, 'letterSpacingOverride', Number(e.target.value)))
              }
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Step 3 Tint Overlay & Reduced Motion Controls */}
      {currentStep.id === 'color' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-800 mb-2">Optional Soft Tint Overlay</div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Wizard reading tint overlay">
              {OVERLAY_KEYS.map((key) => {
                const active = state.choices.overlayPreference === key;
                const swatch = key === 'none' ? '#e2e8f0' : OVERLAY_COLORS[key].swatchHex;
                const label = key === 'none' ? 'Off' : OVERLAY_COLORS[key].label;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setState((prev) => selectWizardOption(prev, 'overlayPreference', key))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: swatch }}
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={state.choices.disableAnimations}
              onChange={(e) =>
                setState((prev) => selectWizardOption(prev, 'disableAnimations', e.target.checked))
              }
              className="rounded border-slate-300 accent-indigo-600"
            />
            <span>Disable UI transitions and animations when this profile is active</span>
          </label>
        </div>
      )}

      {/* Cumulative Live Preview Card */}
      <section
        aria-label="Live combined reading preview"
        className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Live Combined Preview
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
              Contrast {preview.contrastRatio}:1 · WCAG {preview.wcagContrastLevel}
            </span>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Sample preview passages">
            {WIZARD_SAMPLE_PASSAGES.map((passage) => {
              const active = state.sampleText === passage.text;
              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => setState((prev) => setWizardSampleText(prev, passage.text))}
                  aria-pressed={active}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {passage.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="relative rounded-xl border border-slate-200 p-4 overflow-hidden"
          style={{
            backgroundColor: preview.background,
            color: preview.textColor,
          }}
        >
          {preview.overlayRgba && (
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: preview.overlayRgba, mixBlendMode: 'multiply' }}
            />
          )}
          <p
            className="relative mx-auto"
            style={{
              fontFamily: FONT_CSS_MAP[preview.fontFamily],
              fontSize: `${preview.fontSizePx}px`,
              lineHeight: preview.lineHeight,
              letterSpacing: `${preview.letterSpacingEm}em`,
              wordSpacing: `${preview.wordSpacingEm}em`,
              maxWidth: `${preview.maxLineWidthCh}ch`,
            }}
          >
            {state.sampleText}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-slate-600">
          <span><strong>Font:</strong> {preview.fontFamily}</span>
          <span><strong>Size:</strong> {preview.fontSizePx}px</span>
          <span><strong>Line Height:</strong> {preview.lineHeight.toFixed(1)}×</span>
          <span><strong>Column:</strong> {preview.maxLineWidthCh}ch</span>
          <span><strong>Tint:</strong> {preview.overlay}</span>
        </div>
      </section>

      {/* Step 4 Profile Naming & Validation */}
      {isLastStep && (
        <div className="space-y-2">
          <label htmlFor="wizard-profile-name" className="block text-xs font-semibold text-slate-800">
            Profile Name
          </label>
          <input
            id="wizard-profile-name"
            type="text"
            value={state.profileName}
            onChange={(e) => setState((prev) => setWizardProfileName(prev, e.target.value))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Evening Dyslexia Comfort"
          />
          {state.validationErrors.length > 0 && (
            <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
              {state.validationErrors.join(' ')}
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={state.currentStepIndex === 0}
            onClick={() => setState((prev) => prevWizardStep(prev))}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>

        {!isLastStep ? (
          <button
            type="button"
            onClick={() => setState((prev) => nextWizardStep(prev))}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            Next Step
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            Save &amp; Apply Profile
          </button>
        )}
      </div>
    </div>
  );
}
