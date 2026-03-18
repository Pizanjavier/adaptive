# @adaptive-bundle/next

Next.js plugin for device-aware bundle optimization. Hooks into Webpack's chunk splitting to isolate tier-specific code, reusing the same analysis engine as the Vite plugin.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/next)](https://www.npmjs.com/package/@adaptive-bundle/next)

## Install

```bash
pnpm add @adaptive-bundle/next @adaptive-bundle/core @adaptive-bundle/react
pnpm add -D @adaptive-bundle/vite-plugin
```

## Quick Start

```js
// next.config.js
const { withAdaptive } = require('@adaptive-bundle/next');

module.exports = withAdaptive({
  adaptive: {
    report: true,
    reportFormat: 'console',
  },
});
```

The Webpack plugin runs at build time (production, client-side only) and:

1. Scans your source for `adaptive()` and `Adaptive.High/Low` patterns
2. Analyzes the dependency graph using the same engine as `@adaptive-bundle/vite-plugin`
3. Creates `splitChunks.cacheGroups` to isolate tier-specific code
4. Reports boundary sizes and savings

## Configuration

```js
module.exports = withAdaptive({
  adaptive: {
    report: true,
    reportFormat: 'html', // 'console' | 'html' | 'json'
    reportDir: './adaptive-reports',
    budget: {
      maxLowTierBundle: 150_000,
      enforce: 'error',
    },
  },
});
```

## How It Works

`withAdaptive()` wraps your Next.js config and injects an `AdaptiveWebpackPlugin` into production client builds. It:

- Adapts Webpack's module graph to the same `ModuleGraph` interface used by the Vite plugin
- Reuses `scanAllModules` and `analyzeBoundaries` from `@adaptive-bundle/vite-plugin`
- Converts analysis results into Webpack `splitChunks.cacheGroups` configuration
- Chains with any existing `webpack` config you have

Your existing `webpack` config is preserved and called after the adaptive plugin runs.

## Using with React Adapter

Write adaptive boundaries with `@adaptive-bundle/react` as usual — the Next.js plugin handles chunk splitting automatically:

```tsx
import { adaptive } from '@adaptive-bundle/react';

const Editor = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
});
```

## Part of Adaptive Bundle

This is the Next.js integration for the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. For Vite-based projects, use [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin) directly. For Nuxt, see [`@adaptive-bundle/nuxt`](https://www.npmjs.com/package/@adaptive-bundle/nuxt).

## License

MIT
