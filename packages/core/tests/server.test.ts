import { describe, it, expect } from 'vitest';
import { resolveTierFromHeaders } from '../src/server.js';

describe('resolveTierFromHeaders', () => {
  it('returns low for Device-Memory <= 2', () => {
    expect(resolveTierFromHeaders({ 'Device-Memory': '1' })).toBe('low');
    expect(resolveTierFromHeaders({ 'Device-Memory': '2' })).toBe('low');
  });

  it('returns high for Device-Memory >= 8', () => {
    expect(resolveTierFromHeaders({ 'Device-Memory': '8' })).toBe('high');
    expect(resolveTierFromHeaders({ 'Device-Memory': '16' })).toBe('high');
  });

  it('returns low for mobile with low memory', () => {
    expect(
      resolveTierFromHeaders({
        'Sec-CH-UA-Mobile': '?1',
        'Device-Memory': '4',
      }),
    ).toBe('low');
  });

  it('returns low for mobile without memory info', () => {
    expect(resolveTierFromHeaders({ 'Sec-CH-UA-Mobile': '?1' })).toBe('low');
  });

  it('returns high for desktop with >= 4GB', () => {
    expect(resolveTierFromHeaders({ 'Device-Memory': '4' })).toBe('high');
  });

  it('returns low as fallback with no headers', () => {
    expect(resolveTierFromHeaders({})).toBe('low');
  });

  it('works with Headers-like objects (get method)', () => {
    const headers = new Map<string, string>();
    headers.set('Device-Memory', '8');
    expect(resolveTierFromHeaders(headers as unknown as Record<string, string>)).toBe('high');
  });
});
