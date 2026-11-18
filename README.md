<p align="center">
  <img src="public/icon.png" alt="AssistiveReader Logo" width="128" height="128" />
</p>

<h1 align="center">AssistiveReader</h1>

<p align="center">
  <strong>A privacy-first, offline-capable accessibility reading suite for neurodivergent users — zero AI, zero telemetry, zero remote requests.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-6.0.0-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/PWA-offline--ready-5a0fc8?style=flat-square" />
  <img src="https://img.shields.io/badge/react-18-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/typescript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/vite-6-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/WCAG-2.2%20AA-2ea44f?style=flat-square" />
  <img src="https://img.shields.io/badge/network%20calls-0-success?style=flat-square" />
</p>

---

## ✨ Overview

**AssistiveReader** provides customizable reading support for people with ADHD, dyslexia, autism, sensory sensitivity, and color vision deficiency. It runs 100% locally in two places — an **offline-capable Web PWA** reader workspace and a **Chrome Manifest V3 extension** — both built around one shared, pure-TypeScript core.

There are no servers, no accounts, no analytics, and no cloud uploads. Every feature is a deterministic, rule-based algorithm you can read, test, and audit.

## 📺 Demo Video

> 🎥 **[Add your demo walkthrough link here]** — a short screen recording of the Web PWA and the Chrome extension in action.

### Key Highlights

- 🧠 **Built-in Profiles + Calibration Wizard** — One-click ADHD, Dyslexia, and Autism profiles, plus a 4-step wizard to build your own
- 📖 **Bionic Reading** — Emphasize the first ~40% of every word as a fixation anchor
- ✂️ **Syllable Splitting & Confusable-Letter Tints** — Liang-pattern syllable boundaries and distinct colors for `b` / `d` / `p` / `q`
- 🧩 **Reading Flow Views** — Full article, one-sentence focus, or chunk cards with keyboard navigation
- 📚 **Offline Dictionary** — Click any word for IPA pronunciation and a definition, with no network lookup
- 📊 **Readability Metrics** — Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, and SMOG computed locally
- 🔊 **Local-First Text-to-Speech** — Prefers on-device voices and warns when only remote voices exist
- 🎨 **Color Vision Filters** — SVG `feColorMatrix` correction for Protanopia, Deuteranopia, and Tritanopia
- ⏱️ **Drift-Free Pomodoro Timer** — Timestamp-driven, so background throttling never skews the clock
- 🎯 **Goals, Stats & Freeze-Day Streaks** — With local CSV / JSON export and import
- 🔐 **Offline Ed25519 Licensing** — Signed keys verified on-device with no phone-home

---

## 🛡️ Non-Negotiable Guarantees

| Guarantee | What it means |
|---|---|
| **Zero AI / Zero Cloud ML** | Every feature uses deterministic algorithms: Liang-style hyphenation, TextRank extractive scoring, sRGB WCAG luminance math, standard readability formulas, and bundled lexicons. |
| **Zero Data Leaves the Device** | No analytics, telemetry, crash reporting, remote fonts, CDNs, or network calls. Enforced in CI by `scripts/check-no-network.mjs`. |
| **No Accounts Required** | Works completely offline out of the box. |
| **Local-First Speech** | Inspects `voice.localService === true`, prefers on-device voices, and warns explicitly if only remote browser voices are detected. |
| **Offline Licensing** | License keys (`AR1.<payload>.<sig>`) are verified locally with a pure-TypeScript RFC 8032 Ed25519 + SHA-512 verifier. |
| **Supportive Framing** | Features are customizable reading-support options to try — never presented as diagnoses, treatments, or cures. |

---

## 🏗️ Architecture

AssistiveReader separates deterministic domain logic from platform DOM and storage APIs across four modular layers. The same `core`, `adapters`, and `ui` packages power both the Web PWA and the Chrome extension.

