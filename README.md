<p align="center">
  <img src="public/icon.png" alt="AssistiveReader Logo" width="128" height="128" />
</p>

<h1 align="center">AssistiveReader</h1>

<p align="center">
  <strong>A premium Chrome Extension that transforms any webpage into an accessible, distraction-free reading experience for neurodivergent users.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-5.0.0-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/react-18-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/typescript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/vite-6-646CFF?style=flat-square&logo=vite" />
</p>

---

## ✨ Overview

**AssistiveReader** is a full-featured accessibility suite designed specifically for people with ADHD, Dyslexia, Autism, and Color Vision Deficiencies. It runs entirely in your browser — no servers, no tracking, no cloud uploads — just pure, privacy-first accessibility.

The extension leverages Chrome's Side Panel API for its control interface, a background service worker for timer and stats management, and targeted content script injection for live DOM transformations — all synchronized via `chrome.storage.local`.

## 📺 Demo Video

Experience AssistiveReader v5.0 in action! See how it transforms the web for better accessibility:

[**🎥 Watch the Demo Walkthrough**](https://drive.google.com/file/d/1dhgfxCAov_Ii9aOzfDsoTbvndR9IRQ_d/view?usp=drivesdk)

### Key Highlights

- 🧠 **3 Neurodivergent Personas** — One-click profiles for ADHD, Dyslexia, and Autism
- 📖 **Bionic Reading** — Bold the first ~40% of every word for faster visual parsing
- 🔊 **Text-to-Speech** — Read any page aloud with real-time word-by-word highlighting and adjustable speed (0.5x–2.0x)
- 🌙 **Dark Mode** — Force a unified high-contrast dark theme on any website with automatic media counter-inversion
- 🎨 **Color Vision Filters** — SVG `feColorMatrix` correction filters for Protanopia, Deuteranopia, and Tritanopia
- ♿ **Quick Access Widget** — Floating button on every page for instant tool access
- ⏱️ **Pomodoro Timer** — Built-in focus timer with automatic phase transitions, Chrome notifications, and session tracking
- 🎯 **Goals & Stats** — Daily/weekly usage analytics with streak tracking and configurable targets

---

## 🏗️ Architecture

AssistiveReader is built on Chrome's **Manifest V3** platform with a clean 3-layer architecture:

```
┌──────────────────────────────────────────────┐
│                Side Panel (React)             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Modes│ │Tools│ │Timer│ │Stats│ │Goals│   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
└──────────────────┬───────────────────────────┘
                   │ chrome.runtime.sendMessage
┌──────────────────▼───────────────────────────┐
│          Background Service Worker            │
│  • Message Router  • Pomodoro Timer           │
│  • Stats Tracker   • Side Panel Controller    │
│  • Streak Manager  • Goal Completion Checker  │
└──────────────────┬───────────────────────────┘
                   │ chrome.tabs.sendMessage
┌──────────────────▼───────────────────────────┐
│            Content Script (DOM)               │
│  • Feature Modules  • Quick Menu Widget       │
│  • State Auto-Apply • CSS/SVG Injection       │
│  • MutationObserver • Keyboard Support        │
└──────────────────────────────────────────────┘
```

### Communication Flow

All three layers communicate through Chrome's messaging APIs and share state via `chrome.storage.local`:

| Direction | API | Purpose |
|---|---|---|
| Side Panel → Background | `chrome.runtime.sendMessage` | Timer control, stats queries, persona forwarding |
| Background → Content Script | `chrome.tabs.sendMessage` | DOM manipulation commands (persona CSS, bionic reading) |
| Side Panel → Content Script | `chrome.tabs.sendMessage` | Direct feature toggles (tools, typography, color vision) |
| Any Layer → Any Layer | `chrome.storage.onChanged` | Reactive state synchronization |

### Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 + TypeScript 5 |
| **Styling** | Tailwind CSS v4 + Custom CSS (glassmorphism, animations) |
| **Build Tool** | Vite 6 with `@crxjs/vite-plugin` for HMR-enabled extension development |
| **State** | `chrome.storage.local` + `chrome.storage.sync` (auto-sync across all layers) |
| **Typography** | Inter (Google Fonts) |
| **Extension API** | Chrome Manifest V3, Side Panel API, Notifications API, Alarms API |

---

## 📁 Project Structure

```
AssistiveReader/
├── manifest.json                    # Chrome Extension manifest (MV3)
├── package.json                     # Dependencies & scripts
├── vite.config.ts                   # Vite build config with CRXJS plugin
├── tsconfig.json                    # TypeScript compiler configuration
├── tsconfig.node.json               # Node-specific TypeScript config
├── .gitignore                       # Git ignore rules
│
├── public/
│   └── icon.png                     # Extension icon / favicon (128×128)
│
├── scripts/
│   └── generate-icons.mjs           # SVG icon generator for dev (16/48/128px)
│
├── src/
│   ├── vite-env.d.ts                # Vite client type declarations
│   │
│   ├── background/
│   │   └── index.ts                 # Service worker: message router, pomodoro timer,
│   │                                #   stats tracking, streak management
│   │
│   ├── content/
│   │   ├── index.ts                 # Content script: message handler, auto-apply,
│   │   │                            #   feature initialization on page load
│   │   └── features/
│   │       ├── colorVision.ts       # Unified dark mode, CVD filters, overlays, saturation
│   │       ├── quickMenu.ts         # Floating ♿ action button with quick toggles
│   │       ├── readerView.ts        # Clean article-only reading view with progress bar
│   │       ├── readingRuler.ts      # Cursor-following line focus band (mouse + keyboard)
│   │       ├── tts.ts               # Text-to-speech with charIndex word highlighting
│   │       ├── toc.ts               # Auto-generated Table of Contents from h1–h3
│   │       ├── typography.ts        # Font size, line height, letter spacing, contrast
│   │       └── mediaHider.ts        # Blur media with MutationObserver for dynamic content
│   │
│   ├── sidepanel/
│   │   ├── index.html               # Side panel HTML entry point
│   │   ├── index.tsx                # React DOM mount point
│   │   ├── SidePanel.tsx            # Main shell with tab bar, dark mode toggle, minimize
│   │   └── components/
│   │       ├── ModesTab.tsx          # Persona toggles (ADHD/Dyslexia/Autism) + Bionic Reading
│   │       ├── ToolsTab.tsx          # Feature toggles + TTS speed + Color Vision + Typography
│   │       ├── TimerTab.tsx          # Pomodoro timer UI with ProgressRing & duration presets
│   │       ├── StatsTab.tsx          # Daily stats + 7-day weekly bar chart
│   │       ├── GoalsTab.tsx          # Goal configuration + streak tracker + confetti
│   │       └── ProgressRing.tsx      # Reusable SVG circular progress component
│   │
│   ├── styles/
│   │   └── index.css                # Design system: CSS variables, animations,
│   │                                #   glassmorphism, blob keyframes, utility classes
│   │
│   └── utils/
│       ├── storage.ts               # Typed chrome.storage.local CRUD helpers
│       │                            #   (DailyStats, GoalConfig, StreakData, TimerState)
│       └── bionicReading.ts         # TreeWalker-based DOM text node transformation
│
└── dist/                            # Production build output (git-ignored)
```

---

## 🚀 Features

### 🧠 Modes Tab — Neurodivergent Personas

| Mode | What it Does |
|---|---|
| **🎯 ADHD Focus Mode** | Hides sidebars, ads, and iframes. Dims all content to 30% opacity and reveals on hover — forces single-element focus with a subtle 1.02× scale effect. |
| **📖 Dyslexia Read Mode** | Applies OpenDyslexic font, cream background (`#fdfbf7`), 2.0 line height, and generous letter/word spacing (`0.12em` / `0.2em`) across the entire page. |
| **🧘 Autism Calm Mode** | Kills all CSS `animation` and `transition` properties site-wide. Desaturates colors to 60% and applies a gentle 10% sepia tint for a calmer visual experience. |
| **⚡ Bionic Reading** | Uses a TreeWalker to bold the first ~40% of every word (min 1 char, skips words < 3 chars), creating fixation anchors for faster visual parsing. Fully reversible. |

### 🛠️ Tools Tab — Accessibility Toolkit

| Tool | Description |
|---|---|
| **🌙 Dark Mode** | Unified CSS filter approach: applies `invert(0.92) hue-rotate(180deg)` to `<html>`, then counter-inverts all `<img>`, `<video>`, `<canvas>`, `<svg>`, and `<iframe>` elements to preserve their original colors. Compatible with all other filters. |
| **📄 Reader View** | Strips the page down to article content only using DOM-based extraction heuristics (searches `<article>`, `[role="main"]`, `<main>`, `.post-content`, etc.). Displays a clean centered column with word count, estimated read time, and a gradient scroll progress bar. |
| **📑 Table of Contents** | Auto-generates a floating, glassmorphic sidebar from all `h1`–`h3` headings. Adds missing IDs, supports smooth-scroll navigation, and includes a close button. Only appears when the page has 2+ qualifying headings. |
| **📏 Reading Ruler** | A semi-transparent horizontal band (100px) that follows your cursor, dimming the rest of the page to 45% opacity. Supports both **mouse tracking** and **keyboard arrow keys** for accessibility. Clamped to prevent negative heights. |
| **🔊 Read Aloud (TTS)** | Uses the Web Speech API with `charIndex`-based word highlighting for precise sync. Each word is wrapped in spans, scrolled to view, and highlighted with a yellow gradient. Chrome's 15-second utterance timeout is bypassed with a 10-second pause/resume keepalive loop. Includes a **speed controller (0.5x–2.0x)** slider. |
| **🖼️ Hide Media** | Blurs all images and videos using `grayscale(1) brightness(0.6) blur(10px)` at 25% opacity. A **MutationObserver** watches for dynamically loaded media (ads, lazy-loaded images) and wraps them with "🖼️ Hover to reveal" overlay labels. Skips icons smaller than 50×50px. |

### 🎨 Color Vision & Typography

| Feature | Description |
|---|---|
| **CVD Correction** | SVG `feColorMatrix` filters for Protanopia (red-weak), Deuteranopia (green-weak), and Tritanopia (blue-weak). Injected as inline SVG `<defs>` and applied via `url()` filter reference. |
| **Color Overlays** | Six tinted screen overlays (Yellow, Blue, Pink, Green, Peach, Aqua) for reading comfort, applied as fixed `<div>` elements with `mix-blend-mode: multiply`. |
| **Saturation Control** | Slider to adjust page color saturation from 0% (grayscale) to 200% (vivid). Media elements receive an inverse saturation adjustment to retain natural appearance. |
| **Font Size** | Adjustable from 14px to 32px with proportional heading hierarchy (h1 at 2×, h2 at 1.6×, h3 at 1.35×, etc.). |
| **Line Height** | Adjustable from 1.2× to 3.0×. |
| **Letter Spacing** | Adjustable from 0 to 0.2em. |
| **Contrast Modes** | Three modes: **Normal** (default), **High** (forces white background + black text + underlined blue links), **Inverted** (full page inversion with counter-inverted media). |

### ⏱️ Pomodoro Timer

A fully-featured focus timer built into the Side Panel:

- **Focus / Short Break / Long Break** phases with automatic transitions
- Duration presets: **15 / 25 / 45 / 60 minutes** (configurable)
- Short breaks after each session, long break after every 4th session
- Background `setInterval` timer running in the service worker (survives panel close)
- Chrome notifications on phase completion
- Session counter and completion tracking
- Animated SVG `ProgressRing` with smooth `stroke-dashoffset` transitions

### 📊 Stats & 🎯 Goals

- **Daily Stats**: Focus minutes, break minutes, sessions completed, per-mode activation counts
- **Weekly Chart**: 7-day bar chart of focus hours with daily archiving
- **Streak Tracking**: Consecutive days of meeting your daily focus goal, with longest streak record
- **Configurable Goals**: Focus time presets (30m / 1h / 2h / 4h) and session targets (2 / 4 / 8 / 12)
- **Confetti Celebration**: Animated confetti burst when daily goal is completed
- **Auto-reset**: Stats automatically roll over at midnight with yesterday's data archived

---

## ♿ Quick Access Widget

A floating action button (♿) that appears on every webpage in the bottom-right corner:

| Action | Result |
|---|---|
| **Single Click** | Opens a quick-access popup with pill-shaped toggles for Dark Mode, Reader View, Reading Ruler, Read Aloud, and Hide Media |
| **Double Click** | Opens the full Side Panel via `chrome.sidePanel.open()` with all settings and tools |

The widget uses a 250ms click debounce to distinguish single from double clicks. It stays perfectly in sync with the Side Panel — toggling a feature from either location updates both instantly via `chrome.storage.onChanged`. The menu supports dark-mode-aware styling.

---

## 🌙 Extension UI Dark Mode

The Side Panel itself has its own dark mode toggle (🌙/☀️ button in the top-right header), independent from the website Dark Mode tool. It uses a CSS `invert(1) hue-rotate(180deg)` filter on the Side Panel's `<html>` element with counter-inverted images. Your preference is persisted across sessions in `ar_ui_dark`.

A **Minimize button** (➖) sits next to the dark mode toggle. Clicking it calls `window.close()`, closing the Side Panel and returning you to just the floating Quick Access widget.

---

## 🛡️ Crash Prevention

Every feature module uses defensive DOM handling:

- **Null-safe injection**: All `document.head` and `document.body` accesses fall back to `document.documentElement` for compatibility with PDFs, XML pages, and other non-standard documents.
- **Isolated initialization**: Each feature is wrapped in its own `try-catch` block during auto-apply. A failure in one tool never prevents others from loading.
- **Graceful degradation**: If the Speech API isn't available, TTS silently skips. If a page has fewer than 2 headings, ToC shows nothing.
- **Mutual exclusions**: Reader View and TTS cannot be active simultaneously — enabling one automatically disables the other to prevent DOM conflicts.

---

## 🎨 Design System

### CSS Custom Properties

```css
--ar-primary:        #4f46e5;    /* Indigo 600 */
--ar-primary-light:  #818cf8;    /* Indigo 400 */
--ar-primary-dark:   #3730a3;    /* Indigo 800 */
--ar-accent:         #06b6d4;    /* Cyan 500 */
--ar-success:        #10b981;    /* Emerald 500 */
--ar-warning:        #f59e0b;    /* Amber 500 */
--ar-danger:         #ef4444;    /* Red 500 */
--ar-bg:             #f8fafc;    /* Slate 50 */
--ar-surface:        #ffffff;
--ar-border:         #e2e8f0;    /* Slate 200 */
--ar-text:           #0f172a;    /* Slate 900 */
--ar-text-muted:     #94a3b8;    /* Slate 400 */
```

### Animations

| Animation | Duration | Usage |
|---|---|---|
| `fadeIn` | 0.3s | Generic element entry |
| `slideUp` | 0.4s | Tab content transitions |
| `bounceIn` | 0.5s | Celebration effects |
| `shimmer` | 2s (infinite) | Loading states |
| `blob` | 7s (infinite alternate) | Header background mesh |
| `flame` | 0.6s (infinite) | Streak fire emoji |
| `confettiBurst` | 1s | Goal completion particles |
| `pulseRing` | — | Progress ring pulsing |

### Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.6);
}
```

---

## 🔧 Installation & Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Google Chrome](https://www.google.com/chrome/) (v116+ for Side Panel API support)

### Setup

```bash
# Clone the repository
git clone https://github.com/DevRexxxx/AssistiveReader.git
cd AssistiveReader

