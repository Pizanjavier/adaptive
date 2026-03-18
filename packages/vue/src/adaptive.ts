import { defineAsyncComponent, defineComponent, h, type Component, type VNode } from 'vue';
import { getDeviceProfile, type Tier } from '@adaptive-bundle/core';
import { loadWithFallback } from './error-recovery.js';

type ImportFn = () => Promise<{ default: Component }>;

interface LayoutConfig {
  width?: string;
  height?: string;
  aspectRatio?: string;
}

interface BaseConfig {
  fallback?: Component;
  layout?: LayoutConfig;
  name?: string;
  loading?: 'eager' | 'lazy' | 'viewport';
  onError?: (error: Error, boundaryName: string) => void;
}

interface ExclusionConfig extends BaseConfig {
  component: ImportFn;
  lowFallback: VNode | Component | null;
}

interface VariantConfig extends BaseConfig {
  high: ImportFn;
  low: ImportFn;
  medium?: ImportFn;
  thresholds?: { high?: number; low?: number };
}

type AdaptiveConfig = ExclusionConfig | VariantConfig;

function isExclusion(c: AdaptiveConfig): c is ExclusionConfig {
  return 'component' in c;
}

function resolveTierFromScore(
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

function layoutStyle(layout?: LayoutConfig): Record<string, string> | undefined {
  if (!layout) return undefined;
  const style: Record<string, string> = {};
  if (layout.width) style.width = layout.width;
  if (layout.height) style.height = layout.height;
  if (layout.aspectRatio) style['aspect-ratio'] = layout.aspectRatio;
  return style;
}

function makeErrorComponent(fallback: Component | undefined, name: string): Component {
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

function unwrap(mod: { default: Component }): Component {
  return mod.default;
}

function buildExclusion(config: ExclusionConfig, name: string): Component {
  const AsyncComponent = defineAsyncComponent({
    loader: () =>
      loadWithFallback(config.component)
        .then(unwrap)
        .catch((err) => {
          config.onError?.(err as Error, name);
          return makeErrorComponent(config.fallback, name);
        }),
    loadingComponent: config.fallback,
  });

  return defineComponent({
    name: `Adaptive(${name})`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      const profile = getDeviceProfile();
      return () => {
        if (profile.tier === 'low') {
          return h('div', { 'data-adaptive': name, style: layoutStyle(config.layout) }, [
            isVNode(config.lowFallback)
              ? config.lowFallback
              : config.lowFallback
                ? h(config.lowFallback as Component)
                : null,
          ]);
        }
        return h('div', { 'data-adaptive': name, style: layoutStyle(config.layout) }, [
          h(AsyncComponent, attrs),
        ]);
      };
    },
  });
}

function isVNode(value: unknown): value is VNode {
  return value !== null && typeof value === 'object' && '__v_isVNode' in (value as object);
}

function buildVariant(config: VariantConfig, name: string): Component {
  const asyncCache = new Map<Tier, Component>();

  function getAsync(tier: Tier): Component {
    if (asyncCache.has(tier)) return asyncCache.get(tier)!;

    const importMap: Record<Tier, ImportFn | undefined> = {
      high: config.high,
      medium: config.medium,
      low: config.low,
    };

    const primary = importMap[tier] ?? config.low;
    const fallbackImport = tier === 'low' ? config.high : config.low;

    const AsyncComp = defineAsyncComponent({
      loader: () =>
        loadWithFallback(primary, fallbackImport)
          .then(unwrap)
          .catch((err) => {
            config.onError?.(err as Error, name);
            return makeErrorComponent(config.fallback, name);
          }),
      loadingComponent: config.fallback,
    });

    asyncCache.set(tier, AsyncComp);
    return AsyncComp;
  }

  return defineComponent({
    name: `Adaptive(${name})`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      const profile = getDeviceProfile();
      const tier = resolveTierFromScore(profile.score, config.thresholds, !!config.medium);
      const AsyncComponent = getAsync(tier);

      return () =>
        h('div', { 'data-adaptive': name, style: layoutStyle(config.layout) }, [
          h(AsyncComponent, attrs),
        ]);
    },
  });
}

export function adaptive(config: AdaptiveConfig): Component {
  const boundaryName = config.name ?? 'adaptive';
  if (isExclusion(config)) {
    return buildExclusion(config, boundaryName);
  }
  return buildVariant(config, boundaryName);
}
