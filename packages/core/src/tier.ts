import type { Tier, AdaptiveConfig } from './types.js';

export function resolveTier(
  score: number,
  config: AdaptiveConfig,
  hasMedium: boolean = false,
): Tier {
  if (!hasMedium) {
    return score >= config.threshold ? 'high' : 'low';
  }

  const { high, low } = config.thresholdsWithMedium;
  if (score >= high) return 'high';
  if (score < low) return 'low';
  return 'medium';
}
