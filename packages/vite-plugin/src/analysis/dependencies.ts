import { dirname, resolve } from 'node:path';
import type { AdaptiveBoundary, BoundaryAnalysis, DependencyInfo, ModuleGraph } from '../types.js';

function resolveImportId(
  importPath: string,
  fromFile: string,
  allModuleIds: Set<string>,
): string | undefined {
  if (!importPath.startsWith('.')) return importPath;

  const dir = dirname(fromFile);
  const base = resolve(dir, importPath);
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];

  for (const ext of extensions) {
    const candidate = base + ext;
    if (allModuleIds.has(candidate)) return candidate;
  }

  for (const ext of extensions) {
    const candidate = base + '/index' + ext;
    if (allModuleIds.has(candidate)) return candidate;
  }

  if (allModuleIds.has(importPath)) return importPath;

  return undefined;
}

function collectDependencies(
  moduleId: string,
  graph: ModuleGraph,
  visited: Set<string> = new Set(),
): Set<string> {
  if (visited.has(moduleId)) return visited;
  visited.add(moduleId);

  const info = graph.getModuleInfo(moduleId);
  if (!info) return visited;

  for (const dep of info.importedIds) {
    collectDependencies(dep, graph, visited);
  }

  return visited;
}

function estimateModuleSize(
  moduleId: string,
  graph: ModuleGraph,
  sizeOverrides: Record<string, number>,
): number {
  for (const [name, size] of Object.entries(sizeOverrides)) {
    if (moduleId.includes(name)) return size * 1024;
  }
  const info = graph.getModuleInfo(moduleId);
  if (!info?.code) return 0;
  return info.code.length;
}

function toDependencyInfo(
  ids: Set<string>,
  graph: ModuleGraph,
  sizeOverrides: Record<string, number>,
): DependencyInfo[] {
  return Array.from(ids).map((id) => ({
    id,
    size: estimateModuleSize(id, graph, sizeOverrides),
  }));
}

export function analyzeBoundary(
  boundary: AdaptiveBoundary,
  graph: ModuleGraph,
  allModuleIds: Set<string>,
  sizeOverrides: Record<string, number> = {},
): BoundaryAnalysis {
  const highRaw = boundary.highImport ?? boundary.componentImport;
  const lowRaw = boundary.lowImport ?? boundary.lowFallbackImport;

  const highRoot = highRaw ? resolveImportId(highRaw, boundary.filePath, allModuleIds) : undefined;
  const lowRoot = lowRaw ? resolveImportId(lowRaw, boundary.filePath, allModuleIds) : undefined;

  const highDeps = highRoot ? collectDependencies(highRoot, graph) : new Set<string>();
  const lowDeps = lowRoot ? collectDependencies(lowRoot, graph) : new Set<string>();

  const exclusiveHigh = new Set<string>();
  const exclusiveLow = new Set<string>();
  const shared = new Set<string>();

  for (const dep of highDeps) {
    if (lowDeps.has(dep)) {
      shared.add(dep);
    } else {
      exclusiveHigh.add(dep);
    }
  }

  for (const dep of lowDeps) {
    if (!highDeps.has(dep)) {
      exclusiveLow.add(dep);
    }
  }

  const exclusiveHighInfo = toDependencyInfo(exclusiveHigh, graph, sizeOverrides);
  const exclusiveLowInfo = toDependencyInfo(exclusiveLow, graph, sizeOverrides);
  const sharedInfo = toDependencyInfo(shared, graph, sizeOverrides);

  const highSize = exclusiveHighInfo.reduce((sum, d) => sum + d.size, 0);
  const lowSize = exclusiveLowInfo.reduce((sum, d) => sum + d.size, 0);
  const mediumSize = 0;
  const savings = highSize;
  const total = highSize + lowSize + sharedInfo.reduce((s, d) => s + d.size, 0);
  const savingsPercent = total > 0 ? (savings / total) * 100 : 0;

  return {
    boundary,
    highSize,
    lowSize,
    mediumSize,
    exclusiveHighDeps: exclusiveHighInfo,
    exclusiveLowDeps: exclusiveLowInfo,
    sharedDeps: sharedInfo,
    savings,
    savingsPercent,
  };
}
