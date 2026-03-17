import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@adaptive/core', () => ({
  getDeviceProfile: vi.fn(),
}));

import { getDeviceProfile } from '@adaptive/core';

const mockGetDeviceProfile = vi.mocked(getDeviceProfile);

function mockProfile(tier: 'high' | 'low' | 'medium', effectiveType: string = '4g') {
  mockGetDeviceProfile.mockReturnValue({
    tier,
    score: tier === 'high' ? 0.8 : tier === 'low' ? 0.2 : 0.5,
    gpu: { tier: 'mid', renderer: '' },
    memory: 4,
    cores: 4,
    screen: { width: 1920, height: 1080, category: 'desktop', dpr: 1 },
    network: { effectiveType, downlink: 10, rtt: 50 },
    deviceType: 'desktop',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

describe('stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('createAdaptiveStore returns correct shape', async () => {
    mockProfile('high', '4g');
    const { createAdaptiveStore } = await import('../src/stores.js');
    const store = createAdaptiveStore();
    const value = get(store);

    expect(value).toEqual({
      tier: 'high',
      shouldDefer: false,
      effectiveType: '4g',
      profile: expect.objectContaining({ tier: 'high' }),
    });
  });

  it('createTierStore returns tier value', async () => {
    mockProfile('low');
    const { createTierStore } = await import('../src/stores.js');
    const store = createTierStore();
    expect(get(store)).toBe('low');
  });

  it('createDeviceProfileStore returns full profile', async () => {
    mockProfile('medium');
    const { createDeviceProfileStore } = await import('../src/stores.js');
    const store = createDeviceProfileStore();
    const value = get(store);
    expect(value).toHaveProperty('tier', 'medium');
    expect(value).toHaveProperty('score');
    expect(value).toHaveProperty('network');
  });

  it('createNetworkAwareStore returns network info', async () => {
    mockProfile('high', '4g');
    const { createNetworkAwareStore } = await import('../src/stores.js');
    const store = createNetworkAwareStore();
    const value = get(store);

    expect(value).toEqual({
      shouldDefer: false,
      effectiveType: '4g',
    });
  });

  it('createNetworkAwareStore defers on slow connections', async () => {
    mockProfile('low', '2g');
    const { createNetworkAwareStore } = await import('../src/stores.js');
    const store = createNetworkAwareStore();
    const value = get(store);

    expect(value.shouldDefer).toBe(true);
    expect(value.effectiveType).toBe('2g');
  });
});
