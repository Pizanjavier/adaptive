import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@adaptive-bundle/core', () => ({
  getDeviceProfile: vi.fn(() => ({
    score: 0.7,
    confidence: 0.9,
    tier: 'high',
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

import { preloadImport, observeViewport } from '../src/loading.js';
import type { Component } from 'vue';

type ImportFn = () => Promise<{ default: Component }>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('preloadImport', () => {
  it('calls import immediately and caches the result', async () => {
    let callCount = 0;
    const mockComponent = {} as Component;
    const importFn: ImportFn = () => {
      callCount++;
      return Promise.resolve({ default: mockComponent });
    };

    const preloaded = preloadImport(importFn);
    expect(callCount).toBe(1);

    const result1 = await preloaded();
    const result2 = await preloaded();
    expect(callCount).toBe(1);
    expect(result1.default).toBe(mockComponent);
    expect(result2.default).toBe(mockComponent);
  });
});

describe('observeViewport', () => {
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

  it('calls callback when element enters viewport', () => {
    const callback = vi.fn();
    const el = document.createElement('div');
    observeViewport(el, callback);

    expect(callback).not.toHaveBeenCalled();
    observerCallback?.([{ isIntersecting: true }]);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('disconnects observer after intersection', () => {
    const callback = vi.fn();
    const el = document.createElement('div');
    observeViewport(el, callback);

    observerCallback?.([{ isIntersecting: true }]);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('returns cleanup function that disconnects', () => {
    const el = document.createElement('div');
    const cleanup = observeViewport(el, vi.fn());
    cleanup();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
