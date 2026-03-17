import type { BoundaryAnalysis } from '../types.js';

type ManualChunksFn = (id: string, meta: unknown) => string | undefined | void;
type ManualChunksOption = Record<string, string[]> | ManualChunksFn | undefined;

function boundaryChunkName(boundaryName: string, tier: 'high' | 'low' | 'medium'): string {
  const safeName = boundaryName.replace(/[^a-zA-Z0-9]/g, '-');
  return `adaptive-${safeName}-${tier}`;
}

function buildExclusiveMap(analyses: BoundaryAnalysis[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const analysis of analyses) {
    const name = analysis.boundary.name;

    for (const dep of analysis.exclusiveHighDeps) {
      map.set(dep.id, boundaryChunkName(name, 'high'));
    }

    for (const dep of analysis.exclusiveLowDeps) {
      map.set(dep.id, boundaryChunkName(name, 'low'));
    }
  }

  return map;
}

function wrapExistingFn(
  existing: ManualChunksFn,
  exclusiveMap: Map<string, string>,
): ManualChunksFn {
  return (id: string, meta: unknown): string | undefined | void => {
    const userResult = existing(id, meta);
    if (userResult) return userResult;
    return exclusiveMap.get(id);
  };
}

function wrapExistingObject(
  existing: Record<string, string[]>,
  exclusiveMap: Map<string, string>,
): ManualChunksFn {
  const objectMap = new Map<string, string>();
  for (const [chunkName, ids] of Object.entries(existing)) {
    for (const id of ids) {
      objectMap.set(id, chunkName);
    }
  }

  return (id: string): string | undefined | void => {
    const userResult = objectMap.get(id);
    if (userResult) return userResult;
    return exclusiveMap.get(id);
  };
}

export function createManualChunks(
  analyses: BoundaryAnalysis[],
  existing?: ManualChunksOption,
): ManualChunksFn {
  const exclusiveMap = buildExclusiveMap(analyses);

  if (!existing) {
    return (id: string): string | undefined | void => exclusiveMap.get(id);
  }

  if (typeof existing === 'function') {
    return wrapExistingFn(existing, exclusiveMap);
  }

  return wrapExistingObject(existing, exclusiveMap);
}

export { boundaryChunkName };
