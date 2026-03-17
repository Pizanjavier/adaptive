import type { ProbeResult } from '../types.js';

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function probeCpu(): ProbeResult {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null;

  if (cores == null) {
    return { raw: null, normalized: 0 };
  }

  return {
    raw: cores,
    normalized: clamp((cores - 2) / 10, 0, 1),
  };
}
