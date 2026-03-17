import { useMemo } from 'react';
import {
  getDeviceProfile,
  type DeviceProfile,
  type Tier,
  type EffectiveType,
} from '@adaptive/core';
import { useAdaptiveContext } from './context.js';

function getProfile(ctx: DeviceProfile | null): DeviceProfile {
  return ctx ?? getDeviceProfile();
}

export interface UseAdaptiveResult {
  tier: Tier;
  shouldDefer: boolean;
  effectiveType: EffectiveType | null;
  profile: DeviceProfile;
}

/**
 * Hook returning tier, network info, and full device profile.
 * @example
 * ```tsx
 * const { tier, shouldDefer } = useAdaptive();
 * ```
 */
export function useAdaptive(): UseAdaptiveResult {
  const ctx = useAdaptiveContext();
  return useMemo(() => {
    const profile = getProfile(ctx);
    const effectiveType = profile.network.effectiveType;
    const shouldDefer = effectiveType === '2g' || effectiveType === 'slow-2g';
    return { tier: profile.tier, shouldDefer, effectiveType, profile };
  }, [ctx]);
}

/**
 * Hook returning the full device profile.
 * @example
 * ```tsx
 * const profile = useDeviceProfile();
 * ```
 */
export function useDeviceProfile(): DeviceProfile {
  const ctx = useAdaptiveContext();
  return useMemo(() => getProfile(ctx), [ctx]);
}

/**
 * Hook returning just the resolved tier.
 * @example
 * ```tsx
 * const tier = useTier(); // 'high' | 'low' | 'medium'
 * ```
 */
export function useTier(): Tier {
  const ctx = useAdaptiveContext();
  return useMemo(() => getProfile(ctx).tier, [ctx]);
}

export interface UseNetworkAwareResult {
  shouldDefer: boolean;
  effectiveType: EffectiveType | null;
}

/**
 * Hook returning network-aware loading hints.
 * @example
 * ```tsx
 * const { shouldDefer, effectiveType } = useNetworkAware();
 * ```
 */
export function useNetworkAware(): UseNetworkAwareResult {
  const ctx = useAdaptiveContext();
  return useMemo(() => {
    const profile = getProfile(ctx);
    const effectiveType = profile.network.effectiveType;
    const shouldDefer = effectiveType === '2g' || effectiveType === 'slow-2g';
    return { shouldDefer, effectiveType };
  }, [ctx]);
}
