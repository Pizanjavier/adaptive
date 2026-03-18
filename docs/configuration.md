# Configuration

Adaptive has two configuration surfaces: the **Vite plugin** (build-time) and **core runtime** (client-side). Framework adapters (`@adaptive-bundle/next`, `@adaptive-bundle/nuxt`) expose subsets of these through their own config APIs.

---

## Vite Plugin Options

```ts
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  plugins: [
    adaptive({
      // All options are optional
    }),
  ],
});
```

### Analysis & Reporting

| Option                  | Type                            | Default                | Description                                       |
| ----------------------- | ------------------------------- | ---------------------- | ------------------------------------------------- |
| `report`                | `boolean`                       | `true`                 | Enable build report output                        |
| `reportFormat`          | `'console' \| 'html' \| 'json'` | `'console'`            | Report output format                              |
| `reportDir`             | `string`                        | `'./adaptive-reports'` | Output directory for HTML/JSON reports            |
| `analysisSizeThreshold` | `number`                        | `50`                   | KB threshold above which dependencies are flagged |

### Bundle Optimization

| Option           | Type              | Default | Description                                                |
| ---------------- | ----------------- | ------- | ---------------------------------------------------------- |
| `preloadHints`   | `boolean`         | `true`  | Inject `modulepreload` hints into HTML                     |
| `ssrDefaultTier` | `'high' \| 'low'` | `'low'` | Default tier for SSR when no client detection is available |

### Build-Time Tier Targeting

| Option       | Type              | Default | Description                                             |
| ------------ | ----------------- | ------- | ------------------------------------------------------- |
| `targetTier` | `'high' \| 'low'` | —       | Resolve tier at compile time, tree-shake unused variant |

When `targetTier` is set:

1. All `adaptive()` calls become direct static imports of the targeted variant
2. `<Adaptive.High>` / `<Adaptive.Low>` blocks are statically resolved — the non-matching block is removed as dead code
3. `@adaptive-bundle/core` is **not included** in the output bundle
4. Works on devices without dynamic `import()` (Chromium <63)

This is the recommended approach for STB/CTV apps built per-platform:

```ts
// vite.config.ts
const platformTierMap: Record<string, 'high' | 'low'> = {
  'sky-q': 'low',
  'sky-soip': 'high',
  'foxtel-iq4': 'low',
  'foxtel-iq5': 'high',
};

export default defineConfig({
  plugins: [
    adaptive({
      targetTier: platformTierMap[process.env.PLATFORM] ?? 'low',
    }),
  ],
});
```

```bash
PLATFORM=foxtel-iq4 pnpm build  # produces low-tier-only bundle
PLATFORM=sky-soip pnpm build    # produces high-tier-only bundle
```

### CI Budget Enforcement

```ts
adaptive({
  budget: {
    maxLowTierBundle: 150_000, // max bytes for low-tier bundle
    maxHighVariant: 80_000, // max bytes for any single high variant
    minSavingsPercent: 10, // minimum savings to justify a boundary
    enforce: 'error', // 'error' fails the build, 'warn' logs only
  },
});
```

| Option                     | Type                | Default  | Description                                                      |
| -------------------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `budget.maxLowTierBundle`  | `number`            | —        | Max total bundle size (bytes) for low-tier devices               |
| `budget.maxHighVariant`    | `number`            | —        | Max size (bytes) for any single adaptive boundary's high variant |
| `budget.minSavingsPercent` | `number`            | —        | Minimum savings percentage required per boundary                 |
| `budget.enforce`           | `'error' \| 'warn'` | `'warn'` | Fail the build or warn when budgets are exceeded                 |

### Size Overrides

Override auto-detected dependency sizes when the analysis is inaccurate:

```ts
adaptive({
  sizeOverrides: {
    'mapbox-gl': 250, // KB
    d3: 80, // KB
  },
});
```

---

## Core Runtime Options

```ts
import { configure } from '@adaptive-bundle/core';

configure({
  // All options are optional — sensible defaults are applied
});
```

### Scoring Weights

Control how much each hardware probe contributes to the final score. Weights must sum to 1.0.

```ts
configure({
  weights: {
    cpuCores: 0.35,
    memory: 0.35,
    gpu: 0.15,
    screen: 0.1,
    touchPoints: 0.05,
  },
});
```

| Probe         | Default Weight | Notes                                                                     |
| ------------- | -------------- | ------------------------------------------------------------------------- |
| `cpuCores`    | `0.35`         | `navigator.hardwareConcurrency`                                           |
| `memory`      | `0.35`         | `navigator.deviceMemory` (Chrome/Edge only)                               |
| `gpu`         | `0.15`         | WebGL renderer string heuristic                                           |
| `screen`      | `0.1`          | Resolution x DPR. Set to `0` for CTV (misleading on STBs)                 |
| `touchPoints` | `0.05`         | `navigator.maxTouchPoints`. Constant 0 on CTV — weight auto-redistributes |

