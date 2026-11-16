import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@assistivereader/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@assistivereader/adapters': path.resolve(__dirname, 'packages/adapters/src/index.ts'),
      '@assistivereader/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});
