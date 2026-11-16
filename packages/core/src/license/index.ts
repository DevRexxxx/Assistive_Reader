/**
 * Offline Signed License Verification & Central Capability Map
 * Pure TypeScript — zero network, zero phone-home.
 *
 * Format: AR1.<base64url(JSON payload)>.<base64url(64-byte Ed25519 signature)>
 */

import { base64UrlToBytes, hexToBytes, verifyEd25519 } from './ed25519';

export type LicenseTier = 'free' | 'pro' | 'family' | 'education';

export interface LicensePayload {
  tier: Exclude<LicenseTier, 'free'>;
  seats: number;
  expiry?: string; // ISO date e.g. "2028-12-31"
  issuedTo?: string;
}

export interface LicenseVerificationResult {
  valid: boolean;
  tier: LicenseTier;
  payload?: LicensePayload;
  reason?: string;
}

export type CapabilityKey =
  | 'builtInPersonas'
  | 'bionicReading'
  | 'darkMode'
  | 'readingRuler'
  | 'readerView'
  | 'tableOfContents'
  | 'hideMedia'
  | 'basicTts'
  | 'pomodoroTimer'
  | 'dailyStatsAndGoals'
  | 'syllableSplitting'
  | 'confusableLetters'
  | 'calibrationWizard'
  | 'customProfiles'
  | 'sentenceFocusAndChunks'
  | 'offlineDictionary'
  | 'extractiveHighlights'
  | 'readabilityMetrics'
  | 'advancedTypographyAndOverlays'
  | 'statsExportAndImport'
  | 'sleepTimerTts';

export const CAPABILITY_MAP: Record<CapabilityKey, { label: string; minTier: LicenseTier; description: string }> = {
  builtInPersonas:              { label: 'ADHD, Dyslexia & Autism Profiles', minTier: 'free', description: 'One-click declarative reading support profiles.' },
  bionicReading:                { label: 'Bionic Reading',                   minTier: 'free', description: 'Bolds word beginnings for faster visual anchoring.' },
  darkMode:                     { label: 'Unified Dark Mode',                minTier: 'free', description: 'High-contrast dark theme with media preservation.' },
  readingRuler:                 { label: 'Reading Ruler',                    minTier: 'free', description: 'Cursor and keyboard-driven line focus band.' },
  readerView:                   { label: 'Clean Reader View',                minTier: 'free', description: 'Distraction-free single-column reading mode.' },
  tableOfContents:              { label: 'Table of Contents',                minTier: 'free', description: 'Auto-generated heading outline navigation.' },
  hideMedia:                    { label: 'Hide Media',                       minTier: 'free', description: 'Blurs images & videos until hovered.' },
  basicTts:                     { label: 'Local Read Aloud (TTS)',           minTier: 'free', description: 'On-device speech synthesis with word highlighting.' },
  pomodoroTimer:                { label: 'Pomodoro Focus Timer',             minTier: 'free', description: 'Timestamp-accurate focus & break timer.' },
  dailyStatsAndGoals:           { label: 'Stats, Streaks & Goals',           minTier: 'free', description: 'Local activity tracking with freeze-day streaks.' },
  syllableSplitting:            { label: 'Syllable Splitting',               minTier: 'pro',  description: 'Liang-style syllable middots and alternating colors.' },
  confusableLetters:            { label: 'Confusable Letter Highlighting',   minTier: 'pro',  description: 'Distinct colors for b / d / p / q and custom pairs.' },
  calibrationWizard:            { label: 'Calibration Wizard',               minTier: 'pro',  description: 'Side-by-side sample picker that builds your profile.' },
  customProfiles:               { label: 'Unlimited Custom Profiles',        minTier: 'pro',  description: 'Save, edit, and switch personal reading profiles.' },
  sentenceFocusAndChunks:       { label: 'Sentence Focus & Chunk Cards',     minTier: 'pro',  description: 'Single-sentence focus and step-by-step reading cards.' },
  offlineDictionary:            { label: 'Offline Tap-to-Define Dictionary', minTier: 'pro',  description: 'Instant local definitions & IPA pronunciation.' },
  extractiveHighlights:         { label: 'Extractive Key Sentences',         minTier: 'pro',  description: 'Deterministic TextRank highlighting (no AI).' },
  readabilityMetrics:           { label: 'Readability Level Indicator',      minTier: 'pro',  description: 'Flesch-Kincaid, Gunning Fog & SMOG metrics.' },
  advancedTypographyAndOverlays:{ label: 'Color Vision, Overlays & Spacing', minTier: 'pro',  description: 'CVD filters, tinted overlays & granular spacing.' },
  statsExportAndImport:         { label: 'JSON/CSV Export & Transfer',       minTier: 'pro',  description: 'Export stats and transfer profiles offline.' },
  sleepTimerTts:                { label: 'TTS Sleep Timer & Sentence Sync',  minTier: 'pro',  description: 'Auto-stop timer and sentence fallback highlighting.' },
};

