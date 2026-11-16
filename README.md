<p align="center">
  <img src="public/icon.png" alt="AssistiveReader Logo" width="128" height="128" />
</p>

<h1 align="center">AssistiveReader</h1>

<p align="center">
  <strong>A privacy-first, offline-capable accessibility reading suite for neurodivergent users — zero AI, zero telemetry, zero remote requests.</strong>
</p>

<p align="center">
  <code>React 18</code> · <code>TypeScript 5</code> · <code>Tailwind CSS 4</code> · <code>Vite 6</code> · <code>Chrome MV3 + Web PWA</code> · <code>WCAG 2.2 AA</code>
</p>

---

## Overview

**AssistiveReader** provides customizable reading support for people with ADHD, dyslexia, autism, sensory sensitivity, and color vision deficiency. It runs 100% locally in both an offline-capable Web PWA reader workspace and a Chrome Manifest V3 extension, built around a shared pure-TypeScript core.

### Non-Negotiable Guarantees

- **Zero AI / Zero Cloud ML**: Every feature uses deterministic, rule-based algorithms (Liang-style hyphenation, TextRank extractive scoring, sRGB WCAG luminance math, readability formulas, and bundled lexicons).
- **Zero Data Leaves the Device**: No analytics, telemetry, crash reporting, remote fonts, CDNs, or network calls. Enforced in CI by `scripts/check-no-network.mjs`.
- **No Accounts Required**: Works completely offline out of the box.
- **Local-First Speech Synthesis**: Inspects `voice.localService === true`, prefers on-device voices, and warns explicitly if only remote browser voices are detected.
- **Offline Ed25519 Licensing**: Signed license keys (`AR1.<payload>.<sig>`) are verified locally with a pure-TypeScript RFC 8032 Ed25519 + SHA-512 verifier—no phone-home.
- **Customizable Support Framing**: Features are presented as customizable reading support options to try, never as medical diagnoses, treatments, or cures.

---

## Architecture

AssistiveReader separates deterministic domain logic from platform DOM/storage APIs across four modular layers:

```
AssistiveReader/
├── packages/
│   ├── core/                      # Pure TypeScript (zero DOM, zero chrome.*, zero network)
│   │   ├── src/profiles/schema.ts # Declarative Profile schema, built-in personas, validator
│   │   ├── src/wizard.ts          # 4-step Calibration Wizard state machine & WCAG contrast math
│   │   ├── src/text/
│   │   │   ├── bionic.ts          # Word fixation anchors (~40% leading bold)
│   │   │   ├── syllables.ts       # Liang-pattern syllable splitter + language pattern registry
│   │   │   ├── confusables.ts     # Mirrored character highlighting (b / d / p / q)
│   │   │   ├── sentences.ts       # Abbreviation/quote-aware splitter & chunk card builder
│   │   │   ├── readability.ts     # Flesch Reading Ease, FK Grade, Gunning Fog, SMOG
│   │   │   └── highlights.ts      # Extractive TextRank + TF key-sentence ranker
│   │   ├── src/color/index.ts     # CVD feColorMatrix presets, tint overlays, saturation clamp
│   │   ├── src/timer/pomodoro.ts  # Drift-free targetEndTimestamp Pomodoro state machine
│   │   ├── src/stats/index.ts     # Daily/weekly rollover, freeze-day streaks, CSV/JSON backup
│   │   ├── src/dictionary/        # Bundled offline dictionary with suffix stemmer
│   │   ├── src/license/           # Pure-TS SHA-512 + Ed25519 offline key verifier
│   │   └── src/__tests__/         # node:test unit suites (text, state, license, wizard)
│   │
│   ├── adapters/                  # Platform abstraction interfaces & implementations
│   │   └── src/                   # LocalStorageAdapter, ChromeStorageAdapter,
│   │                              # WebSpeechTTSAdapter, BrowserExportAdapter, LocalLicenseAdapter
│   │
│   ├── ui/                        # Shared React components & state store (WCAG 2.2 AA)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── AssistiveAppShell.tsx      # Unified Web PWA & Side Panel shell
│   │       │   ├── ReaderWorkspace.tsx        # Local paste/file reader, modes, ruler, dictionary
│   │       │   ├── CalibrationWizard.tsx      # Accessible 4-step font/spacing/color wizard
│   │       │   ├── CalibrationWizardModal.tsx # Modal wrapper with Escape & backdrop dismissal
│   │       │   ├── ModesTab.tsx               # Built-in & custom profiles + reading cues
│   │       │   ├── ToolsTab.tsx               # Focus views, TTS controls, CVD, overlays, typography
│   │       │   ├── TimerTab.tsx               # Timestamp Pomodoro UI with ProgressRing
│   │       │   ├── StatsTab.tsx               # Daily/weekly charts, mode usage, JSON/CSV backup
│   │       │   ├── GoalsTab.tsx               # Daily targets & freeze-day streak tracker
│   │       │   ├── LicenseTab.tsx             # Offline Ed25519 license verification & demo key
│   │       │   └── QuickMenuWidget.tsx        # Floating quick accessibility menu (♿)
│   │       ├── data/sampleDocuments.ts        # Bundled offline sample guides & local parser
│   │       └── state/useAssistiveStore.ts     # Reactive store wiring core + adapters
│   │
│   └── ext-chromium/
│       └── vite.config.ts         # Chrome MV3 extension build config (@crxjs/vite-plugin)
│
├── src/
│   ├── web/main.tsx               # Web PWA entry point (self-hosted fonts & local adapters)
│   ├── background/index.ts        # MV3 service worker (message router, alarms, stats)
│   ├── content/                   # MV3 DOM content script modules
│   ├── sidepanel/                 # MV3 Side Panel entry
│   ├── styles/index.css           # Tailwind CSS v4 + bundled @fontsource/inter & opendyslexic
│   └── utils/                     # Shared extension utilities consuming @assistivereader/core
│
├── public/
│   ├── icon.png                   # Bundled application icon
│   └── manifest.webmanifest       # Offline-ready Web App Manifest
│
├── scripts/
│   ├── check-no-network.mjs       # Static CI check blocking network APIs, CDNs, and core DOM calls
│   ├── generate-license-key.mjs   # Offline CLI for signing AR1 Ed25519 license keys
│   └── generate-icons.mjs         # Icon generation utility
│
├── index.html                     # Web PWA HTML entry point
├── manifest.json                  # Chrome Extension MV3 manifest
├── vite.config.ts                 # Root Web PWA Vite config (port 3000)
└── PROJECT_BRIEF.md               # Architecture & privacy constraints
```

