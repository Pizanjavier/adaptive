export type Tier = 'high' | 'low' | 'medium';

export type EffectiveType = '4g' | '3g' | '2g' | 'slow-2g';

export type ScreenCategory = 'high' | 'standard' | 'low';

export type GpuTier = 0 | 1 | 2 | 3;

export interface ProbeValues {
  cpuCores: number | null;
  memoryGB: number | null;
  gpuTier: GpuTier | null;
  screenCategory: ScreenCategory;
  touchPoints: number | null;
}

export interface NetworkInfo {
  effectiveType: EffectiveType | null;
  dataSaver: boolean | null;
}

export interface DeviceProfile {
  score: number;
  confidence: number;
  tier: Tier;
  probes: ProbeValues;
  network: NetworkInfo;
  reasoning: string[];
}

export interface WeightConfig {
  cpuCores: number;
  memory: number;
  gpu: number;
  screen: number;
  touchPoints: number;
}

export interface ProbeProvider {
  (): { score: number; confidence: number } | null;
}

export interface AdaptiveConfig {
  weights: WeightConfig;
  threshold: number;
  thresholdsWithMedium: { high: number; low: number };
  hysteresis: { up: number; down: number };
  cacheTTL: number;
  cacheKey: string;
  cacheStorage: 'localStorage' | 'memory';
  forceTierParam: string;
  probeProviders: Record<string, ProbeProvider>;
  deviceMap: Record<string, Tier>;
  detectPlatform: (() => string | null) | null;
  configHash: string;
}

export interface NormalizedProbe {
  name: string;
  normalized: number;
  weight: number;
}

export interface ProbeResult {
  raw: number | null;
  normalized: number;
}

export interface FastPathResult {
  tier: Tier;
  reason: string;
  score?: number;
  confidence?: number;
}

export interface CacheEntry {
  tier: Tier;
  score: number;
  timestamp: number;
  configHash: string;
}
