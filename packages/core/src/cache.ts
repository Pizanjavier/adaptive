import type { AdaptiveConfig, CacheEntry, Tier } from './types.js';

let memoryCache: CacheEntry | null = null;

export function readCache(config: AdaptiveConfig): CacheEntry | null {
  const entry = config.cacheStorage === 'localStorage' ? readLocalStorage(config) : memoryCache;

  if (!entry) return null;

  if (entry.configHash !== config.configHash) return null;

  const age = Date.now() - entry.timestamp;
  if (age > config.cacheTTL) return null;

  return entry;
}

export function writeCache(config: AdaptiveConfig, tier: Tier, score: number): void {
  const entry: CacheEntry = {
    tier,
    score,
    timestamp: Date.now(),
    configHash: config.configHash,
  };

  memoryCache = entry;

  if (config.cacheStorage === 'localStorage') {
    writeLocalStorage(config, entry);
  }
}

export function applyHysteresis(newScore: number, config: AdaptiveConfig): Tier | null {
  const cached = readCache(config);
  if (!cached) return null;

  const { threshold } = config;
  const { up, down } = config.hysteresis;
  const currentTier = cached.tier;

  if (currentTier === 'low' && newScore >= threshold + up) return 'high';
  if (currentTier === 'low') return 'low';

  if (currentTier === 'high' && newScore < threshold - down) return 'low';
  if (currentTier === 'high') return 'high';

  return null;
}

export function clearCache(config: AdaptiveConfig): void {
  memoryCache = null;
  if (config.cacheStorage === 'localStorage') {
    try {
      localStorage.removeItem(config.cacheKey);
    } catch {
      // localStorage may be unavailable
    }
  }
}

function readLocalStorage(config: AdaptiveConfig): CacheEntry | null {
  try {
    const raw = localStorage.getItem(config.cacheKey);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeLocalStorage(config: AdaptiveConfig, entry: CacheEntry): void {
  try {
    localStorage.setItem(config.cacheKey, JSON.stringify(entry));
  } catch {
    // localStorage may be full or unavailable
  }
}
