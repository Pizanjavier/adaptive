# Adaptive

**Intelligent bundle optimization for device-aware web apps.**

Install one Vite plugin. See exactly where your bundle hurts low-end devices. Fix it incrementally with one-line adaptive boundaries. Ship 60-90% less JS to devices that can't handle it.

## Why

Modern web apps ship the same JavaScript to every device. A flagship phone with 12GB RAM gets the same 1.2MB bundle as a budget phone with 2GB RAM. On STBs and CTV devices, the problem is even worse.

No production-grade tooling exists for adaptive loading. Google Chrome Labs validated the pattern in 2019 but abandoned it. Adaptive makes it practical.

## Install

```bash
pnpm add -D @adaptive/vite-plugin
pnpm add @adaptive/core

# Pick your framework adapter:
pnpm add @adaptive/react    # React 18+
pnpm add @adaptive/vue      # Vue 3.3+
pnpm add @adaptive/svelte   # Svelte 4+
pnpm add @adaptive/next     # Next.js 13+
pnpm add @adaptive/nuxt     # Nuxt 3+
```

## Level 0: Plugin Setup (zero code changes)

```ts
// vite.config.ts
import { adaptive } from '@adaptive/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [adaptive()],
});
```

Build your app -- the plugin outputs a bundle analysis report with heavy dependencies, potential savings, and suggested adaptive boundaries ranked by impact.

## Level 1: Adaptive Boundaries

### Exclusion Pattern

Exclude a heavy component on low-tier devices entirely:

```tsx
import { adaptive } from '@adaptive/react';

const MapView = adaptive({
  component: () => import('./MapboxMap'),
  lowFallback: <img src="/static-map.png" alt="Map" />,
  layout: { width: '100%', aspectRatio: '16/9' },
});

// Use like a normal component
<MapView center={[40, -74]} zoom={12} />;
```

### Two-Variant Pattern

Ship different implementations per tier:

```tsx
const Editor = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
  name: 'editor',
});
```

### Inline Pattern

Conditional rendering within JSX:

```tsx
import { Adaptive } from '@adaptive/react';

function Dashboard() {
  return (
    <div>
      <Adaptive.High>
        <AnimatedChart data={data} />
      </Adaptive.High>
      <Adaptive.Low>
        <StaticTable data={data} />
      </Adaptive.Low>
    </div>
  );
}
```

### Vue

```vue
<script setup>
import { adaptive } from '@adaptive/vue';

const MapView = adaptive({
  high: () => import('./MapboxMap.vue'),
  low: () => import('./StaticMap.vue'),
});
</script>

<template>
  <component :is="MapView" :center="[40, -3]" :zoom="12" />
</template>
```

### Svelte

```svelte
<script>
import { adaptive } from '@adaptive/svelte';

const MapView = adaptive({
  high: () => import('./MapboxMap.svelte'),
  low: () => import('./StaticMap.svelte'),
});
</script>

<svelte:component this={$MapView} center={[40, -3]} zoom={12} />
```

## Hooks

```tsx
import { useAdaptive, useTier, useDeviceProfile, useNetworkAware } from '@adaptive/react';

function MyComponent() {
  const { tier, shouldDefer, profile } = useAdaptive();
  const tier = useTier(); // 'high' | 'low' | 'medium'
  const profile = useDeviceProfile(); // full DeviceProfile
  const { shouldDefer } = useNetworkAware(); // true on 2g/slow-2g
}
```

Wrap your app in `AdaptiveProvider` to cache the profile across hooks:

```tsx
import { AdaptiveProvider } from '@adaptive/react';

<AdaptiveProvider>
  <App />
</AdaptiveProvider>;
```

## Configuration

```ts
import { configure } from '@adaptive/core';

configure({
  threshold: 0.5, // score threshold for high/low split
  cacheTTL: 30_000, // cache detection for 30s
  weights: {
    cpuCores: 0.35,
    memory: 0.25,
    gpu: 0.2,
    screen: 0.1,
    touchPoints: 0.1,
  },
});
```

## Server-Side Detection

```ts
import { resolveTierFromHeaders } from '@adaptive/core/server';

const tier = resolveTierFromHeaders(request.headers);
// Uses Device-Memory and Sec-CH-UA-Mobile client hints
```

## Testing

Force a specific tier in tests:

```ts
import { setForcedTier, clearForcedTier } from '@adaptive/core/testing';

beforeEach(() => setForcedTier('low'));
afterEach(() => clearForcedTier());
```

Or via URL parameter: `?adaptive_tier=low`

## Vite Plugin Options

```ts
adaptive({
  report: true, // enable build reports
  reportFormat: 'console', // 'console' | 'html' | 'json'
  reportDir: './adaptive-reports', // output directory
  preloadHints: true, // inject preload tags
  budget: {
    maxLowTierBundle: 150_000, // max bytes for low-tier bundle
    minSavingsPercent: 10, // minimum savings to justify boundary
    enforce: 'error', // 'error' | 'warn'
  },
});
```

## Next.js

```ts
// next.config.js
const { withAdaptive } = require('@adaptive/next');

module.exports = withAdaptive({
  adaptive: {
    report: true,
    reportFormat: 'console',
  },
  // ...rest of your Next.js config
});
```

The Webpack plugin runs analysis at build time (production only, client-side) using the same analysis engine as the Vite plugin. It creates `splitChunks.cacheGroups` to isolate tier-specific code.

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@adaptive/nuxt'],
  adaptive: {
    report: true,
    clientHints: true, // auto-injects Nitro middleware for Client Hints
  },
});
```

The Nuxt module auto-injects the Vite plugin and registers server middleware that resolves device tier from Client Hints headers and sets an `adaptive_tier_hint` cookie.

## Architecture

```
packages/
  core/          @adaptive/core           Detection + scoring (~3KB gzipped, zero deps)
  vite-plugin/   @adaptive/vite-plugin    Build analysis, chunk splitting, CLI, reports
  react/         @adaptive/react          adaptive() + hooks + Adaptive.High/Low
  vue/           @adaptive/vue            adaptive() + composables + AdaptiveHigh/Low
  svelte/        @adaptive/svelte         adaptive() + stores + context
  next/          @adaptive/next           Next.js Webpack plugin (reuses vite-plugin analysis)
  nuxt/          @adaptive/nuxt           Nuxt module + Nitro middleware
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

## Size Budgets

| Package            | Budget        | Enforced     |
| ------------------ | ------------- | ------------ |
| `@adaptive/core`   | 3KB gzipped   | CI blocks PR |
| `@adaptive/react`  | 2KB gzipped   | CI blocks PR |
| `@adaptive/vue`    | 2KB gzipped   | CI blocks PR |
| `@adaptive/svelte` | 1.5KB gzipped | CI blocks PR |

## License

MIT
