import { readable, type Readable } from 'svelte/store';
import {
  getDeviceProfile,
  type DeviceProfile,
  type Tier,
  type EffectiveType,
} from '@adaptive/core';

export interface AdaptiveStoreValue {
  tier: Tier;
  shouldDefer: boolean;
  effectiveType: EffectiveType | null;
  profile: DeviceProfile;
}

export interface NetworkAwareStoreValue {
  shouldDefer: boolean;
  effectiveType: EffectiveType | null;
}

export function createAdaptiveStore(): Readable<AdaptiveStoreValue> {
  return readable<AdaptiveStoreValue>(undefined!, (set) => {
    const profile = getDeviceProfile();
    const effectiveType = profile.network.effectiveType;
    const shouldDefer = effectiveType === '2g' || effectiveType === 'slow-2g';
    set({ tier: profile.tier, shouldDefer, effectiveType, profile });
  });
}

export function createTierStore(): Readable<Tier> {
  return readable<Tier>(undefined!, (set) => {
    set(getDeviceProfile().tier);
  });
}

export function createDeviceProfileStore(): Readable<DeviceProfile> {
  return readable<DeviceProfile>(undefined!, (set) => {
    set(getDeviceProfile());
  });
}

export function createNetworkAwareStore(): Readable<NetworkAwareStoreValue> {
  return readable<NetworkAwareStoreValue>(undefined!, (set) => {
    const profile = getDeviceProfile();
    const effectiveType = profile.network.effectiveType;
    const shouldDefer = effectiveType === '2g' || effectiveType === 'slow-2g';
    set({ shouldDefer, effectiveType });
  });
}

export const adaptiveStore: Readable<AdaptiveStoreValue> = createAdaptiveStore();
export const tierStore: Readable<Tier> = createTierStore();
export const deviceProfileStore: Readable<DeviceProfile> = createDeviceProfileStore();
export const networkAwareStore: Readable<NetworkAwareStoreValue> = createNetworkAwareStore();
