import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['nuxt', '@nuxt/kit', '@adaptive/core', '@adaptive/vite-plugin', 'h3'],
});
