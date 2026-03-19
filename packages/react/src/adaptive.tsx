import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { getDeviceProfile, type Tier } from '@adaptive-bundle/core';
import { loadWithFallback } from './error-recovery.js';
import {
  resolveTierFromScore,
  layoutStyle,
  makeErrorComponent,
  type LayoutConfig,
} from './shared.js';
import { preloadImport, ViewportWrapper } from './loading.js';

type ImportFn<P> = () => Promise<{ default: ComponentType<P> }>;

interface BaseConfig {
  fallback?: ReactElement;
  layout?: LayoutConfig;
  name?: string;
  loading?: 'eager' | 'lazy' | 'viewport';
  onError?: (error: Error, boundaryName: string) => void;
  /** Build-time only: capabilities required to include this component. Pruned by vite plugin. */
  requires?: string[];
  /** Build-time only: fallback import when required capabilities are missing. Pruned by vite plugin. */
  capabilityFallback?: ImportFn<Record<string, unknown>>;
}

interface ExclusionConfig<P> extends BaseConfig {
  component: ImportFn<P>;
  lowFallback: ReactElement | null;
}

interface VariantConfig<P> extends BaseConfig {
  high: ImportFn<P>;
  low: ImportFn<P>;
  medium?: ImportFn<P>;
  thresholds?: { high?: number; low?: number };
}

type AdaptiveConfig<P> = ExclusionConfig<P> | VariantConfig<P>;

function isExclusion<P>(c: AdaptiveConfig<P>): c is ExclusionConfig<P> {
  return 'component' in c;
}

/**
 * Create an adaptive component with tier-based loading.
 * @example
 * ```tsx
 * // Exclusion: heavy component excluded on low-tier
 * const Map = adaptive({
 *   component: () => import('./MapboxMap'),
 *   lowFallback: <img src="/static-map.png" alt="Map" />,
 * });
 *
 * // Two-variant: separate high/low implementations
 * const Editor = adaptive({
 *   high: () => import('./RichEditor'),
 *   low: () => import('./BasicEditor'),
 * });
 * ```
 */
export function adaptive<P extends Record<string, unknown>>(
  config: AdaptiveConfig<P>,
): ComponentType<P> {
  const boundaryName = config.name ?? 'adaptive';
  if (isExclusion(config)) {
    return buildExclusion(config, boundaryName);
  }
  return buildVariant(config, boundaryName);
}

function buildExclusion<P extends Record<string, unknown>>(
  config: ExclusionConfig<P>,
  name: string,
): ComponentType<P> {
  const importFn = config.loading === 'eager' ? preloadImport(config.component) : config.component;

  const LazyComponent = lazy(() =>
    loadWithFallback(importFn).catch((err) => {
      config.onError?.(err as Error, name);
      return { default: makeErrorComponent(config.fallback, name) as ComponentType<P> };
    }),
  );

  function AdaptiveExclusion(props: P) {
    const profile = getDeviceProfile();
    const loadingAttr = config.loading ?? 'viewport';
    if (profile.tier === 'low') {
      return (
        <div
          data-adaptive={name}
          data-adaptive-loading={loadingAttr}
          style={layoutStyle(config.layout)}
        >
          {config.lowFallback}
        </div>
      );
    }

    const content = (
      <div
        data-adaptive={name}
        data-adaptive-loading={loadingAttr}
        style={layoutStyle(config.layout)}
      >
        <Suspense fallback={config.fallback ?? null}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LazyComponent {...(props as any)} />
        </Suspense>
      </div>
    );

    if (config.loading === 'lazy') {
      return (
        <ViewportWrapper fallback={config.fallback} layout={config.layout} name={name}>
          {content}
        </ViewportWrapper>
      );
    }

    return content;
  }

  AdaptiveExclusion.displayName = `Adaptive(${name})`;
  return AdaptiveExclusion;
}

function buildVariant<P extends Record<string, unknown>>(
  config: VariantConfig<P>,
  name: string,
): ComponentType<P> {
  const lazyCache = new Map<Tier, ReturnType<typeof lazy>>();

  if (config.loading === 'eager') {
    preloadImport(config.high);
    preloadImport(config.low);
    if (config.medium) preloadImport(config.medium);
  }

  function getLazy(tier: Tier) {
    if (lazyCache.has(tier)) return lazyCache.get(tier)!;

    const importMap: Record<Tier, ImportFn<P> | undefined> = {
      high: config.high,
      medium: config.medium,
      low: config.low,
    };

    const primary = importMap[tier] ?? config.low;
    const fallbackImport = tier === 'low' ? config.high : config.low;

    const LazyComp = lazy(() =>
      loadWithFallback(primary, fallbackImport).catch((err) => {
        config.onError?.(err as Error, name);
        return { default: makeErrorComponent(config.fallback, name) as ComponentType<P> };
      }),
    );

    lazyCache.set(tier, LazyComp);
    return LazyComp;
  }

  function AdaptiveVariant(props: P) {
    const profile = getDeviceProfile();
    const tier = resolveTierFromScore(profile.score, config.thresholds, !!config.medium);
    const LazyComponent = getLazy(tier);

    const loadingAttr = config.loading ?? 'viewport';
    const content = (
      <div
        data-adaptive={name}
        data-adaptive-loading={loadingAttr}
        style={layoutStyle(config.layout)}
      >
        <Suspense fallback={config.fallback ?? null}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LazyComponent {...(props as any)} />
        </Suspense>
      </div>
    );

    if (config.loading === 'lazy') {
      return (
        <ViewportWrapper fallback={config.fallback} layout={config.layout} name={name}>
          {content}
        </ViewportWrapper>
      );
    }

    return content;
  }

  AdaptiveVariant.displayName = `Adaptive(${name})`;
  return AdaptiveVariant;
}
