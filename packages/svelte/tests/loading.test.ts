// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

let mockTier = 'high';

vi.mock('@adaptive-bundle/core', () => ({
  getDeviceProfile: vi.fn(() => ({
    score: 0.7,
    confidence: 0.9,
    tier: mockTier,
    probes: {
      cpuCores: 8,
      memoryGB: 8,
      gpuTier: 2,
      screenCategory: 'high' as const,
      touchPoints: 0,
    },
    network: { effectiveType: '4g' as const, dataSaver: false },
    reasoning: [],
  })),
}));

import { adaptive } from '../src/adaptive.js';
import type { LazyReadable } from '../src/adaptive.js';
import { viewportAction } from '../src/loading.js';

afterEach(() => {
  mockTier = 'high';
  vi.restoreAllMocks();
});

describe('loading: eager', () => {
  it('preloads import at definition time', () => {
    let importCalled = false;
    const store = adaptive({
      component: () => {
        importCalled = true;
        return Promise.resolve({ default: 'MockComponent' });
      },
      loading: 'eager',
      name: 'eager-test',
    });

    expect(importCalled).toBe(true);
    store.subscribe(() => {});
  });
});

describe('loading: lazy', () => {
  it('store starts as null and does not load until load() called', async () => {
    let importCalled = false;
    const store = adaptive({
      high: () => {
        importCalled = true;
        return Promise.resolve({ default: 'HighComp' });
      },
      low: () => Promise.resolve({ default: 'LowComp' }),
      loading: 'lazy',
      name: 'lazy-test',
    }) as LazyReadable<string>;

    store.subscribe(() => {});
    expect(get(store)).toBe(null);
    expect(importCalled).toBe(false);

    store.load();
    await vi.waitFor(() => {
      expect(get(store)).toBe('HighComp');
    });
    expect(importCalled).toBe(true);
  });

  it('calling load() multiple times is safe', async () => {
    let callCount = 0;
    const store = adaptive({
      component: () => {
        callCount++;
        return Promise.resolve({ default: 'Comp' });
      },
      loading: 'lazy',
      name: 'lazy-safe',
    }) as LazyReadable<string>;

    store.subscribe(() => {});
    store.load();
    store.load();
    store.load();
    await vi.waitFor(() => {
      expect(get(store)).toBe('Comp');
    });
    expect(callCount).toBe(1);
  });
});

describe('viewportAction', () => {
  let observerCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observerCallback = null;
    mockDisconnect = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = vi.fn((cb: typeof observerCallback) => {
      observerCallback = cb;
      return { observe: vi.fn(), disconnect: mockDisconnect, unobserve: vi.fn() };
    });
  });

  it('calls loadFn when element enters viewport', () => {
    const loadFn = vi.fn();
    const node = document.createElement('div');
    viewportAction(node, loadFn);

    expect(loadFn).not.toHaveBeenCalled();
    observerCallback?.([{ isIntersecting: true }]);
    expect(loadFn).toHaveBeenCalledOnce();
  });

  it('returns destroy function', () => {
    const node = document.createElement('div');
    const { destroy } = viewportAction(node, vi.fn());
    destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