### Tier Thresholds

#### Binary mode (default)

```ts
configure({
  tiers: {
    threshold: 0.5, // score >= 0.5 → high, < 0.5 → low
  },
});
```

#### Three-tier mode (opt-in)

```ts
configure({
  tiers: {
    high: 0.65, // score >= 0.65 → high
    low: 0.35, // score < 0.35 → low
    // between 0.35 and 0.65 → medium
  },
});
```

### Hysteresis

Prevent tier flipping when the score is near a threshold boundary:

```ts
configure({
  hysteresis: {
    up: 0.12, // score must exceed threshold by 0.12 to move low → high
    down: 0.08, // score must fall below threshold by 0.08 to move high → low
  },
});
```

### Network

```ts
configure({
  network: {
    dataSaverForcesLow: true, // Data Saver active → force low tier
    deferOnSlowNetwork: true, // Defer loading on 2g/slow-2g
  },
});
```

### Caching

```ts
configure({
  cacheKey: 'adaptive_device_tier', // localStorage key
  cacheStorage: 'localStorage', // 'localStorage' | 'memory'
  cacheTTL: 604_800_000, // 7 days in ms
});
```

| Option         | Type                         | Default                  | Description                                       |
| -------------- | ---------------------------- | ------------------------ | ------------------------------------------------- |
| `cacheKey`     | `string`                     | `'adaptive_device_tier'` | Storage key for cached tier                       |
| `cacheStorage` | `'localStorage' \| 'memory'` | `'localStorage'`         | `'memory'` for strict cookie-consent environments |
| `cacheTTL`     | `number`                     | `604800000` (7 days)     | TTL in milliseconds before re-evaluation          |

### Testing & Debugging

| Option           | Type     | Default           | Description                                               |
| ---------------- | -------- | ----------------- | --------------------------------------------------------- |
| `forceTierParam` | `string` | `'adaptive_tier'` | URL parameter name for forced tier (`?adaptive_tier=low`) |

```ts
// Programmatic tier forcing (for tests)
import { setForcedTier, clearForcedTier } from '@adaptive-bundle/core/testing';

beforeEach(() => setForcedTier('low'));
afterEach(() => clearForcedTier());
```

---

## STB/CTV Configuration

For operator-distributed CTV apps, Adaptive provides specialized configuration paths.

### Device Map

A static lookup table that bypasses the scoring engine entirely. Highest confidence, lowest cost:

```ts
configure({
  deviceMap: {
    'sky-q-mini': 'low',
    'sky-q': 'low',
    'sky-soip': 'high',
    'sky-glass': 'high',
    'foxtel-iq4': 'low',
    'foxtel-iq5': 'high',
    'webos-4': 'low',
    'webos-5': 'low',
    'webos-6': 'high',
    'tizen-2020': 'low',
    'tizen-2021': 'high',
  },

  detectPlatform: () => {
    if (typeof tizen !== 'undefined') return `tizen-${getTizenYear()}`;
    if (typeof webOSSystem !== 'undefined') return `webos-${getWebOSVersion()}`;
    if (typeof sky !== 'undefined') return `sky-${sky.device.model}`;
    return null; // Not an STB — fall through to browser detection
  },
});
```

When `detectPlatform()` returns a key in `deviceMap`, the tier resolves immediately with confidence 1.0 — no scoring, no probing, no WebGL.

### Platform Tier Map (with Capabilities)

An extended version of `deviceMap` that adds per-device capabilities for build-time chunk pruning:

```ts
configure({
  platformTierMap: {
    'sky-q': { tier: 'low', capabilities: ['drm', 'dolby-vision'] },
    'foxtel-iq4': { tier: 'low', capabilities: ['drm', 'hdr10'] },
    'sky-glass': { tier: 'high', capabilities: ['drm', 'dolby-vision', 'dolby-atmos'] },
  },
  detectPlatform: () => detectCurrentPlatform(),
});
```

| Option                             | Type                                | Description                         |
| ---------------------------------- | ----------------------------------- | ----------------------------------- |
| `platformTierMap`                  | `Record<string, PlatformTierEntry>` | Map of platform ID to tier + caps   |
| `platformTierMap[id].tier`         | `'high' \| 'low' \| 'medium'`       | Device tier                         |
| `platformTierMap[id].capabilities` | `string[]`                          | Optional list of supported features |

