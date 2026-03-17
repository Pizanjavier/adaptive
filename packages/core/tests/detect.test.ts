import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDeviceProfile, getTier, resetDetection } from '../src/detect.js';
import { configure, resetConfig } from '../src/config.js';
import { clearForcedTier, setForcedTier } from '../src/testing.js';
import { clearCache } from '../src/cache.js';
import { getConfig } from '../src/config.js';

describe('getDeviceProfile', () => {
  beforeEach(() => {
    resetDetection();
    resetConfig();
    clearForcedTier();
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
    clearCache(getConfig());
  });

  it('returns a complete DeviceProfile', () => {
    vi.stubGlobal('navigator', {
      hardwareConcurrency: 8,
      deviceMemory: 4,
      maxTouchPoints: 5,
    });
    vi.stubGlobal('window', {
      screen: { width: 1920, height: 1080 },
      devicePixelRatio: 1,
      location: { href: 'http://localhost/' },
    });
    vi.stubGlobal('document', { cookie: '', createElement: document.createElement.bind(document) });

    const profile = getDeviceProfile();

    expect(profile).toHaveProperty('score');
    expect(profile).toHaveProperty('confidence');
    expect(profile).toHaveProperty('tier');
    expect(profile).toHaveProperty('probes');
    expect(profile).toHaveProperty('network');
    expect(profile).toHaveProperty('reasoning');
    expect(['high', 'low', 'medium']).toContain(profile.tier);
    expect(profile.score).toBeGreaterThanOrEqual(0);
    expect(profile.score).toBeLessThanOrEqual(1);
  });

  it('uses forced tier when set', () => {
    setForcedTier('low');
    vi.stubGlobal('navigator', { hardwareConcurrency: 16, deviceMemory: 32 });

    const profile = getDeviceProfile();
    expect(profile.tier).toBe('low');
    expect(profile.reasoning.some((r) => r.includes('Forced'))).toBe(true);
  });

  it('caches profile across calls', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4, deviceMemory: 4 });
    vi.stubGlobal('window', {
      screen: { width: 1024, height: 768 },
      devicePixelRatio: 1,
      location: { href: 'http://localhost/' },
    });
    vi.stubGlobal('document', { cookie: '' });

    const profile1 = getDeviceProfile();
    const profile2 = getDeviceProfile();
    expect(profile1).toBe(profile2);
  });

  it('uses fast path for low memory devices', () => {
    vi.stubGlobal('navigator', { deviceMemory: 1, hardwareConcurrency: 2 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });
    vi.stubGlobal('document', { cookie: '' });

    const profile = getDeviceProfile();
    expect(profile.tier).toBe('low');
    expect(profile.reasoning.some((r) => r.includes('Fast-path'))).toBe(true);
  });

  it('uses device map when platform is detected', () => {
    configure({
      deviceMap: { 'sky-q': 'low' },
      detectPlatform: () => 'sky-q',
    });
    resetDetection();

    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });

    const profile = getDeviceProfile();
    expect(profile.tier).toBe('low');
    expect(profile.reasoning.some((r) => r.includes('device map'))).toBe(true);
  });
});

describe('getTier', () => {
  beforeEach(() => {
    resetDetection();
    resetConfig();
    clearForcedTier();
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
    clearCache(getConfig());
  });

  it('returns just the tier string', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8 });
    vi.stubGlobal('window', {
      screen: { width: 1920, height: 1080 },
      devicePixelRatio: 2,
      location: { href: 'http://localhost/' },
    });
    vi.stubGlobal('document', { cookie: '' });

    const tier = getTier();
    expect(['high', 'low', 'medium']).toContain(tier);
  });
});
