import React, { useCallback, useEffect, useState } from 'react';

// ─── Feature Toggle Type ─────────────────────────────────────────────────────

type FeatureKey = 'ruler' | 'readerView' | 'toc' | 'tts' | 'mediaHider' | 'darkMode';

interface FeatureConfig {
  key: FeatureKey;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  enableMsg: string;
  disableMsg: string;
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'darkMode',
    title: 'Dark Mode',
    description: 'Force dark background on any page.',
    emoji: '🌙',
    gradient: 'from-slate-700 to-slate-900',
    enableMsg: 'ENABLE_DARK_MODE',
    disableMsg: 'DISABLE_DARK_MODE',
  },
  {
    key: 'readerView',
    title: 'Reader View',
    description: 'Clean article-only layout with reading progress.',
    emoji: '📄',
    gradient: 'from-sky-400 to-blue-500',
    enableMsg: 'ENABLE_READER_VIEW',
    disableMsg: 'DISABLE_READER_VIEW',
  },
  {
    key: 'toc',
    title: 'Table of Contents',
    description: 'Auto-generated heading outline for navigation.',
    emoji: '📑',
    gradient: 'from-emerald-400 to-green-500',
    enableMsg: 'ENABLE_TOC',
    disableMsg: 'DISABLE_TOC',
  },
  {
    key: 'ruler',
    title: 'Reading Ruler',
    description: 'Line-focus band follows cursor to prevent skipping.',
    emoji: '📏',
    gradient: 'from-indigo-400 to-violet-500',
    enableMsg: 'ENABLE_RULER',
    disableMsg: 'DISABLE_RULER',
  },
  {
    key: 'tts',
    title: 'Read Aloud (TTS)',
    description: 'Text-to-speech with word-by-word highlighting.',
    emoji: '🔊',
    gradient: 'from-rose-400 to-pink-500',
    enableMsg: 'START_TTS',
    disableMsg: 'STOP_TTS',
  },
  {
    key: 'mediaHider',
    title: 'Hide Media',
    description: 'Blur images & videos — hover to reveal.',
    emoji: '🖼️',
    gradient: 'from-amber-400 to-orange-500',
    enableMsg: 'ENABLE_MEDIA_HIDER',
    disableMsg: 'DISABLE_MEDIA_HIDER',
  },
];

// ─── Typography Defaults ─────────────────────────────────────────────────────

interface TypoState {
  enabled: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  contrast: 'normal' | 'high' | 'inverted';
}

const DEFAULT_TYPO: TypoState = {
  enabled: false,
  fontSize: 18,
  lineHeight: 1.8,
  letterSpacing: 0,
  contrast: 'normal',
};

// ─── Color Vision State ──────────────────────────────────────────────────────

type CVDType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
type OverlayColor = 'none' | 'yellow' | 'blue' | 'pink' | 'green' | 'peach' | 'aqua';

interface ColorVisionState {
  cvdFilter: CVDType;
  overlay: OverlayColor;
  saturation: number; // 0-200, default 100
}

const DEFAULT_COLOR: ColorVisionState = {
  cvdFilter: 'none',
  overlay: 'none',
  saturation: 100,
};

const STORAGE_KEY_TOOLS = 'ar_tools_state';
const STORAGE_KEY_TYPO = 'ar_typo_state';
const STORAGE_KEY_COLOR = 'ar_color_state';

// ─── CVD Info ────────────────────────────────────────────────────────────────

const CVD_OPTIONS: { key: CVDType; label: string; description: string; color: string }[] = [
  { key: 'none', label: 'Off', description: 'No filter', color: 'bg-slate-100 text-slate-600' },
  { key: 'protanopia', label: 'Protanopia', description: 'Red-weak', color: 'bg-red-500 text-white' },
  { key: 'deuteranopia', label: 'Deuteranopia', description: 'Green-weak', color: 'bg-green-500 text-white' },
  { key: 'tritanopia', label: 'Tritanopia', description: 'Blue-weak', color: 'bg-blue-500 text-white' },
];

