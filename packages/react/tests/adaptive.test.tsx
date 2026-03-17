import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { adaptive } from '../src/adaptive.js';

let mockTier = 'high';
let mockScore = 0.7;

vi.mock('@adaptive/core', () => ({
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

function HighComponent({ label }: { label: string }) {
  return <div data-testid="high">{label}</div>;
}

function LowComponent({ label }: { label: string }) {
  return <div data-testid="low">{label}</div>;
}

describe('adaptive - exclusion config', () => {
  it('renders component on high tier', async () => {
    const Comp = adaptive({
      component: () => Promise.resolve({ default: HighComponent }),
      lowFallback: <div data-testid="fallback">low fallback</div>,
      name: 'test-exclusion',
    });

    render(<Comp label="hello" />);
    await waitFor(() => expect(screen.getByTestId('high')).toBeDefined());
    expect(screen.getByTestId('high').textContent).toBe('hello');
  });

  it('renders lowFallback on low tier', () => {
    mockTier = 'low';
    const Comp = adaptive({
      component: () => Promise.resolve({ default: HighComponent }),
      lowFallback: <div data-testid="fallback">low fallback</div>,
      name: 'test-exclusion',
    });

    render(<Comp label="hello" />);
    expect(screen.getByTestId('fallback').textContent).toBe('low fallback');
  });

  it('wraps in layout div with data-adaptive', () => {
    mockTier = 'low';
    const Comp = adaptive({
      component: () => Promise.resolve({ default: HighComponent }),
      lowFallback: <span>low</span>,
      layout: { width: '100%', aspectRatio: '16/9' },
      name: 'map',
    });

    const { container } = render(<Comp label="x" />);
    const wrapper = container.querySelector('[data-adaptive="map"]');
    expect(wrapper).toBeDefined();
    expect((wrapper as HTMLElement).style.width).toBe('100%');
  });
});

describe('adaptive - variant config', () => {
  it('renders high variant on high tier', async () => {
    const Comp = adaptive({
      high: () => Promise.resolve({ default: HighComponent }),
      low: () => Promise.resolve({ default: LowComponent }),
      name: 'test-variant',
    });

    render(<Comp label="hi" />);
    await waitFor(() => expect(screen.getByTestId('high')).toBeDefined());
    expect(screen.getByTestId('high').textContent).toBe('hi');
  });

  it('renders low variant on low tier', async () => {
    mockTier = 'low';
    mockScore = 0.3;
    const Comp = adaptive({
      high: () => Promise.resolve({ default: HighComponent }),
      low: () => Promise.resolve({ default: LowComponent }),
      name: 'test-variant',
    });

    render(<Comp label="lo" />);
    await waitFor(() => expect(screen.getByTestId('low')).toBeDefined());
    expect(screen.getByTestId('low').textContent).toBe('lo');
  });
});
