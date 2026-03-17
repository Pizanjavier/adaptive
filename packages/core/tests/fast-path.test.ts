import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkFastPath } from '../src/fast-path.js';
import { DEFAULT_CONFIG } from '../src/defaults.js';
import type { AdaptiveConfig } from '../src/types.js';

function makeConfig(overrides: Partial<AdaptiveConfig> = {}): AdaptiveConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe('checkFastPath', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });
    vi.stubGlobal('document', { cookie: '' });
    // Clear localStorage
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
  });

  it('returns low when data saver is active', () => {
    vi.stubGlobal('navigator', {
      connection: { saveData: true },
    });
    const result = checkFastPath(makeConfig());
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('low');
    expect(result!.reason).toContain('Data saver');
  });

  it('returns server hint from window.__ADAPTIVE_TIER__', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', {
      __ADAPTIVE_TIER__: 'high',
      location: { href: 'http://localhost/' },
    });
    const result = checkFastPath(makeConfig());
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('high');
    expect(result!.reason).toContain('Server hint');
  });

  it('returns server hint from cookie', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });
    vi.stubGlobal('document', { cookie: 'other=val; adaptive_tier=low; foo=bar' });
    const result = checkFastPath(makeConfig());
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('low');
  });

  it('returns low for deviceMemory <= 2GB', () => {
    vi.stubGlobal('navigator', { deviceMemory: 2 });
    const result = checkFastPath(makeConfig());
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('low');
  });

  it('returns high for deviceMemory >= 8GB and cores >= 8', () => {
    vi.stubGlobal('navigator', {
      deviceMemory: 8,
      hardwareConcurrency: 8,
    });
    const result = checkFastPath(makeConfig());
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('high');
  });

  it('returns null for ambiguous devices', () => {
    vi.stubGlobal('navigator', {
      deviceMemory: 4,
      hardwareConcurrency: 4,
    });
    const result = checkFastPath(makeConfig());
    expect(result).toBeNull();
  });

  it('returns cached tier when valid', () => {
    const config = makeConfig({ configHash: 'test123', cacheStorage: 'localStorage' });
    const entry = {
      tier: 'high',
      score: 0.7,
      timestamp: Date.now(),
      configHash: 'test123',
    };
    localStorage.setItem(config.cacheKey, JSON.stringify(entry));

    vi.stubGlobal('navigator', { deviceMemory: 4, hardwareConcurrency: 4 });
    const result = checkFastPath(config);
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('high');
    expect(result!.reason).toContain('Cached');
  });

  it('ignores expired cache', () => {
    const config = makeConfig({ configHash: 'test123', cacheStorage: 'localStorage' });
    const entry = {
      tier: 'high',
      score: 0.7,
      timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
      configHash: 'test123',
    };
    localStorage.setItem(config.cacheKey, JSON.stringify(entry));

    vi.stubGlobal('navigator', { deviceMemory: 4, hardwareConcurrency: 4 });
    const result = checkFastPath(config);
    expect(result).toBeNull();
  });
});
