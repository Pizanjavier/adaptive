# Adaptive: Intelligent Bundle Optimization for Device-Aware Web Apps

## 1. Problem Statement

Modern web applications ship the same JavaScript bundle to every device. A flagship phone with 12GB RAM and a dedicated GPU receives the same 1.2MB bundle as a budget phone with 2GB RAM and no GPU acceleration. The problem is even more extreme on set-top boxes (STBs) and Connected TV (CTV) devices — a Sky Q Mini with a dual-core ARM chip and 1GB RAM receives the same bundle as a modern desktop. This results in:

- **Unusable experiences on low-end devices:** Parsing 500KB of JS takes 2-3 seconds on a Snapdragon 4xx — and 5-8 seconds on a budget STB. Users bounce or the app crashes.
- **Wasted bandwidth:** Low-end devices are often on slower networks. They download heavy code they can't run smoothly anyway.
- **STB/CTV fragmentation:** CTV platforms (Tizen, webOS, Sky, Foxtel, Orange) run old Chromium builds with limited APIs, yet receive bundles designed for modern browsers. Developers build per-platform configs manually with no shared tooling.
- **Manual workarounds:** Developers scatter `if (isMobile)` or `if (isTizen)` checks across their codebase with no structure, no guarantees, and no visibility into impact.
- **No tooling:** Google Chrome Labs validated the adaptive loading pattern in 2019 but never shipped production tooling. Every library since then provided primitives (raw hardware hooks, UA parsing) but never a complete solution. All are abandoned. None support STB/CTV at all.

## 2. Product Vision

Adaptive is a **Vite-native build intelligence tool** that analyzes, splits, and serves optimized bundles based on device capabilities. It combines build-time dependency analysis with a lightweight runtime scoring engine to ship dramatically less JavaScript to devices that can't handle it.

The core value proposition:

> Install one Vite plugin. See exactly where your bundle hurts low-end devices. Fix it incrementally with one-line adaptive boundaries. Ship 60-90% less JS to devices that can't handle it.

Adaptive is NOT just a lazy-loading wrapper. It is a build analysis and optimization pipeline that happens to include a thin runtime component.

## 3. Design Principles

1. **Value before code changes.** The first install, with zero adaptive boundaries written, must show actionable bundle analysis. Developers see the problem before writing any new code.
2. **Progressive adoption.** One line in `vite.config.ts` to start. Add adaptive boundaries incrementally, one at a time, where impact is highest.
3. **The plugin is the product.** The Vite plugin does the hard, differentiated work (analysis, chunk isolation, preload hints, reporting). The runtime wrappers are thin glue — anyone can write a lazy loader, nobody can easily replicate build-time intelligence.
4. **Never fail, always classify.** The detection engine must produce a tier on every device, even when APIs are unavailable. Degrade gracefully with lower confidence, never crash or hang.
5. **Framework-agnostic core.** Detection and scoring logic has zero framework dependencies. React, Vue, and Svelte get thin adapter packages.
6. **Minimal runtime cost.** The detection engine + runtime must be under 4KB gzipped. If the runtime costs more than it saves, the tool is pointless.
7. **Developer trust through transparency.** Always show why a decision was made: which probes were read, what score was computed, which tier was selected, and what the confidence level is.

## 4. Package Architecture

```
packages/
  vite-plugin/     @adaptive-bundle/vite-plugin     Build-time analysis, chunk splitting, CLI, reports
  core/            @adaptive-bundle/core            Detection engine, scoring, tier resolution
  react/           @adaptive-bundle/react           adaptive() + Adaptive.High/Low React wrappers + hooks
  vue/             @adaptive-bundle/vue             adaptive() Vue wrapper
  svelte/          @adaptive-bundle/svelte          adaptive() Svelte wrapper
  next/            @adaptive-bundle/next            Next.js plugin (Webpack integration + middleware)
  nuxt/            @adaptive-bundle/nuxt            Nuxt module (auto-configures Vite plugin + Nitro middleware)
  devtools/        @adaptive-bundle/devtools        Browser overlay + Vite plugin UI panel
```

### Dependency graph

```
@adaptive-bundle/vite-plugin  (dev dependency — build time only)
       │
       ├── analyzes source code for adaptive() and Adaptive.High/Low calls
       ├── configures chunk splitting in Rollup
       ├── injects preload hints into HTML
       ├── generates build reports
       └── enforces CI performance budgets

@adaptive-bundle/next  (dev dependency — wraps Webpack for Next.js)
       └── provides equivalent chunk isolation + analysis for Webpack

@adaptive-bundle/nuxt  (dev dependency — Nuxt module)
       └── auto-configures @adaptive-bundle/vite-plugin + Nitro middleware

@adaptive-bundle/react ─── depends on ──→ @adaptive-bundle/core
@adaptive-bundle/vue   ─── depends on ──→ @adaptive-bundle/core
@adaptive-bundle/svelte ── depends on ──→ @adaptive-bundle/core

@adaptive-bundle/core  (zero dependencies, ~3KB gzipped)
       │
       ├── device hardware detection
       ├── composite scoring engine (hardware only)
       ├── tier resolution logic
       ├── network awareness layer (separate from tier)
       └── probe normalization + caching

@adaptive-bundle/devtools  (optional, dev only)
       │
       ├── browser overlay showing current tier + probes
       └── Vite dev server panel with analysis UI
```

## 5. Adoption Levels

Adaptive is designed for progressive adoption. Each level adds value without requiring the next.

### Level 0: Install and Analyze (zero code changes)

```ts
// vite.config.ts
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  plugins: [adaptive()],
});
```

On every build, the plugin outputs a bundle analysis report:

```
Adaptive Bundle Analysis
────────────────────────────────
Route: /dashboard
  Heavy dependencies detected:
    mapbox-gl        → 230KB (72% of route bundle)
    @antv/g2         → 156KB
    @tiptap/core     → 89KB

  Potential savings: 475KB (84%) for low-tier devices

  Suggested adaptive boundaries (ranked by impact):

    1. src/components/MapView.tsx → imports mapbox-gl (230KB)
       Run: npx adaptive init src/components/MapView.tsx

    2. src/components/Charts.tsx → imports @antv/g2 (156KB)
       Run: npx adaptive init src/components/Charts.tsx

    3. src/components/Editor.tsx → imports @tiptap/core (89KB)
       Run: npx adaptive init src/components/Editor.tsx

Route: /editor
  Heavy dependencies detected:
    @tiptap/core     → 89KB
    highlight.js     → 67KB

  Potential savings: 156KB (61%) for low-tier devices

  Suggested adaptive boundaries (ranked by impact):

    1. src/features/RichEditor.tsx → imports @tiptap/core (89KB)
       Run: npx adaptive init src/features/RichEditor.tsx

    2. src/features/CodeBlock.tsx → imports highlight.js (67KB)
       Run: npx adaptive init src/features/CodeBlock.tsx

Performance impact (low-tier devices):
  Total potential savings: 631KB across all routes
  Parse time saved:  ~1.6s on median low-end device
  Download saved:    ~2.1s on 3G connection

Quick start: npx adaptive init           (scaffold an adaptive boundary)
────────────────────────────────
```

At this level, the plugin acts purely as a diagnostic tool. No runtime code is added. No bundles are modified. The performance impact estimates use published Web Vitals research correlations and are designed to make the business case immediately visible — even at Level 0, before any code changes.

### Level 1: First Adaptive Boundary

Developers choose between three API styles depending on the scope of the boundary:

#### Option A: Single-component exclusion (simplest — no second file)

Best for when the goal is simply to **skip a heavy component on low-tier devices** without writing a full alternative implementation. This is the lowest-friction entry point — no parallel files to maintain, no drift risk:

```tsx
import { adaptive } from '@adaptive-bundle/react';

const MapView = adaptive({
  component: () => import('./MapboxMap'),
  lowFallback: <img src={staticMapUrl} alt="Map overview" />,
  layout: { width: '100%', aspectRatio: '16/9' },
});

// Usage — renders MapboxMap on high-tier, static image on low-tier
function App() {
  return <MapView center={[40, -3]} zoom={12} />;
}
```

The `lowFallback` is inline JSX — a static image, a placeholder, a simplified HTML table, or even `null` to render nothing. No second file, no maintenance burden. Props are forwarded to the heavy component on high-tier devices; on low-tier devices only the fallback renders.

This covers the majority of real-world use cases: "show the fancy thing on capable devices, show something simple (or nothing) on weak devices."

#### Option B: Two-variant boundary (separate files)

Best for when the high and low variants are fundamentally different components that both need significant logic (e.g., interactive map vs. Leaflet map):

```tsx
import { adaptive } from '@adaptive-bundle/react';

const DashboardExperience = adaptive({
  high: () => import('./features/DashboardFull'),
  low: () => import('./features/DashboardLite'),
  fallback: <DashboardSkeleton />,
});
```

#### Option C: Inline boundary (single file)

Best for when specific sections within a component differ by tier, without needing entirely separate component files. This dramatically lowers the maintenance burden — no parallel files to keep in sync:

```tsx
import { Adaptive } from '@adaptive-bundle/react';

function Dashboard({ data }) {
  return (
    <div>
      <Header data={data} />

      <Adaptive.High imports={() => import('./MapboxMap')}>
        {(MapboxMap) => <MapboxMap center={[40, -3]} zoom={12} />}
      </Adaptive.High>
      <Adaptive.Low>
        <img src={staticMapUrl} alt="Map" />
      </Adaptive.Low>

      <Adaptive.High imports={() => import('./InteractiveChart')}>
        {(Chart) => <Chart data={data.metrics} />}
      </Adaptive.High>
      <Adaptive.Low>
        <table>{/* Simple data table */}</table>
      </Adaptive.Low>

      <Footer />
    </div>
  );
}
```

The Vite plugin recognizes both patterns and:

- Guarantees variant chunks are completely isolated (no shared heavy dependencies leaking across).
- Injects appropriate preload hints for the likely variant.
- Reports actual savings in the build output.
- For inline boundaries, statically analyzes the `imports()` calls to determine exclusive dependency weight.

All three APIs are first-class. The single-component exclusion API (Option A) is the recommended starting point — it covers 80% of use cases with zero maintenance cost. The two-variant API (Option B) is for cases where both tiers need substantial logic. The inline API (Option C) is for tier-specific sections within a single component. Teams can mix all three in the same project.

### Level 2: CLI Scaffolding

```bash
npx adaptive init ./src/features/DashboardFull
```

The CLI:

1. Analyzes the component's dependency tree.
2. Creates `DashboardLite.tsx` with the same props interface, a skeleton implementation, and TODO markers where the developer fills in the simple version.
3. Creates `Dashboard.adaptive.tsx` — a wrapper file that exports the `adaptive()` boundary with both variants configured. This is the file consumers import instead of importing the high/low variants directly.
4. Reports expected savings.

**Scaffolded files vs. hand-written boundaries:** The `*.adaptive.tsx` files generated by the CLI are standard `adaptive()` calls — identical to what developers write by hand in Level 1. The CLI simply automates the boilerplate. Developers can skip the CLI entirely and write boundaries inline (Level 1), or use the CLI to scaffold and then customize the generated files. Both approaches are first-class; the plugin treats them identically during analysis.

### Level 3: Fine-Tuning

- Custom thresholds per boundary.
- DevTools overlay for debugging tier decisions.
- Edge middleware helpers for server-side tier hints.
- Performance monitoring integration.
- CI budget enforcement (see Section 7.2.5).

## 6. Runtime API

### 6.1 Core Detection Engine (`@adaptive-bundle/core`)

The detection engine reads all available hardware probes, normalizes them, and computes a composite score.

#### Hardware Probes (determine device tier)

These probes reflect permanent device capability and are used to compute the composite score:

| Probe                   | API                                              | Browser Support         | Weight |
| ----------------------- | ------------------------------------------------ | ----------------------- | ------ |
| CPU cores               | `navigator.hardwareConcurrency`                  | All modern browsers     | 0.35   |
| Device memory           | `navigator.deviceMemory`                         | Chromium only           | 0.35   |
| GPU tier                | WebGL/WebGPU capability probing (see Section 18) | All browsers with WebGL | 0.15   |
| Screen resolution + DPR | `window.screen` + `devicePixelRatio`             | All browsers            | 0.10   |
| Max touch points        | `navigator.maxTouchPoints`                       | All modern browsers     | 0.05   |

