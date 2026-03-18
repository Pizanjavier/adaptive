export { adaptive } from './adaptive.js';
export { AdaptiveHigh, AdaptiveLow, AdaptiveMedium } from './inline.js';
export { useAdaptive, useDeviceProfile, useTier, useNetworkAware } from './composables.js';
export { AdaptiveProvider } from './context.js';

export type { UseAdaptiveResult, UseNetworkAwareResult } from './composables.js';
export { getCapabilities } from '@adaptive-bundle/core';
export type { DeviceProfile, Tier, EffectiveType } from '@adaptive-bundle/core';
