import type { ProbeResult, ScreenCategory } from '../types.js';

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function probeScreen(): ProbeResult & {
  screenCategory: ScreenCategory;
} {
  if (typeof window === 'undefined' || !window.screen) {
    return { raw: null, normalized: 0.5, screenCategory: 'standard' };
  }

  const width = window.screen.width;
  const dpr = window.devicePixelRatio || 1;
  const effectivePixels = width * dpr;

  const normalized = clamp((effectivePixels - 480) / (1920 - 480), 0, 1);

  let screenCategory: ScreenCategory = 'standard';
  if (effectivePixels < 768) screenCategory = 'low';
  else if (effectivePixels >= 1440) screenCategory = 'high';

  return {
    raw: effectivePixels,
    normalized,
    screenCategory,
  };
}
