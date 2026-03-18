import type { AdaptiveBoundary, PlatformEntry } from '../types.js';

type TierCapMap = Map<string, Set<string>>;

export interface PruneResult {
  tier: string;
  reason: string;
}

export function buildCapabilityMap(platformTierMap: Record<string, PlatformEntry>): TierCapMap {
  const map: TierCapMap = new Map();
  for (const entry of Object.values(platformTierMap)) {
    if (!map.has(entry.tier)) map.set(entry.tier, new Set());
    const tierCaps = map.get(entry.tier)!;
    for (const cap of entry.capabilities ?? []) {
      tierCaps.add(cap);
    }
  }
  return map;
}

export function shouldPruneTier(requires: string[], tier: string, tierCapMap: TierCapMap): boolean {
  const tierCaps = tierCapMap.get(tier);
  if (!tierCaps) return true;
  return requires.some((cap) => !tierCaps.has(cap));
}

export function applyCapabilityPruning(
  boundaries: AdaptiveBoundary[],
  platformTierMap: Record<string, PlatformEntry>,
): { boundaries: AdaptiveBoundary[]; pruneInfo: Map<AdaptiveBoundary, PruneResult[]> } {
  if (Object.keys(platformTierMap).length === 0) {
    return { boundaries, pruneInfo: new Map() };
  }

  const tierCapMap = buildCapabilityMap(platformTierMap);
  const pruneInfo = new Map<AdaptiveBoundary, PruneResult[]>();

  const result = boundaries.map((boundary) => {
    if (!boundary.requires || boundary.requires.length === 0) return boundary;

    const pruned: PruneResult[] = [];
    const modified = { ...boundary };

    for (const tier of ['high', 'low', 'medium'] as const) {
      const importKey = `${tier}Import` as keyof AdaptiveBoundary;
      if (!modified[importKey]) continue;

      if (shouldPruneTier(boundary.requires, tier, tierCapMap)) {
        const missing = boundary.requires.filter((c) => !tierCapMap.get(tier)?.has(c));
        pruned.push({ tier, reason: `missing ${missing.join(', ')}` });
        (modified as Record<string, unknown>)[importKey] =
          boundary.capabilityFallbackImport ?? undefined;
      }
    }

    if (pruned.length > 0) pruneInfo.set(modified, pruned);
    return modified;
  });

  return { boundaries: result, pruneInfo };
}
