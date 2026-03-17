import type { BoundaryAnalysis, ResolvedConfig } from './types.js';
import type { IndexHtmlTransformResult } from 'vite';

function generatePreloadTags(analyses: BoundaryAnalysis[], config: ResolvedConfig): string[] {
  if (!config.preloadHints) return [];

  const tags: string[] = [];

  for (const analysis of analyses) {
    const highRoot = analysis.boundary.highImport ?? analysis.boundary.componentImport;
    if (highRoot) {
      tags.push(highRoot);
    }
  }

  return tags;
}

export function createPreloadHtmlTransform(
  analyses: BoundaryAnalysis[],
  config: ResolvedConfig,
): IndexHtmlTransformResult {
  const paths = generatePreloadTags(analyses, config);

  if (paths.length === 0) return [];

  return paths.map((href) => ({
    tag: 'link',
    attrs: {
      rel: 'modulepreload',
      href,
    },
    injectTo: 'head' as const,
  }));
}
