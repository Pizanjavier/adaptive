import type { AdaptiveBoundary, ModuleGraph, ResolvedConfig } from '../types.js';

export interface Opportunity {
  moduleId: string;
  moduleName: string;
  size: number;
  importedBy: string[];
  potentialSavings: number;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

const FRAMEWORK_PATTERNS = [
  'react',
  'react-dom',
  'vue',
  'svelte',
  'scheduler',
  'jsx-runtime',
  'jsx-dev-runtime',
  'commonjsHelpers',
];

const VITE_INTERNALS = [
  'preload-helper',
  'modulepreload-polyfill',
  'vite/client',
  'vite/modulepreload',
  '__vite',
];

function shortName(id: string): string {
  return (
    id
      .split('/')
      .pop()
      ?.replace(/\?\S+$/, '') ?? id
  );
}

function isInternalModule(id: string): boolean {
  const name = shortName(id).toLowerCase();
  return (
    FRAMEWORK_PATTERNS.some((p) => name.includes(p)) ||
    VITE_INTERNALS.some((p) => id.toLowerCase().includes(p))
  );
}

function buildImporterMap(graph: ModuleGraph): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const id of graph.getModuleIds()) {
    const info = graph.getModuleInfo(id);
    if (!info) continue;
    for (const dep of info.importedIds) {
      const importers = map.get(dep) ?? [];
      importers.push(id);
      map.set(dep, importers);
    }
  }
  return map;
}

function moduleSize(id: string, graph: ModuleGraph): number {
  const info = graph.getModuleInfo(id);
  return info?.code?.length ?? 0;
}

function isCoveredByBoundary(moduleId: string, boundaries: AdaptiveBoundary[]): boolean {
  const name = shortName(moduleId);
  return boundaries.some((b) => {
    const match = (s?: string) => s && shortName(s) === name;
    return (
      match(b.highImport) ||
      match(b.lowImport) ||
      match(b.componentImport) ||
      match(b.mediumImport) ||
      b.filePath === moduleId
    );
  });
}

function classifyImpact(size: number): 'high' | 'medium' | 'low' {
  const kb = size / 1024;
  if (kb >= 50) return 'high';
  if (kb >= 20) return 'medium';
  return 'low';
}

function generateSuggestion(id: string, importerCount: number): string {
  const name = shortName(id);

  if (id.includes('node_modules')) {
    return `Large dependency "${name}" — consider lazy-loading or a lighter alternative`;
  }
  if (importerCount === 1) {
    return `Wrap in adaptive({ component: () => import('./${name}'), lowFallback: <Fallback /> })`;
  }
  return `Consider splitting "${name}" into high/low variants with adaptive()`;
}

export function findOpportunities(
  graph: ModuleGraph,
  boundaries: AdaptiveBoundary[],
  config: ResolvedConfig,
): Opportunity[] {
  const threshold = config.analysisSizeThreshold;
  const importerMap = buildImporterMap(graph);
  const opportunities: Opportunity[] = [];
  const seenNames = new Set<string>();

  for (const id of graph.getModuleIds()) {
    const info = graph.getModuleInfo(id);
    if (!info?.code) continue;
    if (isInternalModule(id)) continue;
    if (isCoveredByBoundary(id, boundaries)) continue;

    const size = moduleSize(id, graph);
    if (size < threshold) continue;

    const name = shortName(id);
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    const importers = importerMap.get(id) ?? [];
    const importedBy = importers.filter((imp) => !imp.includes('node_modules')).map(shortName);

    if (importedBy.length === 0 && !id.includes('node_modules')) continue;

    opportunities.push({
      moduleId: id,
      moduleName: name,
      size,
      importedBy,
      potentialSavings: size,
      suggestion: generateSuggestion(id, importedBy.length),
      impact: classifyImpact(size),
    });
  }

  return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 10);
}
