import type { AdaptiveBoundary, BoundaryAnalysis, ModuleGraph, PlatformEntry } from '../types.js';
import { scanSource } from './scanner.js';
import { analyzeBoundary } from './dependencies.js';
import { applyCapabilityPruning } from './capabilities.js';

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
  platformTierMap: Record<string, PlatformEntry> = {},
): BoundaryAnalysis[] {
  const { boundaries: pruned, pruneInfo } = applyCapabilityPruning(boundaries, platformTierMap);
  const allModuleIds = new Set(graph.getModuleIds());

  return pruned.map((boundary) => {
    const analysis = analyzeBoundary(boundary, graph, allModuleIds, sizeOverrides);
    const info = pruneInfo.get(boundary);
    if (info) analysis.pruned = info;
    return analysis;
  });
}

export { scanSource } from './scanner.js';
export { analyzeBoundary } from './dependencies.js';
export { findOpportunities } from './opportunities.js';
export type { Opportunity } from './opportunities.js';
export { applyCapabilityPruning, buildCapabilityMap } from './capabilities.js';