const OVERLAY_OPTIONS: { key: OverlayColor; label: string; swatch: string }[] = [
  { key: 'none', label: 'Off', swatch: 'bg-slate-200' },
  { key: 'yellow', label: 'Yellow', swatch: 'bg-yellow-200' },
  { key: 'blue', label: 'Blue', swatch: 'bg-blue-200' },
  { key: 'pink', label: 'Pink', swatch: 'bg-pink-200' },
  { key: 'green', label: 'Green', swatch: 'bg-green-200' },
  { key: 'peach', label: 'Peach', swatch: 'bg-orange-200' },
  { key: 'aqua', label: 'Aqua', swatch: 'bg-teal-200' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ToolsTab() {
  const [toggles, setToggles] = useState<Record<FeatureKey, boolean>>({
    ruler: false,
    readerView: false,
    toc: false,
    tts: false,
    mediaHider: false,
    darkMode: false,
  });
  const [typo, setTypo] = useState<TypoState>(DEFAULT_TYPO);
  const [colorState, setColorState] = useState<ColorVisionState>(DEFAULT_COLOR);
  const [ttsRate, setTtsRate] = useState<number>(0.9);
  const [initialized, setInitialized] = useState(false);

  // Load persisted state
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY_TOOLS, STORAGE_KEY_TYPO, STORAGE_KEY_COLOR, 'ar_tts_rate'], (result) => {
      if (result[STORAGE_KEY_TOOLS]) setToggles(prev => ({ ...prev, ...result[STORAGE_KEY_TOOLS] }));
      if (result[STORAGE_KEY_TYPO]) setTypo(prev => ({ ...prev, ...result[STORAGE_KEY_TYPO] }));
      if (result[STORAGE_KEY_COLOR]) setColorState(prev => ({ ...prev, ...result[STORAGE_KEY_COLOR] }));
      if (result.ar_tts_rate) setTtsRate(result.ar_tts_rate);
      setInitialized(true);
    });
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!initialized) return;
    chrome.storage.local.set({
      [STORAGE_KEY_TOOLS]: toggles,
      [STORAGE_KEY_TYPO]: typo,
      [STORAGE_KEY_COLOR]: colorState,
      ar_tts_rate: ttsRate,
    });
  }, [toggles, typo, colorState, ttsRate, initialized]);

  // Re-apply active tools on panel open
  useEffect(() => {
    if (!initialized) return;
    const activeFeatures = FEATURES.filter(f => toggles[f.key]);
    for (const feature of activeFeatures) {
      sendToContent(feature.enableMsg);
    }
    if (typo.enabled) {
      sendToContent('APPLY_TYPOGRAPHY', {
        settings: {
          fontSize: typo.fontSize,
          lineHeight: typo.lineHeight,
          letterSpacing: typo.letterSpacing,
          contrast: typo.contrast,
        },
      });
    }
    if (colorState.cvdFilter !== 'none') {
      sendToContent('APPLY_CVD_FILTER', { cvdType: colorState.cvdFilter });
    }
    if (colorState.overlay !== 'none') {
      sendToContent('APPLY_COLOR_OVERLAY', { color: colorState.overlay });
    }
    if (colorState.saturation !== 100) {
      sendToContent('APPLY_SATURATION', { level: colorState.saturation });
    }
    sendToContent('SET_TTS_RATE', { rate: ttsRate });
  }, [initialized]);

  const sendToContent = useCallback(async (msgType: string, extra?: any) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: msgType, ...extra });
      } catch {
        // Content script may not be loaded yet
      }
    }
  }, []);

  const toggleFeature = useCallback((feature: FeatureConfig) => {
    const isActive = toggles[feature.key];

    // Mutual exclusions
    if (!isActive && feature.key === 'tts' && toggles.readerView) {
      sendToContent('DISABLE_READER_VIEW');
      setToggles(prev => ({ ...prev, readerView: false }));
    }
    if (!isActive && feature.key === 'readerView' && toggles.tts) {
      sendToContent('STOP_TTS');
      setToggles(prev => ({ ...prev, tts: false }));
    }

    setToggles(prev => ({ ...prev, [feature.key]: !isActive }));
    sendToContent(isActive ? feature.disableMsg : feature.enableMsg);
  }, [toggles, sendToContent]);

  const updateTypo = useCallback((update: Partial<TypoState>) => {
    const newTypo = { ...typo, ...update };
    setTypo(newTypo);
    if (newTypo.enabled) {
      sendToContent('APPLY_TYPOGRAPHY', {
        settings: {
          fontSize: newTypo.fontSize,
          lineHeight: newTypo.lineHeight,
          letterSpacing: newTypo.letterSpacing,
          contrast: newTypo.contrast,
        },
      });
    }
  }, [typo, sendToContent]);

  const toggleTypo = useCallback(() => {
    const newEnabled = !typo.enabled;
    setTypo(prev => ({ ...prev, enabled: newEnabled }));
    if (newEnabled) {
      sendToContent('APPLY_TYPOGRAPHY', {
        settings: {
          fontSize: typo.fontSize,
          lineHeight: typo.lineHeight,
          letterSpacing: typo.letterSpacing,
          contrast: typo.contrast,
        },
      });
    } else {
      sendToContent('REMOVE_TYPOGRAPHY');
    }
  }, [typo, sendToContent]);

  // ── Color Vision Handlers ──

  const setCVDFilter = useCallback((cvdType: CVDType) => {
    setColorState(prev => ({ ...prev, cvdFilter: cvdType }));
    if (cvdType === 'none') {
      sendToContent('REMOVE_CVD_FILTER');
    } else {
      sendToContent('APPLY_CVD_FILTER', { cvdType });
    }
  }, [sendToContent]);

  const setOverlay = useCallback((color: OverlayColor) => {
    setColorState(prev => ({ ...prev, overlay: color }));
    if (color === 'none') {
      sendToContent('REMOVE_COLOR_OVERLAY');
    } else {
      sendToContent('APPLY_COLOR_OVERLAY', { color });
    }
  }, [sendToContent]);

  const setSaturation = useCallback((level: number) => {
    setColorState(prev => ({ ...prev, saturation: level }));
    if (level === 100) {
      sendToContent('REMOVE_SATURATION');
    } else {
      sendToContent('APPLY_SATURATION', { level });
    }
  }, [sendToContent]);

  const handleTtsRateChange = useCallback((rate: number) => {
    setTtsRate(rate);
    sendToContent('SET_TTS_RATE', { rate });
    // If TTS is currently speaking, we could restart it, but for simplicity
    // we'll let it apply on the next sentence/restart or if the user toggles it.
  }, [sendToContent]);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Feature Toggles */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Accessibility Tools
        </h2>
        {FEATURES.map((feature, i) => {
          const isActive = toggles[feature.key];
          return (
            <button
              key={feature.key}
              id={`toggle-${feature.key}`}
              onClick={() => toggleFeature(feature)}
              className={`flex items-center justify-between p-4 mb-3 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
                isActive
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-xl shadow-sm`}>
                  {feature.emoji}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{feature.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{feature.description}</div>
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

        {/* TTS Speed Controller (Shows only if TTS is enabled) */}
        {toggles.tts && (
          <div className="glass-card rounded-xl p-4 mb-3 animate-fade-in border-l-4 border-rose-500">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Reading Speed</span>
              <span className="font-mono text-rose-600 font-bold">{ttsRate.toFixed(1)}x</span>
            </div>
            <div className="text-[10px] text-slate-400 mb-2">Adjust speech rate. Restart TTS to apply.</div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={ttsRate}
              onChange={e => handleTtsRateChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Color Vision Section ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          👁️ Color Vision
        </h2>

        {/* CVD Correction */}
        <div className="glass-card rounded-xl p-4 mb-3">
          <div className="text-xs font-semibold text-slate-700 mb-1">Color Blindness Correction</div>
          <div className="text-[10px] text-slate-400 mb-3">Adjusts colors for color vision deficiency.</div>
          <div className="grid grid-cols-2 gap-2">
            {CVD_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setCVDFilter(opt.key)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  colorState.cvdFilter === opt.key
                    ? opt.key === 'none'
                      ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-400'
                      : `${opt.color} ring-1 ring-offset-1 ring-slate-300 shadow-md`
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[9px] opacity-75 font-normal mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Overlay */}
        <div className="glass-card rounded-xl p-4 mb-3">
          <div className="text-xs font-semibold text-slate-700 mb-1">Reading Tint Overlay</div>
          <div className="text-[10px] text-slate-400 mb-3">Colored overlay to reduce glare & visual stress.</div>
          <div className="flex gap-2 flex-wrap">
            {OVERLAY_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setOverlay(opt.key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  colorState.overlay === opt.key
                    ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-md'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-full ${opt.swatch} border border-slate-300 shadow-sm`} />
                <span className="text-[10px] text-slate-600 font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saturation Control */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">Color Saturation</span>
            <span className="font-mono text-indigo-600 font-bold">{colorState.saturation}%</span>
          </div>
          <div className="text-[10px] text-slate-400 mb-2">0% = grayscale, 100% = normal, 200% = vivid</div>
          <input
            type="range"
            min="0"
            max="200"
            step="10"
            value={colorState.saturation}
            onChange={e => setSaturation(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>Grayscale</span>
            <span>Normal</span>
            <span>Vivid</span>
          </div>
        </div>
      </div>

      {/* Typography Controls */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Typography
        </h2>

        {/* Enable toggle */}
        <button
          onClick={toggleTypo}
          className={`flex items-center justify-between p-4 mb-3 rounded-xl border shadow-sm transition-all duration-200 w-full text-left group hover:shadow-md ${
            typo.enabled
              ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center text-xl shadow-sm">
              🔤
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Custom Typography</div>
              <div className="text-xs text-slate-500">Font size, spacing, contrast controls.</div>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 shrink-0 ml-2 ${
            typo.enabled ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
              typo.enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
        </button>

        {/* Sliders (shown when enabled) */}
        {typo.enabled && (
          <div className="glass-card rounded-xl p-4 space-y-4 animate-fade-in">
            {/* Font Size */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Font Size</span>
                <span className="font-mono text-indigo-600 font-bold">{typo.fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="32"
                step="1"
                value={typo.fontSize}
                onChange={e => updateTypo({ fontSize: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Line Height */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Line Height</span>
                <span className="font-mono text-indigo-600 font-bold">{typo.lineHeight.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="3.0"
                step="0.1"
                value={typo.lineHeight}
                onChange={e => updateTypo({ lineHeight: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Letter Spacing */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Letter Spacing</span>
                <span className="font-mono text-indigo-600 font-bold">{typo.letterSpacing.toFixed(2)}em</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={typo.letterSpacing}
                onChange={e => updateTypo({ letterSpacing: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Contrast</div>
              <div className="flex gap-2">
                {(['normal', 'high', 'inverted'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateTypo({ contrast: mode })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      typo.contrast === mode
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