```
┌─────────────────────────────────────────────────────────────┐
│                  packages/ui  (React, WCAG 2.2 AA)           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌─────────┐   │
│  │Modes │ │Tools │ │Timer │ │Stats │ │Goals │ │ License │   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └─────────┘   │
│        Reader Workspace  ·  Calibration Wizard  ·  Store     │
└───────────────────────────┬─────────────────────────────────┘
                            │ uses interfaces
┌───────────────────────────▼─────────────────────────────────┐
│                      packages/adapters                       │
│  LocalStorage · ChromeStorage · WebSpeechTTS · Export · License │
└───────────────────────────┬─────────────────────────────────┘
                            │ calls pure functions
┌───────────────────────────▼─────────────────────────────────┐
│       packages/core  (zero DOM · zero chrome.* · zero net)   │
│  Profiles · Wizard · Text · Color · Timer · Stats · License  │
└─────────────────────────────────────────────────────────────┘

        ┌──────────────────┐        ┌──────────────────────┐
        │   Web PWA shell   │        │  Chrome MV3 extension │
        │  src/web/main.tsx │        │  Side Panel · Service │
        │  (offline, local) │        │  Worker · Content     │
        └──────────────────┘        └──────────────────────┘
```

### Design Principle

> **Core is pure.** `packages/core` never touches the DOM, `chrome.*`, or the network. Platform concerns live in `adapters`, so every algorithm is unit-testable in plain Node.

### Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 + TypeScript 5 (`strict`) |
| **Styling** | Tailwind CSS v4 + self-hosted `@fontsource/inter` & `@fontsource/opendyslexic` |
| **Core Logic** | Pure TypeScript (`packages/core`) |
| **State & Storage** | Reactive store (`useAssistiveStore`) over `localStorage` / `chrome.storage` adapters |
| **Testing** | Node built-in test runner (`node:test` + `tsx`) |
| **Build Tool** | Vite 6 (Web PWA) + `@crxjs/vite-plugin` (Chrome MV3 extension) |
| **Compliance** | WCAG 2.2 AA, enforced no-network CI check |

---

