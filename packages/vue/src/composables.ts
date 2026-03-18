import { inject } from 'vue';
import {
  getDeviceProfile,
  type DeviceProfile,
  type Tier,
  type EffectiveType,
} from '@adaptive-bundle/core';
import { ADAPTIVE_KEY } from './context.js';

function resolveProfile(): DeviceProfile {
  const injected = inject(ADAPTIVE_KEY, null);
  return injected ?? getDeviceProfile();
}

export interface UseAdaptiveResult {
  tier: Tier;
  shouldDefer: boolean;
  effectiveType: EffectiveType | null;
  profile: DeviceProfile;
}

export function useAdaptive(): UseAdaptiveResult {
  const profile = resolveProfile();
  const effectiveType = profile.network.effectiveType;
  const shouldDefer = effectiveType === '2g' || effectiveType === 'slow-2g';
  return { tier: profile.tier, shouldDefer, effectiveType, profile };
}

export function useDeviceProfile(): DeviceProfile {
  return resolveProfile();
}

export function useTier(): Tier {
  return resolveProfile().tier;
}

export interface UseNetworkAwareResult {
  shouldDefer: boolean;
  effectiveType: EffectiveType | null;
}

export function useNetworkAware(): UseNetworkAwareResult {
  const profile = resolveProfile();
  const effectiveType = profile.network.effectiveType;
  const shouldDefer = effectiveType === '2g' || effectiveType === 'slow-2g';
  return { shouldDefer, effectiveType };
}
