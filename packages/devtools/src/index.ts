import type { OverlayConfig, OverlayInstance } from './types.js';
import { createOverlay } from './overlay/create.js';

let instance: OverlayInstance | null = null;

export function init(config?: OverlayConfig): void {
  if (typeof document === 'undefined') return;

  if (instance) {
    instance.destroy();
    instance = null;
  }

  instance = createOverlay(config);
}

export function destroy(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

export type { OverlayConfig, OverlayInstance, BoundaryDecision, OverlayState } from './types.js';