---

## Key Features

### Profiles & Calibration Wizard
- **Built-in Customizable Profiles**: One-click toggles for **ADHD Focus Mode**, **Dyslexia Read Mode**, and **Autism Calm Mode**, defined declaratively in `packages/core/src/profiles/schema.ts`.
- **Interactive Calibration Wizard** (`packages/core/src/wizard.ts` & `packages/ui/src/components/CalibrationWizard.tsx`):
  1. **Typeface**: Side-by-side testing across bundled `Inter`, `OpenDyslexic`, `Georgia Serif`, and `Fixed-Width Mono`.
  2. **Spacing & Scale**: Presets (`Compact`, `Balanced`, `Airy & Wide`) plus live fine-tuning sliders for text size (`14–34px`), line height (`1.2–3.0×`), and letter spacing (`0–0.22em`).
  3. **Surface Color, Contrast & Tint**: `Crisp White`, `Warm Cream Paper`, `Soft Sage Calm`, and `Calm Slate Dark`, optional reading tint overlays (`Yellow`, `Blue`, `Pink`, `Green`, `Peach`, `Aqua`), and reduced-motion preference.
  4. **Column Width & Review**: Line width (`50ch`, `65ch`, `82ch`), live combined preview with real-time **WCAG 2.2 contrast ratio badge** (`AAA` / `AA`), passage switcher, schema validation, and profile saving.
- **WCAG 2.2 AA Accessibility**: Radiogroup arrow-key navigation, interactive step indicators (`aria-current="step"`), polite `aria-live` step announcements, visible `:focus-visible` outlines, and `prefers-reduced-motion` support.

### Deterministic Reading Tools
- **Bionic Reading**: Highlights word openings (~40%) as visual fixation anchors while skipping short words (< 3 chars).
- **Syllable Splitting (Pro)**: Liang-pattern syllable boundaries rendered as middots (`re·ad`) or alternating color pairs.
- **Confusable-Letter Tints (Pro)**: Distinct high-contrast color coding for mirrored characters (`b`, `d`, `p`, `q`, customizable).
- **Reading Flow Views**: Full Article, `1 Sentence` Focus, and `Chunk Cards` with keyboard (`←` / `→`) navigation.
- **Extractive Key Sentences & Readability (Pro)**: Deterministic TextRank sentence selection and local Flesch Reading Ease / Flesch-Kincaid / Gunning Fog / SMOG metrics.
- **Bundled Offline Dictionary (Pro)**: Click any word in the reader for instant IPA pronunciation and definition from the bundled lexicon with suffix-stem fallback.
- **Visual Comfort & Audio**: Reading Ruler (mouse + arrow keys), Dark Mode, SVG `feColorMatrix` CVD correction (`Protanopia`, `Deuteranopia`, `Tritanopia`), tint overlays, saturation control, Media Hider, Table of Contents, and local-voice-first Text-to-Speech.

### Focus Timer, Goals & Local Backup
- **Timestamp-Driven Pomodoro**: Computes remaining seconds from `targetEndTimestamp` so background throttling never causes timer drift; includes automatic short/long breaks (every 4th session).
- **Stats & Freeze-Day Streaks**: Tracks daily focus/break minutes, sessions, mode activations, 7-day focus history, and freeze-day streak protection.
- **Local Export & Import**: Export stats as `.csv` or full settings/goals/stats backups as `.json`, and restore locally from file.

---

## Development & Verification

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (Node 22 recommended for `node:crypto` Ed25519 key generation)

### Commands

```bash
# Install dependencies
npm install

# Run Web PWA development server (http://localhost:3000)
npm run dev

# Run pure-core unit tests (profiles, wizard, text, timer, stats, license)
npm test

# Type-check and enforce zero-network / core isolation rules
npm run lint

# Standalone no-network & core isolation check
npm run check:network

# Type-check and build Web PWA production bundle
npm run build
```

### Generate an Offline Pro License Key (Local Maintainer CLI)

```bash
node scripts/generate-license-key.mjs --to "Local Evaluator" --tier pro --expiry 2029-12-31
```

### Load Chrome MV3 Extension
Build the extension bundle with `packages/ext-chromium/vite.config.ts`, then open `chrome://extensions/`, enable **Developer mode**, and click **Load unpacked** on the built output directory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 + TypeScript 5 (`strict`) |
| **Styling** | Tailwind CSS v4 + Self-Hosted `@fontsource/inter` & `@fontsource/opendyslexic` |
| **Core Logic** | Pure TypeScript (`packages/core`, zero DOM / `chrome.*` / network) |
| **Testing** | Node built-in test runner (`node:test` + `tsx`) |
| **Build** | Vite 6 (Web PWA) + `@crxjs/vite-plugin` (Chrome MV3 extension) |
