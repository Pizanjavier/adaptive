import type { Component } from 'vue';

type ImportFn = () => Promise<{ default: Component }>;

export function preloadImport(importFn: ImportFn): ImportFn {
  const cached = importFn();
  return () => cached;
}

export function observeViewport(element: HTMLElement, callback: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    callback();
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          callback();
          return;
        }
      }
    },
    { rootMargin: '200px' },
  );

  observer.observe(element);
  return () => observer.disconnect();
}