**Why GPU is weighted lower than CPU/memory:** WebGL capability probing (`MAX_TEXTURE_SIZE`, extensions count, etc.) yields only 3-4 meaningful buckets across all modern GPUs — coarse discrimination compared to CPU cores (2-16+ range) and memory (1-32GB range). CPU and memory are the most reliable, highest-resolution probes for differentiating device capability. GPU weight is intentionally conservative to avoid noise from driver variability. The weight is configurable — teams with GPU-heavy workloads can increase it based on their own calibration data.

Weights are dynamically redistributed when probes are unavailable (e.g., if `deviceMemory` is missing on Safari, its 0.35 weight is redistributed proportionally across the remaining available probes).

#### Network Probes (separate concern — do not affect tier)

Network conditions are transient: a flagship phone on airplane WiFi shouldn't be classified as "low-tier" and have that cached for a week. Network is handled as a **separate overlay** that affects loading strategy, not component selection:

| Probe                  | API                                  | Browser Support | Effect                                                     |
| ---------------------- | ------------------------------------ | --------------- | ---------------------------------------------------------- |
| Network effective type | `navigator.connection.effectiveType` | Chromium only   | Defer non-critical variant loading on slow connections     |
| Data saver mode        | `navigator.connection.saveData`      | Chromium only   | **Force low tier** (explicit user preference to save data) |

Data saver is the exception: it represents an explicit user choice, not a transient condition, so it overrides the hardware tier.

The network layer provides a separate API for developers who want network-aware behavior:

```ts
import { useNetworkAware } from '@adaptive-bundle/react';

function VideoPlayer({ src }) {
  const { shouldDefer, effectiveType } = useNetworkAware();

  if (shouldDefer) return <VideoThumbnail src={src} />;
  return <FullVideoPlayer src={src} />;
}
```

This separation means:

- Hardware tier is stable, cached, predictable. Developers trust it.
- Network awareness is opt-in and clearly labeled as transient.
- No confusing tier switches when a user moves between WiFi and cellular.

#### Detection Fast-Path

Before running the full composite scoring, the engine checks for **unambiguous probes** that can resolve the tier instantly without computing a weighted score:

1. **Data Saver active** → force `low` immediately (explicit user preference).
2. **Server-side tier hint available** (cookie/header from Client Hints or edge middleware) → use it directly, skip client detection entirely.
3. **Cached tier in `localStorage`** with valid TTL → use it directly.
4. **`deviceMemory` ≤ 2GB** (when available) → resolve `low` immediately. Devices with ≤2GB RAM are unambiguously low-tier regardless of other probes.
5. **`deviceMemory` ≥ 8GB AND `hardwareConcurrency` ≥ 8** → resolve `high` immediately. This combination is unambiguously high-tier.

The fast-path covers ~70% of real-world devices without needing GPU probing (the most expensive detection step). When the fast-path resolves, the `reasoning` array notes which shortcut was taken. The full composite scoring runs only for ambiguous cases — devices in the middle range where the tier decision actually requires nuance.

#### Composite Scoring

Each hardware probe is normalized to a 0-1 range using the following calibration ranges:

| Probe             | Raw Range                       | Maps to 0.0                  | Maps to 1.0                | Normalization                                 |
| ----------------- | ------------------------------- | ---------------------------- | -------------------------- | --------------------------------------------- |
| CPU cores         | `navigator.hardwareConcurrency` | ≤2 cores                     | ≥12 cores                  | Linear clamp: `clamp((cores - 2) / 10, 0, 1)` |
| Device memory     | `navigator.deviceMemory` (GB)   | ≤1GB                         | ≥8GB                       | Linear clamp: `clamp((mem - 1) / 7, 0, 1)`    |
| GPU tier          | Capability probing result (0-3) | Tier 0 (no WebGL / software) | Tier 3 (high-end discrete) | Direct: `tier / 3`                            |
| Screen resolution | `width × height × DPR`          | ≤480px effective width       | ≥1920px effective width    | Linear clamp on effective pixels              |
| Max touch points  | `navigator.maxTouchPoints`      | 0 (desktop/STB — no signal)  | ≥5 (modern touch device)   | Heuristic: 0→0.5 (neutral), 1→0.4, ≥5→0.6     |

**Calibration methodology:** These ranges are derived from public device distribution data (HTTP Archive, StatCounter, Google Chrome UX Report). The ranges are intentionally wide — a device at the 10th percentile of web traffic should score ~0.1, and a device at the 90th should score ~0.9. The 0.5 tier threshold should sit in the natural valley of the bimodal device capability distribution (cheap phones vs. flagships). These constants are baked into `@adaptive-bundle/core` and require no external data.

**Touch points nuance:** Touch points is a weak signal — desktops report 0, modern phones report 5-10, but some 2-in-1 laptops report 10+. The normalization maps 0 to 0.5 (neutral, not penalized) rather than 0.0, since desktop devices are high-capability. This probe's low weight (0.05) means it only breaks ties.

Missing probes are excluded from scoring and their weight is redistributed proportionally. The final score is a weighted average of available probes, with a confidence value reflecting how many probes were available.

```ts
interface DeviceProfile {
  score: number; // 0.0 (lowest capability) to 1.0 (highest capability)
  confidence: number; // 0.0 to 1.0 — how many probes contributed
  tier: 'high' | 'low'; // Binary by default
  probes: {
    cpuCores: number | null;
    memoryGB: number | null;
    gpuTier: 0 | 1 | 2 | 3 | null;
    screenCategory: 'high' | 'standard' | 'low';
    touchPoints: number | null;
  };
  network: {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | null;
    dataSaver: boolean | null;
  };
  reasoning: string[]; // Human-readable list of why this tier was chosen
}
```

#### Tier Resolution

Default tiers are **binary: high and low.** This is a deliberate design choice — two tiers means developers maintain at most two variants per boundary, which is the minimum viable maintenance burden.

Default tier boundary (configurable globally or per-boundary):

- **high:** score >= 0.5
- **low:** score < 0.5

**Optional medium tier (opt-in):** Developers who need finer granularity can enable three tiers per boundary. This is explicitly opt-in and the build report will warn about the additional maintenance cost:

```tsx
const MapView = adaptive({
  high: () => import('./MapboxMap'),
  medium: () => import('./LeafletMap'), // Opt-in: enables 3-tier resolution
  low: () => import('./StaticMap'),
  thresholds: { high: 0.65, low: 0.35 },
});
```

When a boundary defines only `high` and `low`, the single threshold at 0.5 is used. When `medium` is present, the `thresholds` config splits the range into three zones.

#### Caching and Stability

- The device profile is computed **once** on first access and cached in memory for the session.
- The resolved tier is persisted in `localStorage` to prevent flicker across page loads and sessions.
- The cache key includes a **config hash** derived from the project's adaptive configuration (weights, thresholds, probe settings). When a new deploy changes adaptive configuration, the cached tier is automatically invalidated and recomputed. This prevents stale tiers from a previous build serving the wrong variant after a deploy that changes thresholds or weight calibration. The config hash is injected at build time by the Vite plugin as a small constant (~8 bytes).
- Tier changes use **asymmetric hysteresis** to prevent borderline devices from flipping. Moving from `low` → `high` requires the new score to exceed the threshold by 0.12 (proving the device is clearly capable). Moving from `high` → `low` requires the new score to fall below the threshold by 0.08 (quicker to degrade gracefully). This asymmetry matches the design principle "prefer capability over degradation" — it's better to briefly serve a lighter experience than to serve a heavier one to a device that can't handle it.
- A forced override via URL parameter (`?adaptive_tier=low`) is supported for testing and debugging.

#### Fallback Strategy for Safari and Firefox

When `deviceMemory` is unavailable (~30-40% of users), the engine redistributes its weight to the remaining probes. Since network is no longer part of the hardware score, the impact of missing `navigator.connection` is limited to the network overlay (which simply reports null — no deferral applied).

The fallback chain for hardware scoring:

1. **Best case (Chromium):** All 5 hardware probes available. Full weight distribution, high confidence (~0.9+).
2. **Safari/Firefox:** `deviceMemory` unavailable. Its 0.35 weight redistributes → CPU gets ~0.54, GPU ~0.23, screen ~0.15, touch ~0.08. Confidence drops to ~0.7. GPU tier is still available via WebGL capability probing (privacy-safe, works in all browsers with WebGL).
3. **No WebGL (rare):** GPU probe also unavailable. Weight redistributes to CPU + screen + touch. Confidence drops to ~0.5.
4. **Worst case:** Only screen metrics + touch points available. Confidence will be ~0.3. Tier defaults to `high` (optimistic — prefer capability over degradation).
5. **Platform-identified device (STB/CTV):** When a custom probe provider or device map identifies the exact platform, tier is resolved immediately with confidence 1.0. Zero ambiguity. See Section 6.5.
6. **Server-side (preferred when available):** Client Hints provide `Device-Memory` and UA data directly. Edge middleware resolves tier before HTML is sent. Zero client-side detection cost. See Section 8.

The `reasoning` array explicitly notes which probes were unavailable and how weight was redistributed.

The engine must still produce a usable tier — it never returns "unknown" or forces a fallback tier without a score.

### 6.2 React Adapter (`@adaptive-bundle/react`)

The React adapter provides three APIs: single-component exclusion, two-variant boundaries, and inline boundaries.

#### Single-Component Exclusion API: `adaptive(config)` with `component` + `lowFallback`

The simplest API — skip a heavy component on low-tier devices without writing a second file:

```tsx
import { adaptive } from '@adaptive-bundle/react';

const MapView = adaptive({
  component: () => import('./MapboxMap'),
  lowFallback: <img src={staticMapUrl} alt="Map overview" />,
  layout: { width: '100%', aspectRatio: '16/9' },
});

// Usage — renders MapboxMap on high-tier, static image on low-tier
function App() {
  return <MapView center={[40, -3]} zoom={12} />;
}
```

```ts
interface AdaptiveExclusionConfig<Props> {
  /** Dynamic import for the full component (loaded on high-tier only) */
  component: () => Promise<{ default: ComponentType<Props> }>;

  /** Inline JSX rendered on low-tier devices instead of loading the heavy component.
   *  Can be a static image, placeholder, simplified HTML, or null to render nothing. */
  lowFallback: ReactElement | null;

  /** React element to show while the component loads on high-tier devices */
  fallback?: ReactElement;

  /** Layout hints to prevent CLS during loading */
  layout?: {
    width?: string;
    height?: string;
    aspectRatio?: string;
  };

  /** Identifier for this boundary (used in build reports and devtools) */
  name?: string;

  /** Loading strategy for this boundary (see Section 6.6) */
  loading?: 'eager' | 'lazy' | 'viewport';

  /** Called when a dynamic import fails after retry and cross-tier fallback */
  onError?: (error: Error, boundaryName: string) => void;
}
```

This API covers the majority of real-world use cases. Props are forwarded to the heavy component on high-tier devices. On low-tier devices, only the `lowFallback` renders — no dynamic import, no chunk loaded, zero cost. The Vite plugin recognizes this pattern and isolates the heavy component's chunk just like the two-variant API.

#### Two-Variant API: `adaptive(config)` with `high` + `low`

For cases where both tiers need substantial, different implementations:

```tsx
import { adaptive } from '@adaptive-bundle/react';

const MapView = adaptive({
  high: () => import('./MapboxMap'),
  low: () => import('./StaticMap'),
  fallback: <MapSkeleton />,
  layout: { width: '100%', aspectRatio: '16/9' },
});

// Usage — behaves like a normal component
function App() {
  return <MapView center={[40, -3]} zoom={12} />;
}
```

