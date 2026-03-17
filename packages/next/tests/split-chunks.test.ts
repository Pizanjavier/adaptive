import { describe, it, expect } from 'vitest';
import { buildCacheGroups } from '../src/webpack/split-chunks.js';
import type { BoundaryAnalysis } from '@adaptive/vite-plugin';

function createAnalysis(overrides: Partial<BoundaryAnalysis> = {}): BoundaryAnalysis {
  return {
    boundary: {
      name: 'Dashboard',
      filePath: '/app/src/Dashboard.tsx',
      line: 1,
      highImport: './DashboardHigh',
      lowImport: './DashboardLow',
    },
    highSize: 5000,
    lowSize: 2000,
    mediumSize: 0,
    exclusiveHighDeps: [],
    exclusiveLowDeps: [],
    sharedDeps: [],
    savings: 3000,
    savingsPercent: 60,
    ...overrides,
  };
}

describe('buildCacheGroups', () => {
  it('returns empty groups for no analyses', () => {
    expect(buildCacheGroups([])).toEqual({});
  });

  it('returns empty groups when no exclusive deps', () => {
    const groups = buildCacheGroups([createAnalysis()]);
    expect(Object.keys(groups)).toHaveLength(0);
  });

  it('creates cache group for exclusive high deps', () => {
    const analysis = createAnalysis({
      exclusiveHighDeps: [
        { id: '/app/src/HeavyChart.tsx', size: 3000 },
        { id: '/app/src/ChartUtils.ts', size: 1000 },
      ],
    });

    const groups = buildCacheGroups([analysis]);
    expect(groups['adaptive-dashboard-high']).toBeDefined();
    expect(groups['adaptive-dashboard-high'].name).toBe('adaptive-dashboard-high');
    expect(groups['adaptive-dashboard-high'].chunks).toBe('all');
    expect(groups['adaptive-dashboard-high'].enforce).toBe(true);
    expect(groups['adaptive-dashboard-high'].test).toBeInstanceOf(RegExp);
  });

  it('creates cache group for exclusive low deps', () => {
    const analysis = createAnalysis({
      exclusiveLowDeps: [{ id: '/app/src/LightChart.tsx', size: 800 }],
    });

    const groups = buildCacheGroups([analysis]);
    expect(groups['adaptive-dashboard-low']).toBeDefined();
  });

  it('creates both high and low groups', () => {
    const analysis = createAnalysis({
      exclusiveHighDeps: [{ id: '/app/src/Heavy.tsx', size: 3000 }],
      exclusiveLowDeps: [{ id: '/app/src/Light.tsx', size: 800 }],
    });

    const groups = buildCacheGroups([analysis]);
    expect(Object.keys(groups)).toHaveLength(2);
    expect(groups['adaptive-dashboard-high']).toBeDefined();
    expect(groups['adaptive-dashboard-low']).toBeDefined();
  });

  it('handles multiple boundaries', () => {
    const analyses = [
      createAnalysis({
        boundary: { name: 'Chart', filePath: '/a', line: 1 },
        exclusiveHighDeps: [{ id: '/chart-heavy', size: 5000 }],
      }),
      createAnalysis({
        boundary: { name: 'Map', filePath: '/b', line: 1 },
        exclusiveHighDeps: [{ id: '/map-heavy', size: 4000 }],
      }),
    ];

    const groups = buildCacheGroups(analyses);
    expect(groups['adaptive-chart-high']).toBeDefined();
    expect(groups['adaptive-map-high']).toBeDefined();
  });

  it('test pattern matches module ids', () => {
    const analysis = createAnalysis({
      exclusiveHighDeps: [{ id: '/app/src/HeavyChart.tsx', size: 3000 }],
    });

    const groups = buildCacheGroups([analysis]);
    const pattern = groups['adaptive-dashboard-high'].test;
    expect(pattern.test('/app/src/HeavyChart.tsx')).toBe(true);
    expect(pattern.test('/app/src/Other.tsx')).toBe(false);
  });
});
