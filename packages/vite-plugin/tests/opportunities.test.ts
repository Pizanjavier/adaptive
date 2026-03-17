import { describe, it, expect } from 'vitest';
import { findOpportunities } from '../src/analysis/opportunities.js';
import type { AdaptiveBoundary, ModuleGraph, ModuleInfo, ResolvedConfig } from '../src/types.js';

function createGraph(modules: Record<string, { code: string; imports: string[] }>): ModuleGraph {
  return {
    getModuleInfo(id: string): ModuleInfo | null {
      const mod = modules[id];
      if (!mod) return null;
      return { id, code: mod.code, importedIds: mod.imports };
    },
    getModuleIds(): IterableIterator<string> {
      return Object.keys(modules)[Symbol.iterator]();
    },
  };
}

const baseConfig: ResolvedConfig = {
  analysisSizeThreshold: 1024,
  report: true,
  reportFormat: 'console',
  reportDir: './reports',
  preloadHints: false,
  ssrDefaultTier: 'low',
  sizeOverrides: {},
};

describe('findOpportunities', () => {
  it('detects heavy modules above threshold', () => {
    const graph = createGraph({
      './App.tsx': { code: 'x'.repeat(100), imports: ['./Heavy'] },
      './Heavy': { code: 'x'.repeat(5000), imports: [] },
    });

    const result = findOpportunities(graph, [], baseConfig);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].moduleName).toBe('Heavy');
    expect(result[0].size).toBeGreaterThanOrEqual(5000);
  });

  it('excludes modules covered by existing boundaries', () => {
    const graph = createGraph({
      './App.tsx': { code: 'x'.repeat(100), imports: ['./Heavy'] },
      './Heavy': { code: 'x'.repeat(5000), imports: [] },
    });

    const boundaries: AdaptiveBoundary[] = [
      { name: 'test', filePath: 'App.tsx', line: 1, highImport: './Heavy' },
    ];

    const result = findOpportunities(graph, boundaries, baseConfig);
    const heavy = result.find((o) => o.moduleName === 'Heavy');
    expect(heavy).toBeUndefined();
  });

  it('ranks by potential savings descending', () => {
    const graph = createGraph({
      './App.tsx': { code: 'x'.repeat(100), imports: ['./Small', './Large'] },
      './Small': { code: 'x'.repeat(2000), imports: [] },
      './Large': { code: 'x'.repeat(8000), imports: [] },
    });

    const result = findOpportunities(graph, [], baseConfig);
    expect(result.length).toBe(2);
    expect(result[0].moduleName).toBe('Large');
    expect(result[1].moduleName).toBe('Small');
  });

  it('filters modules below threshold', () => {
    const graph = createGraph({
      './App.tsx': { code: 'x'.repeat(100), imports: ['./Tiny'] },
      './Tiny': { code: 'x'.repeat(500), imports: [] },
    });

    const result = findOpportunities(graph, [], baseConfig);
    expect(result).toHaveLength(0);
  });

  it('classifies impact correctly', () => {
    const graph = createGraph({
      './App.tsx': { code: 'x'.repeat(100), imports: ['./Med', './Big'] },
      './Med': { code: 'x'.repeat(25_000), imports: [] },
      './Big': { code: 'x'.repeat(60_000), imports: [] },
    });

    const result = findOpportunities(graph, [], baseConfig);
    const big = result.find((o) => o.moduleName === 'Big');
    const med = result.find((o) => o.moduleName === 'Med');
    expect(big?.impact).toBe('high');
    expect(med?.impact).toBe('medium');
  });

  it('limits results to top 10', () => {
    const modules: Record<string, { code: string; imports: string[] }> = {
      './App.tsx': { code: 'x'.repeat(100), imports: [] },
    };
    for (let i = 0; i < 15; i++) {
      const id = `./Mod${i}`;
      modules['./App.tsx'].imports.push(id);
      modules[id] = { code: 'x'.repeat(2000 + i * 100), imports: [] };
    }
    const graph = createGraph(modules);
    const result = findOpportunities(graph, [], baseConfig);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
