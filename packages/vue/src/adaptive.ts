import {
  defineAsyncComponent,
  defineComponent,
  h,
  ref,
  onMounted,
  onUnmounted,
  type Component,
  type VNode,
} from 'vue';
import { getDeviceProfile, type Tier } from '@adaptive-bundle/core';
import { loadWithFallback } from './error-recovery.js';
import {
  resolveTierFromScore,
  layoutStyle,
  makeErrorComponent,
  unwrap,
  isVNode,
  type ImportFn,
  type LayoutConfig,
} from './shared.js';
import { preloadImport, observeViewport } from './loading.js';

interface BaseConfig {
  fallback?: Component;
  layout?: LayoutConfig;
  name?: string;
  loading?: 'eager' | 'lazy' | 'viewport';
  onError?: (error: Error, boundaryName: string) => void;
  requires?: string[];
  capabilityFallback?: ImportFn;
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

function makeLoader(
  importFn: ImportFn,
  config: BaseConfig,
  name: string,
  fallbackImport?: ImportFn,
) {
  const primary = config.loading === 'eager' ? preloadImport(importFn) : importFn;
  return () =>
    loadWithFallback(primary, fallbackImport)
      .then(unwrap)
      .catch((err) => {
        config.onError?.(err as Error, name);
        return makeErrorComponent(config.fallback, name);
      });
}

function buildExclusion(config: ExclusionConfig, name: string): Component {
  const loader = makeLoader(config.component, config, name);
  const AsyncComponent = defineAsyncComponent({
    loader,
    loadingComponent: config.fallback,
  });
  const loadingAttr = config.loading ?? 'viewport';

  return defineComponent({
    name: `Adaptive(${name})`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      const profile = getDeviceProfile();

      if (profile.tier === 'low') {
        return () =>
          h(
            'div',
            {
              'data-adaptive': name,
              'data-adaptive-loading': loadingAttr,
              style: layoutStyle(config.layout),
            },
            [
              isVNode(config.lowFallback)
                ? config.lowFallback
                : config.lowFallback
                  ? h(config.lowFallback as Component)
                  : null,
            ],
          );
      }

      if (config.loading === 'lazy') {
        const visible = ref(false);
        const wrapperRef = ref<HTMLElement | null>(null);
        let cleanup: (() => void) | undefined;

        onMounted(() => {
          if (wrapperRef.value) {
            cleanup = observeViewport(wrapperRef.value, () => {
              visible.value = true;
            });
          }
        });
        onUnmounted(() => cleanup?.());

        return () =>
          h(
            'div',
            {
              ref: wrapperRef,
              'data-adaptive': name,
              'data-adaptive-loading': loadingAttr,
              style: layoutStyle(config.layout),
            },
            [
              visible.value
                ? h(AsyncComponent, attrs)
                : config.fallback
                  ? h(config.fallback)
                  : null,
            ],
          );
      }

      return () =>
        h(
          'div',
          {
            'data-adaptive': name,
            'data-adaptive-loading': loadingAttr,
            style: layoutStyle(config.layout),
          },
          [h(AsyncComponent, attrs)],
        );
    },
  });
}

function buildVariant(config: VariantConfig, name: string): Component {
  const asyncCache = new Map<Tier, Component>();

  if (config.loading === 'eager') {
    preloadImport(config.high);
    preloadImport(config.low);
    if (config.medium) preloadImport(config.medium);
  }

  function getAsync(tier: Tier): Component {
    if (asyncCache.has(tier)) return asyncCache.get(tier)!;

    const importMap: Record<Tier, ImportFn | undefined> = {
      high: config.high,
      medium: config.medium,
      low: config.low,
    };
    const primary = importMap[tier] ?? config.low;
    const fallbackImport = tier === 'low' ? config.high : config.low;
    const loader = makeLoader(primary, config, name, fallbackImport);

    const AsyncComp = defineAsyncComponent({
      loader,
      loadingComponent: config.fallback,
    });
    asyncCache.set(tier, AsyncComp);
    return AsyncComp;
  }

  const loadingAttr = config.loading ?? 'viewport';

  return defineComponent({
    name: `Adaptive(${name})`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      const profile = getDeviceProfile();
      const tier = resolveTierFromScore(profile.score, config.thresholds, !!config.medium);
      const AsyncComponent = getAsync(tier);

      if (config.loading === 'lazy') {
        const visible = ref(false);
        const wrapperRef = ref<HTMLElement | null>(null);
        let cleanup: (() => void) | undefined;

        onMounted(() => {
          if (wrapperRef.value) {
            cleanup = observeViewport(wrapperRef.value, () => {
              visible.value = true;
            });
          }
        });
        onUnmounted(() => cleanup?.());

        return () =>
          h(
            'div',
            {
              ref: wrapperRef,
              'data-adaptive': name,
              'data-adaptive-loading': loadingAttr,
              style: layoutStyle(config.layout),
            },
            [
              visible.value
                ? h(AsyncComponent, attrs)
                : config.fallback
                  ? h(config.fallback)
                  : null,
            ],
          );
      }

      return () =>
        h(
          'div',
          {
            'data-adaptive': name,
            'data-adaptive-loading': loadingAttr,
            style: layoutStyle(config.layout),
          },
          [h(AsyncComponent, attrs)],
        );
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
