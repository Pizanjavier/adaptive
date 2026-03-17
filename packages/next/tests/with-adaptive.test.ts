import { describe, it, expect, vi } from 'vitest';
import { withAdaptive } from '../src/with-adaptive.js';

describe('withAdaptive', () => {
  it('returns a config object with webpack function', () => {
    const config = withAdaptive({});
    expect(typeof config.webpack).toBe('function');
  });

  it('preserves existing config properties', () => {
    const config = withAdaptive({
      reactStrictMode: true,
      images: { domains: ['example.com'] },
    });
    expect(config.reactStrictMode).toBe(true);
    expect(config.images).toEqual({ domains: ['example.com'] });
  });

  it('adds webpack plugin in production client builds', () => {
    const config = withAdaptive({});
    const webpackConfig = { plugins: [] as unknown[] };
    const context = { dev: false, isServer: false };

    config.webpack!(webpackConfig as never, context as never);
    expect(webpackConfig.plugins).toHaveLength(1);
    expect(webpackConfig.plugins[0]).toHaveProperty('apply');
  });

  it('does not add plugin in dev mode', () => {
    const config = withAdaptive({});
    const webpackConfig = { plugins: [] as unknown[] };
    const context = { dev: true, isServer: false };

    config.webpack!(webpackConfig as never, context as never);
    expect(webpackConfig.plugins).toHaveLength(0);
  });

  it('does not add plugin for server builds', () => {
    const config = withAdaptive({});
    const webpackConfig = { plugins: [] as unknown[] };
    const context = { dev: false, isServer: true };

    config.webpack!(webpackConfig as never, context as never);
    expect(webpackConfig.plugins).toHaveLength(0);
  });

  it('chains user webpack config', () => {
    const userWebpack = vi.fn((config: unknown) => config);
    const config = withAdaptive({ webpack: userWebpack as never });
    const webpackConfig = { plugins: [] as unknown[] };
    const context = { dev: false, isServer: false };

    config.webpack!(webpackConfig as never, context as never);
    expect(userWebpack).toHaveBeenCalledWith(webpackConfig, context);
  });

  it('passes adaptive config to plugin', () => {
    const config = withAdaptive({
      adaptive: { report: false, reportFormat: 'json' },
    });
    const webpackConfig = { plugins: [] as unknown[] };
    const context = { dev: false, isServer: false };

    config.webpack!(webpackConfig as never, context as never);
    expect(webpackConfig.plugins).toHaveLength(1);
  });
});
