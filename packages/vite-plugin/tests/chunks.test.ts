import { describe, it, expect } from 'vitest';
import { createManualChunks } from '../src/chunks/isolation.js';
import type { BoundaryAnalysis } from '../src/types.js';

function createAnalysis(
  name: string,
  exclusiveHighIds: string[],
  exclusiveLowIds: string[],
): BoundaryAnalysis {
  return {
    boundary: { name, filePath: 'test.tsx', line: 1 },
    highSize: 0,
    lowSize: 0,
    mediumSize: 0,
    exclusiveHighDeps: exclusiveHighIds.map((id) => ({ id, size: 100 })),
    exclusiveLowDeps: exclusiveLowIds.map((id) => ({ id, size: 100 })),
    sharedDeps: [],
    savings: 0,
    savingsPercent: 0,
  };
}

describe('createManualChunks', () => {
  it('assigns exclusive high deps to high chunk', () => {
    const analyses = [createAnalysis('Dashboard', ['mapbox-gl'], ['lite-map'])];
    const fn = createManualChunks(analyses);
    expect(fn('mapbox-gl', {})).toBe('adaptive-Dashboard-high');
  });

  it('assigns exclusive low deps to low chunk', () => {
    const analyses = [createAnalysis('Dashboard', ['mapbox-gl'], ['lite-map'])];
    const fn = createManualChunks(analyses);
    expect(fn('lite-map', {})).toBe('adaptive-Dashboard-low');
  });

  it('returns undefined for non-adaptive modules', () => {
    const analyses = [createAnalysis('Dashboard', ['mapbox-gl'], [])];
    const fn = createManualChunks(analyses);
    expect(fn('react', {})).toBeUndefined();
  });

  it('wraps existing function-based manualChunks', () => {
    const existing = (id: string) => {
      if (id === 'react') return 'vendor';
      return undefined;
    };
    const analyses = [createAnalysis('Dashboard', ['mapbox-gl'], [])];
    const fn = createManualChunks(analyses, existing);

    expect(fn('react', {})).toBe('vendor');
    expect(fn('mapbox-gl', {})).toBe('adaptive-Dashboard-high');
  });

  it('wraps existing object-based manualChunks', () => {
    const existing = { vendor: ['react', 'react-dom'] };
    const analyses = [createAnalysis('Dashboard', ['mapbox-gl'], [])];
    const fn = createManualChunks(analyses, existing);

    expect(fn('react', {})).toBe('vendor');
    expect(fn('mapbox-gl', {})).toBe('adaptive-Dashboard-high');
  });

  it('user-defined chunks take precedence', () => {
    const existing = (id: string) => {
      if (id === 'mapbox-gl') return 'my-maps';
      return undefined;
    };
    const analyses = [createAnalysis('Dashboard', ['mapbox-gl'], [])];
    const fn = createManualChunks(analyses, existing);

    expect(fn('mapbox-gl', {})).toBe('my-maps');
  });

  it('handles multiple boundaries', () => {
    const analyses = [
      createAnalysis('Dashboard', ['mapbox-gl'], ['lite-map']),
      createAnalysis('Editor', ['codemirror'], ['textarea']),
    ];
    const fn = createManualChunks(analyses);

    expect(fn('mapbox-gl', {})).toBe('adaptive-Dashboard-high');
    expect(fn('codemirror', {})).toBe('adaptive-Editor-high');
    expect(fn('textarea', {})).toBe('adaptive-Editor-low');
  });
});
