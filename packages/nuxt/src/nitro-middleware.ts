import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolveTierFromHeaders } from '@adaptive/core/server';

export interface NitroMiddlewareOptions {
  cookieName: string;
  cookieMaxAge: number;
}

const DEFAULT_OPTIONS: NitroMiddlewareOptions = {
  cookieName: 'adaptive_tier_hint',
  cookieMaxAge: 86400,
};

export function createAdaptiveMiddleware(options: Partial<NitroMiddlewareOptions> = {}) {
  const { cookieName, cookieMaxAge } = { ...DEFAULT_OPTIONS, ...options };

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const headers = req.headers as Record<string, string | undefined>;
    const tier = resolveTierFromHeaders(headers);

    const cookie = `${cookieName}=${tier}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`;
    const existing = res.getHeader('Set-Cookie');

    if (existing) {
      const cookies = Array.isArray(existing) ? existing : [String(existing)];
      res.setHeader('Set-Cookie', [...cookies, cookie]);
    } else {
      res.setHeader('Set-Cookie', cookie);
    }

    next();
  };
}
