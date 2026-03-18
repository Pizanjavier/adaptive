export { configure, getConfig, resetConfig } from './config.js';
export { getDeviceProfile, getTier, resetDetection } from './detect.js';
export { getCapabilities } from './capabilities.js';

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
  PlatformTierEntry,
} from './types.js';
