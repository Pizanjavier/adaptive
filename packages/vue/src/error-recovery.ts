import type { Component } from 'vue';

type ImportFn<P = Record<string, unknown>> = () => Promise<{ default: Component<P> }>;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function loadWithRetry<P>(importFn: ImportFn<P>): Promise<{ default: Component<P> }> {
  try {
    return await importFn();
  } catch {
    await delay(1000);
    return importFn();
  }
}

export async function loadWithFallback<P>(
  primary: ImportFn<P>,
  fallback?: ImportFn<P>,
): Promise<{ default: Component<P> }> {
  try {
    return await loadWithRetry(primary);
  } catch (primaryError) {
    if (fallback) {
      try {
        return await loadWithRetry(fallback);
      } catch {
        throw primaryError;
      }
    }
    throw primaryError;
  }
}
