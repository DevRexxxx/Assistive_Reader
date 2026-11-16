/**
 * Content Script — DOM Manipulation & Style Injection (v3)
 *
 * Handles persona CSS, bionic reading, and all new features:
 * reading ruler, reader view, ToC, TTS, media hider, typography, color vision.
 */

import { BUILT_IN_PROFILES, type BuiltInProfileId, type Profile } from '@assistivereader/core';
import { applyBionicReading, removeBionicReading } from '../utils/bionicReading';
import { enableReadingRuler, disableReadingRuler } from './features/readingRuler';
import { enableReaderView, disableReaderView } from './features/readerView';
import { enableToC, disableToC } from './features/toc';
import { injectQuickMenu } from './features/quickMenu';
import { startTTS, stopTTS, pauseTTS, resumeTTS, setTTSRate } from './features/tts';
import { enableMediaHider, disableMediaHider } from './features/mediaHider';
import { applyTypography, removeTypography, type TypographySettings } from './features/typography';
import {
  enableDarkMode, disableDarkMode,
  applyCVDFilter, removeCVDFilter, type CVDType,
  applyColorOverlay, removeColorOverlay, type OverlayColor,
  applySaturation, removeSaturation,
  removeAllColorFilters,
} from './features/colorVision';

// ─── Declarative Profile Renderer ────────────────────────────────────────────

function profileToCss(profile: Profile): string {
  const fontMap: Record<Profile['fontFamily'], string> = {
    system: 'system-ui, sans-serif',
    inter: "'Inter', system-ui, sans-serif",
    opendyslexic: "'OpenDyslexic', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: 'ui-monospace, monospace',
  };

  const parts: string[] = [];

  if (profile.hideDistractions) {
    parts.push(`iframe, aside, [class*="ad-"], [id*="ad-"], .sidebar { display: none !important; }`);
  }

  if (profile.dimLevel > 0) {
    const dimOpacity = Math.max(0.15, 1 - profile.dimLevel).toFixed(2);
    parts.push(`
      p, article { opacity: ${dimOpacity}; transition: opacity 0.2s; }
      p:hover, article:hover { opacity: 1.0 !important; }
    `);
  }

  if (profile.disableAnimations) {
    parts.push(`* { animation: none !important; transition: none !important; }`);
  }

  if (profile.saturation !== 100) {
    parts.push(`body { filter: saturate(${profile.saturation / 100}) !important; }`);
  }

  parts.push(`
    body {
      font-family: ${fontMap[profile.fontFamily]} !important;
      background-color: ${profile.background} !important;
      color: ${profile.textColor} !important;
      line-height: ${profile.lineHeight} !important;
      letter-spacing: ${profile.letterSpacing}em !important;
      word-spacing: ${profile.wordSpacing}em !important;
    }
    p, span, li, td, th, a, h1, h2, h3, h4, h5, h6, label, blockquote {
      font-family: ${fontMap[profile.fontFamily]} !important;
      line-height: ${profile.lineHeight} !important;
      letter-spacing: ${profile.letterSpacing}em !important;
      word-spacing: ${profile.wordSpacing}em !important;
    }
  `);

  return parts.join('\n');
}