```ts
interface AdaptiveVariantConfig<HighProps, LowProps = HighProps, MedProps = HighProps> {
  /** Dynamic import for high-capability devices */
  high: () => Promise<{ default: ComponentType<HighProps> }>;

  /** Dynamic import for low-capability devices */
  low: () => Promise<{ default: ComponentType<LowProps> }>;

  /** Optional (opt-in): dynamic import for medium-capability devices */
  medium?: () => Promise<{ default: ComponentType<MedProps> }>;

  /** React element to show while the chosen variant loads */
  fallback?: ReactElement;

  /** Override default tier threshold for this boundary */
  thresholds?: {
    high?: number; // Score above this → high (default: 0.5, or 0.65 if medium defined)
    low?: number; // Score below this → low (default: 0.5, or 0.35 if medium defined)
  };

  /** Layout hints to prevent CLS during loading */
  layout?: {
    width?: string;
    height?: string;
    aspectRatio?: string;
  };

  /** Identifier for this boundary (used in build reports and devtools) */
  name?: string;

  /** Loading strategy for this boundary (see Section 6.6) */
  loading?: 'eager' | 'lazy' | 'viewport';

  /** Called when a dynamic import fails after retry and cross-tier fallback */
  onError?: (error: Error, boundaryName: string) => void;
}
```

`adaptive()` returns a React component that:

1. On mount, reads the cached device tier from `@adaptive-bundle/core`.
2. Loads the corresponding dynamic import.
3. Renders the fallback (wrapped in a container with `layout` dimensions) while loading.
4. Renders the resolved component, forwarding all props.
5. Exposes the resolved tier via context for child components that need to know.

#### Error Recovery

Dynamic imports can fail — network errors, missing chunks after a deploy, CDN issues. Every `adaptive()` boundary includes built-in error handling:

1. **Automatic retry:** On import failure, the boundary retries once after a 1-second delay. This handles transient network glitches.
2. **Cross-tier fallback:** If the retry fails and the boundary has two variants (`high` + `low`), the boundary attempts to load the opposite tier's variant. A high-tier device with a broken `mapbox-gl` chunk can still render the low variant rather than crashing.
3. **Error fallback:** If all imports fail, the boundary renders the `fallback` prop (the loading skeleton) with a `data-adaptive-error` attribute. This ensures the layout stays stable.
4. **Error reporting:** The boundary calls an optional `onError` callback with the error and boundary name, letting developers log the failure to their existing error tracking (Sentry, Datadog, etc.).
5. **No React error boundary propagation:** Import failures are caught internally and do not propagate to parent error boundaries. The boundary degrades gracefully without unmounting siblings.

```tsx
const MapView = adaptive({
  high: () => import('./MapboxMap'),
  low: () => import('./StaticMap'),
  fallback: <MapSkeleton />,
  onError: (error, boundaryName) => {
    // Optional: log to your error tracking service
    errorTracker.captureException(error, { boundary: boundaryName });
  },
});
```

For the single-component exclusion API, cross-tier fallback means rendering the `lowFallback` if the heavy component fails to load — which is the most natural degradation path.

#### React Suspense and Concurrent Mode

`adaptive()` uses `React.lazy` + `Suspense` internally. The `fallback` prop is passed to the internal `Suspense` boundary. This means:

- **User-defined Suspense boundaries:** If an `adaptive()` component is rendered inside a user's `<Suspense>`, the inner (adaptive-owned) boundary takes precedence for the import loading state. The outer boundary only activates if the adaptive component itself suspends for other reasons (data fetching, nested lazy components).
- **Concurrent rendering (React 18+):** Adaptive boundaries are compatible with `startTransition`. Wrapping a tier-dependent state change in `startTransition` allows React to keep the current variant visible while the new one loads, avoiding flash-of-skeleton on tier override changes during development.
- **Strict Mode:** Double-invocation in development does not trigger double detection — the detection engine is idempotent and returns the cached profile on subsequent calls.

#### Inline API: `<Adaptive.High>` / `<Adaptive.Low>`

Best for tier-specific sections within a single component. Lower maintenance cost — everything stays in one file:

```tsx
import { Adaptive } from '@adaptive-bundle/react';

function Dashboard({ data }) {
  return (
    <div>
      <Header data={data} />

      <Adaptive.High imports={() => import('./MapboxMap')}>
        {(MapboxMap) => <MapboxMap center={[40, -3]} zoom={12} />}
      </Adaptive.High>
      <Adaptive.Low>
        <img src={staticMapUrl} alt="Map overview" />
      </Adaptive.Low>

      <SharedContent data={data} />
    </div>
  );
}
```

`<Adaptive.High>` accepts an optional `imports` prop for dynamic imports — the Vite plugin statically analyzes these for chunk isolation. `<Adaptive.Low>` typically contains lightweight inline JSX with no heavy imports. The non-matching tier renders `null`.

For cases where `<Adaptive.Low>` also needs a dynamic import:

```tsx
<Adaptive.Low imports={() => import('./LeafletMap')}>
  {(LeafletMap) => <LeafletMap center={[40, -3]} />}
</Adaptive.Low>
```

#### Hooks

The primary hook is `useAdaptive()` — a single entry point that combines tier and network awareness. Internally, tier comes from hardware scoring (stable, cached) and `shouldDefer` comes from network conditions (transient). The architectural separation is an implementation detail, not an API burden:

```tsx
import { useAdaptive } from '@adaptive-bundle/react';

function VideoPlayer({ src }) {
  const { tier, shouldDefer, profile } = useAdaptive();

  // shouldDefer is true on slow networks (2g/slow-2g)
  if (shouldDefer) return <VideoThumbnail src={src} />;

  // tier is the stable hardware classification
  if (tier === 'low') return <LiteVideoPlayer src={src} />;
  return <FullVideoPlayer src={src} />;
}
```

```ts
interface UseAdaptiveResult {
  tier: 'high' | 'low' | 'medium'; // Stable hardware tier
  shouldDefer: boolean; // Transient network probe — defer non-critical loads
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | null;
  profile: DeviceProfile; // Full profile for advanced use
}
```

Individual hooks are also available for focused use cases:

```tsx
import { useDeviceProfile, useTier, useNetworkAware } from '@adaptive-bundle/react';

function DebugPanel() {
  const profile = useDeviceProfile(); // Full DeviceProfile object
  const tier = useTier(); // 'high' | 'low' (or 'medium' if opted in)

  return <pre>{JSON.stringify(profile, null, 2)}</pre>;
}
```

#### TypeScript Support

When `high` and `low` variants share the same props interface, the returned component accepts those props directly with full type inference.

When they have different props, TypeScript should error at the `adaptive()` call — variants must accept a compatible props interface since the consumer uses one component for both tiers.

For inline boundaries, the render function in the `children` prop receives the imported component with full type inference.

### 6.3 Vue Adapter (`@adaptive-bundle/vue`)

```vue
<script setup>
import { adaptive } from '@adaptive-bundle/vue';

const MapView = adaptive({
  high: () => import('./MapboxMap.vue'),
  low: () => import('./StaticMap.vue'),
});
</script>

<template>
  <MapView :center="[40, -3]" :zoom="12" />
</template>
```

Internally uses Vue's `defineAsyncComponent` with the tier resolution from `@adaptive-bundle/core`.

### 6.4 Svelte Adapter (`@adaptive-bundle/svelte`)

```svelte
<script>
import { adaptive } from '@adaptive-bundle/svelte';

const MapView = adaptive({
  high: () => import('./MapboxMap.svelte'),
  low: () => import('./StaticMap.svelte'),
});
</script>

<svelte:component this={$MapView} center={[40, -3]} zoom={12} />
```

Uses Svelte's `{#await}` block internally for loading states.

### 6.5 STB/CTV Platform Support

Set-top boxes (STBs) and Connected TV (CTV) devices represent an extreme case for adaptive optimization — the hardware gap is wider and the consequences of shipping heavy bundles are harsher than on phones. A budget STB with a dual-core ARM chip, 1GB RAM, and Chromium 49 cannot run the same JavaScript as a desktop browser, yet it outputs 1080p or 4K to a TV (making screen resolution a misleading probe).

Adaptive treats STB/CTV as a **first-class target** through three mechanisms: custom probe providers, a static device map, and build-time tier targeting.

#### Custom Probe Providers

The detection engine accepts user-supplied probe providers that return platform-specific capability data. This is essential for STB/CTV devices where native JS bridges expose hardware info that browser standard APIs don't cover:

```ts
import { configure } from '@adaptive-bundle/core';

configure({
  probeProviders: {
    // Tizen Smart TV — use native systeminfo API
    tizenHardware: () => {
      if (typeof tizen !== 'undefined') {
        const mem = tizen.systeminfo.getCapability(
          'http://tizen.org/feature/platform.core.cpu.frequency',
        );
        const cores = tizen.systeminfo.getCapability(
          'http://tizen.org/feature/platform.core.cpu.arch',
        );
        return { score: normalizeTizenCapability(mem, cores), confidence: 1.0 };
      }
      return null; // Not a Tizen device — skip this provider
    },

    // webOS — use native deviceInfo API
    webosHardware: () => {
      if (typeof webOSSystem !== 'undefined') {
        const info = JSON.parse(webOSSystem.deviceInfo);
        return { score: normalizeWebOSCapability(info), confidence: 1.0 };
      }
      return null;
    },

    // Sky platforms — use proprietary JS bridge
    skyPlatform: () => {
      if (typeof sky !== 'undefined' && sky.device) {
        return { score: normalizeSkyCapability(sky.device), confidence: 1.0 };
      }
      return null;
    },
  },
});
```

When a custom probe provider returns a result, it **takes priority** over browser API probes. If it returns `null`, the engine falls through to the standard browser-based detection. The `confidence: 1.0` reflects that native APIs provide exact hardware info — no estimation needed.

Custom probe providers are registered once at app startup and cached like any other probe result.

#### Static Device Map

For operator-distributed CTV apps, the target device is known at development time. A static device map bypasses the scoring engine entirely — it's a lookup table from platform identifier to tier:

```ts
import { configure } from '@adaptive-bundle/core';

configure({
  deviceMap: {
    // Sky platforms
    'sky-q-mini': 'low', // Dual-core, 1GB RAM, Chromium ~49
    'sky-q': 'low', // Quad-core, 2GB RAM, Chromium ~69
    'sky-soip': 'high', // Modern SoC, 4GB RAM, current Chromium
    'sky-glass': 'high', // Integrated TV, modern hardware

    // Foxtel
    'foxtel-iq4': 'low', // Older Broadcom SoC
    'foxtel-iq5': 'high', // Modern SoC

    // Orange
    'orange-sop': 'low', // Limited hardware

    // LG webOS — map by generation
    'webos-4': 'low', // 2019 and earlier
    'webos-5': 'low', // 2020
    'webos-6': 'high', // 2021+
    'webos-22': 'high', // 2022+
    'webos-23': 'high', // 2023+

    // Samsung Tizen — map by year
    'tizen-2018': 'low',
    'tizen-2019': 'low',
    'tizen-2020': 'low',
    'tizen-2021': 'high',
    'tizen-2022': 'high',
    'tizen-2023': 'high',
  },

  // Function that returns the current platform identifier
  // Must match a key in deviceMap or return null for browser-based detection
  detectPlatform: () => {
    if (typeof tizen !== 'undefined') return `tizen-${getTizenYear()}`;
    if (typeof webOSSystem !== 'undefined') return `webos-${getWebOSVersion()}`;
    if (typeof sky !== 'undefined') return `sky-${sky.device.model}`;
    return null; // Not an STB — fall through to browser detection
  },
});
```

When `detectPlatform()` returns a key that exists in `deviceMap`, the tier is resolved **immediately** — no scoring, no probing, no WebGL context, confidence 1.0. The `reasoning` array records: `"Platform identified as sky-q → forced tier: low via device map"`.

This is the highest-confidence, lowest-cost detection path and is the **recommended approach for STB/CTV apps** where the target platforms are known in advance.

#### Build-Time Tier Targeting

For CTV apps built per-platform (one build for Tizen, one for webOS, one for Sky), runtime tier switching is unnecessary overhead. The Vite plugin supports a `targetTier` option that resolves the tier at compile time and **tree-shakes the unused variant entirely**:

```ts
// vite.config.sky-q.ts — build specifically for Sky Q
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  plugins: [
    adaptive({
      targetTier: 'low', // Compile-time: strip all high variants
    }),
  ],
});
```

