import type { AdaptiveNuxtConfig } from './types.js';
import { adaptive } from '@adaptive/vite-plugin';

export interface NuxtModule {
  meta: { name: string; configKey: string };
  defaults: Partial<AdaptiveNuxtConfig>;
  setup(options: AdaptiveNuxtConfig, nuxt: NuxtInstance): void;
}

interface NuxtInstance {
  hook(name: string, callback: (config: ViteConfig) => void): void;
  options: {
    serverHandlers: ServerHandler[];
  };
}

interface ViteConfig {
  plugins?: unknown[];
}

interface ServerHandler {
  handler: string;
  middleware?: boolean;
}

export function defineAdaptiveModule(): NuxtModule {
  return {
    meta: { name: '@adaptive/nuxt', configKey: 'adaptive' },
    defaults: { report: true, reportFormat: 'console', clientHints: true },

    setup(options: AdaptiveNuxtConfig, nuxt: NuxtInstance) {
      nuxt.hook('vite:extendConfig', (config: ViteConfig) => {
        config.plugins = config.plugins || [];
        config.plugins.push(adaptive(options));
      });

      if (options.clientHints !== false) {
        nuxt.options.serverHandlers.push({
          handler: new URL('./nitro-middleware.js', import.meta.url).pathname,
          middleware: true,
        });
      }
    },
  };
}
