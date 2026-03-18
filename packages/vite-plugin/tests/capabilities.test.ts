import { describe, it, expect } from 'vitest';
import {
  buildCapabilityMap,
  shouldPruneTier,
  applyCapabilityPruning,
} from '../src/analysis/capabilities.js';
import type { AdaptiveBoundary } from '../src/types.js';

const platformTierMap = {
  'foxtel-iq4': { tier: 'low' as const, capabilities: ['drm', 'hdr10'] },
  'sky-q': { tier: 'low' as const, capabilities: ['drm', 'dolby-vision'] },
  ios: { tier: 'high' as const, capabilities: ['haptics', 'webgl2'] },
  android: { tier: 'high' as const, capabilities: ['webgl2', 'nfc'] },
};

function makeBoundary(overrides: Partial<AdaptiveBoundary> = {}): AdaptiveBoundary {
  return {
    name: 'DolbyPlayer:5',
    filePath: 'src/Player.tsx',
    line: 5,
    highImport: './DolbyPlayer.high',
    lowImport: './DolbyPlayer.low',
    ...overrides,
  };
}

describe('buildCapabilityMap', () => {
  it('returns empty map for empty platformTierMap', () => {
    const map = buildCapabilityMap({});
    expect(map.size).toBe(0);
  });

  it('aggregates capabilities per tier correctly', () => {
    const map = buildCapabilityMap(platformTierMap);

    const lowCaps = map.get('low')!;
    expect(lowCaps.has('drm')).toBe(true);
    expect(lowCaps.has('hdr10')).toBe(true);
    expect(lowCaps.has('dolby-vision')).toBe(true);

    const highCaps = map.get('high')!;
    expect(highCaps.has('haptics')).toBe(true);
    expect(highCaps.has('webgl2')).toBe(true);
    expect(highCaps.has('nfc')).toBe(true);
    expect(highCaps.has('drm')).toBe(false);
  });

  it('handles entries without capabilities', () => {
    const map = buildCapabilityMap({
      'basic-tv': { tier: 'low' as const },
      'smart-tv': { tier: 'high' as const, capabilities: ['webgl2'] },
    });

    expect(map.get('low')!.size).toBe(0);
    expect(map.get('high')!.has('webgl2')).toBe(true);
  });
});

describe('shouldPruneTier', () => {
  const tierCapMap = buildCapabilityMap(platformTierMap);

  it('returns true when tier has no capabilities at all', () => {
    const emptyMap = buildCapabilityMap({ basic: { tier: 'low' as const } });
    expect(shouldPruneTier(['drm'], 'low', emptyMap)).toBe(true);
  });

  it('returns true when required capability is missing from tier', () => {
    expect(shouldPruneTier(['dolby-vision'], 'high', tierCapMap)).toBe(true);
  });

  it('returns false when all required capabilities are present', () => {
    expect(shouldPruneTier(['drm', 'dolby-vision'], 'low', tierCapMap)).toBe(false);
  });

  it('returns true when tier does not exist in map', () => {
    expect(shouldPruneTier(['drm'], 'medium', tierCapMap)).toBe(true);
  });
});

describe('applyCapabilityPruning', () => {
  it('returns boundaries unchanged when platformTierMap is empty', () => {
    const boundaries = [makeBoundary()];
    const { boundaries: result, pruneInfo } = applyCapabilityPruning(boundaries, {});

    expect(result).toBe(boundaries);
    expect(pruneInfo.size).toBe(0);
  });

  it('returns boundaries unchanged when no boundary has requires', () => {
    const boundaries = [makeBoundary()];
    const { boundaries: result } = applyCapabilityPruning(boundaries, platformTierMap);

    expect(result[0].highImport).toBe('./DolbyPlayer.high');
    expect(result[0].lowImport).toBe('./DolbyPlayer.low');
  });

  it('prunes high tier import when no high device has required capability', () => {
    const boundaries = [
      makeBoundary({
        requires: ['dolby-vision'],
        capabilityFallbackImport: './StandardPlayer',
      }),
    ];
    const { boundaries: result, pruneInfo } = applyCapabilityPruning(boundaries, platformTierMap);

    expect(result[0].highImport).toBe('./StandardPlayer');
    expect(result[0].lowImport).toBe('./DolbyPlayer.low');
    expect(pruneInfo.size).toBe(1);
  });

  it('replaces pruned import with capabilityFallbackImport when available', () => {
    const boundaries = [
      makeBoundary({
        requires: ['dolby-vision'],
        capabilityFallbackImport: './StandardPlayer',
      }),
    ];
    const { boundaries: result } = applyCapabilityPruning(boundaries, platformTierMap);

    expect(result[0].highImport).toBe('./StandardPlayer');
  });

  it('sets import to undefined when pruned and no fallback', () => {
    const boundaries = [makeBoundary({ requires: ['dolby-vision'] })];
    const { boundaries: result } = applyCapabilityPruning(boundaries, platformTierMap);

    expect(result[0].highImport).toBeUndefined();
  });

  it('does NOT prune when at least one device in tier has the capability', () => {
    const boundaries = [makeBoundary({ requires: ['dolby-vision'] })];
    const { boundaries: result } = applyCapabilityPruning(boundaries, platformTierMap);

    expect(result[0].lowImport).toBe('./DolbyPlayer.low');
  });

  it('handles multiple requires where all must be present in tier union', () => {
    // requires dolby-vision AND hdr10 — low tier has both (across sky-q and foxtel-iq4)
    // high tier has neither
    const boundaries = [makeBoundary({ requires: ['dolby-vision', 'hdr10'] })];
    const { boundaries: result } = applyCapabilityPruning(boundaries, platformTierMap);

    expect(result[0].lowImport).toBe('./DolbyPlayer.low');
    expect(result[0].highImport).toBeUndefined();
  });

  it('returns correct pruneInfo for pruned boundaries', () => {
    const boundaries = [
      makeBoundary({
        requires: ['dolby-vision'],
        capabilityFallbackImport: './StandardPlayer',
      }),
    ];
    const { pruneInfo } = applyCapabilityPruning(boundaries, platformTierMap);

    const entries = [...pruneInfo.values()][0];
    expect(entries).toHaveLength(1);
    expect(entries[0].tier).toBe('high');
    expect(entries[0].reason).toContain('dolby-vision');
  });
});