```ts
// vite.config.sky-soip.ts — build specifically for Sky SoIP
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  plugins: [
    adaptive({
      targetTier: 'high', // Compile-time: strip all low variants
    }),
  ],
});
```

When `targetTier` is set:

1. The plugin transforms all `adaptive()` calls into direct imports of the targeted variant — no runtime wrapper, no dynamic `import()`, no `@adaptive-bundle/core` included in the bundle at all.
2. `<Adaptive.High>` / `<Adaptive.Low>` blocks are statically resolved — the non-matching block is removed as dead code by Rollup's tree-shaking.
3. The build report shows the final per-platform bundle sizes with no adaptive runtime overhead.
4. This works even on devices where dynamic `import()` is unavailable (Chromium <63), since all imports become static.

This is the **killer feature for CTV/STB apps** — the same codebase produces platform-specific builds with zero runtime cost and zero unused code.

#### CTV-Specific Probe Considerations

Several default hardware probes behave differently on STB/CTV devices:

| Probe                   | Behavior on STB/CTV                               | Recommendation                                                              |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| Screen resolution + DPR | Misleading — cheap STBs output 1080p/4K to the TV | Weight should be 0 for CTV targets. Use `weights: { screen: 0 }` in config. |
| `maxTouchPoints`        | Always 0 (remote control navigation)              | Useless — weight auto-redistributes since value is constant.                |
| GPU (WebGL probing)     | Often software-rendered, absent, or unreliable    | Reduce weight or skip. Many STB Chromium builds have crippled WebGL.        |
| `deviceMemory`          | Often unavailable on old Chromium                 | Falls through to CPU cores as primary probe.                                |
| CPU cores               | Available on most STB Chromium versions           | Most reliable browser-based probe for STBs.                                 |

Recommended weight configuration for CTV apps using browser-based detection (when device map is not used):

```ts
configure({
  weights: {
    cpuCores: 0.6,
    memory: 0.3,
    gpu: 0.05,
    screen: 0.0, // Useless for CTV
    touchPoints: 0.05,
  },
});
```

However, for CTV apps the **device map or build-time targeting is strongly preferred** over browser-based scoring. Browser probes are the fallback, not the primary detection path.

#### Platform Capabilities (Build-Time Pruning)

Beyond tier classification, devices within the same tier may have different feature support. A `platformTierMap` extends the static device map with **user-defined capabilities** — string tags that describe what each device supports. These capabilities enable build-time chunk pruning: when a component declares `requires: ['dolby-vision']` and no device in a tier has that capability, the chunk for that tier is replaced with a `capabilityFallback` at build time.

**Configuration:**

```ts
import { configure } from '@adaptive-bundle/core';

configure({
  platformTierMap: {
    'foxtel-iq4': { tier: 'low', capabilities: ['drm', 'hdr10'] },
    'sky-q': { tier: 'low', capabilities: ['drm', 'dolby-vision'] },
    ios: { tier: 'high', capabilities: ['haptics', 'webgl2'] },
    android: { tier: 'high', capabilities: ['webgl2', 'nfc'] },
  },
  detectPlatform: () => detectCurrentPlatform(),
});
```

When `detectPlatform()` returns a platform that exists in `platformTierMap`, the tier is resolved immediately (same as `deviceMap`) AND the platform's capabilities are stored for runtime access via `getCapabilities()`.

`platformTierMap` takes priority over `deviceMap` when both contain the same platform key.

**Build-time pruning with `requires` + `capabilityFallback`:**

```tsx
const DolbyPlayer = adaptive({
  high: () => import('./DolbyPlayer'),
  low: () => import('./DolbyPlayer'),
  requires: ['dolby-vision'],
  capabilityFallback: () => import('./StandardPlayer'),
  name: 'DolbyPlayer',
});
```

At build time, the Vite plugin:

1. Scans `adaptive()` calls for `requires` arrays.
2. Cross-references with capabilities declared in `platformTierMap` per tier.
3. For each tier, if **no** device in that tier has **all** required capabilities, the tier's import is replaced with `capabilityFallback`.
4. If no `capabilityFallback` is provided, the pruned tier's import is removed entirely.
5. If no `platformTierMap` is configured (auto-detection mode), `requires` is ignored and all chunks are generated.

The build report annotates pruned boundaries: `PRUNED for high: missing dolby-vision`.

**Runtime API (minimal):**

```ts
import { getCapabilities } from '@adaptive-bundle/core';

const caps = getCapabilities(); // ['drm', 'dolby-vision'] or []
```

`getCapabilities()` returns the capabilities of the current platform as resolved from `platformTierMap`. Returns an empty array when using auto-detection or when the platform has no declared capabilities. This is a raw data accessor — Adaptive does not provide hooks or feature-flag abstractions on top. Users wire their own runtime logic if needed.

**Interaction with other features:**

- `platformTierMap` and `deviceMap` coexist. `platformTierMap` is checked first.
- `targetTier` build-time targeting works independently — capability pruning runs before `targetTier` transformation.
- The devtools overlay shows active capabilities when available.

### 6.6 Multiple Boundaries on a Single Page

When a page contains multiple adaptive boundaries, loading all variant chunks simultaneously can create a bandwidth waterfall — especially on slow connections where the device is high-tier but the network is constrained.

**Default loading strategy: viewport-prioritized parallel loading.**

1. **Above-the-fold boundaries** load immediately on mount. The Vite plugin statically identifies which boundaries are likely above-the-fold based on route-level component tree analysis (components rendered before the first `Suspense` boundary or scroll container).
2. **Below-the-fold boundaries** are deferred until either (a) the component enters the viewport (via `IntersectionObserver`) or (b) the browser is idle (`requestIdleCallback`), whichever comes first.
3. **Network-aware throttling:** When the network overlay detects a slow connection (`2g` / `slow-2g`), below-the-fold boundaries are deferred more aggressively — they only load on viewport entry, not on idle.

Developers can override the default strategy per boundary:

```tsx
const MapView = adaptive({
  high: () => import('./MapboxMap'),
  low: () => import('./StaticMap'),
  loading: 'eager' | 'lazy' | 'viewport', // default: 'viewport'
});
```

- `eager`: Load immediately regardless of viewport position. Use for critical above-the-fold content.
- `lazy`: Load only when the component enters the viewport. Use for heavy below-the-fold content.
- `viewport`: Default behavior — the plugin determines the best strategy.

The Vite plugin reports the total number of adaptive boundaries per route and warns when more than 5 boundaries share a single route (a signal that the page may benefit from route-level splitting instead).

## 7. Vite Plugin

### 7.1 Configuration

```ts
// vite.config.ts
import { adaptive } from '@adaptive-bundle/vite-plugin';

export default defineConfig({
  plugins: [
    adaptive({
      // Analysis thresholds — deps above this size are flagged
      analysisSizeThreshold: 50, // KB, default 50

      // Enable/disable build report output
      report: true, // default true

      // Report format
      reportFormat: 'console' | 'html' | 'json', // default 'console'

      // Output directory for HTML/JSON reports
      reportDir: './adaptive-reports',

      // Enable preload hint injection
      preloadHints: true, // default true

      // Default tier for SSR (when no client detection is possible)
      ssrDefaultTier: 'low', // default 'low' — conservative for SSR

      // Custom dependency size overrides (for dependencies where
      // tree-shaking makes the actual size much smaller than package size)
      sizeOverrides: {
        'lodash-es': 10, // KB — actual used size after tree-shaking
      },

      // CI performance budgets (see Section 7.2.5)
      budget: {
        maxLowTierBundle: 200, // KB — max total for low-tier
        maxHighVariant: 500, // KB — max for any high variant
        minSavingsPercent: 40, // Min savings per boundary
        enforce: 'warn', // 'error' to fail builds in CI
      },
    }),
  ],
});
```

### 7.2 Build-Time Responsibilities

#### 7.2.1 Source Code Analysis

The plugin scans the project for `adaptive()` calls at build time — including all three API forms: `component` + `lowFallback`, `high` + `low`, and inline `Adaptive.High`/`Adaptive.Low` patterns. For each call, it:

1. Identifies the `component`, `high`, `medium`, and `low` import paths.
2. Resolves the full dependency tree of each variant.
3. Calculates the exclusive dependency size of each variant (dependencies not shared with the rest of the app).
4. Identifies shared dependencies between variants and the main app (these stay in shared chunks — no duplication).

This analysis happens during Vite's `buildStart` hook, using Rollup's module resolution.

#### 7.2.2 Chunk Isolation

The plugin configures Rollup's `manualChunks` to ensure:

- Each variant (high/low/medium) of each adaptive boundary gets its own chunk group.
- Heavy dependencies exclusive to one variant are isolated in that variant's chunk group.
- Dependencies shared across variants AND the main app remain in shared chunks (no unnecessary duplication).
- No code from a `high` variant leaks into a `low` variant's chunk.

Example output structure:

```
dist/
  assets/
    main-[hash].js                    # App shell
    dashboard-high-[hash].js          # DashboardFull + its exclusive deps
    dashboard-low-[hash].js           # DashboardLite + its exclusive deps
    shared-react-[hash].js            # Shared framework code
    mapbox-gl-[hash].js               # Isolated heavy dep (only loaded by high variant)
```

#### 7.2.3 Preload Hint Injection

The plugin injects `<link rel="modulepreload">` tags into the HTML output. It cannot know the device tier at build time, so it uses a strategy:

- **No preload by default** — let the runtime decide and load on demand.
- **Optional optimistic preload** — if configured, inject preload for the `high` variant (most common on desktop where preloading matters less for performance).
- **SSR integration** — when using SSR with Client Hints, the server can read `Sec-CH-Device-Memory` and inject the correct preload hints for the detected tier.

#### 7.2.4 Build Report

After every build, the plugin outputs a report. Console format example:

```
Adaptive Build Report
═══════════════════════════════════════════════════════
Adaptive Boundaries: 3 found

  1. DashboardExperience (src/pages/Dashboard.tsx:8)
     ├─ high: 487KB (mapbox-gl, @antv/g2, @tiptap/core)
     ├─ low:   12KB (static assets only)
     └─ Savings for low-tier: 475KB (97.5%)

  2. EditorPanel (src/components/Editor.tsx:15)
     ├─ high: 156KB (@tiptap/core, highlight.js)
     ├─ low:    2KB (plain textarea)
     └─ Savings for low-tier: 154KB (98.7%)

  3. HeroAnimation (src/components/Hero.tsx:4)
     ├─ high:  89KB (lottie-web)
     ├─ low:    0KB (CSS only)
     └─ Savings for low-tier: 89KB (100%)

Total potential savings: 718KB for low-tier devices
Total bundle (high-tier): 1.2MB
Total bundle (low-tier):  482KB (59.8% reduction)

Performance Impact Estimate (low-tier devices):
  Parse time saved:  ~1.8s on median low-end device (Snapdragon 4xx class)
  Download saved:    ~2.4s on 3G connection (1.6 Mbps)
  Estimated bounce reduction: 8-15% (based on Google Web Vitals research¹)
═══════════════════════════════════════════════════════

¹ Based on published correlations between load time improvements and bounce rate
  reductions (Google/SOASTA "The State of Online Retail Performance" and
  Web Vitals research). These are directional estimates, not guarantees.
```

#### Shareable HTML Report

The HTML report format is designed to be **shareable with non-technical stakeholders**. It includes:

- Visual size comparison between high and low variant bundles (bar charts).
- Performance impact estimates with business-metric framing (parse time, download time, estimated bounce rate impact).
- Per-route breakdown showing which routes benefit most from optimization.
- A summary card suitable for embedding in Slack, Notion, or internal dashboards.
- Historical comparison when previous reports are available (trend tracking).

The HTML report is the primary tool for making the **business case** for adaptive optimization — developers use it to show managers and product owners the concrete impact of shipping heavy bundles to low-end devices.

HTML and JSON formats contain the same data in richer formats, suitable for CI dashboards and programmatic analysis.

#### Historical Trend Tracking

When `reportFormat` is `'json'` or `'html'`, the plugin appends a timestamped entry to a `adaptive-reports/history.json` file on each build. This enables trend-over-time analysis — the most compelling story for long-term adoption:

