import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DeviceProfile } from '@adaptive-bundle/core';

vi.mock('@adaptive-bundle/core', () => ({
  getDeviceProfile: vi.fn<() => DeviceProfile>(() => ({
    score: 0.75,
    confidence: 0.9,
    tier: 'high',
    probes: {
      cpuCores: 8,
      memoryGB: 8,
      gpuTier: 2,
      screenCategory: 'high',
      touchPoints: 0,
    },
    network: { effectiveType: '4g', dataSaver: false },
    reasoning: ['Score: 0.75'],
  })),
}));

import { collectState } from '../src/overlay/state.js';

describe('collectState', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns profile with tier and score', () => {
    const state = collectState();
    expect(state.profile.tier).toBe('high');
    expect(state.profile.score).toBe(0.75);
    expect(state.profile.confidence).toBe(0.9);
  });

  it('scans data-adaptive elements', () => {
    const el = document.createElement('div');
    el.setAttribute('data-adaptive', 'HeroChart');
    document.body.appendChild(el);

    const state = collectState();
    expect(state.boundaries).toHaveLength(1);
    expect(state.boundaries[0].name).toBe('HeroChart');
    expect(state.boundaries[0].loadedVariant).toBe('high');
    expect(state.boundaries[0].hasError).toBe(false);
  });

  it('detects error boundaries', () => {
    const el = document.createElement('div');
    el.setAttribute('data-adaptive', 'BrokenChart');
    el.setAttribute('data-adaptive-error', '');
    document.body.appendChild(el);

    const state = collectState();
    expect(state.boundaries[0].hasError).toBe(true);
    expect(state.boundaries[0].loadedVariant).toBe('error');
  });

  it('returns empty boundaries when none exist', () => {
    const state = collectState();
    expect(state.boundaries).toHaveLength(0);
  });
});
