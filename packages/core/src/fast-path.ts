import type { AdaptiveConfig, FastPathResult, Tier } from './types.js';
import { readCache } from './cache.js';

export function checkFastPath(config: AdaptiveConfig): FastPathResult | null {
  const dataSaver = getDataSaver();
  if (dataSaver === true) {
    return { tier: 'low', reason: 'Data saver active', score: 0, confidence: 1 };
  }

  const serverTier = getServerHint();
  if (serverTier) {
    return { tier: serverTier, reason: `Server hint: ${serverTier}`, confidence: 1 };
  }

  const cached = readCache(config);
  if (cached) {
    return {
      tier: cached.tier,
      reason: 'Cached tier (valid TTL + config hash)',
      score: cached.score,
      confidence: 1,
    };
  }

  const memory = getDeviceMemory();
  if (memory !== null && memory <= 2) {
    return { tier: 'low', reason: `deviceMemory=${memory}GB (<=2GB)`, score: 0.1, confidence: 0.9 };
  }

  const cores = getCpuCores();
  if (memory !== null && memory >= 8 && cores !== null && cores >= 8) {
    return {
      tier: 'high',
      reason: `deviceMemory=${memory}GB, cores=${cores} (high-end)`,
      score: 0.9,
      confidence: 0.95,
    };
  }

  return null;
}

function getDataSaver(): boolean | null {
  if (typeof navigator === 'undefined') return null;
  const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
  return conn?.saveData ?? null;
}

function getServerHint(): Tier | null {
  if (typeof window === 'undefined') return null;

  const globalTier = (window as { __ADAPTIVE_TIER__?: string }).__ADAPTIVE_TIER__;
  if (globalTier === 'high' || globalTier === 'low' || globalTier === 'medium') {
    return globalTier;
  }

  try {
    const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('adaptive_tier='));
    if (cookie) {
      const value = cookie.split('=')[1]?.trim();
      if (value === 'high' || value === 'low' || value === 'medium') return value;
    }
  } catch {
    // cookie access may be restricted
  }

  return null;
}

function getDeviceMemory(): number | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as { deviceMemory?: number }).deviceMemory ?? null;
}

function getCpuCores(): number | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.hardwareConcurrency ?? null;
}
