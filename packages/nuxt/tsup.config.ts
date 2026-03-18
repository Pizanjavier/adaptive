import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['nuxt', '@nuxt/kit', '@adaptive-bundle/core', '@adaptive-bundle/vite-plugin', 'h3'],
});
