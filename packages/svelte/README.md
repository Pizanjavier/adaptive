# @adaptive-bundle/svelte

Svelte adapter for adaptive loading. Ship different components to high-end and low-end devices with `adaptive()` stores and Svelte context.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/svelte)](https://www.npmjs.com/package/@adaptive-bundle/svelte)

## Install

```bash
pnpm add @adaptive-bundle/svelte @adaptive-bundle/core
pnpm add -D @adaptive-bundle/vite-plugin
```

## Adaptive Boundaries

### Two-Variant Pattern

```svelte
<script>
import { adaptive } from '@adaptive-bundle/svelte';

const MapView = adaptive({
  high: () => import('./MapboxMap.svelte'),
  low: () => import('./StaticMap.svelte'),
});
</script>

{#if $MapView}
  <svelte:component this={$MapView} center={[40, -3]} zoom={12} />
{/if}
```

`adaptive()` returns a Svelte `Readable` store that lazily loads the correct variant on first subscription.

### Exclusion Pattern

```ts
const MapView = adaptive({
  component: () => import('./MapboxMap.svelte'),
});
// Returns null on low-tier devices
```

### Three-Tier Mode

```ts
const Chart = adaptive({
  high: () => import('./AnimatedChart.svelte'),
  medium: () => import('./StaticChart.svelte'),
  low: () => import('./ChartTable.svelte'),
  thresholds: { high: 0.65, low: 0.35 },
});
```

## Stores

```ts
import { tierStore, deviceProfileStore, networkAwareStore } from '@adaptive-bundle/svelte';

$tierStore; // 'high' | 'low' | 'medium'
$deviceProfileStore; // full DeviceProfile
$networkAwareStore; // { shouldDefer, effectiveType }
```

## Context

Share the device profile across a component tree:

```ts
import { setAdaptiveContext, getAdaptiveContext } from '@adaptive-bundle/svelte';

// In a parent component
setAdaptiveContext();

// In any child component
const profile = getAdaptiveContext();
```

## Part of Adaptive Bundle

This is the Svelte adapter for the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. Requires [`@adaptive-bundle/core`](https://www.npmjs.com/package/@adaptive-bundle/core) as a peer dependency and Svelte 4+. For build-time chunk splitting, add [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin).

## License

MIT
