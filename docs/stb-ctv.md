# STB/CTV Platform Guide

Adaptive is the only adaptive loading tool that supports set-top boxes and connected TV platforms. This guide covers the three detection strategies for STB/CTV apps, from simplest to most flexible.

---

## Strategy 1: Build-Time Tier Targeting (`targetTier`)

**Best for:** Apps built per-platform (one build for Sky Q, one for Sky Glass, etc.)

When you already build separately per platform, runtime detection is unnecessary overhead. `targetTier` resolves the tier at compile time and tree-shakes the unused variant entirely.

```ts
// vite.config.ts
import { adaptive } from '@adaptive/vite-plugin';

const platformTierMap: Record<string, 'high' | 'low'> = {
  'sky-q': 'low',
  'sky-soip': 'high',
  'sky-glass': 'high',
  'foxtel-iq4': 'low',
  'foxtel-iq5': 'high',
  'webos-4': 'low',
  'webos-6': 'high',
  'tizen-2020': 'low',
  'tizen-2022': 'high',
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
PLATFORM=foxtel-iq4 pnpm build   # low-tier-only bundle
PLATFORM=sky-glass pnpm build    # high-tier-only bundle
```

When `targetTier` is set:

1. All `adaptive()` calls become **static imports** of the targeted variant
2. `<Adaptive.High>` / `<Adaptive.Low>` blocks are statically resolved — the non-matching block is removed as dead code
3. `@adaptive/core` is **not included** in the output bundle at all
4. Works on devices without dynamic `import()` (Chromium <63)

This is the recommended approach for per-platform STB/CTV builds.

---

## Strategy 2: Static Device Map (`deviceMap`)

**Best for:** Single build deployed to multiple known platforms with runtime detection

When you ship one build to multiple STB/CTV platforms, a device map bypasses the scoring engine for known devices. It's a lookup table from platform identifier to tier.

```ts
import { configure } from '@adaptive/core';

configure({
  deviceMap: {
    'sky-q-mini': 'low',
    'sky-q': 'low',
    'sky-soip': 'high',
    'sky-glass': 'high',
    'foxtel-iq4': 'low',
    'foxtel-iq5': 'high',
    'orange-sop': 'low',
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

When `detectPlatform()` returns a key in `deviceMap`, the tier resolves immediately with **confidence 1.0** — no scoring, no probing, no WebGL context.

---

## Strategy 3: Custom Probe Providers

**Best for:** Platforms with native JS bridges that expose hardware info

STB/CTV devices often have proprietary APIs that browser standards don't cover. Custom probe providers feed this data into the scoring engine.

```ts
configure({
  probeProviders: {
    tizenHardware: () => ({
      cpuFrequency: tizen.systeminfo.getCapability(
        'http://tizen.org/feature/platform.core.cpu.frequency',
      ),
      cpuArch: tizen.systeminfo.getCapability('http://tizen.org/feature/platform.core.cpu.arch'),
    }),
    skyCapabilities: () => ({
      ram: sky.device.memory,
      model: sky.device.model,
    }),
  },
});
```

---

## CTV Probe Weight Recommendations

Several default probes behave differently on STB/CTV devices:

| Probe                   | Behavior on STB/CTV                               | Recommendation                      |
| ----------------------- | ------------------------------------------------- | ----------------------------------- |
| Screen resolution + DPR | Misleading — cheap STBs output 1080p/4K to the TV | Set weight to `0`                   |
| `maxTouchPoints`        | Always 0 (remote control)                         | Useless — weight auto-redistributes |
| GPU (WebGL)             | Often software-rendered or absent                 | Reduce weight or skip               |
| `deviceMemory`          | Often unavailable on old Chromium                 | Falls through to CPU cores          |

Recommended weights for CTV targets:

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

## Choosing a Strategy

| Criteria                         | `targetTier` | `deviceMap`        | Custom Probes |
| -------------------------------- | ------------ | ------------------ | ------------- |
| Build per platform               | Yes          | No                 | No            |
| Single build, multiple platforms | No           | Yes                | Yes           |
| Runtime cost                     | Zero         | Negligible         | ~50ms         |
| `@adaptive/core` in bundle       | No           | Yes                | Yes           |
| Works without dynamic `import()` | Yes          | No                 | No            |
| Unknown devices supported        | No           | Fallback to probes | Yes           |