const TIER_RANK: Record<LicenseTier, number> = {
  free: 0,
  pro: 1,
  family: 2,
  education: 3,
};

// Embedded Ed25519 public key (32 bytes hex). Private signing key never ships in bundles.
export const EMBEDDED_PUBLIC_KEY_HEX =
  '3d00ba50b6002b8b1e21fab0c620720d68196a4d12569a3b85c4363a170db4bc';

function encodeUtf8(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      const cp = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

function decodeUtf8(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
    } else if (b0 < 0xe0) {
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (b0 < 0xf0) {
      out += String.fromCharCode(
        ((b0 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)
      );
    } else {
      const cp =
        ((b0 & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      const offset = cp - 0x10000;
      out += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    }
  }
  return out;
}

export function verifyLicenseKey(
  licenseKey: string,
  nowDateISO: string = new Date().toISOString().split('T')[0],
  publicKeyHex: string = EMBEDDED_PUBLIC_KEY_HEX
): LicenseVerificationResult {
  const trimmed = licenseKey.trim();
  if (!trimmed) {
    return { valid: false, tier: 'free', reason: 'No license key entered.' };
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3 || parts[0] !== 'AR1') {
    return { valid: false, tier: 'free', reason: 'Invalid license key format (expected AR1.<payload>.<signature>).' };
  }

  const [, payloadB64, sigB64] = parts;

  try {
    const pubKeyBytes = hexToBytes(publicKeyHex);
    const payloadBytes = base64UrlToBytes(payloadB64);
    const sigBytes = base64UrlToBytes(sigB64);
    const messageBytes = encodeUtf8(`AR1.${payloadB64}`);

    const signatureValid = verifyEd25519(pubKeyBytes, messageBytes, sigBytes);
    if (!signatureValid) {
      return { valid: false, tier: 'free', reason: 'Signature verification failed — key may be tampered or invalid.' };
    }

    const payloadJson = decodeUtf8(payloadBytes);
    const payload = JSON.parse(payloadJson) as Partial<LicensePayload>;

    if (!payload.tier || !['pro', 'family', 'education'].includes(payload.tier)) {
      return { valid: false, tier: 'free', reason: 'Invalid license tier in payload.' };
    }
    if (typeof payload.seats !== 'number' || payload.seats < 1) {
      return { valid: false, tier: 'free', reason: 'Invalid seat count in license payload.' };
    }
    if (payload.expiry && payload.expiry < nowDateISO) {
      return { valid: false, tier: 'free', reason: `License expired on ${payload.expiry}. Downgraded to Free tier.` };
    }

    return {
      valid: true,
      tier: payload.tier,
      payload: payload as LicensePayload,
    };
  } catch {
    return { valid: false, tier: 'free', reason: 'Malformed license key encoding.' };
  }
}

export function hasCapability(tier: LicenseTier, capability: CapabilityKey): boolean {
  const required = CAPABILITY_MAP[capability].minTier;
  return TIER_RANK[tier] >= TIER_RANK[required];
}
