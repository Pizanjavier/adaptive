import { describe, it, expect } from 'vitest';
import { createPreloadHtmlTransform } from '../src/preload.js';
import type { BoundaryAnalysis, ResolvedConfig } from '../src/types.js';

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    analysisSizeThreshold: 50,
    report: true,
    reportFormat: 'console',
    reportDir: './adaptive-reports',
    preloadHints: true,
    ssrDefaultTier: 'low',
    sizeOverrides: {},
    devtools: false,
    ...overrides,
  };
}

function makeAnalysis(highImport?: string): BoundaryAnalysis {
  return {
    boundary: {
      name: 'Test',
      filePath: 'test.tsx',
      line: 1,
      highImport,
    },
    highSize: 1000,
    lowSize: 100,
    mediumSize: 0,
    exclusiveHighDeps: [],
    exclusiveLowDeps: [],
    sharedDeps: [],
    savings: 900,
    savingsPercent: 90,
  };
}

describe('createPreloadHtmlTransform', () => {
  it('generates modulepreload links for high imports', () => {
    const analyses = [makeAnalysis('./DashboardFull')];
    const result = createPreloadHtmlTransform(analyses, makeConfig());

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      {
        tag: 'link',
        attrs: { rel: 'modulepreload', href: './DashboardFull' },
        injectTo: 'head',
      },
    ]);
  });

  it('returns empty when preloadHints is false', () => {
    const analyses = [makeAnalysis('./DashboardFull')];
    const result = createPreloadHtmlTransform(analyses, makeConfig({ preloadHints: false }));
    expect(result).toHaveLength(0);
  });

  it('handles multiple boundaries', () => {
    const analyses = [makeAnalysis('./A'), makeAnalysis('./B')];
    const result = createPreloadHtmlTransform(analyses, makeConfig());
    expect(result).toHaveLength(2);
  });

  it('skips boundaries without high import', () => {
    const analyses = [makeAnalysis(undefined)];
    const result = createPreloadHtmlTransform(analyses, makeConfig());
    expect(result).toHaveLength(0);
  });
});
