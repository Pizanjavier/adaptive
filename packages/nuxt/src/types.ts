import type { AdaptivePluginConfig } from '@adaptive/vite-plugin';

export interface AdaptiveNuxtConfig extends AdaptivePluginConfig {
  clientHints?: boolean;
  cookieName?: string;
  cookieMaxAge?: number;
}
