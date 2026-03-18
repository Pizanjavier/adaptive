import {
  normalizeConfig,
  scanAllModules,
  analyzeBoundaries,
  findOpportunities,
  generateReports,
  checkBudgets,
} from '@adaptive-bundle/vite-plugin';
import type { BoundaryAnalysis, Opportunity } from '@adaptive-bundle/vite-plugin';
import type { NextAdaptiveConfig, WebpackCompiler, WebpackCompilation } from '../types.js';
import { createModuleGraphAdapter } from './module-graph-adapter.js';
import { buildCacheGroups } from './split-chunks.js';

export class AdaptiveWebpackPlugin {
  private readonly userConfig: NextAdaptiveConfig;

  constructor(config: NextAdaptiveConfig = {}) {
    this.userConfig = config;
  }

  apply(compiler: WebpackCompiler): void {
    const config = normalizeConfig(this.userConfig);
    let analyses: BoundaryAnalysis[] = [];
    let opportunities: Opportunity[] = [];

    compiler.hooks.thisCompilation.tap('AdaptiveWebpackPlugin', (compilation: unknown) => {
      const comp = compilation as WebpackCompilation & {
        hooks: {
          afterOptimizeModules: {
            tap(name: string, cb: () => void): void;
          };
        };
      };

      comp.hooks.afterOptimizeModules.tap('AdaptiveWebpackPlugin', () => {
        const graph = createModuleGraphAdapter(comp);
        const boundaries = scanAllModules(graph);
        analyses = analyzeBoundaries(boundaries, graph, config.sizeOverrides);
        opportunities = findOpportunities(graph, boundaries, config);

        const cacheGroups = buildCacheGroups(analyses);
        const webpackConfig = (
          compiler as unknown as {
            options: { optimization: { splitChunks: { cacheGroups: Record<string, unknown> } } };
          }
        ).options;
        if (webpackConfig?.optimization?.splitChunks) {
          webpackConfig.optimization.splitChunks.cacheGroups = {
            ...webpackConfig.optimization.splitChunks.cacheGroups,
            ...cacheGroups,
          };
        }
      });
    });

    compiler.hooks.done.tap('AdaptiveWebpackPlugin', () => {
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
    });
  }
}
