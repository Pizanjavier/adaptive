import { describe, it, expect } from 'vitest';
import { computeScore } from '../src/scoring.js';
import type { WeightConfig } from '../src/types.js';

const defaultWeights: WeightConfig = {
  cpuCores: 0.35,
  memory: 0.35,
  gpu: 0.15,
  screen: 0.1,
  touchPoints: 0.05,
};

function allAvailable(values: {
  cpu: number;
  memory: number;
  gpu: number;
  screen: number;
  touch: number;
}) {
  return {
    cpu: { normalized: values.cpu, available: true },
    memory: { normalized: values.memory, available: true },
    gpu: { normalized: values.gpu, available: true },
    screen: { normalized: values.screen, available: true },
    touch: { normalized: values.touch, available: true },
  };
}

describe('computeScore', () => {
  it('computes weighted average when all probes available', () => {
    const result = computeScore(
      allAvailable({ cpu: 1, memory: 1, gpu: 1, screen: 1, touch: 1 }),
      defaultWeights,
    );
    expect(result.score).toBeCloseTo(1.0, 5);
    expect(result.confidence).toBeCloseTo(1.0, 5);
  });

  it('returns 0 score for all-zero probes', () => {
    const result = computeScore(
      allAvailable({ cpu: 0, memory: 0, gpu: 0, screen: 0, touch: 0 }),
      defaultWeights,
    );
    expect(result.score).toBeCloseTo(0, 5);
  });

  it('correctly weights probes', () => {
    const result = computeScore(
      allAvailable({ cpu: 0.6, memory: 0.5, gpu: 0.3, screen: 0.8, touch: 0.5 }),
      defaultWeights,
    );
    const expected = 0.6 * 0.35 + 0.5 * 0.35 + 0.3 * 0.15 + 0.8 * 0.1 + 0.5 * 0.05;
    expect(result.score).toBeCloseTo(expected, 4);
  });

  it('redistributes weights when memory is missing', () => {
    const input = {
      cpu: { normalized: 0.6, available: true },
      memory: { normalized: 0, available: false },
      gpu: { normalized: 0.5, available: true },
      screen: { normalized: 0.8, available: true },
      touch: { normalized: 0.5, available: true },
    };
    const result = computeScore(input, defaultWeights);

    const totalWeight = 0.35 + 0.15 + 0.1 + 0.05;
    const expected = (0.6 * 0.35 + 0.5 * 0.15 + 0.8 * 0.1 + 0.5 * 0.05) / totalWeight;

    expect(result.score).toBeCloseTo(expected, 4);
    expect(result.confidence).toBeCloseTo(totalWeight, 5);
  });

  it('redistributes weights when multiple probes missing', () => {
    const input = {
      cpu: { normalized: 0.8, available: true },
      memory: { normalized: 0, available: false },
      gpu: { normalized: 0, available: false },
      screen: { normalized: 0.5, available: true },
      touch: { normalized: 0.5, available: true },
    };
    const result = computeScore(input, defaultWeights);

    const totalWeight = 0.35 + 0.1 + 0.05;
    expect(result.confidence).toBeCloseTo(totalWeight, 5);
  });

  it('handles all probes missing', () => {
    const input = {
      cpu: { normalized: 0, available: false },
      memory: { normalized: 0, available: false },
      gpu: { normalized: 0, available: false },
      screen: { normalized: 0, available: false },
      touch: { normalized: 0, available: false },
    };
    const result = computeScore(input, defaultWeights);
    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0);
  });

  it('includes reasoning for unavailable probes', () => {
    const input = {
      cpu: { normalized: 0.5, available: true },
      memory: { normalized: 0, available: false },
      gpu: { normalized: 0, available: false },
      screen: { normalized: 0.5, available: true },
      touch: { normalized: 0.5, available: true },
    };
    const result = computeScore(input, defaultWeights);
    expect(result.reasoning.some((r) => r.includes('Unavailable'))).toBe(true);
    expect(result.reasoning.some((r) => r.includes('Device memory'))).toBe(true);
  });
});
