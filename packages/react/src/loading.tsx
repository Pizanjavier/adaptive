import React, { useState, useEffect, useRef, type ReactElement } from 'react';
import { layoutStyle, type LayoutConfig } from './shared.js';

type ImportFn<P> = () => Promise<{ default: React.ComponentType<P> }>;

export function preloadImport<P>(importFn: ImportFn<P>): ImportFn<P> {
  const cached = importFn();
  return () => cached;
}

interface ViewportWrapperProps {
  fallback?: ReactElement;
  layout?: LayoutConfig;
  name: string;
  children: ReactElement;
}

export function ViewportWrapper({ fallback, layout, name, children }: ViewportWrapperProps) {
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible || typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  if (visible) return children;

  return (
    <div
      ref={ref}
      data-adaptive={name}
      data-adaptive-loading="viewport"
      style={layoutStyle(layout)}
    >
      {fallback ?? null}
    </div>
  );
}
