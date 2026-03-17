import type { AdaptiveConfig } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';

let currentConfig: AdaptiveConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the detection engine with custom settings.
 * @example
 * ```ts
 * configure({ threshold: 0.6, cacheTTL: 60_000 });
 * ```
 */
export function configure(overrides: Partial<AdaptiveConfig>): void {
  currentConfig = {
    ...DEFAULT_CONFIG,
    ...overrides,
    weights: {
      ...DEFAULT_CONFIG.weights,
      ...overrides.weights,
    },
    hysteresis: {
      ...DEFAULT_CONFIG.hysteresis,
      ...overrides.hysteresis,
    },
    thresholdsWithMedium: {
      ...DEFAULT_CONFIG.thresholdsWithMedium,
      ...overrides.thresholdsWithMedium,
    },
    probeProviders: {
      ...DEFAULT_CONFIG.probeProviders,
      ...overrides.probeProviders,
    },
    deviceMap: {
      ...DEFAULT_CONFIG.deviceMap,
      ...overrides.deviceMap,
    },
  };
}

export function getConfig(): AdaptiveConfig {
  return currentConfig;
}

export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}