```
"We added 3 adaptive boundaries this quarter and reduced low-tier bundle by 400KB."
```

The HTML report includes a trend chart when historical data is available, showing how total bundle size (high-tier vs. low-tier) has changed over time. This turns the report from a per-build snapshot into a progress tracker that teams can share with stakeholders.

The history file is append-only and small (one JSON line per build). It can be committed to the repository for team visibility or gitignored for local-only tracking.

#### 7.2.5 CI Budget Enforcement

The plugin can enforce performance budgets in CI pipelines. When configured, the build fails if budgets are exceeded:

```ts
adaptive({
  budget: {
    // Maximum total bundle size for low-tier devices
    maxLowTierBundle: 200, // KB

    // Maximum size for any single adaptive boundary's high variant
    maxHighVariant: 500, // KB

    // Minimum savings percentage required for each adaptive boundary
    // (prevents boundaries that save too little to justify the complexity)
    minSavingsPercent: 40,

    // Fail the build or just warn
    enforce: 'error' | 'warn', // default: 'warn'
  },
});
```

Example CI output when a budget is exceeded:

```
Adaptive Budget FAILED
═══════════════════════════════════════════════════════
  OVER BUDGET: Low-tier bundle is 267KB (budget: 200KB)
    Largest contributors:
      /dashboard route: 89KB (DashboardLite has heavy deps)
      /editor route: 67KB (EditorLite imports highlight.js)

  WARNING: HeroAnimation boundary saves only 12KB (28%)
    Below minSavingsPercent threshold of 40%
    Consider removing this adaptive boundary.
═══════════════════════════════════════════════════════
```

This turns the plugin into a **performance guardrail** that prevents regressions in CI, not just a one-time analysis tool.

#### 7.2.6 Plugin Interoperability

The Vite plugin must coexist with other plugins that also configure chunk splitting. Common conflicts and how they're handled:

- **Other `manualChunks` configurations:** The plugin merges its chunk isolation rules with any existing `manualChunks` function defined in the user's Vite config. It wraps the existing function rather than replacing it — user-defined chunk rules take precedence, and the plugin adds its isolation rules for adaptive boundaries on top. If a conflict is detected (a user rule assigns a module to a chunk that breaks adaptive isolation), the build report emits a warning with the specific module and chunk names.
- **`vite-plugin-chunk-split` and similar:** These plugins typically set `manualChunks` as a function. The adaptive plugin detects this and chains its logic after the existing function, only overriding assignments for modules that are exclusive to an adaptive variant.
- **CSS code splitting plugins:** Adaptive boundaries may have variant-specific CSS. The plugin ensures CSS chunks follow the same isolation rules — CSS exclusive to a high variant is not loaded when the low variant is active.
- **Plugin ordering:** The adaptive plugin should be placed **after** framework plugins (React, Vue, Svelte) and **before** compression/minification plugins in the Vite plugin array. The plugin emits a warning if it detects an ordering issue.

```ts
// Correct ordering
export default defineConfig({
  plugins: [
    react(), // Framework first
    adaptive(), // Adaptive after framework
    compression(), // Compression last
  ],
});
```

#### 7.2.7 Build-Time Performance

The plugin adds overhead to the build process. This overhead must be bounded:

| Operation                                             | Expected Overhead         | When                  |
| ----------------------------------------------------- | ------------------------- | --------------------- |
| Source scanning (AST analysis for `adaptive()` calls) | <500ms for 10,000 modules | `buildStart` hook     |
| Dependency tree resolution per boundary               | <100ms per boundary       | `buildStart` hook     |
| Chunk isolation configuration                         | <50ms                     | `generateBundle` hook |
| Report generation (console)                           | <100ms                    | `closeBundle` hook    |
| Report generation (HTML + history)                    | <300ms                    | `closeBundle` hook    |

**Total expected overhead: <2 seconds** for a large project with 20+ adaptive boundaries and 10,000 modules. The plugin reuses Rollup's already-parsed module graph rather than re-parsing source files, which is the primary reason the overhead is low.

The plugin logs timing information when Vite's `--debug` flag is active, letting developers profile the overhead. If any single operation exceeds 5 seconds, it's a bug.

### 7.3 CLI

The plugin ships a CLI accessible via `npx adaptive`.

#### `npx adaptive analyze`

Runs the bundle analysis without a full build. Outputs the report showing heavy dependencies and suggested adaptive boundaries ranked by impact. Each suggestion includes the exact file, the heavy dependency, and a copy-pasteable `npx adaptive init` command. Useful in CI to track bundle impact over time.

#### `npx adaptive init <component-path>`

Scaffolds an adaptive boundary:

1. Analyzes the target component's dependencies.
2. Creates a `*Lite.tsx` (or `.vue`/`.svelte`) file with:
   - The same exported props interface.
   - A skeleton/placeholder implementation with TODO comments.
   - Necessary imports stubbed out.
3. Creates or updates the `adaptive()` wrapper.
4. Prints expected savings.

Example:

```bash
$ npx adaptive init src/features/DashboardFull.tsx

Analyzing src/features/DashboardFull.tsx...
  Dependencies: mapbox-gl (230KB), @antv/g2 (156KB), @tiptap/core (89KB)
  Total exclusive weight: 475KB

Created:
  src/features/DashboardLite.tsx  (scaffold with matching props)
  src/features/Dashboard.adaptive.tsx  (adaptive boundary wrapper)

Expected savings: 475KB for low-tier devices

Next: implement the lite variant in DashboardLite.tsx
```

#### Batch scaffolding (future)

> **Deferred:** Batch init (`npx adaptive init --top=N`) may be added in a future release based on user demand. For now, run `npx adaptive init` once per component.

#### `npx adaptive report`

Generates a full report from the last build (reads from cached build data). Supports `--format=console|html|json` and `--output=<path>`.

#### `npx adaptive simulate <component-path>`

Answers "what if I wrap this component?" without creating any files. Analyzes the target component's dependency tree and reports potential savings, exclusive dependencies, and shared dependencies — letting developers make informed decisions before committing to code changes:

```bash
$ npx adaptive simulate src/components/MapView.tsx

Simulating adaptive boundary for src/components/MapView.tsx...

  Exclusive dependencies (would be isolated to high variant):
    mapbox-gl        → 230KB
    @mapbox/vector-tile → 12KB

  Shared dependencies (stay in main bundle regardless):
    react            → 42KB (shared with 23 other components)
    lodash-es/merge  → 3KB (shared with 5 other components)

  Potential savings for low-tier devices: 242KB
  This component is ranked #1 by impact across your project.

  To proceed: npx adaptive init src/components/MapView.tsx
```

This is the bridge between Level 0 (seeing the report) and Level 1 (writing boundaries). It reduces decision anxiety — developers know exactly what they'll gain before writing any code.

#### `npx adaptive validate`

Checks that all adaptive boundaries are correctly configured:

- Both variants exist and export a default component.
- Props interfaces are compatible.
- No circular dependencies between variants.
- The Vite plugin is installed and configured.

## 8. SSR and Server-Side Detection

### The Problem

During SSR, the server has no access to client hardware capabilities. If the server renders the `high` variant and the client resolves to `low`, React hydration will fail with a mismatch.

### Why Server-Side Detection Matters

Client-side hardware detection is increasingly constrained by browser privacy changes. APIs like `WEBGL_debug_renderer_info` are being deprecated, `navigator.deviceMemory` remains Chromium-only, and the trend is toward less client-side fingerprinting, not more. Meanwhile, **Client Hints are gaining adoption** — they provide the same data (device memory, viewport, UA data) but through a privacy-respecting, server-controlled opt-in mechanism.

Server-side detection is not an afterthought — it is the **strategically superior path** for tier resolution. It avoids the 50ms client-side detection cost entirely, eliminates the skeleton flash, and works with edge computing platforms (Cloudflare Workers, Vercel Edge Functions, Deno Deploy) where the tier decision can happen at the CDN layer before any HTML is sent.

The runtime client-side detection remains essential as a fallback (not all deployments use SSR, Client Hints require Chromium) but the architecture should treat server-side as the preferred path when available.

### The Solution

#### Path 1: Client-Side Detection (default, no server required)

1. Server always renders the `fallback` (skeleton/placeholder).
2. Client resolves the tier, loads the correct variant, and replaces the skeleton.
3. The `layout` config in `adaptive()` ensures the skeleton matches the expected dimensions, preventing CLS.

This means SSR pages have a brief loading state for adaptive components. This is acceptable because:

- Adaptive components are typically below the fold or non-critical-path.
- The skeleton is rendered instantly with correct dimensions.
- The actual component loads in parallel with hydration.

#### Path 2: Server-Side Detection via Client Hints (recommended for SSR apps)

For applications using SSR with Client Hints:

1. The server reads `Sec-CH-Device-Memory` and `Sec-CH-UA` headers from the request.
2. Passes a `tierHint` to the SSR renderer.
3. The adaptive component renders the hinted variant on the server.
4. The client confirms or corrects the tier during hydration.
5. If the client tier matches the hint, hydration is seamless. If it doesn't (rare — Client Hints are reliable when available), the component re-renders with the correct variant.

```ts
// Server-side (e.g., Express/Fastify handler)
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

app.get('*', (req, res) => {
  const tierHint = resolveTierFromHeaders(req.headers);
  // Pass tierHint to your SSR renderer (React renderToString, etc.)
});
```

The Client Hints approach requires the server to send an `Accept-CH` response header:

```
Accept-CH: Device-Memory, DPR, Viewport-Width, Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform
```

The Vite plugin can optionally inject this header configuration into the development server and provide middleware helpers for production.

#### Path 3: Edge Middleware Detection (zero-latency tier resolution)

For applications deployed behind edge platforms, tier resolution can happen at the CDN layer before any origin request:

```ts
// Cloudflare Worker / Vercel Edge Function
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

export default {
  async fetch(request: Request) {
    const tier = resolveTierFromHeaders(request.headers);
    // Option A: Set a cookie so the client knows its tier immediately
    // Option B: Rewrite the request to a tier-specific cached page variant
    // Option C: Inject a <script> tag that sets window.__ADAPTIVE_TIER__
  },
};
```

Edge detection eliminates both the client-side detection cost AND the skeleton flash. The client receives HTML that already contains the correct variant. This is the highest-performance path and the plugin should make it trivially easy to set up.

The `@adaptive-bundle/core/server` module is intentionally lightweight (no DOM dependencies, no WebGL) so it runs in any JavaScript server environment including edge runtimes.

## 9. Meta-Framework Integration

Adaptive provides first-class integration with the frameworks where SSR + performance optimization matters most.

### 9.1 Next.js

Next.js uses Webpack by default, not Vite. Adaptive provides a separate Next.js plugin that hooks into Webpack's chunk splitting. **Turbopack support:** Deferred until Turbopack stabilizes its module graph plugin API. The current implementation targets Webpack only, which covers all production Next.js builds. Turbopack support may be added in a future release when the API is stable.

```ts
// next.config.js
const { withAdaptive } = require('@adaptive-bundle/next');

module.exports = withAdaptive({
  adaptive: {
    report: true,
    budget: { maxLowTierBundle: 200 },
  },
});
```

#### React Server Components

Adaptive boundaries are inherently client components — they depend on device detection, dynamic imports, and browser APIs. In the Next.js App Router, adaptive boundaries must be marked with `'use client'`:

```tsx
'use client';
import { adaptive } from '@adaptive-bundle/react';

const MapView = adaptive({
  high: () => import('./MapboxMap'),
  low: () => import('./StaticMap'),
});
```

Server Components can import and render adaptive boundaries without themselves becoming client components — React's module boundary handles this automatically. The key architectural constraint: `@adaptive-bundle/core` detection logic never runs in the RSC server environment. On the server, adaptive components render their `fallback` (or the hinted variant if a tier hint cookie/header is available from middleware).

`@adaptive-bundle/core/server` (the Client Hints resolver) is designed separately — it has zero DOM/browser dependencies and runs in any server environment including RSC, edge runtimes, and Nitro.

