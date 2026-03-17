import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { adaptive } from '../src/adaptive.js';

vi.mock('@adaptive/core', () => ({
  getDeviceProfile: vi.fn(),
}));

import { getDeviceProfile } from '@adaptive/core';

const mockGetDeviceProfile = vi.mocked(getDeviceProfile);

function mockProfile(tier: 'high' | 'low' | 'medium', score: number) {
  mockGetDeviceProfile.mockReturnValue({
    tier,
    score,
    gpu: { tier: 'mid', renderer: '' },
    memory: 4,
    cores: 4,
    screen: { width: 1920, height: 1080, category: 'desktop', dpr: 1 },
    network: { effectiveType: '4g', downlink: 10, rtt: 50 },
    deviceType: 'desktop',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

const FakeHigh = { name: 'HighComponent' };
const FakeLow = { name: 'LowComponent' };

function makeImport<T>(mod: T) {
  return () => Promise.resolve({ default: mod });
}

function failingImport() {
  return () => Promise.reject(new Error('import failed'));
}

describe('adaptive()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('variant config', () => {
    it('resolves high component on high tier', async () => {
      mockProfile('high', 0.8);
      const store = adaptive({
        high: makeImport(FakeHigh),
        low: makeImport(FakeLow),
      });

      await new Promise((r) => {
        const unsub = store.subscribe((val) => {
          if (val !== null) {
            expect(val).toBe(FakeHigh);
            unsub();
            r(undefined);
          }
        });
      });
    });

    it('resolves low component on low tier', async () => {
      mockProfile('low', 0.2);
      const store = adaptive({
        high: makeImport(FakeHigh),
        low: makeImport(FakeLow),
      });

      await new Promise((r) => {
        const unsub = store.subscribe((val) => {
          if (val !== null) {
            expect(val).toBe(FakeLow);
            unsub();
            r(undefined);
          }
        });
      });
    });

    it('falls back to opposite variant on import failure', async () => {
      mockProfile('high', 0.8);
      const store = adaptive({
        high: failingImport(),
        low: makeImport(FakeLow),
      });

      await new Promise((r) => {
        const unsub = store.subscribe((val) => {
          if (val !== null) {
            expect(val).toBe(FakeLow);
            unsub();
            r(undefined);
          }
        });
      });
    });
  });

  describe('exclusion config', () => {
    it('resolves component on high tier', async () => {
      mockProfile('high', 0.8);
      const store = adaptive({
        component: makeImport(FakeHigh),
      });

      await new Promise((r) => {
        const unsub = store.subscribe((val) => {
          if (val !== null) {
            expect(val).toBe(FakeHigh);
            unsub();
            r(undefined);
          }
        });
      });
    });

    it('returns null on low tier', async () => {
      mockProfile('low', 0.2);
      const store = adaptive({
        component: makeImport(FakeHigh),
      });

      // Exclusion on low tier sets null immediately, so the initial value stays null
      // We need to wait a tick to ensure the start function ran
      await new Promise((r) => setTimeout(r, 10));
      expect(get(store)).toBeNull();
    });
  });

  describe('error handling', () => {
    it('calls onError when all imports fail', async () => {
      mockProfile('high', 0.8);
      const onError = vi.fn();
      const store = adaptive({
        component: failingImport(),
        onError,
      });

      await new Promise((r) => {
        store.subscribe(() => {});
        setTimeout(() => r(undefined), 2200);
      });

      expect(onError).toHaveBeenCalledOnce();
      expect(get(store)).toBeNull();
    });

    it('resolves custom thresholds for medium tier', async () => {
      mockProfile('medium', 0.5);
      const FakeMid = { name: 'MidComponent' };
      const store = adaptive({
        high: makeImport(FakeHigh),
        low: makeImport(FakeLow),
        medium: makeImport(FakeMid),
        thresholds: { high: 0.7, low: 0.3 },
      });

      await new Promise((r) => {
        const unsub = store.subscribe((val) => {
          if (val !== null) {
            expect(val).toBe(FakeMid);
            unsub();
            r(undefined);
          }
        });
      });
    });
  });
});
