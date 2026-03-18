import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCapabilities } from '../src/capabilities.js';
import { configure, resetConfig, getConfig } from '../src/config.js';
import { getDeviceProfile, resetDetection } from '../src/detect.js';
import { clearForcedTier } from '../src/testing.js';
import { clearCache } from '../src/cache.js';

describe('getCapabilities', () => {
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

  it('returns empty array by default when no platformTierMap is configured', () => {
    expect(getCapabilities()).toEqual([]);
  });

  it('returns correct capabilities after platform detection via platformTierMap', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4, deviceMemory: 2 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });

    configure({
      platformTierMap: {
        'sky-q': { tier: 'low', capabilities: ['drm', 'dolby-vision'] },
        'foxtel-iq4': { tier: 'low', capabilities: ['drm', 'hdr10'] },
      },
      detectPlatform: () => 'sky-q',
    });
    resetDetection();

    getDeviceProfile();

    expect(getCapabilities()).toEqual(['drm', 'dolby-vision']);
  });

  it('clears capabilities after resetDetection', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4, deviceMemory: 2 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });

    configure({
      platformTierMap: {
        'sky-q': { tier: 'low', capabilities: ['drm', 'dolby-vision'] },
      },
      detectPlatform: () => 'sky-q',
    });
    resetDetection();

    getDeviceProfile();
    expect(getCapabilities()).toEqual(['drm', 'dolby-vision']);

    resetDetection();
    expect(getCapabilities()).toEqual([]);
  });

  it('stays empty when platform matches deviceMap but not platformTierMap', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4, deviceMemory: 2 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });

    configure({
      deviceMap: { 'roku-express': 'low' },
      detectPlatform: () => 'roku-express',
    });
    resetDetection();

    getDeviceProfile();

    expect(getCapabilities()).toEqual([]);
  });

  it('platformTierMap takes priority over deviceMap for the same platform', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4, deviceMemory: 2 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });

    configure({
      deviceMap: { 'sky-q': 'high' },
      platformTierMap: {
        'sky-q': { tier: 'low', capabilities: ['drm'] },
      },
      detectPlatform: () => 'sky-q',
    });
    resetDetection();

    const profile = getDeviceProfile();

    expect(profile.tier).toBe('low');
    expect(getCapabilities()).toEqual(['drm']);
  });

  it('stays empty when detectPlatform returns null', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 8 });
    vi.stubGlobal('window', {
      screen: { width: 1920, height: 1080 },
      devicePixelRatio: 2,
      location: { href: 'http://localhost/' },
    });
    vi.stubGlobal('document', { cookie: '' });

    configure({
      platformTierMap: {
        'sky-q': { tier: 'low', capabilities: ['drm'] },
      },
      detectPlatform: () => null,
    });
    resetDetection();

    getDeviceProfile();

    expect(getCapabilities()).toEqual([]);
  });
});