function injectStyle(id: string, css: string): void {
  removeStyle(id);
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

function removeStyle(id: string): void {
  document.getElementById(id)?.remove();
}

const PERSONA_MAP: Record<BuiltInProfileId, { id: string; css: string }> = {
  adhd: { id: 'assistive-reader-adhd', css: profileToCss(BUILT_IN_PROFILES.adhd) },
  dyslexia: { id: 'assistive-reader-dyslexia', css: profileToCss(BUILT_IN_PROFILES.dyslexia) },
  autism: { id: 'assistive-reader-autism', css: profileToCss(BUILT_IN_PROFILES.autism) },
};

// ─── Message Listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (message.type) {
      // Persona
      case 'APPLY_PERSONA': {
        const p = PERSONA_MAP[message.persona as BuiltInProfileId];
        if (p) injectStyle(p.id, p.css);
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_PERSONA': {
        const p = PERSONA_MAP[message.persona as BuiltInProfileId];
        if (p) removeStyle(p.id);
        sendResponse({ success: true });
        break;
      }

      // Bionic Reading
      case 'APPLY_BIONIC': {
        const target = document.querySelector('article') || document.querySelector('main') || document.body;
        if (target) applyBionicReading(target as HTMLElement);
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_BIONIC': {
        removeBionicReading(document.body);
        sendResponse({ success: true });
        break;
      }

      // ── New Features ──

      // Reading Ruler
      case 'ENABLE_RULER': {
        enableReadingRuler();
        sendResponse({ success: true });
        break;
      }
      case 'DISABLE_RULER': {
        disableReadingRuler();
        sendResponse({ success: true });
        break;
      }

      // Reader View
      case 'ENABLE_READER_VIEW': {
        enableReaderView();
        sendResponse({ success: true });
        break;
      }
      case 'DISABLE_READER_VIEW': {
        disableReaderView();
        sendResponse({ success: true });
        break;
      }

      // Table of Contents
      case 'ENABLE_TOC': {
        enableToC();
        sendResponse({ success: true });
        break;
      }
      case 'DISABLE_TOC': {
        disableToC();
        sendResponse({ success: true });
        break;
      }

      // Text-to-Speech
      case 'START_TTS': {
        startTTS();
        sendResponse({ success: true });
        break;
      }
      case 'STOP_TTS': {
        stopTTS();
        sendResponse({ success: true });
        break;
      }
      case 'PAUSE_TTS': {
        pauseTTS();
        sendResponse({ success: true });
        break;
      }
      case 'RESUME_TTS': {
        resumeTTS();
        sendResponse({ success: true });
        break;
      }
      case 'SET_TTS_RATE': {
        setTTSRate(message.rate as number);
        sendResponse({ success: true });
        break;
      }

      // Media Hider
      case 'ENABLE_MEDIA_HIDER': {
        enableMediaHider();
        sendResponse({ success: true });
        break;
      }
      case 'DISABLE_MEDIA_HIDER': {
        disableMediaHider();
        sendResponse({ success: true });
        break;
      }

      // Typography
      case 'APPLY_TYPOGRAPHY': {
        applyTypography(message.settings as TypographySettings);
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_TYPOGRAPHY': {
        removeTypography();
        sendResponse({ success: true });
        break;
      }

      // Color Vision
      case 'ENABLE_DARK_MODE': {
        enableDarkMode();
        sendResponse({ success: true });
        break;
      }
      case 'DISABLE_DARK_MODE': {
        disableDarkMode();
        sendResponse({ success: true });
        break;
      }
      case 'APPLY_CVD_FILTER': {
        applyCVDFilter(message.cvdType as CVDType);
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_CVD_FILTER': {
        removeCVDFilter();
        sendResponse({ success: true });
        break;
      }
      case 'APPLY_COLOR_OVERLAY': {
        applyColorOverlay(message.color as OverlayColor);
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_COLOR_OVERLAY': {
        removeColorOverlay();
        sendResponse({ success: true });
        break;
      }
      case 'APPLY_SATURATION': {
        applySaturation(message.level as number);
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_SATURATION': {
        removeSaturation();
        sendResponse({ success: true });
        break;
      }
      case 'REMOVE_ALL_COLOR_FILTERS': {
        removeAllColorFilters();
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ error: 'Unknown content script message' });
    }
    return true;
  }
);

console.log('[AssistiveReader] Content script v3 loaded.');

// ─── Auto-Apply State on Page Load ───────────────────────────────────────────

try {
  injectQuickMenu();

  chrome.storage.local.get(['ar_tools_state', 'ar_typo_state', 'ar_color_state', 'ar_tts_rate'], (result) => {
    if (chrome.runtime.lastError) return;

    try {
      const tools = result.ar_tools_state;
      if (tools) {
        if (tools.darkMode) enableDarkMode();
        if (tools.readerView) enableReaderView();
        if (tools.toc) enableToC();
        if (tools.ruler) enableReadingRuler();
        if (tools.mediaHider) enableMediaHider();
      }
    } catch (e) {
      console.warn('[AssistiveReader] Auto-apply tools error:', e);
    }

    try {
      if (result.ar_tts_rate) {
        setTTSRate(result.ar_tts_rate);
      }
    } catch (e) {
      console.warn('[AssistiveReader] Auto-apply TTS error:', e);
    }

    try {
      const typo = result.ar_typo_state;
      if (typo && typo.enabled) {
        applyTypography(typo);
      }
    } catch (e) {
      console.warn('[AssistiveReader] Auto-apply typo error:', e);
    }

    try {
      const color = result.ar_color_state;
      if (color) {
        if (color.cvdFilter && color.cvdFilter !== 'none') applyCVDFilter(color.cvdFilter);
        if (color.overlay && color.overlay !== 'none') applyColorOverlay(color.overlay);
        if (color.saturation && color.saturation !== 100) applySaturation(color.saturation);
      }
    } catch (e) {
      console.warn('[AssistiveReader] Auto-apply color error:', e);
    }
  });
} catch (e) {
  console.warn('[AssistiveReader] Storage access error:', e);
}
