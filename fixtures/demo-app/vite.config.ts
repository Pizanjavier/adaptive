import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/adaptive/' : '/',
  plugins: [
    react(),
    adaptive({
      report: true,
      reportFormat: 'console',
      platformTierMap: {
        'stb-premium': { tier: 'high', capabilities: ['4k', 'hdr', 'dolby-atmos'] },
        'stb-standard': { tier: 'high', capabilities: ['4k', 'hdr'] },
        'stb-basic': { tier: 'low', capabilities: ['hdr'] },
        'stb-legacy': { tier: 'low', capabilities: [] },
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {},
    },
  },
});
