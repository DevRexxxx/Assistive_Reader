import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CVD_MATRICES,
  DEFAULT_CONFUSABLE_RULES,
  OVERLAY_COLORS,
  buildCssFilterStrings,
  chunkTextIntoCards,
  computeReadability,
  extractKeySentences,
  formatMatrixString,
  lookupWord,
  segmentBionicWord,
  segmentConfusableLetters,
  segmentTextWithSyllables,
  splitSentences,
  type ConfusableColorRule,
  type DictionaryEntry,
  type ProfileFontFamily,
} from '@assistivereader/core';
import { documentToBodyText, parseRawTextToDocument, type ReaderDocument } from '../data/sampleDocuments';
import type { AssistiveStore } from '../state/useAssistiveStore';

interface ReaderWorkspaceProps {
  store: AssistiveStore;
  onOpenLicense: () => void;
}

const FONT_CSS_MAP: Record<ProfileFontFamily, string> = {
  system: 'system-ui, -apple-system, sans-serif',
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  opendyslexic: "'OpenDyslexic', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const CONFUSABLE_PALETTE = [
  { color: '#1d4ed8', background: 'rgba(219, 234, 254, 0.85)' },
  { color: '#b91c1c', background: 'rgba(254, 226, 226, 0.85)' },
  { color: '#047857', background: 'rgba(209, 250, 229, 0.85)' },
  { color: '#7e22ce', background: 'rgba(243, 232, 255, 0.85)' },
];

