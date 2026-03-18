import { readable, type Readable } from 'svelte/store';
import { getDeviceProfile, type Tier } from '@adaptive-bundle/core';
import { loadWithFallback } from './error-recovery.js';

type ImportFn<T> = () => Promise<{ default: T }>;

interface BaseConfig {
  name?: string;
  loading?: 'eager' | 'lazy' | 'viewport';
  onError?: (error: Error, boundaryName: string) => void;
}

interface ExclusionConfig<T> extends BaseConfig {
  component: ImportFn<T>;
  lowFallback?: null;
}

interface VariantConfig<T> extends BaseConfig {
  high: ImportFn<T>;
  low: ImportFn<T>;
  medium?: ImportFn<T>;
  thresholds?: { high?: number; low?: number };
}

type AdaptiveConfig<T> = ExclusionConfig<T> | VariantConfig<T>;

function isExclusion<T>(c: AdaptiveConfig<T>): c is ExclusionConfig<T> {
  return 'component' in c;
}

function resolveTierFromScore(
  score: number,
  thresholds?: { high?: number; low?: number },
  hasMedium?: boolean,
): Tier {
  if (thresholds || hasMedium) {
    const high = thresholds?.high ?? 0.65;
    const low = thresholds?.low ?? 0.35;
    if (score >= high) return 'high';
    if (score <= low) return 'low';
    return 'medium';
  }
  return score >= 0.5 ? 'high' : 'low';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptive<T = any>(config: AdaptiveConfig<T>): Readable<T | null> {
  const name = config.name ?? 'adaptive';

  return readable<T | null>(null, (set) => {
    if (isExclusion(config)) {
      loadExclusion(config, name, set);
    } else {
      loadVariant(config, name, set);
    }
  });
}

function loadExclusion<T>(
  config: ExclusionConfig<T>,
  name: string,
  set: (value: T | null) => void,
): void {
  const profile = getDeviceProfile();
  if (profile.tier === 'low') {
    set(null);
    return;
  }

  loadWithFallback(config.component)
    .then((mod) => set(mod.default))
    .catch((err) => {
      config.onError?.(err as Error, name);
      set(null);
    });
}

function loadVariant<T>(
  config: VariantConfig<T>,
  name: string,
  set: (value: T | null) => void,
): void {
  const profile = getDeviceProfile();
  const tier = resolveTierFromScore(profile.score, config.thresholds, !!config.medium);

  const importMap: Record<Tier, ImportFn<T> | undefined> = {
    high: config.high,
    medium: config.medium,
    low: config.low,
  };

  const primary = importMap[tier] ?? config.low;
  const fallbackImport = tier === 'low' ? config.high : config.low;

  loadWithFallback(primary, fallbackImport)
    .then((mod) => set(mod.default))
    .catch((err) => {
      config.onError?.(err as Error, name);
      set(null);
    });
}
