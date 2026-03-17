import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getDeviceProfile, type DeviceProfile } from '@adaptive/core';

export const AdaptiveContext = createContext<DeviceProfile | null>(null);

/**
 * Provider that caches the device profile for all child hooks.
 * @example
 * ```tsx
 * <AdaptiveProvider>
 *   <App />
 * </AdaptiveProvider>
 * ```
 */
export function AdaptiveProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DeviceProfile | null>(null);

  useEffect(() => {
    setProfile(getDeviceProfile());
  }, []);

  return <AdaptiveContext.Provider value={profile}>{children}</AdaptiveContext.Provider>;
}

export function useAdaptiveContext(): DeviceProfile | null {
  return useContext(AdaptiveContext);
}
