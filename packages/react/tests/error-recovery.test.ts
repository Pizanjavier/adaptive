import { describe, it, expect, vi } from 'vitest';
import { loadWithRetry, loadWithFallback } from '../src/error-recovery.js';

const makeModule = <T>(val: T) => ({ default: val });

describe('loadWithRetry', () => {
  it('returns module on first success', async () => {
    const importFn = vi.fn().mockResolvedValue(makeModule('ok'));
    const result = await loadWithRetry(importFn as never);
    expect(result.default).toBe('ok');
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('retries once after failure', async () => {
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(makeModule('ok'));
    const result = await loadWithRetry(importFn as never);
    expect(result.default).toBe('ok');
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('throws after two failures', async () => {
    const importFn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(loadWithRetry(importFn as never)).rejects.toThrow('fail');
    expect(importFn).toHaveBeenCalledTimes(2);
  });
});

describe('loadWithFallback', () => {
  it('uses fallback when primary fails', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('fail'));
    const fallback = vi.fn().mockResolvedValue(makeModule('fallback'));
    const result = await loadWithFallback(primary as never, fallback as never);
    expect(result.default).toBe('fallback');
  });

  it('throws primary error when both fail', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('primary'));
    const fallback = vi.fn().mockRejectedValue(new Error('fallback'));
    await expect(loadWithFallback(primary as never, fallback as never)).rejects.toThrow('primary');
  });

  it('returns primary on success without trying fallback', async () => {
    const primary = vi.fn().mockResolvedValue(makeModule('ok'));
    const fallback = vi.fn();
    const result = await loadWithFallback(primary as never, fallback as never);
    expect(result.default).toBe('ok');
    expect(fallback).not.toHaveBeenCalled();
  });
});
