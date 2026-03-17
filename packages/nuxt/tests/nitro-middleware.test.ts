import { describe, it, expect, vi } from 'vitest';
import { createAdaptiveMiddleware } from '../src/nitro-middleware.js';

function createMockReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as never;
  const res = {
    _headers: {} as Record<string, string | string[]>,
    getHeader(name: string) {
      return this._headers[name.toLowerCase()];
    },
    setHeader(name: string, value: string | string[]) {
      this._headers[name.toLowerCase()] = value;
    },
  } as never;
  return { req, res };
}

describe('createAdaptiveMiddleware', () => {
  it('creates middleware function', () => {
    const middleware = createAdaptiveMiddleware();
    expect(typeof middleware).toBe('function');
  });

  it('sets tier cookie based on headers', () => {
    const middleware = createAdaptiveMiddleware();
    const { req, res } = createMockReqRes({ 'device-memory': '2' });
    const next = vi.fn();

    middleware(req, res, next);

    const setCookie = (res as { _headers: Record<string, string | string[]> })._headers[
      'set-cookie'
    ];
    expect(setCookie).toContain('adaptive_tier_hint=low');
    expect(next).toHaveBeenCalled();
  });

  it('resolves high tier for high-memory devices', () => {
    const middleware = createAdaptiveMiddleware();
    const { req, res } = createMockReqRes({ 'device-memory': '8' });
    const next = vi.fn();

    middleware(req, res, next);

    const setCookie = (res as { _headers: Record<string, string | string[]> })._headers[
      'set-cookie'
    ];
    expect(setCookie).toContain('adaptive_tier_hint=high');
  });

  it('uses custom cookie name', () => {
    const middleware = createAdaptiveMiddleware({ cookieName: 'device_tier' });
    const { req, res } = createMockReqRes({ 'device-memory': '2' });
    const next = vi.fn();

    middleware(req, res, next);

    const setCookie = (res as { _headers: Record<string, string | string[]> })._headers[
      'set-cookie'
    ];
    expect(setCookie).toContain('device_tier=low');
  });

  it('uses custom max age', () => {
    const middleware = createAdaptiveMiddleware({ cookieMaxAge: 3600 });
    const { req, res } = createMockReqRes({ 'device-memory': '2' });
    const next = vi.fn();

    middleware(req, res, next);

    const setCookie = (res as { _headers: Record<string, string | string[]> })._headers[
      'set-cookie'
    ];
    expect(setCookie).toContain('Max-Age=3600');
  });

  it('preserves existing set-cookie headers', () => {
    const middleware = createAdaptiveMiddleware();
    const { req, res } = createMockReqRes({ 'device-memory': '2' });
    (res as { _headers: Record<string, string> })._headers['set-cookie'] = 'existing=value';
    const next = vi.fn();

    middleware(req, res, next);

    const setCookie = (res as { _headers: Record<string, string | string[]> })._headers[
      'set-cookie'
    ];
    expect(Array.isArray(setCookie)).toBe(true);
    expect(setCookie).toContain('existing=value');
  });

  it('always calls next', () => {
    const middleware = createAdaptiveMiddleware();
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
