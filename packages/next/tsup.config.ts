import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: [
    'next',
    '@adaptive-bundle/core',
    '@adaptive-bundle/react',
    '@adaptive-bundle/vite-plugin',
  ],
});