function LocalIllustration({ kind }: { kind: 'fixation' | 'solar' | 'architecture' }) {
  if (kind === 'solar') {
    return (
      <svg viewBox="0 0 420 140" className="w-full h-36 rounded-xl bg-slate-900 p-2" role="img" aria-label="Diagram of concentric planetary orbits around the Sun">
        <circle cx="60" cy="70" r="24" fill="#f59e0b" />
        <ellipse cx="210" cy="70" rx="180" ry="52" fill="none" stroke="#475569" strokeDasharray="4 4" />
        <ellipse cx="165" cy="70" rx="125" ry="36" fill="none" stroke="#64748b" strokeDasharray="4 4" />
        <circle cx="135" cy="40" r="7" fill="#38bdf8" />
        <circle cx="290" cy="70" r="10" fill="#fb7185" />
        <circle cx="360" cy="48" r="13" fill="#a78bfa" />
      </svg>
    );
  }
  if (kind === 'architecture') {
    return (
      <svg viewBox="0 0 420 140" className="w-full h-36 rounded-xl bg-indigo-50 border border-indigo-200 p-2" role="img" aria-label="Diagram of Core, Adapters, and Platform UI layers">
        <rect x="20" y="25" width="110" height="90" rx="10" fill="#4f46e5" />
        <text x="75" y="74" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">Pure Core</text>
        <rect x="155" y="25" width="110" height="90" rx="10" fill="#0ea5e9" />
        <text x="210" y="74" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">Adapters</text>
        <rect x="290" y="25" width="110" height="90" rx="10" fill="#10b981" />
        <text x="345" y="74" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">Local UI</text>
        <line x1="130" y1="70" x2="155" y2="70" stroke="#334155" strokeWidth="2.5" />
        <line x1="265" y1="70" x2="290" y2="70" stroke="#334155" strokeWidth="2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 420 140" className="w-full h-36 rounded-xl bg-emerald-50 border border-emerald-200 p-2" role="img" aria-label="Diagram illustrating fixation points across a line of text">
      <rect x="24" y="34" width="372" height="72" rx="12" fill="#ffffff" stroke="#cbd5e1" />
      <circle cx="72" cy="70" r="14" fill="#4f46e5" opacity="0.2" />
      <circle cx="164" cy="70" r="14" fill="#4f46e5" opacity="0.2" />
      <circle cx="268" cy="70" r="14" fill="#4f46e5" opacity="0.2" />
      <circle cx="348" cy="70" r="14" fill="#4f46e5" opacity="0.2" />
      <text x="48" y="75" fill="#0f172a" fontSize="15" fontWeight="700">Re<tspan fontWeight="400">ad</tspan>  sm<tspan fontWeight="400">oother</tspan>  wi<tspan fontWeight="400">th</tspan>  an<tspan fontWeight="400">chors</tspan></text>
    </svg>
  );
}

export function ReaderWorkspace({ store, onOpenLicense }: ReaderWorkspaceProps) {
  const {
    settings,
    resolvedProfile,
    documents,
    activeDocument,
    setActiveDocId,
    addCustomDocument,
    toggleTool,
    ttsActiveSentenceIndex,
    canUse,
  } = store;

  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteBody, setPasteBody] = useState('');
  const [showKeySentences, setShowKeySentences] = useState(false);
  const [showReadabilityDetail, setShowReadabilityDetail] = useState(false);
  const [focusedSentenceIdx, setFocusedSentenceIdx] = useState(0);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    entry: DictionaryEntry | null;
  } | null>(null);
  const [rulerY, setRulerY] = useState(220);
  const [readerScrollPct, setReaderScrollPct] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const bodyText = useMemo(() => documentToBodyText(activeDocument), [activeDocument]);
  const sentences = useMemo(() => splitSentences(bodyText), [bodyText]);
  const chunks = useMemo(() => chunkTextIntoCards(bodyText, settings.sentencesPerCard), [bodyText, settings.sentencesPerCard]);
  const readability = useMemo(() => computeReadability(bodyText), [bodyText]);
  const keySentences = useMemo(() => extractKeySentences(bodyText, 3), [bodyText]);

  // Reset indices on document change
  useEffect(() => {
    setFocusedSentenceIdx(0);
    setChunkIdx(0);
    setSelectedWordInfo(null);
  }, [activeDocument.id]);

  // Arrow key support for Reading Ruler & Sentence/Chunk step
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (settings.tools.ruler) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setRulerY((y) => Math.min(680, y + 26));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setRulerY((y) => Math.max(40, y - 26));
        }
      }
      if (settings.readingMode === 'sentenceFocus') {
        if (e.key === 'ArrowRight') setFocusedSentenceIdx((i) => Math.min(sentences.length - 1, i + 1));
        if (e.key === 'ArrowLeft') setFocusedSentenceIdx((i) => Math.max(0, i - 1));
      } else if (settings.readingMode === 'chunkCards') {
        if (e.key === 'ArrowRight') setChunkIdx((i) => Math.min(chunks.length - 1, i + 1));
        if (e.key === 'ArrowLeft') setChunkIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.tools.ruler, settings.readingMode, sentences.length, chunks.length]);

  const confusableRules: ConfusableColorRule[] = useMemo(() => {
    const chars = Array.from(new Set((settings.confusableChars || 'bdpq').split('').filter((c) => /[a-z]/i.test(c)))).slice(0, 4);
    if (chars.length === 0) return DEFAULT_CONFUSABLE_RULES;
    return chars.map((ch, idx) => ({
      char: ch,
      color: CONFUSABLE_PALETTE[idx % CONFUSABLE_PALETTE.length].color,
      background: CONFUSABLE_PALETTE[idx % CONFUSABLE_PALETTE.length].background,
    }));
  }, [settings.confusableChars]);

  const renderConfusableWord = useCallback(
    (piece: string, keyPrefix: string) => {
      if (!settings.confusableLetters || !canUse('confusableLetters')) {
        return piece;
      }
      const segs = segmentConfusableLetters(piece, confusableRules);
      return segs.map((seg, idx) =>
        seg.rule ? (
          <span
            key={`${keyPrefix}-c-${idx}`}
            style={{
              color: seg.rule.color,
              backgroundColor: seg.rule.background,
              borderRadius: '3px',
              padding: '0 1px',
              fontWeight: 700,
            }}
          >
            {seg.text}
          </span>
        ) : (
          <React.Fragment key={`${keyPrefix}-c-${idx}`}>{seg.text}</React.Fragment>
        )
      );
    },
    [canUse, confusableRules, settings.confusableLetters]
  );

  const handleWordClick = useCallback(
    (rawToken: string) => {
      const clean = rawToken.replace(/[^A-Za-z-]/g, '');
      if (!clean) return;
      if (!canUse('offlineDictionary')) {
        onOpenLicense();
        return;
      }
      const entry = lookupWord(clean);
      setSelectedWordInfo({ word: clean, entry });
    },
    [canUse, onOpenLicense]
  );

  const renderTransformedText = useCallback(
    (text: string, keyBase: string) => {
      const syllableEnabled = settings.syllableMode !== 'off' && canUse('syllableSplitting');
      const bionicEnabled = settings.bionicReading;

      if (syllableEnabled) {
        const tokens = segmentTextWithSyllables(text, 'en');
        return tokens.map((tok, idx) => {
          if (tok.isWhitespace) {
            return <React.Fragment key={`${keyBase}-ws-${idx}`}>{tok.raw}</React.Fragment>;
          }
          return (
            <span
              key={`${keyBase}-w-${idx}`}
              onClick={() => handleWordClick(tok.raw)}
              className="cursor-pointer hover:underline decoration-indigo-300 underline-offset-2"
            >
              {tok.leading}
              {tok.syllables.map((syl, sIdx) => {
                const altColor =
                  settings.syllableMode === 'alternating'
                    ? sIdx % 2 === 0
                      ? '#3730a3'
                      : '#0f766e'
                    : undefined;
                return (
                  <React.Fragment key={`${keyBase}-syl-${idx}-${sIdx}`}>
                    {sIdx > 0 && settings.syllableMode === 'middot' && (
                      <span className="text-indigo-500 font-bold mx-[1px]" aria-hidden="true">·</span>
                    )}
                    <span style={altColor ? { color: altColor, fontWeight: 600 } : undefined}>
                      {renderConfusableWord(syl.text, `${keyBase}-${idx}-${sIdx}`)}
                    </span>
                  </React.Fragment>
                );
              })}
              {tok.trailing}
            </span>
          );
        });
      }

      // Standard or Bionic word rendering
      const parts = text.split(/(\s+)/).filter(Boolean);
      return parts.map((part, idx) => {
        if (/^\s+$/.test(part)) {
          return <React.Fragment key={`${keyBase}-ws-${idx}`}>{part}</React.Fragment>;
        }
        if (bionicEnabled) {
          const b = segmentBionicWord(part);
          return (
            <span
              key={`${keyBase}-bw-${idx}`}
              onClick={() => handleWordClick(part)}
              className="cursor-pointer hover:underline decoration-indigo-300 underline-offset-2"
            >
              {b.leadingPunctuation}
              {b.bold && <strong className="font-extrabold">{renderConfusableWord(b.bold, `${keyBase}-bb-${idx}`)}</strong>}
              {b.normal && renderConfusableWord(b.normal, `${keyBase}-bn-${idx}`)}
              {b.trailingPunctuation}
            </span>
          );
        }
        return (
          <span
            key={`${keyBase}-pw-${idx}`}
            onClick={() => handleWordClick(part)}
            className="cursor-pointer hover:underline decoration-indigo-300 underline-offset-2"
          >
            {renderConfusableWord(part, `${keyBase}-pc-${idx}`)}
          </span>
        );
      });
    },
    [canUse, handleWordClick, renderConfusableWord, settings.bionicReading, settings.syllableMode]
  );

  // Compute combined style for reading surface from declarative Profile + Typography overrides
  const surfaceStyle = useMemo(() => {
    const baseFontFamily = settings.typography.enabled
      ? FONT_CSS_MAP[settings.typography.fontFamily]
      : resolvedProfile
        ? FONT_CSS_MAP[resolvedProfile.fontFamily]
        : FONT_CSS_MAP.inter;

    const fontSizePx = settings.typography.enabled
      ? settings.typography.fontSize
      : resolvedProfile
        ? Math.round(18 * resolvedProfile.fontScale)
        : 18;

    const lineHeight = settings.typography.enabled
      ? settings.typography.lineHeight
      : resolvedProfile?.lineHeight ?? 1.75;

    const letterSpacing = settings.typography.enabled
      ? settings.typography.letterSpacing
      : resolvedProfile?.letterSpacing ?? 0;

    const wordSpacing = settings.typography.enabled
      ? settings.typography.wordSpacing
      : resolvedProfile?.wordSpacing ?? 0;

    const maxWidthCh = settings.typography.enabled
      ? settings.typography.maxLineWidthCh
      : resolvedProfile?.maxLineWidthCh ?? 68;

    const contrastMode = settings.typography.enabled
      ? settings.typography.contrast
      : resolvedProfile?.contrast ?? 'normal';

    let background = resolvedProfile?.background ?? '#ffffff';
    let color = resolvedProfile?.textColor ?? '#0f172a';
    if (contrastMode === 'high') {
      background = '#ffffff';
      color = '#000000';
    }

    const activeSaturation =
      settings.colorVision.saturation !== 100
        ? settings.colorVision.saturation
        : resolvedProfile?.saturation ?? 100;

    const filters = buildCssFilterStrings({
      darkMode: settings.tools.darkMode || contrastMode === 'inverted',
      cvd: settings.colorVision.cvdFilter,
      saturation: activeSaturation,
    });

    return {
      container: {
        backgroundColor: background,
        color,
        filter: filters.surfaceFilter === 'none' ? undefined : filters.surfaceFilter,
        transition: resolvedProfile?.disableAnimations ? 'none' : 'background-color 0.2s ease',
      } as React.CSSProperties,
      column: {
        fontFamily: baseFontFamily,
        fontSize: `${fontSizePx}px`,
        lineHeight,
        letterSpacing: `${letterSpacing}em`,
        wordSpacing: `${wordSpacing}em`,
        maxWidth: `${maxWidthCh}ch`,
      } as React.CSSProperties,
      mediaCounterFilter: filters.mediaCounterFilter,
    };
  }, [resolvedProfile, settings.colorVision, settings.tools.darkMode, settings.typography]);

  const activeOverlay =
    settings.colorVision.overlay !== 'none'
      ? settings.colorVision.overlay
      : resolvedProfile?.overlay && resolvedProfile.overlay !== 'none'
        ? resolvedProfile.overlay
        : 'none';

  // Local file upload / drag-and-drop handler
  const handleFileText = async (file: File) => {
    const raw = await file.text();
    let extracted = raw;
    if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'text/html');
      doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
      extracted = doc.body?.textContent || raw;
    }
    const title = file.name.replace(/\.[^.]+$/, '');
    addCustomDocument(parseRawTextToDocument(title, extracted));
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteBody.trim()) return;
    addCustomDocument(parseRawTextToDocument(pasteTitle || 'Pasted Reading Text', pasteBody));
    setPasteModalOpen(false);
    setPasteTitle('');
    setPasteBody('');
  };

  const headingsForToc = activeDocument.sections.filter((s) => Boolean(s.heading));
  const adhdDimmingActive = (resolvedProfile?.dimLevel ?? 0) > 0 && settings.readingMode === 'full';
  const hideMediaActive = settings.tools.mediaHider;

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 relative ${
        settings.tools.readerView ? 'fixed inset-0 z-40 bg-stone-50' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileText(file);
      }}
    >
      {/* Inline SVG CVD Filter Definitions */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          {Object.values(CVD_MATRICES).map((def) => (
            <filter key={def.type} id={`ar-cvd-${def.type}`}>
              <feColorMatrix type="matrix" values={formatMatrixString(def.matrix)} />
            </filter>
          ))}
        </defs>
      </svg>

      {/* Reader View Progress Bar */}
      {settings.tools.readerView && (
        <div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-600 to-violet-600 z-50 transition-all"
          style={{ width: `${readerScrollPct}%` }}
          aria-hidden="true"
        />
      )}

      {/* Workspace Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="doc-select" className="sr-only">
            Select reading passage
          </label>
          <select
            id="doc-select"
            value={activeDocument.id}
            onChange={(e) => setActiveDocId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 max-w-[230px] sm:max-w-[300px]"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.category}: {doc.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            Paste Text
          </button>

          <input
            ref={fileUploadRef}
            type="file"
            accept=".txt,.md,.html,.htm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileText(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileUploadRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Upload File
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Readability Indicator */}
          <button
            type="button"
            onClick={() => {
              if (!canUse('readabilityMetrics')) {
                onOpenLicense();
                return;
              }
              setShowReadabilityDetail((v) => !v);
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
            title="Deterministic readability metrics"
          >
            {readability.band} · {readability.wordCount} words · {readability.estimatedReadTimeMinutes}m read
          </button>

          {/* Extractive Key Sentences */}
          <button
            type="button"
            aria-expanded={showKeySentences}
            onClick={() => {
              if (!canUse('extractiveHighlights')) {
                onOpenLicense();
                return;
              }
              setShowKeySentences((v) => !v);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
              showKeySentences
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Key Sentences
          </button>

          {settings.tools.readerView && (
            <button
              type="button"
              onClick={() => toggleTool('readerView')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              ✕ Exit Reader View
            </button>
          )}
        </div>
      </div>

      {/* Expandable Readability Metrics */}
      {showReadabilityDetail && canUse('readabilityMetrics') && (
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-950 flex flex-wrap gap-4 items-center">
          <span><strong>Flesch Ease:</strong> {readability.fleschReadingEase}/100</span>
          <span><strong>Flesch-Kincaid Grade:</strong> {readability.fleschKincaidGrade}</span>
          <span><strong>Gunning Fog:</strong> {readability.gunningFogIndex}</span>
          <span><strong>SMOG:</strong> {readability.smogIndex}</span>
          <span className="text-[11px] text-emerald-800">Computed locally via deterministic syllable formulas.</span>
        </div>
      )}

      {/* Extractive Key Sentences Drawer */}
      {showKeySentences && canUse('extractiveHighlights') && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950">
              Key Sentences (Extractive TextRank · Rule-Based · No AI)
            </span>
            <button
              type="button"
              onClick={() => setShowKeySentences(false)}
              className="text-xs text-amber-800 hover:underline"
            >
              Hide
            </button>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-5">
            {keySentences.map((ks) => (
              <li key={ks.sentenceIndex}>{ks.text}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Reading Surface */}
      <div
        ref={surfaceRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollHeight - el.clientHeight;
          setReaderScrollPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
        }}
        onMouseMove={(e) => {
          if (!settings.tools.ruler || !surfaceRef.current) return;
          const rect = surfaceRef.current.getBoundingClientRect();
          setRulerY(e.clientY - rect.top);
        }}
        style={surfaceStyle.container}
        className="flex-1 overflow-y-auto relative px-6 py-8 md:px-12"
      >
        {/* Reading Tint Overlay */}
        {activeOverlay !== 'none' && (
          <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none z-20"
            style={{
              backgroundColor: OVERLAY_COLORS[activeOverlay].rgba,
              mixBlendMode: 'multiply',
            }}
          />
        )}

        {/* Reading Ruler Band */}
        {settings.tools.ruler && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-0 z-10 overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 bg-slate-950/35"
              style={{ height: `${Math.max(0, rulerY - 48)}px` }}
            />
            <div
              className="absolute inset-x-0 border-y-2 border-indigo-500/70 bg-indigo-500/5"
              style={{ top: `${Math.max(0, rulerY - 48)}px`, height: '96px' }}
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-slate-950/35"
              style={{ top: `${Math.max(0, rulerY - 48) + 96}px` }}
            />
          </div>
        )}

        {/* Sticky Table of Contents */}
        {settings.tools.toc && headingsForToc.length > 0 && (
          <nav
            aria-label="Table of Contents"
            className="mb-6 lg:float-right lg:ml-6 lg:w-60 rounded-xl border border-slate-200 bg-white/95 text-slate-800 p-3.5 shadow-md sticky top-2 z-20"
          >
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">📑 Contents</span>
              <button
                type="button"
                onClick={() => toggleTool('toc')}
                aria-label="Close Table of Contents"
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1 text-xs">
              {headingsForToc.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className="block py-1 px-2 rounded hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {sec.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Drag overlay */}
        {dragActive && (
          <div className="fixed inset-0 z-50 bg-indigo-600/20 border-4 border-dashed border-indigo-600 flex items-center justify-center pointer-events-none">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl text-sm font-bold text-indigo-900">
              Drop .txt, .md, or .html file to open locally
            </div>
          </div>
        )}

        {/* Reading Column */}
        <article style={surfaceStyle.column} className="mx-auto relative z-0">
          <header className="mb-6 pb-4 border-b border-slate-200/70">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              {activeDocument.category}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2">
              {activeDocument.title}
            </h1>
            {activeDocument.subtitle && (
              <p className="text-sm opacity-80 leading-relaxed">{activeDocument.subtitle}</p>
            )}
          </header>

          {/* Reading Mode 1: Sentence Focus */}
          {settings.readingMode === 'sentenceFocus' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-indigo-50 text-indigo-900 px-3 py-2 rounded-lg border border-indigo-200">
                <span>
                  Sentence <strong>{focusedSentenceIdx + 1}</strong> of <strong>{sentences.length}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={focusedSentenceIdx === 0}
                    onClick={() => setFocusedSentenceIdx((i) => Math.max(0, i - 1))}
                    className="px-2.5 py-1 rounded bg-white border border-indigo-200 font-semibold disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={focusedSentenceIdx >= sentences.length - 1}
                    onClick={() => setFocusedSentenceIdx((i) => Math.min(sentences.length - 1, i + 1))}
                    className="px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {sentences.map((sent, idx) => {
                  const isCurrent = idx === focusedSentenceIdx || idx === ttsActiveSentenceIndex;
                  return (
                    <p
                      key={idx}
                      onClick={() => setFocusedSentenceIdx(idx)}
                      className={`p-3 rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'opacity-100 bg-indigo-50/70 ring-2 ring-indigo-400 shadow-sm'
                          : 'opacity-25 hover:opacity-60'
                      }`}
                    >
                      {renderTransformedText(sent, `sf-${idx}`)}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reading Mode 2: Chunked Cards */}
          {settings.readingMode === 'chunkCards' && chunks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  Card <strong>{chunkIdx + 1}</strong> of <strong>{chunks.length}</strong> ({chunks[chunkIdx]?.wordCount} words)
                </span>
                <span className="text-[11px]">Use ← / → keys or buttons</span>
              </div>

              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((chunkIdx + 1) / chunks.length) * 100}%` }}
                />
              </div>

              <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-white/95 text-slate-900 shadow-md min-h-[180px] flex items-center">
                <p className="leading-relaxed">
                  {renderTransformedText(chunks[chunkIdx]?.text || '', `chunk-${chunkIdx}`)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={chunkIdx === 0}
                  onClick={() => setChunkIdx((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={chunkIdx >= chunks.length - 1}
                  onClick={() => setChunkIdx((i) => Math.min(chunks.length - 1, i + 1))}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Next Card →
                </button>
              </div>
            </div>
          )}

          {/* Reading Mode 3: Full Article */}
          {settings.readingMode === 'full' && (
            <div className="space-y-6">
              {activeDocument.sections.map((section, sIdx) => (
                <section key={section.id} id={section.id} className="space-y-3">
                  {section.heading && (
                    <h2 className="text-xl font-bold tracking-tight mt-4">
                      {section.heading}
                    </h2>
                  )}

                  {section.paragraphs.map((para, pIdx) => {
                    const paraSentences = splitSentences(para);
                    return (
                      <p
                        key={pIdx}
                        className={`rounded-lg transition-all ${
                          adhdDimmingActive
                            ? 'opacity-35 hover:opacity-100 focus-within:opacity-100 p-2 -mx-2 hover:bg-indigo-50/40'
                            : ''
                        }`}
                      >
                        {paraSentences.map((sent, sentIdx) => {
                          const globalIdx = sentences.indexOf(sent);
                          const isSpeaking =
                            settings.tools.tts && ttsActiveSentenceIndex >= 0 && globalIdx === ttsActiveSentenceIndex;
                          return (
                            <span
                              key={sentIdx}
                              className={isSpeaking ? 'bg-yellow-200/80 text-slate-950 rounded px-1' : ''}
                            >
                              {renderTransformedText(sent, `p-${sIdx}-${pIdx}-${sentIdx}`)}{' '}
                            </span>
                          );
                        })}
                      </p>
                    );
                  })}

                  {section.illustration && (
                    <div
                      className={`relative group my-4 rounded-xl overflow-hidden ${
                        hideMediaActive ? 'cursor-pointer' : ''
                      }`}
                      style={{
                        filter:
                          surfaceStyle.mediaCounterFilter !== 'none'
                            ? surfaceStyle.mediaCounterFilter
                            : undefined,
                      }}
                    >
                      <div
                        className={
                          hideMediaActive
                            ? 'grayscale brightness-75 blur-md opacity-30 group-hover:grayscale-0 group-hover:brightness-100 group-hover:blur-none group-hover:opacity-100 transition-all duration-300'
                            : ''
                        }
                      >
                        <LocalIllustration kind={section.illustration} />
                      </div>
                      {hideMediaActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                          <span className="px-3 py-1.5 rounded-lg bg-slate-900/80 text-white text-xs font-semibold">
                            🖼️ Hover to reveal diagram
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* Offline Dictionary Popover (rendered outside surface filter/scroll box) */}
      {selectedWordInfo && (
        <div
          role="dialog"
          aria-label={`Dictionary entry for ${selectedWordInfo.word}`}
          className="fixed bottom-20 left-4 md:left-auto md:right-20 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-900 rounded-2xl shadow-2xl border-2 border-indigo-200 p-4"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-extrabold text-indigo-700">
                {selectedWordInfo.entry?.word || selectedWordInfo.word}
              </span>
              {selectedWordInfo.entry && (
                <span className="ml-2 text-xs font-medium text-slate-500">
                  {selectedWordInfo.entry.pos} · {selectedWordInfo.entry.pronunciation}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedWordInfo(null)}
              aria-label="Close dictionary popup"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
          {selectedWordInfo.entry ? (
            <p className="text-xs text-slate-700 leading-relaxed">{selectedWordInfo.entry.definition}</p>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              Not found in the bundled compact offline dictionary. (Tip: try terms like <em>dyslexia</em>,{' '}
              <em>cognition</em>, <em>fixation</em>, <em>syllable</em>, or <em>orbit</em>.)
            </p>
          )}
        </div>
      )}

      {/* Paste Text Modal */}
      {pasteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paste-modal-title"
        >
          <form
            onSubmit={handlePasteSubmit}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 id="paste-modal-title" className="text-sm font-bold text-slate-900">
                Paste Text to Read Locally
              </h2>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                aria-label="Close paste modal"
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <div>
              <label htmlFor="paste-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Title (optional)
              </label>
              <input
                id="paste-title"
                type="text"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Article or study notes title"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label htmlFor="paste-body" className="block text-xs font-semibold text-slate-700 mb-1">
                Passage Text (Markdown headings # / ## supported)
              </label>
              <textarea
                id="paste-body"
                required
                rows={7}
                value={pasteBody}
                onChange={(e) => setPasteBody(e.target.value)}
                placeholder="Paste any article, essay, or notes here. Everything stays on your device."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Open in Reader
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