# Install dependencies
npm install

# Build for production
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The AssistiveReader icon will appear in your toolbar — click it to open the Side Panel

### Development

```bash
# Start dev server with hot reload
npm run dev
```

> **Note**: After running `npm run build`, you must click the 🔄 reload button on `chrome://extensions/` to pick up changes. During `npm run dev`, CRXJS handles hot module replacement automatically.

---

## 📡 Internal Messaging Protocol

The extension uses a typed message-passing system between layers. Key message types:

### Side Panel → Background → Content Script

| Message Type | Direction | Purpose |
|---|---|---|
| `APPLY_PERSONA` / `REMOVE_PERSONA` | SP → BG → CS | Toggle neurodivergent persona CSS |
| `APPLY_BIONIC` / `REMOVE_BIONIC` | SP → BG → CS | Toggle bionic reading DOM transform |

### Side Panel → Content Script (Direct)

| Message Type | Purpose |
|---|---|
| `ENABLE_DARK_MODE` / `DISABLE_DARK_MODE` | Toggle unified dark mode filter |
| `ENABLE_READER_VIEW` / `DISABLE_READER_VIEW` | Toggle clean article reader |
| `ENABLE_TOC` / `DISABLE_TOC` | Toggle Table of Contents sidebar |
| `ENABLE_RULER` / `DISABLE_RULER` | Toggle reading ruler |
| `START_TTS` / `STOP_TTS` / `PAUSE_TTS` / `RESUME_TTS` | Text-to-speech controls |
| `SET_TTS_RATE` | Adjust TTS playback speed |
| `ENABLE_MEDIA_HIDER` / `DISABLE_MEDIA_HIDER` | Toggle media blur |
| `APPLY_TYPOGRAPHY` / `REMOVE_TYPOGRAPHY` | Apply/remove font controls |
| `APPLY_CVD_FILTER` / `REMOVE_CVD_FILTER` | Toggle color blindness correction |
| `APPLY_COLOR_OVERLAY` / `REMOVE_COLOR_OVERLAY` | Toggle reading tint |
| `APPLY_SATURATION` / `REMOVE_SATURATION` | Adjust color saturation |

