import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { useAdaptive, useDeviceProfile, useTier, useNetworkAware } from '../src/composables.js';

let mockTier = 'high';
let mockScore = 0.7;
let mockEffectiveType: string | null = '4g';

vi.mock('@adaptive-bundle/core', () => ({
  getDeviceProfile: vi.fn(() => ({
    score: mockScore,
    confidence: 0.9,
    tier: mockTier,
    probes: {
      cpuCores: 8,
      memoryGB: 8,
      gpuTier: 2,
      screenCategory: 'high' as const,
      touchPoints: 0,
    },
    network: { effectiveType: mockEffectiveType, dataSaver: false },
    reasoning: [],
  })),
}));

afterEach(() => {
  mockTier = 'high';
  mockScore = 0.7;
  mockEffectiveType = '4g';
  vi.restoreAllMocks();
});

function runInSetup<T>(fn: () => T): Promise<T> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = createApp(
      defineComponent({
        setup() {
          const result = fn();
          resolve(result);
          return () => h('div');
        },
      }),
    );
    app.mount(el);
    app.unmount();
    document.body.removeChild(el);
  });
}

describe('useAdaptive', () => {
  it('returns tier, shouldDefer, effectiveType, profile', async () => {
    const result = await runInSetup(() => useAdaptive());
    expect(result.tier).toBe('high');
    expect(result.shouldDefer).toBe(false);
    expect(result.effectiveType).toBe('4g');
    expect(result.profile).toBeDefined();
    expect(result.profile.score).toBe(0.7);
  });

  it('shouldDefer is true on slow networks', async () => {
    mockEffectiveType = '2g';
    const result = await runInSetup(() => useAdaptive());
    expect(result.shouldDefer).toBe(true);
  });
});

describe('useDeviceProfile', () => {
  it('returns full device profile', async () => {
    const profile = await runInSetup(() => useDeviceProfile());
    expect(profile.tier).toBe('high');
    expect(profile.score).toBe(0.7);
    expect(profile.probes.cpuCores).toBe(8);
  });
});

describe('useTier', () => {
  it('returns the tier string', async () => {
    const tier = await runInSetup(() => useTier());
    expect(tier).toBe('high');
  });

  it('returns low when device is low tier', async () => {
    mockTier = 'low';
    const tier = await runInSetup(() => useTier());
    expect(tier).toBe('low');
  });
});

describe('useNetworkAware', () => {
  it('returns shouldDefer and effectiveType', async () => {
    const result = await runInSetup(() => useNetworkAware());
    expect(result.shouldDefer).toBe(false);
    expect(result.effectiveType).toBe('4g');
  });

  it('defers on slow-2g', async () => {
    mockEffectiveType = 'slow-2g';
    const result = await runInSetup(() => useNetworkAware());
    expect(result.shouldDefer).toBe(true);
    expect(result.effectiveType).toBe('slow-2g');
  });
});
