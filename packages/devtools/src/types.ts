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
  loading?: string;
}

export interface OverlayState {
  profile: DeviceProfile;
  boundaries: BoundaryDecision[];
  forcedTier: Tier | null;
  capabilities: string[];
}

export interface OverlayInstance {
  update(): void;
  destroy(): void;
}
