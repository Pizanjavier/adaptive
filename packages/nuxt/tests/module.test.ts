import { describe, it, expect, vi } from 'vitest';
import { defineAdaptiveModule } from '../src/module.js';

describe('defineAdaptiveModule', () => {
  it('returns a module with correct meta', () => {
    const mod = defineAdaptiveModule();
    expect(mod.meta.name).toBe('@adaptive-bundle/nuxt');
    expect(mod.meta.configKey).toBe('adaptive');
  });

  it('has default options', () => {
    const mod = defineAdaptiveModule();
    expect(mod.defaults).toEqual({
      report: true,
      reportFormat: 'console',
      clientHints: true,
    });
  });

  it('hooks into vite:extendConfig to add plugin', () => {
    const mod = defineAdaptiveModule();
    const hookCallback = vi.fn();
    const nuxt = {
      hook: vi.fn((name: string, cb: unknown) => {
        if (name === 'vite:extendConfig') hookCallback.mockImplementation(cb as never);
      }),
      options: { serverHandlers: [] as unknown[] },
    };

    mod.setup({ clientHints: true } as never, nuxt as never);

    expect(nuxt.hook).toHaveBeenCalledWith('vite:extendConfig', expect.any(Function));

    const viteConfig = { plugins: [] as unknown[] };
    hookCallback(viteConfig);
    expect(viteConfig.plugins).toHaveLength(1);
  });

  it('registers server handler when clientHints enabled', () => {
    const mod = defineAdaptiveModule();
    const nuxt = {
      hook: vi.fn(),
      options: { serverHandlers: [] as unknown[] },
    };

    mod.setup({ clientHints: true } as never, nuxt as never);
    expect(nuxt.options.serverHandlers).toHaveLength(1);
    expect(nuxt.options.serverHandlers[0]).toHaveProperty('middleware', true);
  });

  it('skips server handler when clientHints disabled', () => {
    const mod = defineAdaptiveModule();
    const nuxt = {
      hook: vi.fn(),
      options: { serverHandlers: [] as unknown[] },
    };

    mod.setup({ clientHints: false } as never, nuxt as never);
    expect(nuxt.options.serverHandlers).toHaveLength(0);
  });

  it('creates vite config plugins array if missing', () => {
    const mod = defineAdaptiveModule();
    let viteCallback: (config: { plugins?: unknown[] }) => void;

    const nuxt = {
      hook: vi.fn((name: string, cb: (config: { plugins?: unknown[] }) => void) => {
        if (name === 'vite:extendConfig') viteCallback = cb;
      }),
      options: { serverHandlers: [] as unknown[] },
    };

    mod.setup({} as never, nuxt as never);

    const config: { plugins?: unknown[] } = {};
    viteCallback!(config);
    expect(config.plugins).toHaveLength(1);
  });
});
