import { describe, it, expect } from 'vitest';
import { analyzeBoundary } from '../src/analysis/dependencies.js';
import type { AdaptiveBoundary, ModuleGraph, ModuleInfo } from '../src/types.js';

function createMockGraph(modules: Record<string, { code: string; imports: string[] }>): {
  graph: ModuleGraph;
  moduleIds: Set<string>;
} {
  const moduleIds = new Set(Object.keys(modules));
  return {
    moduleIds,
    graph: {
      getModuleInfo(id: string): ModuleInfo | null {
        const mod = modules[id];
        if (!mod) return null;
        return { id, code: mod.code, importedIds: mod.imports };
      },
      getModuleIds(): IterableIterator<string> {
        return moduleIds.values();
      },
    },
  };
}

describe('analyzeBoundary', () => {
  it('identifies exclusive high deps', () => {
    const { graph, moduleIds } = createMockGraph({
      './High': { code: 'x'.repeat(1000), imports: ['./heavy-lib'] },
      './heavy-lib': { code: 'x'.repeat(5000), imports: [] },
      './Low': { code: 'x'.repeat(100), imports: [] },
    });

    const boundary: AdaptiveBoundary = {
      name: 'Test',
      filePath: 'test.tsx',
      line: 1,
      highImport: './High',
      lowImport: './Low',
    };

    const result = analyzeBoundary(boundary, graph, moduleIds, {});
    expect(result.exclusiveHighDeps).toHaveLength(2);
    expect(result.exclusiveLowDeps).toHaveLength(1);
    expect(result.highSize).toBeGreaterThan(0);
  });

  it('identifies shared deps', () => {
    const { graph, moduleIds } = createMockGraph({
      './High': { code: 'x'.repeat(100), imports: ['./shared'] },
      './Low': { code: 'x'.repeat(100), imports: ['./shared'] },
      './shared': { code: 'x'.repeat(500), imports: [] },
    });

    const boundary: AdaptiveBoundary = {
      name: 'Test',
      filePath: 'test.tsx',
      line: 1,
      highImport: './High',
      lowImport: './Low',
    };

    const result = analyzeBoundary(boundary, graph, moduleIds, {});
    expect(result.sharedDeps).toHaveLength(1);
    expect(result.sharedDeps[0].id).toBe('./shared');
  });

  it('uses sizeOverrides', () => {
    const { graph, moduleIds } = createMockGraph({
      './High': { code: 'x'.repeat(100), imports: ['mapbox-gl/dist/index'] },
      'mapbox-gl/dist/index': { code: 'x'.repeat(10), imports: [] },
      './Low': { code: 'x'.repeat(50), imports: [] },
    });

    const boundary: AdaptiveBoundary = {
      name: 'Test',
      filePath: 'test.tsx',
      line: 1,
      highImport: './High',
      lowImport: './Low',
    };

    const result = analyzeBoundary(boundary, graph, moduleIds, {
      'mapbox-gl': 200,
    });

    const mapboxDep = result.exclusiveHighDeps.find((d) => d.id.includes('mapbox-gl'));
    expect(mapboxDep?.size).toBe(200 * 1024);
  });

  it('calculates savings correctly', () => {
    const { graph, moduleIds } = createMockGraph({
      './High': { code: 'x'.repeat(1000), imports: [] },
      './Low': { code: 'x'.repeat(100), imports: [] },
    });

    const boundary: AdaptiveBoundary = {
      name: 'Test',
      filePath: 'test.tsx',
      line: 1,
      highImport: './High',
      lowImport: './Low',
    };

    const result = analyzeBoundary(boundary, graph, moduleIds, {});
    expect(result.savings).toBe(result.highSize);
    expect(result.savingsPercent).toBeGreaterThan(0);
  });
});
