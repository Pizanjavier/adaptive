import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdaptive, useTier, useNetworkAware } from '../src/hooks.js';

vi.mock('@adaptive/core', () => ({
  getDeviceProfile: vi.fn(() => ({
    score: 0.7,
    confidence: 0.9,
    tier: 'high' as const,
    probes: {
      cpuCores: 8,
      memoryGB: 8,
      gpuTier: 2,
      screenCategory: 'high' as const,
      touchPoints: 0,
    },
    network: { effectiveType: '4g' as const, dataSaver: false },
    reasoning: ['test'],
  })),
}));

vi.mock('../src/context.js', () => ({
  useAdaptiveContext: vi.fn(() => null),
}));

afterEach(() => vi.restoreAllMocks());

describe('useAdaptive', () => {
  it('returns tier, shouldDefer, effectiveType, and profile', () => {
    const { result } = renderHook(() => useAdaptive());
    expect(result.current.tier).toBe('high');
    expect(result.current.shouldDefer).toBe(false);
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.profile).toBeDefined();
  });
});

describe('useTier', () => {
  it('returns the tier string', () => {
    const { result } = renderHook(() => useTier());
    expect(result.current).toBe('high');
  });
});

describe('useNetworkAware', () => {
  it('returns shouldDefer false on 4g', () => {
    const { result } = renderHook(() => useNetworkAware());
    expect(result.current.shouldDefer).toBe(false);
    expect(result.current.effectiveType).toBe('4g');
  });
});