The `@adaptive-bundle/next` Webpack plugin analyzes the RSC module graph, which differs from standard Vite's module graph. The analysis engine's bundler-agnostic core (AST scanning, dependency resolution) handles both — the Webpack adapter hooks into Next.js's `splitChunks` configuration for chunk isolation.

#### Middleware Integration

Next.js middleware can read Client Hints and pass tier hints via cookies/headers:

```ts
// middleware.ts
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

export function middleware(request: NextRequest) {
  const tier = resolveTierFromHeaders(request.headers);
  const response = NextResponse.next();
  response.cookies.set('adaptive_tier_hint', tier);
  return response;
}
```

### 9.2 Remix / React Router v7

Remix uses Vite natively, so the standard `@adaptive-bundle/vite-plugin` works directly. Loader functions can pass tier hints:

```ts
// app/routes/dashboard.tsx
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

export async function loader({ request }: LoaderFunctionArgs) {
  const tierHint = resolveTierFromHeaders(request.headers);
  return json({ tierHint });
}
```

### 9.3 Nuxt

Nuxt uses Vite natively. The plugin integrates via Nuxt modules:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@adaptive-bundle/nuxt'],
  adaptive: {
    report: true,
  },
});
```

The `@adaptive-bundle/nuxt` module auto-configures the Vite plugin and provides Nitro server middleware for Client Hints.

### 9.4 SvelteKit

SvelteKit uses Vite natively. Standard plugin works. Server hooks provide tier hints:

```ts
// src/hooks.server.ts
import { resolveTierFromHeaders } from '@adaptive-bundle/core/server';

export async function handle({ event, resolve }) {
  event.locals.tierHint = resolveTierFromHeaders(event.request.headers);
  return resolve(event);
}
```

## 10. DevTools

### 10.1 Browser Overlay (`@adaptive-bundle/devtools`)

An optional package that, when imported in development, renders a floating overlay showing:

- Current device tier (high/medium/low) with color coding.
- Composite score and confidence value.
- All detected probes with their normalized values.
- Which probes are unavailable (highlighted).
- Reasoning chain: "GPU tier 2 + 8 cores + 4GB RAM → score 0.72 → high tier."
- Per-boundary decisions: which variant was loaded for each adaptive component.

The overlay is stripped from production builds by the Vite plugin.

```tsx
// main.tsx (dev only)
if (import.meta.env.DEV) {
  import('@adaptive-bundle/devtools').then((d) => d.init());
}
```

### 10.2 Vite Dev Server Panel

The Vite plugin adds a panel to Vite's built-in dev server UI showing:

- All detected adaptive boundaries in the project.
- Dependency tree visualization per variant.
- Size comparison between variants.
- A device simulator dropdown to preview different tiers without changing code.

### 10.3 Testing Utilities

```ts
import { setForcedTier, clearForcedTier } from '@adaptive-bundle/core/testing';

// In tests
beforeEach(() => setForcedTier('low'));
afterEach(() => clearForcedTier());

// Or via URL
// https://localhost:3000/dashboard?adaptive_tier=low
```

### 10.4 Testing Strategy

Adaptive boundaries introduce a branching dimension that must be tested systematically. The testing utilities above are the foundation — here's how they fit into a complete testing approach:

#### Unit Testing Adaptive Components

Each variant should be unit-tested independently as a normal component. The `adaptive()` wrapper is tested separately to verify it selects the correct variant:

```tsx
import { render, screen } from '@testing-library/react';
import { setForcedTier, clearForcedTier } from '@adaptive-bundle/core/testing';
import MapView from './MapView.adaptive';

afterEach(() => clearForcedTier());

test('renders MapboxMap on high-tier devices', async () => {
  setForcedTier('high');
  render(<MapView center={[40, -3]} zoom={12} />);
  expect(await screen.findByTestId('mapbox-map')).toBeInTheDocument();
});

test('renders static image on low-tier devices', async () => {
  setForcedTier('low');
  render(<MapView center={[40, -3]} zoom={12} />);
  expect(await screen.findByAltText('Map overview')).toBeInTheDocument();
});
```

#### Integration Testing Chunk Isolation

The Vite plugin exports analysis functions that can be used to verify chunk isolation in CI:

```ts
import { scanAllModules, analyzeBoundaries } from '@adaptive-bundle/vite-plugin';

test('high variant dependencies do not leak into low variant chunks', () => {
  // Use the analysis functions with your build's module graph
  // to verify exclusive dependencies don't overlap between tiers
  for (const analysis of analyses) {
    const highIds = new Set(analysis.exclusiveHighDeps.map((d) => d.id));
    const lowIds = new Set(analysis.exclusiveLowDeps.map((d) => d.id));

    const overlap = [...highIds].filter((d) => lowIds.has(d));
    expect(overlap).toEqual([]);
  }
});
```

#### E2E Testing with Tier Simulation

The `?adaptive_tier=low` URL parameter enables E2E tests (Playwright, Cypress) to verify both tiers without hardware simulation:

```ts
// Playwright example
test('dashboard renders lite version on low-tier', async ({ page }) => {
  await page.goto('/dashboard?adaptive_tier=low');
  await expect(page.locator('[data-adaptive="DashboardLite"]')).toBeVisible();
});

