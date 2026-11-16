import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import manifest from '../../manifest.json';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: {
      '@assistivereader/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@assistivereader/adapters': path.resolve(__dirname, '../adapters/src/index.ts'),
      '@assistivereader/ui': path.resolve(__dirname, '../ui/src/index.ts'),
    },
  },
  build: {
    outDir: '../../dist-ext',
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, '../../src/sidepanel/index.html'),
      },
    },
  },
});
