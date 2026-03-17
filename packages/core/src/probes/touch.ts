import type { ProbeResult } from '../types.js';

export function probeTouch(): ProbeResult {
  const points = typeof navigator !== 'undefined' ? (navigator.maxTouchPoints ?? null) : null;

  if (points == null) {
    return { raw: null, normalized: 0.5 };
  }

  let normalized: number;
  if (points === 0) normalized = 0.5;
  else if (points < 5) normalized = 0.4;
  else normalized = 0.6;

  return { raw: points, normalized };
}
