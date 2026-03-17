export { configure, getConfig, resetConfig } from './config.js';
export { getDeviceProfile, getTier, resetDetection } from './detect.js';

export type {
  DeviceProfile,
  ProbeValues,
  NetworkInfo,
  Tier,
  AdaptiveConfig,
  ProbeProvider,
  WeightConfig,
  ScreenCategory,
  GpuTier,
  EffectiveType,
  CacheEntry,
  FastPathResult,
  NormalizedProbe,
  ProbeResult,
} from './types.js';
