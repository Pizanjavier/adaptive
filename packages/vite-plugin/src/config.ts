import type { AdaptivePluginConfig, ResolvedConfig } from './types.js';

const DEFAULTS: ResolvedConfig = {
  analysisSizeThreshold: 1024,
  report: true,
  reportFormat: 'console',
  reportDir: './adaptive-reports',
  preloadHints: true,
  ssrDefaultTier: 'low',
  sizeOverrides: {},
  devtools: true,
};

export function normalizeConfig(userConfig: AdaptivePluginConfig = {}): ResolvedConfig {
  const config: ResolvedConfig = {
    ...DEFAULTS,
    ...userConfig,
    sizeOverrides: { ...DEFAULTS.sizeOverrides, ...userConfig.sizeOverrides },
  };

  if (config.analysisSizeThreshold < 0) {
    throw new Error('[adaptive] analysisSizeThreshold must be a positive number');
  }

  if (config.budget) {
    const { budget } = config;
    if (budget.maxLowTierBundle !== undefined && budget.maxLowTierBundle < 0) {
      throw new Error('[adaptive] budget.maxLowTierBundle must be positive');
    }
    if (budget.maxHighVariant !== undefined && budget.maxHighVariant < 0) {
      throw new Error('[adaptive] budget.maxHighVariant must be positive');
    }
    if (
      budget.minSavingsPercent !== undefined &&
      (budget.minSavingsPercent < 0 || budget.minSavingsPercent > 100)
    ) {
      throw new Error('[adaptive] budget.minSavingsPercent must be between 0 and 100');
    }
  }

  return config;
}
