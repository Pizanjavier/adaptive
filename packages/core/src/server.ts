import type { Tier } from './types.js';

interface HeadersLike {
  get?: (name: string) => string | null;
  [key: string]: string | undefined | ((name: string) => string | null);
}

function getHeader(headers: HeadersLike, name: string): string | null {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const val = headers[key];
      return typeof val === 'string' ? val : null;
    }
  }
  return null;
}

export function resolveTierFromHeaders(headers: HeadersLike): Tier {
  const memory = getHeader(headers, 'Device-Memory');
  const mobile = getHeader(headers, 'Sec-CH-UA-Mobile');

  if (memory) {
    const memGB = parseFloat(memory);
    if (!isNaN(memGB)) {
      if (memGB <= 2) return 'low';
      if (memGB >= 8) return 'high';
    }
  }

  if (mobile === '?1') {
    if (memory) {
      const memGB = parseFloat(memory);
      if (!isNaN(memGB) && memGB <= 4) return 'low';
    }
    return 'low';
  }

  if (memory) {
    const memGB = parseFloat(memory);
    if (!isNaN(memGB) && memGB >= 4) return 'high';
  }

  return 'low';
}
