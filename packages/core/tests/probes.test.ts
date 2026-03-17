import { describe, it, expect, vi, afterEach } from 'vitest';
import { probeCpu } from '../src/probes/cpu.js';
import { probeMemory } from '../src/probes/memory.js';
import { probeGpu } from '../src/probes/gpu.js';
import { probeScreen } from '../src/probes/screen.js';
import { probeTouch } from '../src/probes/touch.js';
import { probeNetwork } from '../src/probes/network.js';

describe('probeCpu', () => {
  it('normalizes cores correctly', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
    const result = probeCpu();
    expect(result.raw).toBe(8);
    expect(result.normalized).toBeCloseTo(0.6, 5);
  });

  it('clamps at 0 for 2 or fewer cores', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 2 });
    expect(probeCpu().normalized).toBe(0);

    vi.stubGlobal('navigator', { hardwareConcurrency: 1 });
    expect(probeCpu().normalized).toBe(0);
  });

  it('clamps at 1 for 12+ cores', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 16 });
    expect(probeCpu().normalized).toBe(1);
  });

  it('returns null raw when navigator unavailable', () => {
    vi.stubGlobal('navigator', {});
    const result = probeCpu();
    expect(result.raw).toBeNull();
  });
});

describe('probeMemory', () => {
  it('normalizes memory correctly', () => {
    vi.stubGlobal('navigator', { deviceMemory: 4 });
    const result = probeMemory();
    expect(result.raw).toBe(4);
    expect(result.normalized).toBeCloseTo(3 / 7, 5);
  });

  it('clamps at 0 for 1GB or less', () => {
    vi.stubGlobal('navigator', { deviceMemory: 0.5 });
    expect(probeMemory().normalized).toBe(0);
  });

  it('clamps at 1 for 8GB+', () => {
    vi.stubGlobal('navigator', { deviceMemory: 16 });
    expect(probeMemory().normalized).toBe(1);
  });

  it('returns null when deviceMemory unavailable', () => {
    vi.stubGlobal('navigator', {});
    expect(probeMemory().raw).toBeNull();
  });
});

describe('probeGpu', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns null when document is undefined', () => {
    const origDoc = globalThis.document;
    // @ts-expect-error testing
    delete globalThis.document;
    const result = probeGpu();
    expect(result.gpuTier).toBeNull();
    globalThis.document = origDoc;
  });

  it('classifies GPU tiers based on texture size', () => {
    const mockGl = {
      MAX_TEXTURE_SIZE: 0x0d33,
      MAX_RENDERBUFFER_SIZE: 0x84e8,
      getParameter: vi.fn((param: number) => {
        if (param === 0x0d33) return 16384;
        if (param === 0x84e8) return 16384;
        return 0;
      }),
      getSupportedExtensions: vi.fn(() => new Array(35).fill('ext')),
      getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
    };

    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => mockGl),
    } as unknown as HTMLCanvasElement);

    const result = probeGpu();
    expect(result.gpuTier).toBe(3);
    expect(result.normalized).toBe(1);
  });
});

describe('probeScreen', () => {
  it('calculates effective pixels and normalizes', () => {
    vi.stubGlobal('window', {
      screen: { width: 1920, height: 1080 },
      devicePixelRatio: 1,
    });
    const result = probeScreen();
    expect(result.normalized).toBe(1);
    expect(result.screenCategory).toBe('high');
  });

  it('classifies low screens', () => {
    vi.stubGlobal('window', {
      screen: { width: 320, height: 480 },
      devicePixelRatio: 1,
    });
    const result = probeScreen();
    expect(result.screenCategory).toBe('low');
    expect(result.normalized).toBe(0);
  });

  it('returns standard for mid-range screens', () => {
    vi.stubGlobal('window', {
      screen: { width: 1024, height: 768 },
      devicePixelRatio: 1,
    });
    const result = probeScreen();
    expect(result.screenCategory).toBe('standard');
  });
});

describe('probeTouch', () => {
  it('maps 0 touch points to 0.5', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 0 });
    expect(probeTouch().normalized).toBe(0.5);
  });

  it('maps 1 touch point to 0.4', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 1 });
    expect(probeTouch().normalized).toBe(0.4);
  });

  it('maps 5+ touch points to 0.6', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 10 });
    expect(probeTouch().normalized).toBe(0.6);
  });
});

describe('probeNetwork', () => {
  it('reads connection info', () => {
    vi.stubGlobal('navigator', {
      connection: { effectiveType: '4g', saveData: false },
    });
    const result = probeNetwork();
    expect(result.effectiveType).toBe('4g');
    expect(result.dataSaver).toBe(false);
  });

  it('returns nulls when connection unavailable', () => {
    vi.stubGlobal('navigator', {});
    const result = probeNetwork();
    expect(result.effectiveType).toBeNull();
    expect(result.dataSaver).toBeNull();
  });

  it('handles data saver active', () => {
    vi.stubGlobal('navigator', {
      connection: { effectiveType: '2g', saveData: true },
    });
    const result = probeNetwork();
    expect(result.dataSaver).toBe(true);
  });
});
