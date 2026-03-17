import type { AdaptiveBoundary, BoundaryAnalysis, ModuleGraph } from '../types.js';
import { scanSource } from './scanner.js';
import { analyzeBoundary } from './dependencies.js';

export function scanAllModules(graph: ModuleGraph): AdaptiveBoundary[] {
  const boundaries: AdaptiveBoundary[] = [];

  for (const id of graph.getModuleIds()) {
    const info = graph.getModuleInfo(id);
    if (!info?.code) continue;
    if (id.includes('node_modules')) continue;

    const found = scanSource(info.code, id);
    boundaries.push(...found);
  }

  return boundaries;
}

export function analyzeBoundaries(
  boundaries: AdaptiveBoundary[],
  graph: ModuleGraph,
  sizeOverrides: Record<string, number> = {},
): BoundaryAnalysis[] {
  const allModuleIds = new Set(graph.getModuleIds());

  return boundaries.map((boundary) =>
    analyzeBoundary(boundary, graph, allModuleIds, sizeOverrides),
  );
}

export { scanSource } from './scanner.js';
export { analyzeBoundary } from './dependencies.js';
export { findOpportunities } from './opportunities.js';
export type { Opportunity } from './opportunities.js';
