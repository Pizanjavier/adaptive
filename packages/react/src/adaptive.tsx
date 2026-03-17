import React, { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { getDeviceProfile, type Tier } from '@adaptive/core';
import { loadWithFallback } from './error-recovery.js';

type ImportFn<P> = () => Promise<{ default: ComponentType<P> }>;

interface LayoutConfig {
  width?: string;
  height?: string;
  aspectRatio?: string;
}

interface BaseConfig {
  fallback?: ReactElement;
  layout?: LayoutConfig;
  name?: string;
  loading?: 'eager' | 'lazy' | 'viewport';
  onError?: (error: Error, boundaryName: string) => void;
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

function layoutStyle(layout?: LayoutConfig): React.CSSProperties | undefined {
  if (!layout) return undefined;
  return {
    width: layout.width,
    height: layout.height,
    aspectRatio: layout.aspectRatio,
  };
}

function makeErrorComponent(
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
  const LazyComponent = lazy(() =>
    loadWithFallback(config.component).catch((err) => {
      config.onError?.(err as Error, name);
      return { default: makeErrorComponent(config.fallback, name) as ComponentType<P> };
    }),
  );

  function AdaptiveExclusion(props: P) {
    const profile = getDeviceProfile();
    if (profile.tier === 'low') {
      return (
        <div data-adaptive={name} style={layoutStyle(config.layout)}>
          {config.lowFallback}
        </div>
      );
    }
    return (
      <div data-adaptive={name} style={layoutStyle(config.layout)}>
        <Suspense fallback={config.fallback ?? null}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LazyComponent {...(props as any)} />
        </Suspense>
      </div>
    );
  }

  AdaptiveExclusion.displayName = `Adaptive(${name})`;
  return AdaptiveExclusion;
}

function buildVariant<P extends Record<string, unknown>>(
  config: VariantConfig<P>,
  name: string,
): ComponentType<P> {
  const lazyCache = new Map<Tier, ReturnType<typeof lazy>>();

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

    return (
      <div data-adaptive={name} style={layoutStyle(config.layout)}>
        <Suspense fallback={config.fallback ?? null}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LazyComponent {...(props as any)} />
        </Suspense>
      </div>
    );
  }

  AdaptiveVariant.displayName = `Adaptive(${name})`;
  return AdaptiveVariant;
}
