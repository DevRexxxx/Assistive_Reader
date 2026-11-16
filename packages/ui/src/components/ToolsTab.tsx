import React from 'react';
import {
  CVD_MATRICES,
  OVERLAY_COLORS,
  type CVDType,
  type OverlayColor,
  type ProfileContrast,
  type ProfileFontFamily,
} from '@assistivereader/core';
import type { AssistiveStore, ReadingViewMode, ToolsToggleState } from '../state/useAssistiveStore';

interface ToolsTabProps {
  store: AssistiveStore;
  onStartTTS: () => void;
  onOpenLicense: () => void;
}

const FEATURES: Array<{
  key: keyof ToolsToggleState;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
}> = [
  { key: 'darkMode', title: 'Dark Mode', description: 'High-contrast dark surface with media protection.', emoji: '🌙', gradient: 'from-slate-700 to-slate-900' },
  { key: 'readerView', title: 'Reader View', description: 'Clean single-column layout with progress bar.', emoji: '📄', gradient: 'from-sky-400 to-blue-500' },
  { key: 'toc', title: 'Table of Contents', description: 'Floating heading outline for quick navigation.', emoji: '📑', gradient: 'from-emerald-400 to-green-500' },
  { key: 'ruler', title: 'Reading Ruler', description: 'Cursor & arrow-key line band to prevent skipping.', emoji: '📏', gradient: 'from-indigo-400 to-violet-500' },
  { key: 'tts', title: 'Read Aloud (TTS)', description: 'On-device speech synthesis with word & sentence sync.', emoji: '🔊', gradient: 'from-rose-400 to-pink-500' },
  { key: 'mediaHider', title: 'Hide Media', description: 'Softens diagrams & images until hovered.', emoji: '🖼️', gradient: 'from-amber-400 to-orange-500' },
];

