import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Adaptive } from '../src/inline.js';

let mockTier = 'high';

vi.mock('@adaptive-bundle/core', () => ({
  getDeviceProfile: vi.fn(() => ({
    score: 0.7,
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

describe('Adaptive.High', () => {
  it('renders children on high tier', () => {
    mockTier = 'high';
    render(
      <Adaptive.High>
        <div data-testid="high-content">high</div>
      </Adaptive.High>,
    );
    expect(screen.getByTestId('high-content')).toBeDefined();
  });

  it('renders nothing on low tier', () => {
    mockTier = 'low';
    const { container } = render(
      <Adaptive.High>
        <div data-testid="high-content">high</div>
      </Adaptive.High>,
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('Adaptive.Low', () => {
  it('renders children on low tier', () => {
    mockTier = 'low';
    render(
      <Adaptive.Low>
        <div data-testid="low-content">low</div>
      </Adaptive.Low>,
    );
    expect(screen.getByTestId('low-content')).toBeDefined();
  });

  it('renders nothing on high tier', () => {
    mockTier = 'high';
    const { container } = render(
      <Adaptive.Low>
        <div data-testid="low-content">low</div>
      </Adaptive.Low>,
    );
    expect(container.innerHTML).toBe('');
  });
});
