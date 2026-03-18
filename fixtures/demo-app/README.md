# Adaptive Demo App

A multi-page React dashboard that showcases every feature of the Adaptive plugin. Each page demonstrates a different use case for device-aware bundle optimization — the same codebase delivers a rich experience to powerful devices and a lightweight one to constrained devices.

## Running

```bash
# From the monorepo root
pnpm install
pnpm build          # build all packages first
cd fixtures/demo-app
pnpm dev            # http://localhost:5173
```

To simulate a low-tier device, add `?adaptive_tier=low` to any URL.

## Pages

### Dashboard (`/`)

Shows the primary adaptive patterns in a real-world analytics layout:

- **Animated Metrics** (high) vs **Static Metrics** (low) — framer-motion staggered card animations vs plain HTML. Demonstrates how a ~100KB animation library is only loaded on capable devices.
- **Canvas Chart** (high) vs **HTML Table** (low) — smooth animated area chart with eased transitions, gradient fills, and data dots vs a lightweight table with inline progress bars. Same data, different presentation.
- **Inline Boundaries** — `<Adaptive.High>` and `<Adaptive.Low>` blocks show tier-specific explanatory text.

### 3D Explorer (`/3d`)

The most dramatic demonstration of adaptive loading:

- **Three.js Scene** (high) — interactive 3D torus knot with PBR materials, distortion effects, floating rings, orbit controls, and dynamic lighting. Loads Three.js + React Three Fiber + Drei (~600KB).
- **Static SVG** (low) — a lightweight wireframe SVG (~2KB). No JavaScript runtime, no GPU requirements.

This single boundary saves ~600KB on low-tier devices.

### Editor (`/editor`)

A practical two-variant pattern:

- **Rich Editor** (high) — markdown source editor with formatting toolbar (bold, italic, heading, code, link, list, quote), side-by-side live preview with rendered HTML, and real-time word/character count.
- **Basic Editor** (low) — plain textarea with word count. No toolbar, no preview, no markdown engine.

## Adaptive Patterns Demonstrated

| Pattern     | Component      | High Tier                    | Low Tier                   |
| ----------- | -------------- | ---------------------------- | -------------------------- |
| Two-variant | Metrics        | framer-motion animated cards | Static HTML cards          |
| Two-variant | Chart          | Canvas animated area chart   | HTML table with bars       |
| Two-variant | Scene3D        | Three.js interactive scene   | Static SVG wireframe       |
| Two-variant | Editor         | Rich markdown with preview   | Plain textarea             |
| Inline      | Dashboard text | Tier-specific explanation    | Tier-specific explanation  |
| Inline      | Badges         | "CANVAS" / "RICH EDITOR"     | "TABLE" / "BASIC TEXTAREA" |

## Architecture

```
src/
  main.tsx                    Entry point, providers, devtools init
  App.tsx                     Router + layout (sidebar + pages)
  styles.css                  Global styles, design tokens

  pages/
    Dashboard.tsx             Metrics + chart page
    Exploration.tsx           3D visualization page
    Editor.tsx                Rich text editor page

  components/
    layout/
      Sidebar.tsx             Navigation with route links
      TierIndicator.tsx       Shows current tier, score, probes
    dashboard/
      Metrics.tsx             adaptive() boundary
      AnimatedMetrics.tsx     High: framer-motion staggered cards
      StaticMetrics.tsx       Low: plain HTML cards
      Chart.tsx               adaptive() boundary
      AnimatedChart.tsx       High: canvas animated area chart
      StaticChart.tsx         Low: HTML table with bar indicators
    exploration/
      Scene.tsx               adaptive() boundary
      ThreeScene.tsx          High: Three.js + R3F + Drei
      StaticScene.tsx         Low: inline SVG wireframe
    editor/
      EditorBoundary.tsx      adaptive() boundary
      RichEditor.tsx          High: toolbar + preview + markdown
      BasicEditor.tsx         Low: plain textarea

  heavy/
    chart-engine.ts           Canvas chart rendering (draw, animate, axes)
    editor-engine.ts          Markdown formatting + rendering engine
    geometry.ts               3D wireframe math (vertices, edges, projection)
    particles.ts              Particle system (physics, connections, draw)
```

## Key Dependencies (High-Tier Only)

These packages are only loaded on high-tier devices via adaptive boundaries:

| Package              | Size   | Used In                            |
| -------------------- | ------ | ---------------------------------- |
| `three`              | ~600KB | 3D Explorer scene                  |
| `@react-three/fiber` | ~150KB | React bindings for Three.js        |
| `@react-three/drei`  | ~200KB | OrbitControls, MeshDistortMaterial |
| `framer-motion`      | ~100KB | Dashboard animated metrics         |

Low-tier devices never download these packages.

## Features Shown

- **Device detection** — hardware probes (CPU, memory, GPU, screen, touch), scoring, tier resolution
- **Adaptive boundaries** — `adaptive()` two-variant pattern across all pages
- **Inline boundaries** — `<Adaptive.High>` / `<Adaptive.Low>` for conditional content
- **React hooks** — `useTier()`, `useAdaptive()` in TierIndicator
- **AdaptiveProvider** — context-based profile caching
- **DevTools overlay** — bottom-right panel with probes, reasoning, boundaries, tier simulator
- **Dev server dashboard** — `/__adaptive` for build analysis
- **URL parameter testing** — `?adaptive_tier=low` to force tier
- **Error recovery** — Three.js scene gracefully falls back when WebGL is unavailable
- **Chunk isolation** — build produces separate chunks for high/low variants

## Design

Clean, professional light theme — no excessive gradients or effects. Inter font, neutral palette with blue accent, sidebar navigation, card-based layout. The visual impact comes from the content difference between tiers, not from decorative styling.
