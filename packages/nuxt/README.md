# @adaptive-bundle/nuxt

Nuxt module for device-aware bundle optimization. Auto-configures the Vite plugin and registers Nitro middleware for server-side tier resolution via Client Hints.

[![npm](https://img.shields.io/npm/v/@adaptive-bundle/nuxt)](https://www.npmjs.com/package/@adaptive-bundle/nuxt)

## Install

```bash
pnpm add @adaptive-bundle/nuxt @adaptive-bundle/core @adaptive-bundle/vue
pnpm add -D @adaptive-bundle/vite-plugin
```

## Quick Start

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@adaptive-bundle/nuxt'],
  adaptive: {
    report: true,
    clientHints: true, // auto-injects Nitro middleware
  },
});
```

That's it. The module:

1. Injects `@adaptive-bundle/vite-plugin` into your Vite config via `vite:extendConfig`
2. If `clientHints: true`, registers Nitro server middleware that resolves device tier from `Sec-CH-Device-Memory` and `Sec-CH-UA-Mobile` headers
3. Sets an `adaptive_tier_hint` cookie so the client can read the server-resolved tier

## Configuration

```ts
export default defineNuxtConfig({
  modules: ['@adaptive-bundle/nuxt'],
  adaptive: {
    report: true,
    reportFormat: 'html',
    clientHints: true,
    cookieName: 'adaptive_tier_hint', // default
    cookieMaxAge: 86400, // 24 hours, default
    budget: {
      maxLowTierBundle: 150_000,
      enforce: 'warn',
    },
  },
});
```

## Server-Side Tier Resolution

When `clientHints: true`, the Nitro middleware:

1. Reads `Sec-CH-Device-Memory` and `Sec-CH-UA-Mobile` headers
2. Resolves a tier using `resolveTierFromHeaders()` from `@adaptive-bundle/core/server`
3. Sets `adaptive_tier_hint` cookie with the resolved tier
4. The client reads this cookie to skip client-side detection entirely

This eliminates the ~50ms client-side detection cost for returning visitors.

## Using with Vue Adapter

Write adaptive boundaries with `@adaptive-bundle/vue` as usual:

```vue
<script setup>
import { adaptive } from '@adaptive-bundle/vue';

const Editor = adaptive({
  high: () => import('./RichEditor.vue'),
  low: () => import('./BasicEditor.vue'),
});
</script>

<template>
  <component :is="Editor" />
</template>
```

## Part of Adaptive Bundle

This is the Nuxt integration for the [Adaptive Bundle](https://github.com/Pizanjavier/adaptive) monorepo. For plain Vite projects, use [`@adaptive-bundle/vite-plugin`](https://www.npmjs.com/package/@adaptive-bundle/vite-plugin) directly. For Next.js, see [`@adaptive-bundle/next`](https://www.npmjs.com/package/@adaptive-bundle/next).

## License

MIT
