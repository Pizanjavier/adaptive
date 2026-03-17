import { setContext, getContext } from 'svelte';
import { getDeviceProfile, type DeviceProfile } from '@adaptive/core';

const ADAPTIVE_KEY = Symbol('adaptive-context');

export function setAdaptiveContext(profile?: DeviceProfile): void {
  setContext(ADAPTIVE_KEY, profile ?? getDeviceProfile());
}

export function getAdaptiveContext(): DeviceProfile | null {
  try {
    return getContext<DeviceProfile>(ADAPTIVE_KEY) ?? null;
  } catch {
    return null;
  }
}
