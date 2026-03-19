import React, { type ComponentType, type ReactElement } from 'react';
import type { Tier } from '@adaptive-bundle/core';

export interface LayoutConfig {
  width?: string;
  height?: string;
  aspectRatio?: string;
}

export function resolveTierFromScore(
  score: number,
  thresholds?: { high?: number; low?: number },
  hasMedium?: boolean,
): Tier {
  if (thresholds || hasMedium) {
    const high = thresholds?.high ?? 0.65;
    const low = thresholds?.low ?? 0.35;
    if (score >= high) return 'high';
    if (score <= low) return 'low';
    return 'medium';
  }
  return score >= 0.5 ? 'high' : 'low';
}

export function layoutStyle(layout?: LayoutConfig): React.CSSProperties | undefined {
  if (!layout) return undefined;
  return {
    width: layout.width,
    height: layout.height,
    aspectRatio: layout.aspectRatio,
  };
}

export function makeErrorComponent(
  fallback: ReactElement | undefined,
  name: string,
): ComponentType<unknown> {
  return function ErrorFallback() {
    if (!fallback) return <div data-adaptive={name} data-adaptive-error />;
    return (
      <div data-adaptive={name} data-adaptive-error>
        {fallback}
      </div>
    );
  };
}
