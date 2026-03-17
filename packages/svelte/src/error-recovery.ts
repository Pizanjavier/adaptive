type ImportFn<T> = () => Promise<{ default: T }>;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function loadWithRetry<T>(importFn: ImportFn<T>): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch {
    await delay(1000);
    return importFn();
  }
}

export async function loadWithFallback<T>(
  primary: ImportFn<T>,
  fallback?: ImportFn<T>,
): Promise<{ default: T }> {
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