export function ToolsTab({ store, onStartTTS, onOpenLicense }: ToolsTabProps) {
  const { settings, updateSettings, toggleTool, stopReadingAloud, voiceStatus, canUse } = store;

  const canSentenceChunks = canUse('sentenceFocusAndChunks');
  const canAdvancedColorTypo = canUse('advancedTypographyAndOverlays');
  const canSleepTimer = canUse('sleepTimerTts');

  const handleToggleFeature = (key: keyof ToolsToggleState) => {
    if (key === 'tts') {
      if (settings.tools.tts) {
        stopReadingAloud();
      } else {
        onStartTTS();
      }
      return;
    }
    toggleTool(key);
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Reading Flow Modes */}
      <section aria-labelledby="reading-flow-heading">
        <div className="flex items-center justify-between mb-2">
          <h2 id="reading-flow-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Reading Focus Flow
          </h2>
          {!canSentenceChunks && (
            <button
              type="button"
              onClick={onOpenLicense}
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
            >
              Pro
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Reading view mode">
          {([
            { id: 'full', label: 'Full Page' },
            { id: 'sentenceFocus', label: '1 Sentence' },
            { id: 'chunkCards', label: 'Chunk Cards' },
          ] as Array<{ id: ReadingViewMode; label: string }>).map((mode) => {
            const active = settings.readingMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (mode.id !== 'full' && !canSentenceChunks) {
                    onOpenLicense();
                    return;
                  }
                  updateSettings((prev) => ({ ...prev, readingMode: mode.id }));
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Feature Toggles */}
      <section aria-labelledby="tools-heading" className="space-y-2.5">
        <h2 id="tools-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Accessibility Tools
        </h2>
        {FEATURES.map((feature) => {
          const isActive = settings.tools[feature.key];
          return (
            <button
              key={feature.key}
              type="button"
              id={`toggle-${feature.key}`}
              role="switch"
              aria-checked={isActive}
              onClick={() => handleToggleFeature(feature.key)}
              className={`flex items-center justify-between p-3.5 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
                isActive
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/90'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-xl shadow-sm shrink-0`} aria-hidden="true">
                  {feature.emoji}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{feature.title}</div>
                  <div className="text-xs text-slate-600 leading-relaxed">{feature.description}</div>
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

        {/* Local Voice Privacy Status & TTS Controls */}
        <div className="glass-card rounded-xl p-3.5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Voice & Speech Settings</span>
            {voiceStatus.onlyNetworkVoices ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Network Voices Only
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                {voiceStatus.localVoicesCount} Local Voice{voiceStatus.localVoicesCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {voiceStatus.onlyNetworkVoices && (
            <div
              role="alert"
              className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-950 leading-relaxed"
            >
              <strong>Privacy notice:</strong> Only remote/network TTS voices were detected in this browser.
              Speaking text with a network voice may send that text to the browser vendor’s servers. Install an
              OS offline voice for 100% local speech.
            </div>
          )}

          {voiceStatus.voices.length > 0 && (
            <div>
              <label htmlFor="tts-voice-select" className="block text-[11px] font-medium text-slate-600 mb-1">
                Voice (prefers on-device localService)
              </label>
              <select
                id="tts-voice-select"
                value={settings.ttsVoiceURI || voiceStatus.selectedVoice?.voiceURI || ''}
                onChange={(e) => updateSettings((prev) => ({ ...prev, ttsVoiceURI: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
              >
                {voiceStatus.voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.localService ? '🔒 [Local] ' : '☁️ [Network] '}
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="tts-rate-slider" className="font-medium text-slate-700">
                Reading Speed
              </label>
              <span className="font-mono text-rose-700 font-bold">{settings.ttsRate.toFixed(1)}x</span>
            </div>
            <input
              id="tts-rate-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.ttsRate}
              onChange={(e) => updateSettings((prev) => ({ ...prev, ttsRate: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-600">Sleep Timer</span>
              {!canSleepTimer && (
                <button
                  type="button"
                  onClick={onOpenLicense}
                  className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                >
                  Pro
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[0, 5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    if (mins > 0 && !canSleepTimer) {
                      onOpenLicense();
                      return;
                    }
                    updateSettings((prev) => ({ ...prev, ttsSleepMinutes: mins }));
                  }}
                  className={`py-1 rounded text-[11px] font-semibold ${
                    settings.ttsSleepMinutes === mins
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mins === 0 ? 'Off' : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Color Vision Section */}
      <section aria-labelledby="color-vision-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="color-vision-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            👁️ Color Vision & Overlays
          </h2>
          {!canAdvancedColorTypo && (
            <button
              type="button"
              onClick={onOpenLicense}
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800"
            >
              Pro
            </button>
          )}
        </div>

        {/* CVD Correction */}
        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="text-xs font-semibold text-slate-800 mb-1">Color Vision Deficiency Filter</div>
          <div className="text-[11px] text-slate-500 mb-2.5">SVG feColorMatrix adjustments for color perception.</div>
          <div className="grid grid-cols-2 gap-2">
            {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as CVDType[]).map((key) => {
              const label = key === 'none' ? 'Off' : CVD_MATRICES[key].label;
              const desc = key === 'none' ? 'No filter' : CVD_MATRICES[key].description;
              const active = settings.colorVision.cvdFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (key !== 'none' && !canAdvancedColorTypo) {
                      onOpenLicense();
                      return;
                    }
                    updateSettings((prev) => ({
                      ...prev,
                      colorVision: { ...prev.colorVision, cvdFilter: key },
                    }));
                  }}
                  className={`py-2 px-2.5 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{label}</div>
                  <div className={`text-[10px] mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-500'}`}>{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading Tint Overlay */}
        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="text-xs font-semibold text-slate-800 mb-1">Reading Tint Overlay</div>
          <div className="text-[11px] text-slate-500 mb-2.5">Softens harsh white glare on screen.</div>
          <div className="flex gap-2 flex-wrap">
            {(['none', 'yellow', 'blue', 'pink', 'green', 'peach', 'aqua'] as OverlayColor[]).map((key) => {
              const active = settings.colorVision.overlay === key;
              const swatchHex = key === 'none' ? '#e2e8f0' : OVERLAY_COLORS[key].swatchHex;
              const label = key === 'none' ? 'Off' : OVERLAY_COLORS[key].label;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (key !== 'none' && !canAdvancedColorTypo) {
                      onOpenLicense();
                      return;
                    }
                    updateSettings((prev) => ({
                      ...prev,
                      colorVision: { ...prev.colorVision, overlay: key },
                    }));
                  }}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                    active ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-slate-300 shadow-sm"
                    style={{ backgroundColor: swatchHex }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-medium text-slate-700">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saturation */}
        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="flex justify-between text-xs mb-1">
            <label htmlFor="saturation-slider" className="font-semibold text-slate-800">
              Color Saturation
            </label>
            <span className="font-mono text-indigo-700 font-bold">{settings.colorVision.saturation}%</span>
          </div>
          <input
            id="saturation-slider"
            type="range"
            min="0"
            max="200"
            step="10"
            value={settings.colorVision.saturation}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                colorVision: { ...prev.colorVision, saturation: Number(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </section>

      {/* Typography Controls */}
      <section aria-labelledby="typography-heading" className="space-y-2.5">
        <h2 id="typography-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Typography & Spacing
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={settings.typography.enabled}
          onClick={() =>
            updateSettings((prev) => ({
              ...prev,
              typography: { ...prev.typography, enabled: !prev.typography.enabled },
            }))
          }
          className={`flex items-center justify-between p-3.5 rounded-xl border shadow-sm transition-all duration-200 w-full text-left ${
            settings.typography.enabled
              ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/90'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center text-xl shadow-sm shrink-0" aria-hidden="true">
              🔤
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Custom Typography</div>
              <div className="text-xs text-slate-600">Font choice, size, spacing & contrast.</div>
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ml-2 ${
              settings.typography.enabled ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
            aria-hidden="true"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                settings.typography.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {settings.typography.enabled && (
          <div className="glass-card rounded-xl p-4 space-y-3.5 border border-slate-200 animate-fade-in">
            <div>
              <label htmlFor="typo-font-select" className="block text-xs font-medium text-slate-700 mb-1">
                Self-Hosted Typeface
              </label>
              <select
                id="typo-font-select"
                value={settings.typography.fontFamily}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, fontFamily: e.target.value as ProfileFontFamily },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
              >
                <option value="inter">Inter (Bundled Sans)</option>
                <option value="opendyslexic">OpenDyslexic (Bundled)</option>
                <option value="serif">Georgia Serif</option>
                <option value="mono">Monospace</option>
                <option value="system">System UI</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="typo-fontsize" className="font-medium text-slate-700">Font Size</label>
                <span className="font-mono text-indigo-700 font-bold">{settings.typography.fontSize}px</span>
              </div>
              <input
                id="typo-fontsize"
                type="range"
                min="14"
                max="32"
                step="1"
                value={settings.typography.fontSize}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, fontSize: Number(e.target.value) },
                  }))
                }
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="typo-lineheight" className="font-medium text-slate-700">Line Height</label>
                <span className="font-mono text-indigo-700 font-bold">{settings.typography.lineHeight.toFixed(1)}×</span>
              </div>
              <input
                id="typo-lineheight"
                type="range"
                min="1.2"
                max="3.0"
                step="0.1"
                value={settings.typography.lineHeight}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, lineHeight: Number(e.target.value) },
                  }))
                }
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="typo-letterspacing" className="font-medium text-slate-700">Letter Spacing</label>
                <span className="font-mono text-indigo-700 font-bold">{settings.typography.letterSpacing.toFixed(2)}em</span>
              </div>
              <input
                id="typo-letterspacing"
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={settings.typography.letterSpacing}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, letterSpacing: Number(e.target.value) },
                  }))
                }
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="typo-wordspacing" className="font-medium text-slate-700">Word Spacing</label>
                <span className="font-mono text-indigo-700 font-bold">{settings.typography.wordSpacing.toFixed(2)}em</span>
              </div>
              <input
                id="typo-wordspacing"
                type="range"
                min="0"
                max="0.35"
                step="0.02"
                value={settings.typography.wordSpacing}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, wordSpacing: Number(e.target.value) },
                  }))
                }
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-700 mb-1.5">Contrast</div>
              <div className="flex gap-2">
                {(['normal', 'high', 'inverted'] as ProfileContrast[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={settings.typography.contrast === mode}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, contrast: mode },
                      }))
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      settings.typography.contrast === mode
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
