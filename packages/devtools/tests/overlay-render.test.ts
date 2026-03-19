import { describe, it, expect } from 'vitest';
import type { OverlayState } from '../src/types.js';
import { renderOverlay } from '../src/overlay/render.js';

function createState(overrides: Partial<OverlayState> = {}): OverlayState {
  return {
    profile: {
      score: 0.65,
      confidence: 0.85,
      tier: 'medium',
      probes: {
        cpuCores: 4,
        memoryGB: 4,
        gpuTier: 1,
        screenCategory: 'standard',
        touchPoints: 5,
      },
      network: { effectiveType: '4g', dataSaver: false },
      reasoning: ['Score: 0.65', 'Tier resolved: medium'],
    },
    boundaries: [
      { name: 'Chart', loadedVariant: 'medium', hasError: false },
      { name: 'Map', loadedVariant: 'medium', hasError: false },
    ],
    forcedTier: null,
    capabilities: [],
    ...overrides,
  };
}

describe('renderOverlay', () => {
  it('renders tier badge with correct class', () => {
    const html = renderOverlay(createState());
    expect(html).toContain('tier-medium');
    expect(html).toContain('MEDIUM');
  });

  it('renders score and confidence', () => {
    const html = renderOverlay(createState());
    expect(html).toContain('0.65');
    expect(html).toContain('85%');
  });

  it('renders probe values', () => {
    const html = renderOverlay(createState());
    expect(html).toContain('CPU Cores');
    expect(html).toContain('4');
    expect(html).toContain('GPU Tier');
  });

  it('shows n/a for null probes', () => {
    const state = createState();
    state.profile.probes.cpuCores = null;
    const html = renderOverlay(state);
    expect(html).toContain('probe-unavailable');
    expect(html).toContain('n/a');
  });

  it('renders boundaries', () => {
    const html = renderOverlay(createState());
    expect(html).toContain('Chart');
    expect(html).toContain('Map');
    expect(html).toContain('Boundaries (2)');
  });

  it('renders no-boundaries message', () => {
    const html = renderOverlay(createState({ boundaries: [] }));
    expect(html).toContain('No boundaries detected');
  });

  it('renders reasoning chain', () => {
    const html = renderOverlay(createState());
    expect(html).toContain('Score: 0.65');
    expect(html).toContain('Tier resolved: medium');
  });

  it('renders tier simulator', () => {
    const html = renderOverlay(createState());
    expect(html).toContain('Tier Simulator');
    expect(html).toContain('data-devtools-action="simulate"');
    expect(html).toContain('Auto (detected)');
  });

  it('renders reset button when tier is forced', () => {
    const html = renderOverlay(createState({ forcedTier: 'low' }));
    expect(html).toContain('data-devtools-action="reset"');
    expect(html).toContain('Reset forced tier');
  });

  it('renders loading strategy tag on boundaries', () => {
    const state = createState({
      boundaries: [
        { name: 'Metrics', loadedVariant: 'high', hasError: false, loading: 'eager' },
        { name: 'Scene', loadedVariant: 'high', hasError: false, loading: 'lazy' },
        { name: 'Chart', loadedVariant: 'high', hasError: false },
      ],
    });
    const html = renderOverlay(state);
    expect(html).toContain('loading-eager');
    expect(html).toContain('loading-lazy');
    expect(html).not.toContain('loading-undefined');
  });

  it('escapes HTML in boundary names', () => {
    const state = createState({
      boundaries: [{ name: '<script>xss</script>', loadedVariant: 'high', hasError: false }],
    });
    const html = renderOverlay(state);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>xss</script>');
  });
});