### Timer Messages (Side Panel ↔ Background)

| Message Type | Direction | Purpose |
|---|---|---|
| `TIMER_START` / `TIMER_PAUSE` / `TIMER_RESET` / `TIMER_SKIP` | SP → BG | Timer controls |
| `TIMER_SET_DURATION` | SP → BG | Change focus duration |
| `GET_TIMER_STATE` | SP → BG | Query current timer state |
| `TIMER_TICK` | BG → SP | Real-time countdown update (every 1s) |
| `TIMER_PHASE_COMPLETE` | BG → SP | Phase transition notification |
| `STATS_UPDATED` | BG → SP | Refreshed daily stats after timer events |

---

## 📝 Version History

| Version | Highlights |
|---|---|
| **v5.0** | Minimize button for Side Panel → Quick Access workflow. Version branding update. |
| **v4.0** | Premium UI overhaul with glassmorphism header, Inter font, animated background blobs, new custom logo, and extension UI dark mode toggle. |
| **v3.0** | Floating Quick Access Widget with single/double-click behavior, TTS speed controller, crash-proof DOM handling with `try-catch` isolation, MutationObserver-powered media hider, state persistence across page navigations. |
| **v2.0** | Color Vision suite (Dark Mode, CVD filters, overlays, saturation), Typography controls with heading hierarchy, Media Hider, Reader View with progress bar, Table of Contents, Reading Ruler with keyboard support, TTS with charIndex word highlighting and Chrome keepalive workaround. |
| **v1.0** | Initial release with ADHD/Dyslexia/Autism personas, Bionic Reading, Pomodoro Timer, Stats & Goals tracking. |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>Built with ❤️ for accessibility</strong><br/>
  <em>Making the web readable for everyone.</em>
</p>
