# @adaptive-bundle/vite-plugin

Vite plugin for device-aware bundle optimization. Analyzes your dependency graph, splits chunks by device tier, generates build reports, and enforces CI size budgets — all automatically.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/vite-plugin)](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin)

## Install

```bash
pnpm add -D @adaptive-bundle/vite-plugin
```

## Quick Start

```ts
// vite.config.ts
import { adaptive } from '@adaptive-bundle/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [adaptive()],
});
```

Build your app — the plugin outputs a bundle analysis report showing heavy dependencies, potential savings, and suggested adaptive boundaries ranked by impact. **Zero code changes required.**

## What It Does

1. **Analyzes** your source for `adaptive()` calls and `Adaptive.High/Low` patterns
2. **Isolates** tier-specific dependencies into separate Rollup chunks
3. **Guarantees** no high-tier code leaks into low-tier bundles
4. **Reports** boundary sizes, savings, and optimization opportunities
5. **Enforces** size budgets in CI pipelines

## Configuration

```ts
adaptive({
  report: true, // enable build reports (default: true)
  reportFormat: 'console', // 'console' | 'html' | 'json'
  reportDir: './adaptive-reports', // output directory for reports
  preloadHints: true, // inject <link rel="modulepreload">
  devtools: true, // enable dev server dashboard

  // CI budget enforcement
  budget: {
    maxLowTierBundle: 150_000, // max bytes for low-tier total
    maxHighVariant: 80_000, // max bytes per high variant
    minSavingsPercent: 10, // minimum savings to justify a boundary
    enforce: 'error', // 'error' fails build, 'warn' logs only
  },

  // STB/CTV: compile-time tier resolution (zero runtime cost)
  targetTier: 'low', // tree-shake to single tier
});
```

For full configuration options, see the [Configuration Reference](https://github.com/Pizanjavier/adaptive/blob/main/docs/configuration.md).

## CLI

```bash
npx adaptive analyze             # scan source for boundaries
npx adaptive init src/Heavy.tsx  # scaffold adaptive boundary
npx adaptive simulate src/X.tsx  # what-if analysis
npx adaptive report              # regenerate from cached data
npx adaptive validate            # check boundary correctness (CI-friendly)
```

## Dev Server Dashboard

Visit `http://localhost:5173/__adaptive` during development to see boundary sizes, dependency trees, and a tier simulator with HMR-based live reload.

## Build Reports

Three output formats:

- **Console** — boundary summary with sizes, savings, and opportunities
- **HTML** — interactive dashboard with historical trend charts
- **JSON** — structured data for CI pipelines and custom tooling

## Part of Adaptive Bundle

This is the build-time engine of the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. Pair it with [`@adaptive-bundle/core`](https://www.npmjs.com/package/@adaptive-bundle/core) and a framework adapter ([React](https://www.npmjs.com/package/@adaptive-bundle/react), [Vue](https://www.npmjs.com/package/@adaptive-bundle/vue), [Svelte](https://www.npmjs.com/package/@adaptive-bundle/svelte)).

## License

MIT