`platformTierMap` takes priority over `deviceMap` when both contain the same key. Capabilities are used by the Vite plugin's `requires` pruning and accessible at runtime via `getCapabilities()`.

The same `platformTierMap` should be passed to the Vite plugin config for build-time pruning:

```ts
// vite.config.ts
adaptive({
  platformTierMap: {
    /* same entries */
  },
});
```

### Custom Probe Providers

For STB/CTV devices with native JS bridges that expose hardware info:

```ts
configure({
  probeProviders: {
    tizenHardware: () => ({
      cpuFrequency: tizen.systeminfo.getCapability(
        'http://tizen.org/feature/platform.core.cpu.frequency',
      ),
      cpuArch: tizen.systeminfo.getCapability('http://tizen.org/feature/platform.core.cpu.arch'),
    }),
  },
});
```

### CTV Probe Weight Recommendations

| Probe         | Recommendation for CTV                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `screen`      | Set to `0` — cheap STBs output 1080p/4K to the TV regardless of hardware |
| `touchPoints` | Useless (always 0 with remote control). Weight auto-redistributes        |
| `gpu`         | Reduce or skip — many STB Chromium builds have crippled WebGL            |
| `memory`      | Often unavailable on old Chromium — falls through to CPU cores           |

```ts
configure({
  weights: {
    cpuCores: 0.5,
    memory: 0.4,
    gpu: 0.1,
    screen: 0,
    touchPoints: 0,
  },
});
```

---

## Per-Boundary Options

Each `adaptive()` call accepts boundary-specific configuration:

### Exclusion Pattern

```ts
const MapView = adaptive({
  component: () => import('./MapboxMap'),
  lowFallback: <img src="/static-map.png" alt="Map" />,
  fallback: <Skeleton />,
  layout: { width: '100%', aspectRatio: '16/9' },
  name: 'map-view',
  loading: 'viewport',
  onError: (error, name) => logError(error, name),
});
```

### Two-Variant Pattern

```ts
const Editor = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
  medium: () => import('./StandardEditor'), // opt-in three-tier
  fallback: <Skeleton />,
  layout: { width: '100%', height: '400px' },
  name: 'editor',
  loading: 'eager',
  thresholds: { high: 0.7, low: 0.3 }, // override global thresholds
});
```

| Option               | Type                                  | Default      | Description                                     |
| -------------------- | ------------------------------------- | ------------ | ----------------------------------------------- |
| `component`          | `() => Promise<{default: Component}>` | —            | Heavy component (exclusion pattern)             |
| `high`               | `() => Promise<{default: Component}>` | —            | High-tier variant (two-variant pattern)         |
| `low`                | `() => Promise<{default: Component}>` | —            | Low-tier variant (two-variant pattern)          |
| `medium`             | `() => Promise<{default: Component}>` | —            | Medium-tier variant (opt-in)                    |
| `lowFallback`        | `ReactElement \| null`                | —            | Rendered on low-tier (exclusion pattern)        |
| `fallback`           | `ReactElement`                        | —            | Loading skeleton                                |
| `layout`             | `{ width?, height?, aspectRatio? }`   | —            | CLS-preventing layout hints                     |
| `name`               | `string`                              | —            | Boundary identifier for reports/devtools        |
| `loading`            | `'eager' \| 'lazy' \| 'viewport'`     | `'viewport'` | Loading strategy                                |
| `thresholds`         | `{ high?: number, low?: number }`     | —            | Override global tier thresholds                 |
| `onError`            | `(error, name) => void`               | —            | Error callback                                  |
| `requires`           | `string[]`                            | —            | Capabilities required (build-time pruning)      |
| `capabilityFallback` | `() => Promise<{default: Component}>` | —            | Fallback when required capabilities are missing |

---

## Framework-Specific Configuration

### Next.js

```ts
// next.config.js
const { withAdaptive } = require('@adaptive-bundle/next');

module.exports = withAdaptive({
  adaptive: {
    report: true,
    reportFormat: 'console',
    budget: { maxLowTierBundle: 200_000 },
  },
});
```

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@adaptive-bundle/nuxt'],
  adaptive: {
    report: true,
    clientHints: true, // auto-injects Nitro middleware for Client Hints
  },
});
```

---

## Server-Side Detection

```ts
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

// Express / Node.js
app.use((req, res, next) => {
  const tier = resolveTierFromHeaders(req.headers);
  // Uses Device-Memory and Sec-CH-UA-Mobile client hints
});
```

The `@adaptive-bundle/core/server` module has zero DOM dependencies and runs in any JS server environment including edge runtimes.
