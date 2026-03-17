import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setForcedTier, clearForcedTier, getForcedTier } from '../src/testing.js';
import { DEFAULT_CONFIG } from '../src/defaults.js';
import type { AdaptiveConfig } from '../src/types.js';

function makeConfig(overrides: Partial<AdaptiveConfig> = {}): AdaptiveConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe('testing utilities', () => {
  beforeEach(() => {
    clearForcedTier();
  });

  it('setForcedTier overrides detection', () => {
    setForcedTier('low');
    expect(getForcedTier(makeConfig())).toBe('low');
  });

  it('clearForcedTier removes override', () => {
    setForcedTier('high');
    clearForcedTier();
    vi.stubGlobal('window', { location: { href: 'http://localhost/' } });
    expect(getForcedTier(makeConfig())).toBeNull();
  });

  it('reads tier from URL parameter', () => {
    vi.stubGlobal('window', {
      location: { href: 'http://localhost/?adaptive_tier=medium' },
    });
    expect(getForcedTier(makeConfig())).toBe('medium');
  });

  it('ignores invalid URL parameter values', () => {
    vi.stubGlobal('window', {
      location: { href: 'http://localhost/?adaptive_tier=invalid' },
    });
    expect(getForcedTier(makeConfig())).toBeNull();
  });

  it('uses custom forceTierParam', () => {
    vi.stubGlobal('window', {
      location: { href: 'http://localhost/?custom_tier=low' },
    });
    expect(getForcedTier(makeConfig({ forceTierParam: 'custom_tier' }))).toBe('low');
  });
});
