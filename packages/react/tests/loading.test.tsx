import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { adaptive } from '../src/adaptive.js';

let mockTier = 'high';
let mockScore = 0.7;

vi.mock('@adaptive-bundle/core', () => ({
  getDeviceProfile: vi.fn(() => ({
    score: mockScore,
    confidence: 0.9,
    tier: mockTier,
    probes: {
      cpuCores: 8,
      memoryGB: 8,
      gpuTier: 2,
      screenCategory: 'high' as const,
      touchPoints: 0,
    },
    network: { effectiveType: '4g' as const, dataSaver: false },
    reasoning: [],
  })),
}));

afterEach(() => {
  mockTier = 'high';
  mockScore = 0.7;
  vi.restoreAllMocks();
});

function HighComp() {
  return <div data-testid="high">high</div>;
}

function LowComp() {
  return <div data-testid="low">low</div>;
}

let observerCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;
let mockDisconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  observerCallback = null;
  mockDisconnect = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = vi.fn((cb: typeof observerCallback) => {
    observerCallback = cb;
    return { observe: vi.fn(), disconnect: mockDisconnect, unobserve: vi.fn() };
  });
});

describe('loading: eager', () => {
  it('preloads import at definition time (exclusion)', () => {
    let importCalled = false;
    const importFn = () => {
      importCalled = true;
      return Promise.resolve({ default: HighComp });
    };

    adaptive({
      component: importFn,
      lowFallback: <div>low</div>,
      loading: 'eager',
      name: 'eager-test',
    });

    expect(importCalled).toBe(true);
  });

  it('preloads all tier imports at definition time (variant)', () => {
    let highCalled = false;
    let lowCalled = false;
    const highImport = () => {
      highCalled = true;
      return Promise.resolve({ default: HighComp });
    };
    const lowImport = () => {
      lowCalled = true;
      return Promise.resolve({ default: LowComp });
    };

    adaptive({
      high: highImport,
      low: lowImport,
      loading: 'eager',
      name: 'eager-variant',
    });

    expect(highCalled).toBe(true);
    expect(lowCalled).toBe(true);
  });
});

describe('loading: lazy', () => {
  it('does not load until viewport intersection (exclusion)', async () => {
    let importCalled = false;
    const importFn = () => {
      importCalled = true;
      return Promise.resolve({ default: HighComp });
    };

    const Comp = adaptive({
      component: importFn,
      lowFallback: <div>low</div>,
      loading: 'lazy',
      name: 'lazy-test',
    });

    render(<Comp />);
    expect(importCalled).toBe(false);
    expect(screen.queryByTestId('high')).toBeNull();

    await act(async () => {
      observerCallback?.([{ isIntersecting: true }]);
    });

    await waitFor(() => expect(screen.getByTestId('high')).toBeDefined());
  });

  it('does not load until viewport intersection (variant)', async () => {
    let highCalled = false;
    const highImport = () => {
      highCalled = true;
      return Promise.resolve({ default: HighComp });
    };

    const Comp = adaptive({
      high: highImport,
      low: () => Promise.resolve({ default: LowComp }),
      loading: 'lazy',
      name: 'lazy-variant',
    });

    render(<Comp />);
    expect(highCalled).toBe(false);

    await act(async () => {
      observerCallback?.([{ isIntersecting: true }]);
    });

    await waitFor(() => expect(screen.getByTestId('high')).toBeDefined());
  });
});

describe('loading: viewport (default)', () => {
  it('loads immediately on render like current behavior', async () => {
    const Comp = adaptive({
      high: () => Promise.resolve({ default: HighComp }),
      low: () => Promise.resolve({ default: LowComp }),
      name: 'default-test',
    });

    render(<Comp />);
    await waitFor(() => expect(screen.getByTestId('high')).toBeDefined());
  });
});
