# @adaptive-bundle/vue

Vue adapter for adaptive loading. Ship different components to high-end and low-end devices with `adaptive()`, composables, and inline components.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/vue)](https://www.npmjs.com/package/@adaptive-bundle/vue)

## Install

```bash
pnpm add @adaptive-bundle/vue @adaptive-bundle/core
pnpm add -D @adaptive-bundle/vite-plugin
```

## Adaptive Boundaries

### Two-Variant Pattern

```vue
<script setup>
import { adaptive } from '@adaptive-bundle/vue';

const MapView = adaptive({
  high: () => import('./MapboxMap.vue'),
  low: () => import('./StaticMap.vue'),
});
</script>

<template>
  <component :is="MapView" :center="[40, -3]" :zoom="12" />
</template>
```

### Exclusion Pattern

```ts
const MapView = adaptive({
  component: () => import('./MapboxMap.vue'),
  lowFallback: { template: '<img src="/static-map.png" alt="Map" />' },
});
```

### Three-Tier Mode

```ts
const Chart = adaptive({
  high: () => import('./AnimatedChart.vue'),
  medium: () => import('./StaticChart.vue'),
  low: () => import('./ChartTable.vue'),
  thresholds: { high: 0.65, low: 0.35 },
});
```

### Inline Components

```vue
<script setup>
import { AdaptiveHigh, AdaptiveLow } from '@adaptive-bundle/vue';
</script>

<template>
  <AdaptiveHigh><AnimatedChart :data="data" /></AdaptiveHigh>
  <AdaptiveLow><StaticTable :data="data" /></AdaptiveLow>
</template>
```

## Loading Strategies

| Strategy             | Behavior                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| `viewport` (default) | Load on first render                                                     |
| `eager`              | Preload at definition time                                               |
| `lazy`               | Defer until element enters viewport (IntersectionObserver, 200px margin) |

```ts
const Metrics = adaptive({
  high: () => import('./AnimatedMetrics.vue'),
  low: () => import('./StaticMetrics.vue'),
  loading: 'eager',
});

const Scene = adaptive({
  high: () => import('./ThreeScene.vue'),
  low: () => import('./StaticScene.vue'),
  loading: 'lazy',
});
```

## Composables

```ts
import { useAdaptive, useTier, useDeviceProfile, useNetworkAware } from '@adaptive-bundle/vue';

const { tier, shouldDefer, profile } = useAdaptive();
const tier = useTier();
const profile = useDeviceProfile();
const { shouldDefer, effectiveType } = useNetworkAware();
```

## Part of Adaptive Bundle

This is the Vue adapter for the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. Requires [`@adaptive-bundle/core`](https://www.npmjs.com/package/@adaptive-bundle/core) as a peer dependency and Vue 3.3+. For build-time chunk splitting, add [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin).

## License

MIT
