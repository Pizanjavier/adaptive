import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, defineComponent, h, type Component } from 'vue';
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

const HighComponent = defineComponent({
  name: 'HighComponent',
  props: { label: { type: String, required: true } },
  render() {
    return h('div', { 'data-testid': 'high' }, this.label);
  },
});

const LowComponent = defineComponent({
  name: 'LowComponent',
  props: { label: { type: String, required: true } },
  render() {
    return h('div', { 'data-testid': 'low' }, this.label);
  },
});

function mountAndGetHTML(
  component: Component,
  props: Record<string, unknown> = {},
): Promise<string> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = createApp(component, props);
    app.mount(el);
    setTimeout(() => {
      resolve(el.innerHTML);
      app.unmount();
      document.body.removeChild(el);
    }, 50);
  });
}

describe('adaptive - exclusion config', () => {
  it('renders component on high tier', async () => {
    const Comp = adaptive({
      component: () => Promise.resolve({ default: HighComponent }),
      lowFallback: h('div', { 'data-testid': 'fallback' }, 'low fallback'),
      name: 'test-exclusion',
    });

    const html = await mountAndGetHTML(Comp, { label: 'hello' });
    expect(html).toContain('data-adaptive="test-exclusion"');
    expect(html).toContain('hello');
  });

  it('renders lowFallback on low tier', async () => {
    mockTier = 'low';
    const Comp = adaptive({
      component: () => Promise.resolve({ default: HighComponent }),
      lowFallback: h('div', { 'data-testid': 'fallback' }, 'low fallback'),
      name: 'test-exclusion',
    });

    const html = await mountAndGetHTML(Comp, { label: 'hello' });
    expect(html).toContain('low fallback');
    expect(html).toContain('data-adaptive="test-exclusion"');
  });

  it('wraps in layout div with data-adaptive', async () => {
    mockTier = 'low';
    const Comp = adaptive({
      component: () => Promise.resolve({ default: HighComponent }),
      lowFallback: h('span', 'low'),
      layout: { width: '100%', aspectRatio: '16/9' },
      name: 'map',
    });

    const html = await mountAndGetHTML(Comp, { label: 'x' });
    expect(html).toContain('data-adaptive="map"');
    expect(html).toContain('width: 100%');
  });
});

describe('adaptive - variant config', () => {
  it('renders high variant on high tier', async () => {
    const Comp = adaptive({
      high: () => Promise.resolve({ default: HighComponent }),
      low: () => Promise.resolve({ default: LowComponent }),
      name: 'test-variant',
    });

    const html = await mountAndGetHTML(Comp, { label: 'hi' });
    expect(html).toContain('data-testid="high"');
    expect(html).toContain('hi');
  });

  it('renders low variant on low tier', async () => {
    mockTier = 'low';
    mockScore = 0.3;
    const Comp = adaptive({
      high: () => Promise.resolve({ default: HighComponent }),
      low: () => Promise.resolve({ default: LowComponent }),
      name: 'test-variant',
    });

    const html = await mountAndGetHTML(Comp, { label: 'lo' });
    expect(html).toContain('data-testid="low"');
    expect(html).toContain('lo');
  });

  it('uses default name when not provided', async () => {
    const Comp = adaptive({
      high: () => Promise.resolve({ default: HighComponent }),
      low: () => Promise.resolve({ default: LowComponent }),
    });

    const html = await mountAndGetHTML(Comp, { label: 'test' });
    expect(html).toContain('data-adaptive="adaptive"');
  });
});
