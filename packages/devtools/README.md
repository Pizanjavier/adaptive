# @adaptive-bundle/devtools

Browser overlay and dev server dashboard for debugging adaptive loading. Inspect device tier, probe values, boundary decisions, and simulate tiers in real time.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/devtools)](https://www.npmjs.com/package/@adaptive-bundle/devtools)

## Install

```bash
pnpm add -D @adaptive-bundle/devtools
```

## Browser Overlay

Add one line to your app entry:

```ts
import('@adaptive-bundle/devtools').then((d) => d.init());
```

The overlay shows:

- Current tier, score, and confidence level
- All probe values (CPU cores, memory, GPU, screen, touch)
- Reasoning chain — why this tier was selected
- Per-boundary decisions — which variant loaded for each boundary
- Tier simulator dropdown — switch tiers live without reloading
- Unavailable probes highlighted

The overlay is mounted in a Shadow DOM so it won't interfere with your app's styles. It auto-refreshes on DOM mutations and HMR updates.

## Dev Server Dashboard

When `devtools: true` in the Vite plugin config (default), visit:

```
http://localhost:5173/__adaptive
```

The dashboard shows:

- Boundary table with high/low sizes and savings
- Collapsible dependency trees per boundary
- Tier simulator with HMR-based live reload
- Optimization opportunities ranked by impact

## Production Stripping

The Vite plugin automatically replaces `import('@adaptive-bundle/devtools')` with a no-op in production builds. No devtools code ships to users — zero runtime cost.

## API

### `init(config?)`

Mounts the overlay. Idempotent — safe to call multiple times. SSR-safe — no-ops on the server.

### `destroy()`

Removes the overlay and cleans up observers.

## Part of Adaptive Bundle

This is the developer experience package for the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. Requires [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin) for the dev server dashboard and production stripping.

## License

MIT