test('dashboard renders full version on high-tier', async ({ page }) => {
  await page.goto('/dashboard?adaptive_tier=high');
  await expect(page.locator('[data-adaptive="DashboardFull"]')).toBeVisible();
});
```

#### CI Validation

`npx adaptive validate` (Section 7.3) should run in CI alongside tests. It catches structural issues (missing variants, incompatible props, circular dependencies) that unit tests don't cover. Combined with CI budget enforcement (Section 7.2.5), this ensures adaptive boundaries remain correct and effective across commits.

## 11. Performance Budget

The runtime must not become the bottleneck:

| Package                     | Max gzipped size | Rationale                                                 |
| --------------------------- | ---------------- | --------------------------------------------------------- |
| `@adaptive-bundle/core`     | 3KB              | Detection + scoring must be tiny. It loads on every page. |
| `@adaptive-bundle/react`    | 2KB              | Thin wrapper over React.lazy + Suspense.                  |
| `@adaptive-bundle/vue`      | 2KB              | Thin wrapper over defineAsyncComponent.                   |
| `@adaptive-bundle/svelte`   | 1.5KB            | Thin wrapper over Svelte async.                           |
| `@adaptive-bundle/devtools` | 15KB             | Dev only — never shipped to production.                   |

Detection must complete in **under 50ms** on any device. GPU tier lookup (the heaviest operation — requires WebGL context) must be lazy and cached.

**Hard constraints for `@adaptive-bundle/core`:**

- Zero runtime dependencies. No exceptions.
- No string tables, lookup maps, or GPU model databases.
- No polyfills or compatibility shims — use feature detection and graceful degradation.
- No JSON schema validation of config at runtime — validate at build time via the Vite plugin.
- Gzipped size must be tested in CI from day one. Any PR that pushes core above 3KB gzipped is blocked.

If the total runtime cost exceeds 5KB gzipped, the minimum useful savings threshold rises accordingly. The plugin should warn if an adaptive boundary saves less than 10x the runtime cost.

## 12. Edge Cases and Failure Modes

### 12.1 Detection Failures

| Scenario                                      | Behavior                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| All APIs available                            | Full scoring, high confidence                                                                                              |
| `deviceMemory` unavailable (Safari/Firefox)   | Weight redistributed to remaining probes, reduced confidence, note in reasoning                                            |
| WebGL available                               | GPU tier derived from capability probing (MAX_TEXTURE_SIZE, extensions count, etc.) — privacy-safe, no lookup table needed |
| WebGL unavailable (rare, old devices)         | Skip GPU probe, redistribute weight to CPU + memory + screen                                                               |
| WebGPU available but WebGL not                | Use WebGPU feature detection for GPU tier                                                                                  |
| All advanced APIs unavailable                 | Fall back to screen metrics + touch points. Confidence will be low (~0.3). Tier defaults to `high` (optimistic).           |
| Client Hints available (server-side)          | Server resolves tier from headers — zero client-side detection cost, no skeleton flash                                     |
| Edge middleware deployed                      | Tier resolved at CDN layer before origin request — highest performance path                                                |
| `navigator.connection` unavailable            | Network overlay reports null — no loading deferral applied. Tier unaffected (network doesn't affect tier).                 |
| Data saver active                             | Force low tier regardless of hardware score (explicit user preference)                                                     |
| `localStorage` unavailable (private browsing) | Cache in memory only. Tier recomputed each page load.                                                                      |
| SSR with no Client Hints                      | Render fallback skeleton. Client resolves on hydration.                                                                    |
| STB/CTV with device map configured            | Tier resolved instantly via `detectPlatform()` → `deviceMap` lookup. Confidence 1.0. No scoring.                           |
| STB/CTV with custom probe provider            | Native API result takes priority over browser probes. Falls through to browser detection if provider returns null.         |
| STB/CTV with `targetTier` build               | No runtime detection at all. Variant resolved at compile time. `@adaptive-bundle/core` not included in bundle.             |
| Old Chromium without dynamic `import()` (<63) | Use `targetTier` build-time resolution — all imports become static. Runtime-only mode is unsupported below Chrome 63.      |
| STB with software-rendered WebGL              | GPU probe returns misleading results. Reduce GPU weight or use device map instead.                                         |

### 12.2 Borderline Devices

Devices near tier boundaries can flicker between tiers across sessions if hardware conditions change (e.g., low battery triggers power saving, which reduces reported cores).

**Mitigation:** Asymmetric hysteresis — once a tier is cached, promotion (low→high) requires the score to exceed the threshold by 0.12, while demotion (high→low) requires it to fall below by 0.08. This means devices degrade quickly when needed but don't prematurely promote. Combined with `localStorage` persistence, borderline devices get a stable, predictable experience.

### 12.3 Developer Misuse

| Misuse                                   | Plugin Response                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Wrapping tiny components (<10KB savings) | Build report warns: "Adaptive boundary X saves only 8KB — consider removing"                 |
| Variants with incompatible props         | TypeScript error at compile time. `npx adaptive validate` catches it too.                    |
| Missing low variant (file doesn't exist) | Build error with actionable message.                                                         |
| Nesting adaptive boundaries              | Supported but warned against — inner boundaries inherit the parent's tier unless overridden. |

## 13. Configuration Defaults

All defaults are chosen to minimize configuration for the common case:

```ts
const DEFAULTS = {
  // Hardware scoring weights (must sum to 1.0)
  // These are redistributed proportionally when probes are unavailable
  // CPU and memory are weighted highest — they provide the most reliable,
  // highest-resolution discrimination. GPU probing is coarse (3-4 buckets)
  // so it's weighted conservatively. Configurable per-project.
  weights: {
    cpuCores: 0.35,
    memory: 0.35,
    gpu: 0.15,
    screen: 0.1,
    touchPoints: 0.05,
  },

  // Network overrides (separate from hardware scoring)
  network: {
    dataSaverForcesLow: true, // Data saver = explicit user choice → force low
    deferOnSlowNetwork: true, // Defer non-critical loads on 2g/slow-2g
  },

  // Tier boundary (binary by default)
  tiers: {
    threshold: 0.5, // score >= 0.5 → high, score < 0.5 → low
  },

  // When medium tier is opted in, use these boundaries instead:
  tiersWithMedium: {
    high: 0.65, // score >= 0.65
    low: 0.35, // score < 0.35, between = medium
  },

  // Asymmetric hysteresis for tier switching
  // Moving up (low→high) requires stronger proof than moving down (high→low)
  // This matches "prefer capability over degradation" — degrade fast, promote cautiously
  hysteresis: {
    up: 0.12, // Score must exceed threshold by this much to move low→high
    down: 0.08, // Score must fall below threshold by this much to move high→low
  },

  // localStorage key for cached tier
  cacheKey: 'adaptive_device_tier',

  // Cache storage backend
  // 'localStorage' persists across sessions (default)
  // 'memory' recomputes every page load (for strict cookie consent policies)
  cacheStorage: 'localStorage',

  // Cache TTL (re-evaluate after this period)
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Forced tier URL parameter name
  forceTierParam: 'adaptive_tier',

  // SSR default tier (when no Client Hints available)
  ssrDefaultTier: 'low',

  // Minimum savings to avoid warning
  minSavingsThreshold: 30, // KB
};
```

## 14. Browser and Platform Compatibility

### Runtime (`@adaptive-bundle/core`) — browser-based detection + runtime tier switching

Minimum browser support: any browser that supports dynamic `import()`.

- Chrome 63+
- Firefox 67+
- Safari 11.1+
- Edge 79+

The detection engine uses feature detection, not browser sniffing, for all hardware APIs. Missing APIs are gracefully skipped.

### Runtime with `targetTier` — build-time tier resolution (no dynamic import required)

When the Vite plugin is configured with `targetTier`, all `adaptive()` calls are compiled to static imports and `@adaptive-bundle/core` is not included in the output bundle. This mode supports **any browser that can run the app's baseline JavaScript**, including:

- Chromium 38+ (older STBs like Sky Q, Foxtel iQ4)
- Opera/Presto-based engines (legacy Tizen TVs)
- Custom WebKit forks (older LG webOS generations)

This is the recommended mode for STB/CTV apps distributed to known platforms.

### STB/CTV Platform Support Matrix

| Platform                | Typical Engine  | Dynamic `import()` | Recommended Mode                   |
| ----------------------- | --------------- | ------------------ | ---------------------------------- |
| Sky Q Mini              | Chromium ~49    | No                 | `targetTier` build                 |
| Sky Q                   | Chromium ~69    | Yes                | `targetTier` build or device map   |
| Sky SoIP / Sky Glass    | Modern Chromium | Yes                | Device map or runtime detection    |
| Foxtel iQ4              | Chromium ~55    | No                 | `targetTier` build                 |
| Foxtel iQ5              | Modern Chromium | Yes                | Device map or runtime detection    |
| Orange SOP              | Chromium ~60    | No                 | `targetTier` build                 |
| LG webOS 4.x (2019)     | Chromium ~53    | No                 | `targetTier` build                 |
| LG webOS 5.x (2020)     | Chromium ~68    | Yes                | Device map + custom probe provider |
| LG webOS 6+ (2021+)     | Chromium 87+    | Yes                | Device map or runtime detection    |
| Samsung Tizen 2018-2019 | Chromium ~56    | No                 | `targetTier` build                 |
| Samsung Tizen 2020      | Chromium ~69    | Yes                | Device map + custom probe provider |
| Samsung Tizen 2021+     | Chromium 85+    | Yes                | Device map or runtime detection    |

For platforms without dynamic `import()`, `targetTier` is the only supported mode — but it's also the optimal one, since these platforms are known at build time and there's no benefit to runtime detection.

### Build-Time (`@adaptive-bundle/vite-plugin`)

Requires Vite 5.0+ and Node.js 18+. Uses Rollup's plugin API for chunk manipulation.

## 15. Privacy and Data Policy

Adaptive is a **100% local, zero-telemetry, zero-network tool.** No data ever leaves the user's device or build environment. This is not a configurable option — it is a hard architectural constraint enforced by design.

### Core Principle: No Data Transmission

Adaptive does not and will never:

- **Send telemetry.** No usage analytics, no crash reports, no "anonymous" data collection. Not opt-in, not opt-out — it simply doesn't exist.
- **Make network requests.** No package in the Adaptive ecosystem (`@adaptive-bundle/core`, `@adaptive-bundle/react`, `@adaptive-bundle/vite-plugin`, etc.) makes any HTTP request, WebSocket connection, or network call of any kind. The Vite plugin reads local source files. The runtime reads local browser APIs. That's it.
- **Phone home on install.** No `postinstall` scripts that ping a server. No first-run telemetry. No update checks. npm handles versioning.
- **Collect, store, or transmit device profiles.** The device profile (probes, score, tier) is computed locally in the user's browser and stored only in that browser's `localStorage`. It is never sent to a server, never aggregated, never shared across users.
- **Include tracking pixels, beacons, or analytics.** Not in the runtime, not in the devtools, not in the HTML reports.

**This is enforced structurally:** `@adaptive-bundle/core` has zero dependencies and zero network imports. There is no `fetch`, no `XMLHttpRequest`, no `navigator.sendBeacon` anywhere in the package. This is verified by automated checks in CI — any PR that adds a network-capable API to `@adaptive-bundle/core` is blocked.

### Fingerprinting Disclosure

The hardware probes that Adaptive reads (CPU cores, device memory, GPU capabilities, screen resolution, touch points) are the same signals used by browser fingerprinting libraries. Adaptive is **not** a fingerprinting tool and differs fundamentally:

1. **No cross-site identification.** Fingerprinting libraries combine probes to create a unique device identifier that tracks users across websites. Adaptive computes a coarse binary classification (high/low) that is shared by millions of devices. A tier of "high" tells you nothing about who the user is.
2. **No data exfiltration.** The probe values never leave the browser. They are read, scored, and discarded — only the tier string (`"high"` or `"low"`) is cached in `localStorage`. The raw probe values are not persisted.
3. **No unique identifier generation.** Adaptive does not compute hashes, canvases, or any form of device fingerprint. The `DeviceProfile` object exists only in memory during the scoring computation and is not serializable or transmittable by design.
4. **Server-side detection uses only Client Hints.** When server-side tier resolution is used, it reads only the standard `Sec-CH-*` headers that the browser voluntarily sends via the Client Hints protocol. These headers are a privacy-respecting, user-consented mechanism controlled by browser settings. Adaptive does not read `User-Agent` strings for device classification.
5. **Build-time targeting eliminates all runtime probing.** When `targetTier` is configured, the runtime detection engine is not included in the bundle at all — zero browser APIs are read, zero probe data exists.

### GDPR / ePrivacy Compliance

Because Adaptive stores data only in the user's own browser (`localStorage`) and transmits nothing to any server:

- **No personal data processing.** The tier classification is not personal data under GDPR — it is a coarse category shared by millions of devices. No name, email, IP address, or device identifier is ever collected.
- **No consent required for `localStorage` use.** The `localStorage` entry (`adaptive_device_tier`) is a functional/technical cookie equivalent used to prevent UI flicker — it is not used for tracking, profiling, or advertising. Under ePrivacy Directive Article 5(3), strictly necessary technical storage does not require consent. However, teams with strict cookie consent policies can disable `localStorage` caching via configuration (`cacheStorage: 'memory'`), in which case the tier is recomputed on every page load.
- **No data processor agreements needed.** Since no data leaves the device, there is no data processor relationship between Adaptive and the end user.

### For STB/CTV Deployments

STB and CTV apps deployed via operator platforms (Sky, Foxtel, Orange) must comply with platform-specific privacy policies. Adaptive's architecture is compatible with the strictest requirements:

- **Device map lookups** are local string comparisons — no API call to any service.
- **Custom probe providers** read native device APIs but the results are consumed locally and never transmitted.
- **`targetTier` builds** contain no detection code at all — the privacy surface area is zero.

### Audit

The absence of telemetry and network activity is auditable:

- Run `grep -r "fetch\|XMLHttpRequest\|sendBeacon\|WebSocket\|navigator\.sendBeacon" packages/core/` — it must return zero results.
- The CI pipeline includes a size and import audit that blocks any dependency or import that provides network capabilities.
- The gzipped output of `@adaptive-bundle/core` is deterministic and reproducible — a hash change without a corresponding code change indicates tampering.

## 16. Competitive Differentiation

| Feature                        | react-adaptive-hooks | vite-plugin-multi-device | detect-gpu                         | **Adaptive**                                              |
| ------------------------------ | -------------------- | ------------------------ | ---------------------------------- | --------------------------------------------------------- |
| Build-time analysis            | No                   | No                       | No                                 | **Yes**                                                   |
| Chunk isolation                | No                   | Partial (UA-based)       | No                                 | **Yes**                                                   |
| Bundle impact reporting        | No                   | No                       | No                                 | **Yes**                                                   |
| CI budget enforcement          | No                   | No                       | No                                 | **Yes**                                                   |
| CLI scaffolding                | No                   | No                       | No                                 | **Yes**                                                   |
| Composite scoring              | No                   | No                       | GPU only                           | **All hardware probes**                                   |
| Network/hardware separation    | N/A                  | No (mixes concerns)      | N/A                                | **Yes**                                                   |
| Inline boundaries              | No                   | No                       | N/A                                | **Yes**                                                   |
| Framework support              | React only           | Any                      | Any                                | **React, Vue, Svelte**                                    |
| Meta-framework support         | No                   | No                       | N/A                                | **Next.js, Remix, Nuxt, SvelteKit**                       |
| SSR support                    | No                   | UA routing               | N/A                                | **Yes (Client Hints + Edge)**                             |
| Edge middleware detection      | No                   | No                       | N/A                                | **Yes (Cloudflare, Vercel, Deno)**                        |
| DevTools                       | No                   | No                       | No                                 | **Yes**                                                   |
| Active maintenance             | Abandoned (2020)     | Abandoned (2022)         | Active but limited                 | **Active**                                                |
| Progressive adoption           | No (all manual)      | No (restructure app)     | N/A                                | **Level 0-3**                                             |
| Zero-file-overhead API         | No                   | No                       | N/A                                | **Yes (single-component exclusion)**                      |
| Business impact estimates      | No                   | No                       | No                                 | **Yes (parse time, download, bounce rate)**               |
| Shareable reports              | No                   | No                       | No                                 | **Yes (HTML with visual charts)**                         |
| Detection fast-path            | N/A                  | No                       | No                                 | **Yes (skips expensive probing for ~70% of devices)**     |
| What-if simulation             | No                   | No                       | No                                 | **Yes (`npx adaptive simulate`)**                         |
| Historical trend tracking      | No                   | No                       | No                                 | **Yes (build-over-build progress)**                       |
| Unified tier+network hook      | No                   | No                       | N/A                                | **Yes (`useAdaptive()`)**                                 |
| STB/CTV platform support       | No                   | No                       | No                                 | **Yes (device map, custom probes, build-time targeting)** |
| Build-time tier resolution     | No                   | No                       | No                                 | **Yes (`targetTier` compiles away unused variants)**      |
| Custom probe providers         | No                   | No                       | No                                 | **Yes (native STB/CTV APIs)**                             |
| Pre-dynamic-import support     | No                   | No                       | N/A                                | **Yes (via `targetTier` static compilation)**             |
| Zero telemetry / fully private | Unknown              | Unknown                  | Sends GPU data to external service | **Yes (zero network calls, all local)**                   |

The key moat is the **build-time intelligence**: dependency analysis, chunk isolation guarantees, impact reporting, CI budget enforcement, and CLI scaffolding. These are hard to replicate and provide immediate, measurable value that runtime-only solutions cannot match.

The secondary moat is **adoption friction**: the single-component exclusion API means developers can optimize a component in one line with no second file to maintain. Combined with the Level 0 report that makes the business case automatically, the path from "install" to "measurable savings" is shorter than any alternative.

The third moat is **platform reach**: no existing tool supports STB/CTV devices at all. Adaptive's build-time tier targeting and custom probe providers make it the only solution that works on the full spectrum from modern browsers to legacy set-top boxes — without sacrificing DX on either end.

## 17. Success Metrics

The project should be measured by:

1. **Adoption friction:** Time from `npm install` to first actionable insight (target: under 60 seconds — install, add plugin, run build, see report).
2. **Real savings:** Average KB saved for low-tier devices across adopters (target: >100KB per app).
3. **Runtime overhead:** Actual gzipped size of `@adaptive-bundle/core` (target: <3KB) and detection time (target: <50ms).
4. **Tier accuracy:** Percentage of devices correctly classified when ground truth is available (target: >90% on Chrome, >80% on Safari/Firefox).
5. **Developer retention:** Projects that add adaptive boundaries after seeing the Level 0 report (target: >30%).

## 18. Open Questions

### Resolved Decisions

1. **Medium tier:** Binary (high/low) by default. Medium is opt-in per boundary. Rationale: two variants is the minimum maintenance burden, and the 0.5 threshold is simpler to reason about. Developers who need finer control can add `medium` to specific boundaries.

2. **Network vs. hardware:** Network is a separate concern from device tier. Hardware determines which component variant to load (stable, cached). Network affects loading strategy (transient, not cached). Exception: Data Saver mode forces low tier because it's an explicit user preference, not a transient condition.

3. **GPU classification:** Use capability-based detection instead of lookup tables. Browser vendors are actively deprecating `WEBGL_debug_renderer_info` for privacy reasons (Firefox removed it, Chrome is phasing it out). A lookup table of GPU model names is a maintenance burden with a shrinking useful lifespan. Instead:
   - **Primary:** WebGL capability probing — create a small offscreen WebGL context and measure actual capabilities: `MAX_TEXTURE_SIZE`, `MAX_RENDERBUFFER_SIZE`, `MAX_VERTEX_TEXTURE_IMAGE_UNITS`, `MAX_FRAGMENT_UNIFORM_VECTORS`, and supported extensions count. These parameters directly reflect GPU capability without exposing the model name, are privacy-safe, stable across browser updates, and require zero maintenance. Map capability ranges to tiers (0-3) using empirically calibrated thresholds.
   - **Secondary:** WebGPU feature detection (`navigator.gpu`) when available — check `maxTextureDimension2D`, `maxBufferSize`, and supported features as tier indicators. This is future-proof and complements WebGL probing.
   - **Tertiary:** If neither WebGL nor WebGPU is available, skip GPU probe entirely and redistribute weight. GPU-less classification still works via CPU + memory + screen probes.
   - No external fetches, no lookup tables, no quarterly updates. The capability thresholds are baked into `@adaptive-bundle/core` as a few dozen bytes of calibration constants.

### Open Questions

These should be resolved during implementation:

1. **Analytics integration.** Should the plugin provide a hook for sending tier decisions to analytics platforms (Mixpanel, Amplitude)? This would let teams measure real-world impact but adds scope.

2. **Monorepo tooling.** How should adaptive boundaries work in monorepos where the component and its variants might be in different packages?

3. **Hot module replacement.** How should tier switching work in development? If a developer changes from `?adaptive_tier=high` to `?adaptive_tier=low`, should it HMR or require a reload?

4. **Webpack support depth.** The Next.js integration requires a separate Webpack plugin. The analysis engine should share a bundler-agnostic core (AST scanning, dependency graph resolution, report generation) with thin adapters for Rollup (Vite) and Webpack (Next.js). Chunk isolation uses each bundler's native API (`manualChunks` for Rollup, `splitChunks` for Webpack). The goal is full feature parity — the "all or nothing" principle means Next.js users get the same analysis quality, not a degraded experience.

5. **GPU weight calibration.** The default GPU weight (0.15) is intentionally conservative. During Phase 1 implementation, real-device testing should validate whether this provides sufficient discrimination for GPU-heavy workloads (3D, canvas, WebGL apps). The weight is configurable — the question is whether the default should be higher for specific detected use cases (e.g., projects importing Three.js or Babylon.js).

6. **Threshold calibration against real device distribution.** The default 0.5 threshold assumes a roughly even split. Real-world device capability follows a bimodal distribution (cheap phones cluster low, flagships cluster high). Implementation should include a calibration step using public hardware distribution data (StatCounter, HTTP Archive) to validate that 0.5 sits in the natural valley between clusters, and adjust if needed.

## 19. Release Strategy

The project follows a "do everything or nothing" quality philosophy — every shipped package must be complete, tested, and production-ready. However, packages are released in phases to ensure each layer is solid before building the next.

**Note:** This spec defines the complete product. A separate development plan will break each phase into granular implementation tasks, ordering work to maximize iteration speed within each phase while respecting dependency chains. The spec is the "what and why"; the development plan is the "how and when."

### Phase 1: Foundation (core value proposition)

- `@adaptive-bundle/core` — Detection engine, scoring, tier resolution, caching
- `@adaptive-bundle/react` — All three APIs (exclusion, two-variant, inline) + hooks
- `@adaptive-bundle/vite-plugin` — Analysis, chunk isolation, reports (console + HTML + JSON + historical trend tracking), CI budgets, CLI (`analyze`, `simulate`, `init`, `report`, `validate`)

This phase delivers the full Level 0 → Level 3 experience for React + Vite projects. It must prove the product works and people want it before expanding.

### Phase 2: Framework Expansion

- `@adaptive-bundle/vue` — Vue adapter
- `@adaptive-bundle/svelte` — Svelte adapter
- `@adaptive-bundle/core/server` — Server-side tier resolution (Client Hints, edge middleware helpers)

### Phase 3: Meta-Framework Integration

- `@adaptive-bundle/next` — Next.js plugin (Webpack integration + middleware)
- `@adaptive-bundle/nuxt` — Nuxt module (auto-configures Vite plugin + Nitro middleware)
- SvelteKit and Remix integration guides (these use Vite natively, so the standard plugin works — only server hooks need documentation)

### Phase 4: Developer Experience

- `@adaptive-bundle/devtools` — Browser overlay + Vite dev server panel

Each phase ships completely or not at all. No beta packages, no "partial support." A package is either production-ready or it doesn't exist yet.

### Versioning Strategy

All packages in the Adaptive monorepo share a **single version number** (synchronized versioning, like Vite and Angular). When any package releases, all packages release at the same version — even if some packages have no changes in that release.

**Rationale:** Adaptive packages have tight cross-dependencies (`@adaptive-bundle/react` depends on `@adaptive-bundle/core`, `@adaptive-bundle/nuxt` depends on `@adaptive-bundle/vite-plugin`). Independent versioning creates combinatorial compatibility headaches ("does `@adaptive-bundle/react@2.3.1` work with `@adaptive-bundle/core@2.2.0`?"). Synchronized versions eliminate this entirely — if all packages are at `1.4.0`, they work together. Period.

**Semver:** The version follows standard semver. A breaking change in any package bumps the major version for all packages. This creates social pressure to avoid unnecessary breaking changes in stable packages — which is the correct incentive.

**Peer dependencies:** Framework adapters (`@adaptive-bundle/react`, `@adaptive-bundle/vue`, `@adaptive-bundle/svelte`) declare `@adaptive-bundle/core` as a peer dependency with the exact same version. The Vite plugin is always a dev dependency.

## 20. Technology Stack

**Language: TypeScript (strict mode)** — the only language that satisfies all project constraints simultaneously.

### Why TypeScript

1. **Ecosystem requirement.** Vite plugins, Rollup hooks, React/Vue/Svelte adapters, and Next.js/Nuxt integrations are all JavaScript ecosystem tools. The plugin must speak Rollup's plugin API natively — there is no viable alternative language for this.
2. **Size budget compliance.** `@adaptive-bundle/core` must be <3KB gzipped. TypeScript compiles to minimal JS with zero overhead. Languages that compile to WASM (Rust, Go) would blow the size budget on the WASM runtime alone (~10-50KB baseline).
3. **Developer readability.** Target users are React/Vue/Svelte developers who read TypeScript daily. AI models also have the deepest training data on TS/JS, making the codebase maximally accessible to both humans and AI-assisted development.
4. **Type safety where it matters.** The `adaptive()` API has complex generic signatures (forwarding props between high/low variants, type-checking compatibility). TypeScript's type system handles this natively — the types ARE the documentation.
5. **Dual-environment support.** `@adaptive-bundle/core` runs in browsers AND Node.js (via `@adaptive-bundle/core/server`). TypeScript with proper `exports` field in `package.json` handles this cleanly.

### Toolchain

| Concern          | Tool                              | Rationale                                                   |
| ---------------- | --------------------------------- | ----------------------------------------------------------- |
| Language         | TypeScript (strict mode)          | Type safety, ecosystem compatibility, minimal output        |
| Package bundler  | tsup or unbuild                   | Produces ESM + CJS, tree-shakeable output                   |
| Monorepo         | pnpm workspaces + turborepo       | Fast installs, strict dependency isolation, parallel builds |
| Testing          | vitest                            | Same ecosystem as Vite, native TypeScript support, fast     |
| Size enforcement | Custom CI check on gzipped output | Enforces <3KB core budget from day one                      |
| Linting          | eslint + typescript-eslint        | Catches errors before runtime                               |
| Formatting       | prettier                          | Consistent style, zero debates                              |

### Why NOT other languages

- **Rust/Go (for perf-critical parts):** Not needed. The heaviest operation is AST scanning in the Vite plugin (build-time, Node.js). Vite already uses esbuild (Go) and SWC/OXC (Rust) for parsing — the plugin hooks into the already-parsed module graph. Walking a dependency tree is milliseconds in plain TS.
- **WASM modules:** The WASM runtime baseline (~10-50KB) exceeds the entire `@adaptive-bundle/core` budget (3KB). Disqualified by the size constraint alone.
- **Plain JavaScript:** Loses type safety on the complex generic APIs (`adaptive()` config, probe normalization, weight redistribution). The type signatures are load-bearing — they prevent developer misuse at compile time.

## 21. Glossary

- **Adaptive boundary:** A point in the code where the application branches between variants based on device capability. Created by `adaptive()` (component-level or single-component exclusion) or `<Adaptive.High>`/`<Adaptive.Low>` (inline).
- **Single-component exclusion:** The simplest form of adaptive boundary — a heavy component is loaded on high-tier devices and replaced with inline fallback JSX on low-tier devices. No second file needed.
- **Variant:** One version of a component within an adaptive boundary (e.g., the `high` variant, the `low` variant).
- **Device profile:** The full set of detected hardware probes for the current device, plus network status as a separate concern.
- **Composite score:** A 0-1 numerical score derived from available hardware probes only. Network conditions do not affect this score.
- **Tier:** A categorical classification (high/low by default, or high/medium/low if opted in) derived from the composite score.
- **Network overlay:** A separate layer that handles transient network conditions (connection speed, data saver) independently from the stable hardware tier.
- **Chunk isolation:** The guarantee that one variant's exclusive dependencies are never bundled into another variant's chunk.
- **Hysteresis:** An asymmetric buffer zone around tier boundaries that prevents devices from flipping between tiers due to minor score fluctuations. Promotion (low→high) requires a larger score change than demotion (high→low), matching the "prefer capability over degradation" principle.
- **Client Hints:** HTTP request headers (`Sec-CH-*`) that modern browsers can send to inform the server about device capabilities.
- **Performance budget:** Build-time thresholds that enforce maximum bundle sizes per tier, usable as CI guardrails.
- **Probe:** A single hardware or network measurement used by the detection engine (e.g., CPU cores, device memory, GPU tier). Named "probes" because the engine actively probes for capabilities — not to be confused with reactive signals in UI frameworks.
- **Custom probe provider:** A user-supplied function that returns platform-specific probe values, enabling detection on STB/CTV devices with native APIs that browser standards don't cover.
- **Weight redistribution:** When a hardware probe is unavailable, its weight is distributed proportionally across the remaining available probes rather than defaulting to a value.
- **Detection fast-path:** An optimization that resolves tier immediately from unambiguous probes (data saver, server hint, cached tier, extreme memory values, device map match) without running the full composite scoring engine. Covers ~70% of browser devices and ~100% of mapped STB/CTV devices.
- **Simulation:** A non-destructive analysis mode (`npx adaptive simulate`) that reports potential savings for a component without creating files or modifying code. Bridges the gap between seeing the report and committing to a boundary.
- **Trend tracking:** Historical build data appended to `history.json` on each build, enabling progress visualization over time. Used in HTML reports to show cumulative optimization impact.
- **Device map:** A static lookup table mapping platform identifiers (e.g., `sky-q`, `tizen-2020`) to tiers. Bypasses the scoring engine entirely for known STB/CTV platforms. Highest confidence, lowest cost detection path.
- **Build-time tier targeting (`targetTier`):** A Vite plugin option that resolves the tier at compile time, tree-shaking unused variants and removing `@adaptive-bundle/core` from the output bundle. Essential for STB/CTV apps built per-platform, and the only supported mode for browsers without dynamic `import()`.
- **STB (Set-Top Box):** A device connected to a TV that runs web applications via an embedded browser engine (typically old Chromium). Examples: Sky Q, Foxtel iQ, Orange SOP.
- **CTV (Connected TV):** A smart TV with a built-in browser engine that runs web applications directly. Examples: LG webOS TVs, Samsung Tizen TVs.