## 📁 Project Structure

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
├── HOW_IT_WORKS.md                # Deeper walkthrough of the internals
├── MIGRATION.md                   # Notes on migrating from the earlier extension-only version
└── PROJECT_BRIEF.md               # Architecture & privacy constraints
```

---

## 🚀 Features

### 🧠 Profiles & Calibration Wizard

| Profile | What it Does |
|---|---|
| **🎯 ADHD Focus Mode** | Reduces visual clutter and dims surrounding content so attention rests on one element at a time. |
| **📖 Dyslexia Read Mode** | Applies the bundled OpenDyslexic font, a warm background, generous line height, and wider letter/word spacing. |
| **🧘 Autism Calm Mode** | Removes animations and transitions, softens color intensity, and applies a gentle tint for a calmer visual experience. |
| **🧩 Custom Profiles** | Build and save your own from the Calibration Wizard. Profiles are declarative and validated against the schema in `packages/core/src/profiles/schema.ts`. |

#### Interactive Calibration Wizard

A four-step flow (`packages/core/src/wizard.ts` + `packages/ui/src/components/CalibrationWizard.tsx`):

1. **Typeface** — Side-by-side testing across bundled `Inter`, `OpenDyslexic`, `Georgia Serif`, and `Fixed-Width Mono`.
2. **Spacing & Scale** — Presets (`Compact`, `Balanced`, `Airy & Wide`) plus live sliders for text size (`14–34px`), line height (`1.2–3.0×`), and letter spacing (`0–0.22em`).
3. **Surface Color, Contrast & Tint** — `Crisp White`, `Warm Cream Paper`, `Soft Sage Calm`, and `Calm Slate Dark`; optional tint overlays (`Yellow`, `Blue`, `Pink`, `Green`, `Peach`, `Aqua`); and a reduced-motion preference.
4. **Column Width & Review** — Line width (`50ch`, `65ch`, `82ch`), a live combined preview with a real-time **WCAG 2.2 contrast ratio badge** (`AAA` / `AA`), a passage switcher, schema validation, and profile saving.

**Accessibility of the wizard itself:** radiogroup arrow-key navigation, interactive step indicators (`aria-current="step"`), polite `aria-live` step announcements, visible `:focus-visible` outlines, and `prefers-reduced-motion` support.

### 🛠️ Deterministic Reading Tools

| Tool | Tier | Description |
|---|---|---|
| **⚡ Bionic Reading** | Free | Bolds the first ~40% of each word as a fixation anchor, skipping words shorter than 3 characters. |
| **✂️ Syllable Splitting** | Pro | Liang-pattern syllable boundaries rendered as middots (`re·ad`) or alternating color pairs. |
| **🔤 Confusable-Letter Tints** | Pro | High-contrast, customizable color coding for mirrored characters (`b`, `d`, `p`, `q`). |
| **🧩 Reading Flow Views** | Free | Full Article, `1 Sentence` focus, and `Chunk Cards`, with `←` / `→` keyboard navigation. |
| **🔑 Key Sentences** | Pro | Deterministic TextRank + term-frequency sentence selection. No model involved. |
| **📊 Readability Metrics** | Pro | Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, and SMOG, calculated locally. |
| **📚 Offline Dictionary** | Pro | Click any word in the reader for IPA pronunciation and a definition from the bundled lexicon, with suffix-stem fallback. |

### 🎨 Visual Comfort & Audio

| Tool | Description |
|---|---|
| **📏 Reading Ruler** | A band that follows your cursor and dims the rest of the page. Supports mouse tracking and keyboard arrow keys. |
| **🌙 Dark Mode** | A unified dark theme with media counter-inversion so images and video keep their natural colors. |
| **🎨 CVD Correction** | SVG `feColorMatrix` filters for Protanopia (red-weak), Deuteranopia (green-weak), and Tritanopia (blue-weak). |
| **🌈 Color Overlays** | Six tinted overlays (Yellow, Blue, Pink, Green, Peach, Aqua) for reading comfort. |
| **🎚️ Saturation Control** | Adjust page color intensity from grayscale to vivid, with a clamped safe range. |
| **🖼️ Media Hider** | Blurs images and video until you choose to reveal them. |
| **📑 Table of Contents** | Floating outline generated from page headings. |
| **🔊 Read Aloud (TTS)** | Web Speech API playback that prefers **on-device voices** (`voice.localService === true`) and shows a clear warning if only remote voices are available. |

### ⏱️ Focus Timer, Goals & Local Backup

- **Timestamp-driven Pomodoro** — Remaining time is computed from `targetEndTimestamp`, so throttled background tabs and sleeping service workers never cause drift.
- **Automatic phases** — Focus, short break, and a long break after every 4th session.
- **Stats** — Daily focus/break minutes, sessions completed, per-profile activation counts, and a 7-day focus history with automatic midnight rollover.
- **Freeze-Day Streaks** — Consecutive days of meeting your focus goal, with freeze days that protect a streak from a single missed day.
- **Configurable Goals** — Daily focus-time and session targets.
- **Local Export & Import** — Export stats as `.csv`, or full settings + goals + stats backups as `.json`, and restore from a file. Nothing is uploaded anywhere.

### 🔐 Offline Licensing

Pro features are unlocked with a signed key of the form `AR1.<payload>.<sig>`.

- Verification runs entirely on-device using a pure-TypeScript **Ed25519 (RFC 8032) + SHA-512** implementation in `packages/core/src/license/`.
- No activation server, no phone-home, and no account.
- The `LicenseTab` includes a demo key so evaluators can try Pro features immediately.

---

## ♿ Quick Access Widget

In the Chrome extension, a floating accessibility button (♿) provides instant access to the most-used tools on any page (`QuickMenuWidget.tsx`). It stays in sync with the Side Panel through the shared storage layer, so toggling a feature in either place updates both.

---

## 🌐 Two Ways to Run It

| | **Web PWA** | **Chrome MV3 Extension** |
|---|---|---|
| **Best for** | Reading pasted text or local files in a clean workspace | Transforming any webpage you visit |
| **Storage** | `localStorage` via `LocalStorageAdapter` | `chrome.storage` via `ChromeStorageAdapter` |
| **Entry point** | `src/web/main.tsx` | Side Panel + service worker + content scripts |
| **Works offline** | ✅ Installable PWA | ✅ Fully local |
| **Shared code** | `packages/core` · `packages/adapters` · `packages/ui` | `packages/core` · `packages/adapters` · `packages/ui` |

---

## 🛡️ Privacy & Safety by Construction

- **Static no-network check** — `scripts/check-no-network.mjs` runs in CI and fails the build if it finds network APIs, CDN URLs, or DOM calls inside `packages/core`.
- **Self-hosted assets** — Inter and OpenDyslexic ship via `@fontsource`; there are no Google Fonts or CDN requests.
- **Isolated core** — Pure functions with no side effects, covered by `node:test` suites for text, state, license, and wizard logic.
- **Graceful degradation** — If the Speech API is unavailable, TTS skips quietly; if a page has too few headings, the Table of Contents stays hidden.

---

## 🎨 Design System

- **Typography:** `Inter` for UI, `OpenDyslexic` available as a reading face — both self-hosted.
- **Styling:** Tailwind CSS v4 with shared design tokens in `src/styles/index.css`.
- **Accessibility:** WCAG 2.2 AA targets, visible `:focus-visible` outlines, `aria-live` announcements, keyboard-operable controls, and `prefers-reduced-motion` support.

---

## 🔧 Installation & Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (Node 22 recommended for `node:crypto` Ed25519 key generation)
- [Google Chrome](https://www.google.com/chrome/) v116+ (only needed for the extension, for Side Panel API support)

### Setup

```bash
# Clone the repository
git clone https://github.com/DevRexxxx/Assistive_Reader.git
cd Assistive_Reader

