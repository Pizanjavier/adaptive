import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  plugins: [react(), adaptive({ report: true, reportFormat: 'console' })],
  build: {
    rollupOptions: {
      output: {},
    },
  },
});
