import type { Plugin } from 'vite';
import type { AdaptivePluginConfig, BoundaryAnalysis } from './types.js';
import { normalizeConfig } from './config.js';
import { scanAllModules, analyzeBoundaries, findOpportunities } from './analysis/index.js';
import type { Opportunity } from './analysis/opportunities.js';
import { createManualChunks } from './chunks/index.js';
import { createPreloadHtmlTransform } from './preload.js';
import { transformForTargetTier } from './target-tier.js';
import { generateReports } from './reports/index.js';
import { checkBudgets } from './budget.js';
import { stripDevtoolsImport } from './strip-devtools.js';
import { createDevMiddleware } from './server/middleware.js';

/**
 * Vite plugin for device-aware bundle optimization.
 * @example
 * ```ts
 * // vite.config.ts
 * import { adaptive } from '@adaptive-bundle/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [adaptive({ report: true })],
 * });
 * ```
 */
export function adaptive(userConfig?: AdaptivePluginConfig): Plugin {
  const config = normalizeConfig(userConfig);
  let analyses: BoundaryAnalysis[] = [];
  let opportunities: Opportunity[] = [];
  let isBuild = false;

  return {
    name: 'adaptive',
    enforce: 'pre',

    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === 'build';
      if (isBuild) {
        const existing = resolvedConfig.build.rollupOptions?.output;
        if (existing && !Array.isArray(existing)) {
          const prev = existing.manualChunks;
          existing.manualChunks = (id, meta) => {
            const chunksFn = createManualChunks(
              analyses,
              prev as Parameters<typeof createManualChunks>[1],
            );
            return chunksFn(id, meta) ?? undefined;
          };
        }
      }
    },

    configureServer(server) {
      if (config.devtools) {
        server.middlewares.use(
          createDevMiddleware(
            { getAnalyses: () => analyses, getOpportunities: () => opportunities },
            server,
          ),
        );
      }
    },

    buildEnd() {
      const ctx = this as unknown as {
        getModuleInfo: (id: string) => unknown;
        getModuleIds: () => IterableIterator<string>;
      };
      const graph = {
        getModuleInfo: (id: string) => ctx.getModuleInfo(id),
        getModuleIds: () => ctx.getModuleIds(),
      };
      const boundaries = scanAllModules(graph as never);
      analyses = analyzeBoundaries(boundaries, graph as never, config.sizeOverrides);
      opportunities = findOpportunities(graph as never, boundaries, config);
    },

    transform(code, id) {
      if (id.includes('node_modules')) return null;
      if (isBuild) {
        const stripped = stripDevtoolsImport(code, id);
        if (stripped) return stripped;
      }
      return transformForTargetTier(code, id, config);
    },

    transformIndexHtml() {
      return createPreloadHtmlTransform(analyses, config);
    },

    closeBundle() {
      if (analyses.length === 0 && opportunities.length === 0) return;

      generateReports(analyses, config, opportunities);

      if (config.budget) {
        const result = checkBudgets(analyses, config.budget);
        if (!result.passed) {
          const header =
            config.budget.enforce === 'error'
              ? 'Adaptive Budget FAILED'
              : 'Adaptive Budget Warnings';
          const output = `\n${header}\n${'='.repeat(55)}\n${result.messages.join('\n')}\n${'='.repeat(55)}\n`;

          if (config.budget.enforce === 'error') {
            throw new Error(output);
          }
          process.stderr.write(output);
        }
      }
    },
  };
}

export type {
  AdaptivePluginConfig,
  BoundaryAnalysis,
  AdaptiveBoundary,
  BudgetConfig,
  ResolvedConfig,
  ModuleGraph,
  ModuleInfo,
} from './types.js';

export { normalizeConfig } from './config.js';
export { scanSource } from './analysis/scanner.js';
export { scanAllModules, analyzeBoundaries } from './analysis/index.js';
export { findOpportunities } from './analysis/opportunities.js';
export type { Opportunity } from './analysis/opportunities.js';
export { createManualChunks } from './chunks/index.js';
export { generateReports } from './reports/index.js';
export { checkBudgets } from './budget.js';
