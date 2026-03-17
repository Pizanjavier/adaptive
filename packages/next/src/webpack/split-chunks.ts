import type { BoundaryAnalysis } from '@adaptive/vite-plugin';
import type { CacheGroupConfig } from '../types.js';

export function buildCacheGroups(analyses: BoundaryAnalysis[]): Record<string, CacheGroupConfig> {
  const groups: Record<string, CacheGroupConfig> = {};

  for (const analysis of analyses) {
    const { boundary, exclusiveHighDeps, exclusiveLowDeps } = analysis;
    const baseName = sanitizeName(boundary.name);

    if (exclusiveHighDeps.length > 0) {
      const ids = exclusiveHighDeps.map((d: { id: string }) => d.id);
      const pattern = buildTestPattern(ids);
      groups[`adaptive-${baseName}-high`] = {
        name: `adaptive-${baseName}-high`,
        test: pattern,
        chunks: 'all',
        enforce: true,
        priority: 20,
      };
    }

    if (exclusiveLowDeps.length > 0) {
      const ids = exclusiveLowDeps.map((d: { id: string }) => d.id);
      const pattern = buildTestPattern(ids);
      groups[`adaptive-${baseName}-low`] = {
        name: `adaptive-${baseName}-low`,
        test: pattern,
        chunks: 'all',
        enforce: true,
        priority: 20,
      };
    }
  }

  return groups;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

function buildTestPattern(moduleIds: string[]): RegExp {
  const escaped = moduleIds.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escaped.join('|')})`);
}
