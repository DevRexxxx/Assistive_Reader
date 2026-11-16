#!/usr/bin/env node
/**
 * CI No-Network & Zero-Telemetry Check
 * Fails if fetch, XMLHttpRequest, WebSocket, navigator.sendBeacon,
 * remote font/CDN URLs, or known telemetry packages appear in app code.
 */

import fs from 'node:fs';
import path from 'node:path';

const SCAN_ROOTS = ['packages', 'src', 'index.html'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html']);

const FORBIDDEN_PATTERNS = [
  { name: 'fetch()', regex: /\bfetch\s*\(/g },
  { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/g },
  { name: 'WebSocket', regex: /\bWebSocket\b/g },
  { name: 'navigator.sendBeacon', regex: /navigator\.sendBeacon/g },
  { name: 'Google Fonts URL', regex: /fonts\.googleapis\.com|fonts\.gstatic\.com/gi },
  { name: 'cdnfonts URL', regex: /fonts\.cdnfonts\.com/gi },
  { name: 'Analytics/Telemetry SDK', regex: /@sentry|posthog|mixpanel|amplitude|gtag|google-analytics/gi },
];

const CORE_FORBIDDEN_DOM_CHROME = [
  { name: 'chrome.* API in core', regex: /\bchrome\.(storage|runtime|tabs|sidePanel|notifications)\b/g },
  { name: 'window/document DOM in core', regex: /\b(window|document)\.(getElementById|querySelector|createElement|localStorage)\b/g },
];

function walkFiles(targetPath) {
  const results = [];
  if (!fs.existsSync(targetPath)) return results;
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (EXTENSIONS.has(path.extname(targetPath))) results.push(targetPath);
    return results;
  }
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

const violations = [];

for (const root of SCAN_ROOTS) {
  for (const file of walkFiles(root)) {
    const content = fs.readFileSync(file, 'utf8');
    // Skip unit test files for DOM/test helper checks, still scan runtime code
    const isTest = file.includes('__tests__');
    if (isTest) continue;

    for (const pat of FORBIDDEN_PATTERNS) {
      if (pat.regex.test(content)) {
        violations.push(`${file}: forbidden ${pat.name}`);
      }
      pat.regex.lastIndex = 0;
    }

    if (file.startsWith(path.join('packages', 'core'))) {
      for (const pat of CORE_FORBIDDEN_DOM_CHROME) {
        if (pat.regex.test(content)) {
          violations.push(`${file}: ${pat.name}`);
        }
        pat.regex.lastIndex = 0;
      }
    }
  }
}

if (violations.length > 0) {
  console.error('❌ No-network / isolation check failed:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('✅ No-network & core isolation check passed (0 violations).');
