import type { NextConfigWithAdaptive, WebpackConfig, WebpackContext } from './types.js';
import { AdaptiveWebpackPlugin } from './webpack/plugin.js';

export function withAdaptive<T extends NextConfigWithAdaptive>(nextConfig: T): T {
  const adaptiveConfig = nextConfig.adaptive ?? {};
  const userWebpack = nextConfig.webpack;

  return {
    ...nextConfig,
    webpack(config: WebpackConfig, context: WebpackContext): WebpackConfig {
      if (!context.dev && !context.isServer) {
        config.plugins.push(new AdaptiveWebpackPlugin(adaptiveConfig));
      }

      if (typeof userWebpack === 'function') {
        return userWebpack(config, context);
      }

      return config;
    },
  };
}
