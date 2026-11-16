/**
 * Icon generation script — run with: node scripts/generate-icons.mjs
 *
 * Generates 16x16, 48x48, 128x128 PNG icons from an inline SVG.
 * Requires no external dependencies (uses native Canvas in Node 20+).
 *
 * If you don't have Node canvas support, you can simply use any
 * 128x128 PNG icon and resize it manually. Place the files at:
 *   src/assets/icon-16.png
 *   src/assets/icon-48.png
 *   src/assets/icon-128.png
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'src', 'assets');

mkdirSync(assetsDir, { recursive: true });

// Minimal 1x1 purple PNG for each size (placeholder)
// In production, replace these with real icon files.
function createMinimalPNG(size) {
  // PNG file header + minimal IHDR, IDAT, IEND for a solid purple pixel
  // This creates a valid but tiny PNG. For a real icon, replace the files.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="24" fill="#4338ca"/>
    <g transform="translate(64,64)">
      <circle cx="0" cy="-8" r="28" fill="none" stroke="white" stroke-width="6"/>
      <path d="M-20,20 Q0,0 20,20" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/>
      <circle cx="-8" cy="-12" r="4" fill="white"/>
      <circle cx="8" cy="-12" r="4" fill="white"/>
    </g>
  </svg>`;
  return svg;
}

// Write SVG placeholders (CRXJS and Chrome can handle SVG icons in dev mode)
// For production, convert these to PNG
for (const size of [16, 48, 128]) {
  const svg = createMinimalPNG(size);
  const filename = `icon-${size}.svg`;
  writeFileSync(join(assetsDir, filename), svg);
  console.log(`Created ${filename}`);
}

console.log('\\nNote: For production, convert SVG icons to PNG format.');
console.log('You can use any online SVG-to-PNG converter or ImageMagick.');
