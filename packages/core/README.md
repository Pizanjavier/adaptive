# @adaptive-bundle/core

Lightweight device detection engine for adaptive loading. Scores device hardware capability, resolves a tier (`high` | `medium` | `low`), and caches the result. Zero dependencies, ~3KB gzipped.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/core)](https://www.npmjs.com/package/@adaptive-bundle/core)

## Install

```bash
pnpm add @adaptive-bundle/core
```

## Quick Start

```ts
import { getDeviceProfile } from '@adaptive-bundle/core';

const profile = getDeviceProfile();
console.log(profile.tier); // 'high' | 'medium' | 'low'
console.log(profile.score); // 0.0 - 1.0
```

## How Scoring Works

Five hardware probes contribute to a composite score (0-1):

| Probe         | Weight | Source                          |
| ------------- | ------ | ------------------------------- |
| CPU cores     | 0.35   | `navigator.hardwareConcurrency` |
| Device memory | 0.35   | `navigator.deviceMemory`        |
| GPU tier      | 0.15   | WebGL renderer string heuristic |
| Screen        | 0.10   | Resolution x device pixel ratio |
| Touch points  | 0.05   | `navigator.maxTouchPoints`      |

Score >= 0.5 is `high`, < 0.5 is `low`. Weights redistribute automatically when probes are unavailable.

### Fast Path

~70% of devices are classified without full scoring:

- Data Saver on → `low`
- Cached tier (localStorage, 7-day TTL) → reuse
- `deviceMemory` <= 2GB → `low`
- `deviceMemory` >= 8GB + 8+ cores → `high`

Detection completes in **< 50ms** on any device.

## Server-Side Detection

Resolve tier from Client Hints headers without any client-side cost:

```ts
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

app.use((req, res, next) => {
  const tier = resolveTierFromHeaders(req.headers);
  // Uses Sec-CH-Device-Memory and Sec-CH-UA-Mobile
});
```

Works in any JS server environment including edge runtimes.

## Testing Utilities

```ts
import { setForcedTier, clearForcedTier } from '@adaptive-bundle/core/testing';

beforeEach(() => setForcedTier('low'));
afterEach(() => clearForcedTier());
```

Or via URL parameter: `?adaptive_tier=low`

## Platform Capabilities

For STB/CTV apps, `platformTierMap` extends the device map with per-device capabilities:

```ts
import { configure, getCapabilities } from '@adaptive-bundle/core';

configure({
  platformTierMap: {
    'sky-q': { tier: 'low', capabilities: ['drm', 'dolby-vision'] },
    'foxtel-iq4': { tier: 'low', capabilities: ['drm', 'hdr10'] },
  },
  detectPlatform: () => detectCurrentPlatform(),
});

// After detection
getCapabilities(); // ['drm', 'dolby-vision'] on sky-q
```

`platformTierMap` takes priority over `deviceMap`. Capabilities are user-defined and used by the Vite plugin for build-time chunk pruning.

## API

### `getDeviceProfile(): DeviceProfile`

Returns the full device profile including tier, score, confidence, all probe values, and network info.

### `getCapabilities(): string[]`

Returns the current platform's capabilities from `platformTierMap`. Empty array when using auto-detection.

### `resolveTierFromHeaders(headers): Tier`

Server-side tier resolution from Client Hints headers.

### `setForcedTier(tier) / clearForcedTier()`

Testing utilities to override detection.

## Part of Adaptive Bundle

This is the runtime core of the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. For build-time analysis and chunk splitting, see [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin). For framework integration, see the React, Vue, or Svelte adapters.

## License

MIT