# Install dependencies
npm install
```

### Commands

```bash
# Run the Web PWA dev server (http://localhost:3000)
npm run dev

# Run pure-core unit tests (profiles, wizard, text, timer, stats, license)
npm test

# Type-check and enforce zero-network / core isolation rules
npm run lint

# Standalone no-network & core isolation check
npm run check:network

# Type-check and build the Web PWA production bundle
npm run build
```

### Load the Chrome MV3 Extension

1. Build the extension bundle using `packages/ext-chromium/vite.config.ts`
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the built output directory
6. Open the Side Panel from the toolbar icon

> **Note:** After rebuilding, click the 🔄 reload button on `chrome://extensions/` to pick up changes.

### Generate an Offline Pro License Key (Maintainer CLI)

```bash
node scripts/generate-license-key.mjs --to "Local Evaluator" --tier pro --expiry 2029-12-31
```

---

## 📡 Internal Messaging (Extension)

The extension keeps its three-layer messaging model; the shared UI and core packages sit on top of it.

| Direction | API | Purpose |
|---|---|---|
| Side Panel → Background | `chrome.runtime.sendMessage` | Timer control, stats queries, profile forwarding |
| Background → Content Script | `chrome.tabs.sendMessage` | DOM commands (profile CSS, bionic reading) |
| Side Panel → Content Script | `chrome.tabs.sendMessage` | Direct tool toggles (typography, CVD, ruler, TTS) |
| Any Layer → Any Layer | `chrome.storage.onChanged` | Reactive state synchronization |

> For the exact message types and payloads, see `src/background/index.ts`, `src/content/`, and `HOW_IT_WORKS.md`.

---

## 🧪 Testing

```bash
npm test
```

Unit suites live in `packages/core/src/__tests__/` and cover:

- **Text** — Bionic, syllables, confusables, sentences, readability, and key-sentence ranking
- **State** — Pomodoro transitions, daily/weekly rollover, and freeze-day streaks
- **License** — Ed25519 signature verification and key parsing
- **Wizard** — Step state machine and WCAG contrast calculations

---

## 📝 Version History

| Version | Highlights |
|---|---|
| **v6.0** | Monorepo restructure into `core`, `adapters`, and `ui` packages. Added the offline-capable Web PWA, Calibration Wizard, custom profiles, syllable splitting, confusable-letter tints, reading flow views, TextRank key sentences, readability metrics, offline dictionary, freeze-day streaks, JSON/CSV backup, and Ed25519 offline licensing. Added the CI no-network check. |
| **v5.0** | Minimize button for the Side Panel → Quick Access workflow. |
| **v4.0** | Premium UI overhaul with glassmorphism, Inter font, and Side Panel dark mode. |
| **v3.0** | Floating Quick Access widget, TTS speed controller, crash-proof DOM handling, and MutationObserver-powered media hider. |
| **v2.0** | Color Vision suite, typography controls, Reader View, Table of Contents, Reading Ruler, and TTS word highlighting. |
| **v1.0** | Initial release with ADHD / Dyslexia / Autism personas, Bionic Reading, Pomodoro Timer, and Stats & Goals. |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Keep `packages/core` pure — no DOM, no `chrome.*`, no network
4. Run `npm test` and `npm run lint` before committing
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

<p align="center">
  <strong>Built with ❤️ for accessibility</strong><br/>
  <em>Making reading comfortable for everyone — privately, offline, and on your terms.</em>
</p>
