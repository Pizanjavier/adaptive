import type { ModuleGraph, ModuleInfo } from '@adaptive-bundle/vite-plugin';
import type { WebpackCompilation, WebpackModule } from '../types.js';

export function createModuleGraphAdapter(compilation: WebpackCompilation): ModuleGraph {
  const moduleMap = new Map<string, WebpackModule>();

  for (const mod of compilation.modules) {
    if (mod.resource) {
      moduleMap.set(mod.resource, mod);
    }
  }

  return {
    getModuleInfo(id: string): ModuleInfo | null {
      const mod = moduleMap.get(id);
      if (!mod) return null;

      const code = mod._source?.source() ?? null;
      const importedIds: string[] = [];

      if (mod.dependencies) {
        for (const dep of mod.dependencies) {
          if (dep.module?.resource) {
            importedIds.push(dep.module.resource);
          }
        }
      }

      return { id, code, importedIds };
    },

    getModuleIds(): IterableIterator<string> {
      return moduleMap.keys();
    },
  };
}
