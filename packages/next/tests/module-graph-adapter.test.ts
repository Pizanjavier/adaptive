import { describe, it, expect } from 'vitest';
import { createModuleGraphAdapter } from '../src/webpack/module-graph-adapter.js';
import type { WebpackCompilation, WebpackModule } from '../src/types.js';

function createMockCompilation(modules: WebpackModule[]): WebpackCompilation {
  return { modules: new Set(modules) };
}

describe('createModuleGraphAdapter', () => {
  it('creates adapter from empty compilation', () => {
    const compilation = createMockCompilation([]);
    const graph = createModuleGraphAdapter(compilation);

    expect([...graph.getModuleIds()]).toEqual([]);
  });

  it('maps webpack modules to module graph', () => {
    const modules: WebpackModule[] = [
      {
        resource: '/app/src/App.tsx',
        _source: { source: () => 'import React from "react"' },
        dependencies: [],
      },
      {
        resource: '/app/src/utils.ts',
        _source: { source: () => 'export const foo = 1' },
        dependencies: [],
      },
    ];

    const graph = createModuleGraphAdapter(createMockCompilation(modules));
    const ids = [...graph.getModuleIds()];

    expect(ids).toContain('/app/src/App.tsx');
    expect(ids).toContain('/app/src/utils.ts');
  });

  it('returns module info with code and imports', () => {
    const utilsModule: WebpackModule = {
      resource: '/app/src/utils.ts',
      _source: { source: () => 'export const foo = 1' },
      dependencies: [],
    };

    const appModule: WebpackModule = {
      resource: '/app/src/App.tsx',
      _source: { source: () => 'import { foo } from "./utils"' },
      dependencies: [{ request: './utils', module: utilsModule }],
    };

    const graph = createModuleGraphAdapter(createMockCompilation([appModule, utilsModule]));

    const info = graph.getModuleInfo('/app/src/App.tsx');
    expect(info).not.toBeNull();
    expect(info!.id).toBe('/app/src/App.tsx');
    expect(info!.code).toBe('import { foo } from "./utils"');
    expect(info!.importedIds).toContain('/app/src/utils.ts');
  });

  it('returns null for unknown module', () => {
    const graph = createModuleGraphAdapter(createMockCompilation([]));
    expect(graph.getModuleInfo('/nonexistent')).toBeNull();
  });

  it('skips modules without resource', () => {
    const modules: WebpackModule[] = [
      { _source: { source: () => 'virtual module' } },
      { resource: '/app/src/real.ts', _source: { source: () => 'code' } },
    ];

    const graph = createModuleGraphAdapter(createMockCompilation(modules));
    expect([...graph.getModuleIds()]).toEqual(['/app/src/real.ts']);
  });

  it('handles modules without _source', () => {
    const modules: WebpackModule[] = [{ resource: '/app/src/binary.wasm' }];

    const graph = createModuleGraphAdapter(createMockCompilation(modules));
    const info = graph.getModuleInfo('/app/src/binary.wasm');

    expect(info).not.toBeNull();
    expect(info!.code).toBeNull();
  });
});
