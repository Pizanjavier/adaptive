import type { Tier, AdaptiveConfig } from './types.js';

let forcedTier: Tier | null = null;

export function setForcedTier(tier: Tier): void {
  forcedTier = tier;
}

export function clearForcedTier(): void {
  forcedTier = null;
}

export function getForcedTier(config: AdaptiveConfig): Tier | null {
  if (forcedTier) return forcedTier;

  if (typeof window !== 'undefined' && typeof URL !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const param = url.searchParams.get(config.forceTierParam);
      if (param === 'high' || param === 'low' || param === 'medium') {
        return param;
      }
    } catch {
      // URL parsing may fail
    }
  }

  return null;
}
