import type { AdaptiveConfig } from './types.js';

export const DEFAULT_CONFIG: AdaptiveConfig = {
  weights: {
    cpuCores: 0.35,
    memory: 0.35,
    gpu: 0.15,
    screen: 0.1,
    touchPoints: 0.05,
  },
  threshold: 0.5,
  thresholdsWithMedium: { high: 0.65, low: 0.35 },
  hysteresis: { up: 0.12, down: 0.08 },
  cacheTTL: 7 * 24 * 60 * 60 * 1000,
  cacheKey: 'adaptive_device_tier',
  cacheStorage: 'localStorage',
  forceTierParam: 'adaptive_tier',
  probeProviders: {},
  deviceMap: {},
  platformTierMap: {},
  detectPlatform: null,
  configHash: '',
};
