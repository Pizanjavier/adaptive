import { describe, it, expect, beforeEach } from 'vitest';
import { readCache, writeCache, applyHysteresis, clearCache } from '../src/cache.js';
import { DEFAULT_CONFIG } from '../src/defaults.js';
import type { AdaptiveConfig } from '../src/types.js';

function makeConfig(overrides: Partial<AdaptiveConfig> = {}): AdaptiveConfig {
  return { ...DEFAULT_CONFIG, configHash: 'testhash', ...overrides };
}

describe('cache', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
    clearCache(makeConfig());
  });

  it('writes and reads from localStorage', () => {
    const config = makeConfig();
    writeCache(config, 'high', 0.7);

    const entry = readCache(config);
    expect(entry).not.toBeNull();
    expect(entry!.tier).toBe('high');
    expect(entry!.score).toBe(0.7);
  });

  it('returns null for mismatched config hash', () => {
    const config = makeConfig();
    writeCache(config, 'high', 0.7);

    const config2 = makeConfig({ configHash: 'different' });
    expect(readCache(config2)).toBeNull();
  });

  it('returns null for expired cache', () => {
    const config = makeConfig({ cacheTTL: 100 });
    writeCache(config, 'high', 0.7);

    const entry = readCache(config);
    expect(entry).not.toBeNull();

    const expiredConfig = makeConfig({ cacheTTL: -1 });
    expect(readCache(expiredConfig)).toBeNull();
  });

  it('uses memory fallback when configured', () => {
    const config = makeConfig({ cacheStorage: 'memory' });
    writeCache(config, 'low', 0.3);

    const entry = readCache(config);
    expect(entry).not.toBeNull();
    expect(entry!.tier).toBe('low');
  });
});

describe('hysteresis', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
    clearCache(makeConfig());
  });

  it('requires score to exceed threshold+0.12 for low->high', () => {
    const config = makeConfig();
    writeCache(config, 'low', 0.4);

    expect(applyHysteresis(0.55, config)).toBe('low');
    expect(applyHysteresis(0.61, config)).toBe('low');
    expect(applyHysteresis(0.62, config)).toBe('high');
  });

  it('requires score to fall below threshold-0.08 for high->low', () => {
    const config = makeConfig();
    writeCache(config, 'high', 0.6);

    expect(applyHysteresis(0.45, config)).toBe('high');
    expect(applyHysteresis(0.43, config)).toBe('high');
    expect(applyHysteresis(0.41, config)).toBe('low');
  });

  it('returns null when no cache exists', () => {
    const config = makeConfig();
    expect(applyHysteresis(0.5, config)).toBeNull();
  });
});
