import type { GpuTier, ProbeResult } from '../types.js';

function classifyGpu(maxTextureSize: number, extensionCount: number): GpuTier {
  if (maxTextureSize < 4096) return 0;
  if (maxTextureSize < 8192) return 1;
  if (maxTextureSize < 16384 && extensionCount < 30) return 2;
  return 3;
}

export function probeGpu(): ProbeResult & { gpuTier: GpuTier | null } {
  if (typeof document === 'undefined') {
    return { raw: null, normalized: 0, gpuTier: null };
  }

  let canvas: HTMLCanvasElement | null = null;
  let gl: WebGLRenderingContext | null = null;

  try {
    canvas = document.createElement('canvas');
    gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      return { raw: null, normalized: 0, gpuTier: null };
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const extensions = gl.getSupportedExtensions();
    const extensionCount = extensions ? extensions.length : 0;

    const tier = classifyGpu(maxTextureSize, extensionCount);

    return {
      raw: tier,
      normalized: tier / 3,
      gpuTier: tier,
    };
  } catch {
    return { raw: null, normalized: 0, gpuTier: null };
  } finally {
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    canvas = null;
  }
}
