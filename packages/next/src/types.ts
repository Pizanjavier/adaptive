import type { AdaptivePluginConfig } from '@adaptive-bundle/vite-plugin';

export type NextAdaptiveConfig = AdaptivePluginConfig;

export interface NextConfigWithAdaptive {
  adaptive?: NextAdaptiveConfig;
  webpack?: (config: WebpackConfig, context: WebpackContext) => WebpackConfig;
  [key: string]: unknown;
}

export interface WebpackConfig {
  plugins: WebpackPlugin[];
  optimization?: {
    splitChunks?: {
      cacheGroups?: Record<string, CacheGroupConfig>;
    };
  };
  [key: string]: unknown;
}

export interface CacheGroupConfig {
  name: string;
  test: RegExp;
  chunks: 'all' | 'async' | 'initial';
  enforce: boolean;
  priority?: number;
}

export interface WebpackContext {
  dev: boolean;
  isServer: boolean;
  [key: string]: unknown;
}

export interface WebpackPlugin {
  apply(compiler: WebpackCompiler): void;
}

export interface WebpackCompiler {
  hooks: {
    thisCompilation: WebpackHook;
    done: WebpackHook;
  };
}

export interface WebpackCompilation {
  modules: Set<WebpackModule>;
}

export interface WebpackModule {
  resource?: string;
  _source?: { source(): string };
  dependencies?: Array<{ request?: string; module?: WebpackModule }>;
}

export interface WebpackHook {
  tap(name: string, callback: (...args: unknown[]) => void): void;
}
