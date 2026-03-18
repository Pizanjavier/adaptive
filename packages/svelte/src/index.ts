export { adaptive } from './adaptive.js';
export { setAdaptiveContext, getAdaptiveContext } from './context.js';
export {
  createAdaptiveStore,
  createTierStore,
  createDeviceProfileStore,
  createNetworkAwareStore,
  adaptiveStore,
  tierStore,
  deviceProfileStore,
  networkAwareStore,
} from './stores.js';

export type { AdaptiveStoreValue, NetworkAwareStoreValue } from './stores.js';
export { getCapabilities } from '@adaptive-bundle/core';
export type { DeviceProfile, Tier, EffectiveType } from '@adaptive-bundle/core';
