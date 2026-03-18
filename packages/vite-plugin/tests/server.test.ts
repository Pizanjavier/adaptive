import { describe, it, expect, vi } from 'vitest';
import { createDevMiddleware } from '../src/server/middleware.js';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ViteDevServer } from 'vite';

function createMockProvider() {
  return {
    getAnalyses: vi.fn(() => []),
    getOpportunities: vi.fn(() => []),
  };
}

function createMockServer(): ViteDevServer {
  return {
    ws: { send: vi.fn() },
  } as unknown as ViteDevServer;
}

function createMockReq(url: string, method = 'GET'): IncomingMessage {
  return { url, method } as IncomingMessage;
}

function createMockRes() {
  const res = {
    setHeader: vi.fn(),
    end: vi.fn(),
    statusCode: 200,
  };
  return res as unknown as ServerResponse;
}

describe('createDevMiddleware', () => {
  it('serves dashboard HTML at /__adaptive', () => {
    const provider = createMockProvider();
    const server = createMockServer();
    const middleware = createDevMiddleware(provider, server);

    const req = createMockReq('/__adaptive');
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    expect(res.end).toHaveBeenCalled();
    const html = (res.end as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(html).toContain('Adaptive Dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  it('serves JSON at /__adaptive/api/analysis', () => {
    const provider = createMockProvider();
    const server = createMockServer();
    const middleware = createDevMiddleware(provider, server);

    const req = createMockReq('/__adaptive/api/analysis');
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    const json = JSON.parse((res.end as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(json).toEqual({ boundaries: [], opportunities: [] });
  });

  it('calls next() for unrelated routes', () => {
    const provider = createMockProvider();
    const server = createMockServer();
    const middleware = createDevMiddleware(provider, server);

    const req = createMockReq('/other');
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });
});
