import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, defineComponent, h, type Component } from 'vue';
import { AdaptiveHigh, AdaptiveLow, AdaptiveMedium } from '../src/inline.js';

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

afterEach(() => {
  mockTier = 'high';
  vi.restoreAllMocks();
});

function mountAndGetHTML(component: Component): Promise<string> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = createApp(component);
    app.mount(el);
    setTimeout(() => {
      resolve(el.innerHTML);
      app.unmount();
      document.body.removeChild(el);
    }, 10);
  });
}

describe('AdaptiveHigh', () => {
  it('renders slot content when tier is high', async () => {
    const Wrapper = defineComponent({
      render() {
        return h(AdaptiveHigh, null, {
          default: () => h('span', { 'data-testid': 'high-content' }, 'high content'),
        });
      },
    });

    const html = await mountAndGetHTML(Wrapper);
    expect(html).toContain('high-content');
  });

  it('renders nothing when tier is low', async () => {
    mockTier = 'low';
    const Wrapper = defineComponent({
      render() {
        return h(AdaptiveHigh, null, {
          default: () => h('span', 'high content'),
        });
      },
    });

    const html = await mountAndGetHTML(Wrapper);
    expect(html).toBe('<!---->');
  });
});

describe('AdaptiveLow', () => {
  it('renders slot content when tier is low', async () => {
    mockTier = 'low';
    const Wrapper = defineComponent({
      render() {
        return h(AdaptiveLow, null, {
          default: () => h('span', { 'data-testid': 'low-content' }, 'low content'),
        });
      },
    });

    const html = await mountAndGetHTML(Wrapper);
    expect(html).toContain('low-content');
  });

  it('renders nothing when tier is high', async () => {
    const Wrapper = defineComponent({
      render() {
        return h(AdaptiveLow, null, {
          default: () => h('span', 'low content'),
        });
      },
    });

    const html = await mountAndGetHTML(Wrapper);
    expect(html).toBe('<!---->');
  });
});

describe('AdaptiveMedium', () => {
  it('renders slot content when tier is medium', async () => {
    mockTier = 'medium';
    const Wrapper = defineComponent({
      render() {
        return h(AdaptiveMedium, null, {
          default: () => h('span', { 'data-testid': 'med-content' }, 'medium'),
        });
      },
    });

    const html = await mountAndGetHTML(Wrapper);
    expect(html).toContain('med-content');
  });

  it('renders nothing when tier is high', async () => {
    const Wrapper = defineComponent({
      render() {
        return h(AdaptiveMedium, null, {
          default: () => h('span', 'medium content'),
        });
      },
    });

    const html = await mountAndGetHTML(Wrapper);
    expect(html).toBe('<!---->');
  });
});
