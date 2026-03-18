import type { DeviceProfile, Tier } from '@adaptive-bundle/core';

export type OverlayPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface OverlayConfig {
  position?: OverlayPosition;
  collapsed?: boolean;
}

export interface BoundaryDecision {
  name: string;
  loadedVariant: string;
  hasError: boolean;
}

export interface OverlayState {
  profile: DeviceProfile;
  boundaries: BoundaryDecision[];
  forcedTier: Tier | null;
}

export interface OverlayInstance {
  update(): void;
  destroy(): void;
}
