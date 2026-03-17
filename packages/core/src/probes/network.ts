import type { NetworkInfo, EffectiveType } from '../types.js';

interface NetworkConnection {
  effectiveType?: string;
  saveData?: boolean;
}

export function probeNetwork(): NetworkInfo {
  if (typeof navigator === 'undefined') {
    return { effectiveType: null, dataSaver: null };
  }

  const conn = (navigator as { connection?: NetworkConnection }).connection;

  if (!conn) {
    return { effectiveType: null, dataSaver: null };
  }

  const validTypes = ['4g', '3g', '2g', 'slow-2g'];
  const effectiveType = validTypes.includes(conn.effectiveType ?? '')
    ? (conn.effectiveType as EffectiveType)
    : null;

  return {
    effectiveType,
    dataSaver: conn.saveData ?? null,
  };
}
