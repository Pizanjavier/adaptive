import { describe, it, expect, vi } from 'vitest';
import { AdaptiveWebpackPlugin } from '../src/webpack/plugin.js';

describe('AdaptiveWebpackPlugin', () => {
  it('creates plugin instance with default config', () => {
    const plugin = new AdaptiveWebpackPlugin();
    expect(plugin).toBeDefined();
    expect(typeof plugin.apply).toBe('function');
  });

  it('creates plugin instance with custom config', () => {
    const plugin = new AdaptiveWebpackPlugin({
      report: false,
      reportFormat: 'json',
    });
    expect(plugin).toBeDefined();
  });

  it('taps into compiler hooks', () => {
    const plugin = new AdaptiveWebpackPlugin();
    const compilationTap = vi.fn();
    const doneTap = vi.fn();

    const compiler = {
      hooks: {
        thisCompilation: { tap: compilationTap },
        done: { tap: doneTap },
      },
    };

    plugin.apply(compiler as never);
    expect(compilationTap).toHaveBeenCalledWith('AdaptiveWebpackPlugin', expect.any(Function));
    expect(doneTap).toHaveBeenCalledWith('AdaptiveWebpackPlugin', expect.any(Function));
  });

  it('processes modules on afterOptimizeModules', () => {
    const plugin = new AdaptiveWebpackPlugin({ report: false });
    let compilationCallback: (compilation: unknown) => void;

    const compiler = {
      options: {
        optimization: {
          splitChunks: { cacheGroups: {} },
        },
      },
      hooks: {
        thisCompilation: {
          tap(_name: string, cb: (compilation: unknown) => void) {
            compilationCallback = cb;
          },
        },
        done: { tap: vi.fn() },
      },
    };

    plugin.apply(compiler as never);

    const afterOptimizeTap = vi.fn();
    const mockCompilation = {
      modules: new Set([
        {
          resource: '/app/src/App.tsx',
          _source: { source: () => 'const x = 1;' },
          dependencies: [],
        },
      ]),
      hooks: {
        afterOptimizeModules: { tap: afterOptimizeTap },
      },
    };

    compilationCallback!(mockCompilation);
    expect(afterOptimizeTap).toHaveBeenCalledWith('AdaptiveWebpackPlugin', expect.any(Function));
  });

  it('runs analysis when afterOptimizeModules fires', () => {
    const plugin = new AdaptiveWebpackPlugin({ report: false });
    let compilationCallback: (compilation: unknown) => void;
    let afterOptimizeCallback: () => void;

    const compiler = {
      options: {
        optimization: {
          splitChunks: { cacheGroups: {} },
        },
      },
      hooks: {
        thisCompilation: {
          tap(_name: string, cb: (compilation: unknown) => void) {
            compilationCallback = cb;
          },
        },
        done: { tap: vi.fn() },
      },
    };

    plugin.apply(compiler as never);

    const mockCompilation = {
      modules: new Set([
        {
          resource: '/app/src/App.tsx',
          _source: {
            source: () => `
              import { adaptive } from '@adaptive/react';
              const Dashboard = adaptive({
                high: () => import('./DashboardHigh'),
                low: () => import('./DashboardLow'),
              });
            `,
          },
          dependencies: [],
        },
      ]),
      hooks: {
        afterOptimizeModules: {
          tap(_name: string, cb: () => void) {
            afterOptimizeCallback = cb;
          },
        },
      },
    };

    compilationCallback!(mockCompilation);
    // Should not throw
    expect(() => afterOptimizeCallback!()).not.toThrow();
  });
});
