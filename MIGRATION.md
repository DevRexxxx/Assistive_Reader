# Migration Notes (Phase 0 & Core Extraction)

| Area | Original Location | New / Updated Location | Notes |
|---|---|---|---|
| Bionic word math | `src/utils/bionicReading.ts` | `packages/core/src/text/bionic.ts` | Pure segmentation extracted; `src/utils/bionicReading.ts` now delegates DOM wrapping to core. |
| Personas CSS | `src/content/index.ts` (hard-coded CSS + `cdnfonts.com`) | `packages/core/src/profiles/schema.ts` | Replaced hard-coded CSS strings & CDN font import with declarative `Profile` data and bundled `@fontsource/opendyslexic`. |
| CVD & Overlays | `src/content/features/colorVision.ts` | `packages/core/src/color/index.ts` | Matrices, overlays, saturation clamping extracted to pure TypeScript. |
| Pomodoro Timer | `src/background/index.ts` (`setInterval` tick counter) | `packages/core/src/timer/pomodoro.ts` | Replaced tick counting with drift-free `targetEndTimestamp` state machine. |
| Stats & Streaks | `src/utils/storage.ts` | `packages/core/src/stats/index.ts` | Added freeze-day streak rule, CSV/JSON export & import validation. |
| Fonts | Google Fonts `<link>` & CSS `@import` | `@fontsource/inter` & `@fontsource/opendyslexic` | 100% self-hosted in `src/styles/index.css`; zero network font requests. |
| Web Runtime / PWA | N/A (Extension-only) | `index.html`, `src/web/main.tsx`, `packages/ui` | Serves full offline-capable Reader Workspace + Control Panel on port 3000. |
| Extension Vite Config | `vite.config.ts` | `packages/ext-chromium/vite.config.ts` | Preserved CRXJS MV3 build config separately from root web server. |
