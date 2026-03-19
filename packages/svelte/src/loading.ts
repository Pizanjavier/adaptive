type ImportFn<T> = () => Promise<{ default: T }>;

export function preloadImport<T>(importFn: ImportFn<T>): ImportFn<T> {
  const cached = importFn();
  return () => cached;
}

export function viewportAction(node: HTMLElement, loadFn: () => void): { destroy: () => void } {
  if (typeof IntersectionObserver === 'undefined') {
    loadFn();
    return { destroy: () => {} };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        observer.disconnect();
        loadFn();
      }
    },
    { rootMargin: '200px' },
  );

  observer.observe(node);

  return {
    destroy: () => observer.disconnect(),
  };
}
