# @adaptive-bundle/react

React adapter for adaptive loading. Ship different components to high-end and low-end devices with one-line boundaries, inline JSX conditionals, and hooks.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/react)](https://www.npmjs.com/package/@adaptive-bundle/react)

## Install

```bash
pnpm add @adaptive-bundle/react @adaptive-bundle/core
pnpm add -D @adaptive-bundle/vite-plugin
```

## Adaptive Boundaries

### Exclusion Pattern

Exclude a heavy component on low-tier devices:

```tsx
import { adaptive } from '@adaptive-bundle/react';

const MapView = adaptive({
  component: () => import('./MapboxMap'),
  lowFallback: <img src="/static-map.png" alt="Map" />,
  layout: { width: '100%', aspectRatio: '16/9' },
});
```

### Two-Variant Pattern

Ship different implementations per tier:

```tsx
const Editor = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
});
```

### Three-Tier Mode

```tsx
const Chart = adaptive({
  high: () => import('./AnimatedChart'),
  medium: () => import('./StaticChart'),
  low: () => import('./ChartTable'),
  thresholds: { high: 0.65, low: 0.35 },
});
```

### Inline Pattern

```tsx
import { Adaptive } from '@adaptive-bundle/react';

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

## Hooks

```tsx
import { useAdaptive, useTier, useDeviceProfile, useNetworkAware } from '@adaptive-bundle/react';

const { tier, shouldDefer, profile } = useAdaptive();
const tier = useTier(); // 'high' | 'low' | 'medium'
const profile = useDeviceProfile(); // full DeviceProfile
const { shouldDefer, effectiveType } = useNetworkAware();
```

### AdaptiveProvider

Cache the device profile across all hooks:

```tsx
import { AdaptiveProvider } from '@adaptive-bundle/react';

<AdaptiveProvider>
  <App />
</AdaptiveProvider>;
```

## Error Recovery

Boundaries automatically retry failed imports after 1 second. If a high-tier variant fails, the low variant loads as fallback.

```tsx
adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
  onError: (error, name) => analytics.track('adaptive_error', { error, name }),
});
```

## Part of Adaptive Bundle

This is the React adapter for the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. Requires [`@adaptive-bundle/core`](https://www.npmjs.com/package/@adaptive-bundle/core) as a peer dependency. For build-time chunk splitting, add [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin).

## License

MIT
