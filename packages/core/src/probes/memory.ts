import type { ProbeResult } from '../types.js';

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function probeMemory(): ProbeResult {
  const mem =
    typeof navigator !== 'undefined'
      ? ((navigator as { deviceMemory?: number }).deviceMemory ?? null)
      : null;

  if (mem == null) {
    return { raw: null, normalized: 0 };
  }

  return {
    raw: mem,
    normalized: clamp((mem - 1) / 7, 0, 1),
  };
}
