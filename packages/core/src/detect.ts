import type { DeviceProfile, Tier } from './types.js';
import { getConfig } from './config.js';
import { checkFastPath } from './fast-path.js';
import {
  probeCpu,
  probeMemory,
  probeGpu,
  probeScreen,
  probeTouch,
  probeNetwork,
} from './probes/index.js';
import { computeScore } from './scoring.js';
import { resolveTier } from './tier.js';
import { applyHysteresis, writeCache } from './cache.js';
import { getForcedTier } from './testing.js';

let cachedProfile: DeviceProfile | null = null;

/**
 * Detect device capabilities and return a scored profile.
 * @example
 * ```ts
 * const profile = getDeviceProfile();
 * console.log(profile.tier); // 'high' | 'low' | 'medium'
 * ```
 */
export function getDeviceProfile(): DeviceProfile {
  if (cachedProfile) return cachedProfile;

  const config = getConfig();
  const reasoning: string[] = [];

  const forced = getForcedTier(config);
  if (forced) {
    reasoning.push(`Forced tier: ${forced}`);
    cachedProfile = buildProfile(forced, forced === 'high' ? 0.9 : 0.1, 1, reasoning);
    return cachedProfile;
  }

  if (config.detectPlatform) {
    const platform = config.detectPlatform();
    if (platform && config.deviceMap[platform]) {
      const tier = config.deviceMap[platform];
      reasoning.push(`Platform identified as ${platform} -> forced tier: ${tier} via device map`);
      cachedProfile = buildProfile(tier, tier === 'high' ? 0.9 : 0.1, 1, reasoning);
      return cachedProfile;
    }
  }

  for (const [name, provider] of Object.entries(config.probeProviders)) {
    const result = provider();
    if (result) {
      const tier = result.score >= config.threshold ? 'high' : 'low';
      reasoning.push(
        `Custom probe "${name}": score=${result.score}, confidence=${result.confidence}`,
      );
      cachedProfile = buildProfile(tier, result.score, result.confidence, reasoning);
      writeCache(config, tier, result.score);
      return cachedProfile;
    }
  }

  const fastPath = checkFastPath(config);
  if (fastPath) {
    reasoning.push(`Fast-path: ${fastPath.reason}`);
    cachedProfile = buildProfile(
      fastPath.tier,
      fastPath.score ?? (fastPath.tier === 'high' ? 0.9 : 0.1),
      fastPath.confidence ?? 1,
      reasoning,
    );
    return cachedProfile;
  }

  const cpu = probeCpu();
  const memory = probeMemory();
  const gpu = probeGpu();
  const screen = probeScreen();
  const touch = probeTouch();

  const scoringResult = computeScore(
    {
      cpu: { normalized: cpu.normalized, available: cpu.raw !== null },
      memory: { normalized: memory.normalized, available: memory.raw !== null },
      gpu: { normalized: gpu.normalized, available: gpu.raw !== null },
      screen: { normalized: screen.normalized, available: screen.raw !== null },
      touch: { normalized: touch.normalized, available: touch.raw !== null },
    },
    config.weights,
  );

  reasoning.push(...scoringResult.reasoning);

  let tier: Tier;
  const hysteresisTier = applyHysteresis(scoringResult.score, config);
  if (hysteresisTier) {
    tier = hysteresisTier;
    reasoning.push(`Hysteresis applied: maintained ${tier}`);
  } else {
    tier = resolveTier(scoringResult.score, config);
    reasoning.push(
      `Tier resolved: ${tier} (score=${scoringResult.score.toFixed(3)}, threshold=${config.threshold})`,
    );
  }

  writeCache(config, tier, scoringResult.score);

  const network = probeNetwork();

  cachedProfile = {
    score: scoringResult.score,
    confidence: scoringResult.confidence,
    tier,
    probes: {
      cpuCores: cpu.raw,
      memoryGB: memory.raw,
      gpuTier: gpu.gpuTier,
      screenCategory: screen.screenCategory,
      touchPoints: touch.raw,
    },
    network,
    reasoning,
  };

  return cachedProfile;
}

/**
 * Shorthand to get just the resolved tier.
 * @example
 * ```ts
 * if (getTier() === 'low') loadLiteVersion();
 * ```
 */
export function getTier(): Tier {
  return getDeviceProfile().tier;
}

export function resetDetection(): void {
  cachedProfile = null;
}

function buildProfile(
  tier: Tier,
  score: number,
  confidence: number,
  reasoning: string[],
): DeviceProfile {
  const network =
    typeof navigator !== 'undefined' ? probeNetwork() : { effectiveType: null, dataSaver: null };
  const screen =
    typeof window !== 'undefined'
      ? probeScreen()
      : { raw: null, normalized: 0.5, screenCategory: 'standard' as const };

  return {
    score,
    confidence,
    tier,
    probes: {
      cpuCores: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? null) : null,
      memoryGB:
        typeof navigator !== 'undefined'
          ? ((navigator as { deviceMemory?: number }).deviceMemory ?? null)
          : null,
      gpuTier: null,
      screenCategory: screen.screenCategory,
      touchPoints: typeof navigator !== 'undefined' ? (navigator.maxTouchPoints ?? null) : null,
    },
    network,
    reasoning,
  };
}
