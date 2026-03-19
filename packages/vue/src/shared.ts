import { defineComponent, h, type Component } from 'vue';
import type { Tier } from '@adaptive-bundle/core';

export type ImportFn = () => Promise<{ default: Component }>;

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

export function layoutStyle(layout?: LayoutConfig): Record<string, string> | undefined {
  if (!layout) return undefined;
  const style: Record<string, string> = {};
  if (layout.width) style.width = layout.width;
  if (layout.height) style.height = layout.height;
  if (layout.aspectRatio) style['aspect-ratio'] = layout.aspectRatio;
  return style;
}

export function makeErrorComponent(fallback: Component | undefined, name: string): Component {
  return defineComponent({
    name: 'AdaptiveError',
    render() {
      return h(
        'div',
        { 'data-adaptive': name, 'data-adaptive-error': '' },
        fallback ? [h(fallback)] : undefined,
      );
    },
  });
}

export function unwrap(mod: { default: Component }): Component {
  return mod.default;
}

export function isVNode(value: unknown): value is import('vue').VNode {
  return value !== null && typeof value === 'object' && '__v_isVNode' in (value as object);
}
