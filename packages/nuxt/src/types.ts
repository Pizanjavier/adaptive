import type { AdaptivePluginConfig } from '@adaptive-bundle/vite-plugin';

export interface AdaptiveNuxtConfig extends AdaptivePluginConfig {
  clientHints?: boolean;
  cookieName?: string;
  cookieMaxAge?: number;
}
