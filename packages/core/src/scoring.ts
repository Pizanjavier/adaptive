import type { WeightConfig, NormalizedProbe } from './types.js';

interface ScoringInput {
  cpu: { normalized: number; available: boolean };
  memory: { normalized: number; available: boolean };
  gpu: { normalized: number; available: boolean };
  screen: { normalized: number; available: boolean };
  touch: { normalized: number; available: boolean };
}

interface ScoringResult {
  score: number;
  confidence: number;
  probes: NormalizedProbe[];
  reasoning: string[];
}

export function computeScore(input: ScoringInput, weights: WeightConfig): ScoringResult {
  const mapping: Array<{
    key: keyof ScoringInput;
    weightKey: keyof WeightConfig;
    label: string;
  }> = [
    { key: 'cpu', weightKey: 'cpuCores', label: 'CPU cores' },
    { key: 'memory', weightKey: 'memory', label: 'Device memory' },
    { key: 'gpu', weightKey: 'gpu', label: 'GPU tier' },
    { key: 'screen', weightKey: 'screen', label: 'Screen resolution' },
    { key: 'touch', weightKey: 'touchPoints', label: 'Touch points' },
  ];

  const available: NormalizedProbe[] = [];
  const missing: string[] = [];
  let totalAvailableWeight = 0;

  for (const m of mapping) {
    const probe = input[m.key];
    if (probe.available) {
      totalAvailableWeight += weights[m.weightKey];
      available.push({
        name: m.label,
        normalized: probe.normalized,
        weight: weights[m.weightKey],
      });
    } else {
      missing.push(m.label);
    }
  }

  const reasoning: string[] = [];

  if (missing.length > 0) {
    reasoning.push(`Unavailable probes: ${missing.join(', ')}`);
  }

  if (totalAvailableWeight === 0) {
    reasoning.push('No probes available, defaulting to high');
    return { score: 0.5, confidence: 0, probes: [], reasoning };
  }

  const redistributionFactor = 1 / totalAvailableWeight;

  let score = 0;
  for (const probe of available) {
    const redistributedWeight = probe.weight * redistributionFactor;
    score += probe.normalized * redistributedWeight;
    reasoning.push(
      `${probe.name}: ${probe.normalized.toFixed(2)} * ${redistributedWeight.toFixed(2)} = ${(probe.normalized * redistributedWeight).toFixed(3)}`,
    );
  }

  const confidence = totalAvailableWeight;

  reasoning.push(`Composite score: ${score.toFixed(3)}, confidence: ${confidence.toFixed(2)}`);

  return { score, confidence, probes: available, reasoning };
}
