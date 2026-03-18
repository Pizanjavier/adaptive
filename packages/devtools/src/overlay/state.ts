import { getDeviceProfile } from '@adaptive/core';
import type { Tier } from '@adaptive/core';
import type { BoundaryDecision, OverlayState } from '../types.js';

const TIER_PARAM = 'adaptive_tier';

function readForcedTier(): Tier | null {
  try {
    const param = new URL(window.location.href).searchParams.get(TIER_PARAM);
    if (param === 'high' || param === 'low' || param === 'medium') return param;
  } catch {
    /* ignore */
  }
  return null;
}

function inferVariant(tier: string): string {
  if (tier === 'high') return 'high';
  if (tier === 'medium') return 'medium';
  return 'low';
}

function scanBoundaries(): BoundaryDecision[] {
  const elements = document.querySelectorAll('[data-adaptive]');
  const decisions: BoundaryDecision[] = [];

  for (const el of elements) {
    const name = el.getAttribute('data-adaptive') ?? 'unknown';
    const hasError = el.hasAttribute('data-adaptive-error');
    const profile = getDeviceProfile();
    const loadedVariant = hasError ? 'error' : inferVariant(profile.tier);

    decisions.push({ name, loadedVariant, hasError });
  }

  return decisions;
}

export function collectState(): OverlayState {
  const profile = getDeviceProfile();

  return {
    profile,
    boundaries: scanBoundaries(),
    forcedTier: readForcedTier(),
  };
}
