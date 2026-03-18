import { lazy, Suspense, type ReactNode, type ComponentType } from 'react';
import { getDeviceProfile, type Tier } from '@adaptive-bundle/core';
import { loadWithRetry } from './error-recovery.js';

type ImportFn<M = unknown> = () => Promise<{ default: M }>;

interface InlineProps<M = unknown> {
  children: ReactNode | ((module: M) => ReactNode);
  imports?: ImportFn<M>;
  fallback?: ReactNode;
}

function matchesTier(targetTier: Tier): boolean {
  const profile = getDeviceProfile();
  return profile.tier === targetTier;
}

function createTierComponent<M>(targetTier: Tier) {
  function TierBoundary({ children, imports, fallback }: InlineProps<M>) {
    if (!matchesTier(targetTier)) return null;

    if (imports && typeof children === 'function') {
      return (
        <LazyImport
          imports={imports}
          render={children as (mod: M) => ReactNode}
          fallback={fallback}
        />
      );
    }

    return <>{children}</>;
  }

  TierBoundary.displayName = `Adaptive.${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}`;
  return TierBoundary;
}

function LazyImport<M>({
  imports,
  render,
  fallback,
}: {
  imports: ImportFn<M>;
  render: (mod: M) => ReactNode;
  fallback?: ReactNode;
}) {
  const LazyComponent = lazy(() =>
    loadWithRetry(imports as ImportFn<ComponentType<{ render: (mod: M) => ReactNode }>>).then(
      (mod) => ({
        default: function Wrapper() {
          return <>{render(mod.default as M)}</>;
        },
      }),
    ),
  );

  return (
    <Suspense fallback={fallback ?? null}>
      <LazyComponent />
    </Suspense>
  );
}

/**
 * Inline tier boundaries for conditional rendering.
 * @example
 * ```tsx
 * <Adaptive.High>
 *   <HeavyAnimation />
 * </Adaptive.High>
 * <Adaptive.Low>
 *   <StaticImage />
 * </Adaptive.Low>
 * ```
 */
export const Adaptive = {
  High: createTierComponent('high'),
  Low: createTierComponent('low'),
  Medium: createTierComponent('medium'),
};
