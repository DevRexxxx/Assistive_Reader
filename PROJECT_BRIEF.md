# PROJECT BRIEF: AssistiveReader

## What it is
A cross-platform, privacy-first accessibility reading product for neurodivergent users (ADHD, dyslexia, autism, color vision deficiency). It combines a Chrome MV3 extension with an offline-capable Web PWA reader workspace built on a shared pure TypeScript core.

## Non-Negotiable Constraints
1. **NO AI.** No LLMs, no generative AI, no cloud ML. All features are deterministic and rule-based.
2. **NO DATA LEAVES THE DEVICE.** No analytics, telemetry, crash reporting, remote logging, Google Fonts, CDNs, or remote code.
3. **NO ACCOUNTS REQUIRED.** Everything works without sign-in, completely offline.
4. **LOCAL TTS PRIORITY.** Speech synthesis inspects `voice.localService === true`, prefers on-device voices, and warns the user when only remote/network voices are available.
5. **OFFLINE LICENSING.** License keys (`AR1.<payload>.<sig>`) are verified locally via embedded Ed25519 public key (`packages/core/src/license/`). No phone-home.
6. **NO MEDICAL CLAIMS.** UI copy presents customizable reading support options to try, never diagnosing, treating, or curing any condition.

## Architecture
- `packages/core/`: Pure TypeScript (zero DOM, zero `chrome.*`, zero network) — profiles, calibration mapping, bionic reading, Liang-style syllable splitting, confusable letters, sentence splitting/chunking, readability formulas, extractive TextRank key sentences, CVD matrices, timestamp-based Pomodoro state machine, stats/freeze-day streaks, offline dictionary, and Ed25519 license verification.
- `packages/adapters/`: Platform adapter interfaces and implementations (`LocalStorageAdapter`, `ChromeStorageAdapter`, `WebSpeechTTSAdapter`, `BrowserExportAdapter`, `LocalLicenseAdapter`).
- `packages/ui/`: WCAG 2.2 AA React UI components (`AssistiveAppShell`, `ReaderWorkspace`, `CalibrationWizardModal`, `ModesTab`, `ToolsTab`, `TimerTab`, `StatsTab`, `GoalsTab`, `LicenseTab`).
- `packages/ext-chromium/`: Chrome MV3 extension configuration consuming `@assistivereader/core` and `@assistivereader/adapters`.
- `scripts/check-no-network.mjs`: Automated static check enforcing zero network APIs, zero remote fonts/CDNs, and zero DOM/chrome imports inside `packages/core`.
- `scripts/generate-license-key.mjs`: Private offline CLI tool for signing Ed25519 license payloads (never bundled into client apps).
