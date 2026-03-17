import { describe, it, expect } from 'vitest';
import { transformForTargetTier } from '../src/target-tier.js';
import type { ResolvedConfig } from '../src/types.js';

function makeConfig(targetTier?: 'high' | 'low'): ResolvedConfig {
  return {
    analysisSizeThreshold: 50,
    report: true,
    reportFormat: 'console',
    reportDir: './adaptive-reports',
    preloadHints: true,
    ssrDefaultTier: 'low',
    sizeOverrides: {},
    targetTier,
  };
}

describe('transformForTargetTier', () => {
  it('returns null when no targetTier configured', () => {
    const source = `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`;
    const result = transformForTargetTier(source, 'test.tsx', makeConfig());
    expect(result).toBeNull();
  });

  it('returns null for files without adaptive calls', () => {
    const source = `export const foo = 42;`;
    const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'));
    expect(result).toBeNull();
  });

  it('replaces adaptive() with high import when targetTier is high', () => {
    const source = `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`;
    const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'));
    expect(result).not.toBeNull();
    expect(result).toContain("import('./A')");
    expect(result).not.toContain('adaptive({');
  });

  it('replaces adaptive() with low import when targetTier is low', () => {
    const source = `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`;
    const result = transformForTargetTier(source, 'test.tsx', makeConfig('low'));
    expect(result).not.toBeNull();
    expect(result).toContain("import('./B')");
    expect(result).not.toContain('adaptive({');
  });

  it('handles component/lowFallback pattern with high tier', () => {
    const source = `const X = adaptive({ component: () => import('./Full'), lowFallback: () => import('./Lite') });`;
    const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'));
    expect(result).not.toBeNull();
    expect(result).toContain("import('./Full')");
  });

  it('handles component/lowFallback pattern with low tier', () => {
    const source = `const X = adaptive({ component: () => import('./Full'), lowFallback: () => import('./Lite') });`;
    const result = transformForTargetTier(source, 'test.tsx', makeConfig('low'));
    expect(result).not.toBeNull();
    expect(result).toContain("import('./Lite')");
  });
});
