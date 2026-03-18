const TIER_PARAM = 'adaptive_tier';

export function attachControls(shadowRoot: ShadowRoot, onUpdate: () => void): void {
  attachToggle(shadowRoot);
  attachDrag(shadowRoot);
  attachSimulator(shadowRoot, onUpdate);
}

function attachToggle(shadowRoot: ShadowRoot): void {
  shadowRoot.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.getAttribute('data-devtools-action') !== 'toggle') return;

    const panel = shadowRoot.querySelector('.panel');
    if (!panel) return;

    const isCollapsed = panel.classList.toggle('collapsed');
    target.textContent = isCollapsed ? '+' : '−';
  });
}

function attachDrag(shadowRoot: ShadowRoot): void {
  const host = shadowRoot.host as HTMLElement;
  const header = shadowRoot.querySelector('.header') as HTMLElement | null;
  if (!header) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  header.addEventListener('pointerdown', (e: PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = host.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    header.setPointerCapture(e.pointerId);
  });

  header.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    host.style.position = 'fixed';
    host.style.left = `${startLeft + dx}px`;
    host.style.top = `${startTop + dy}px`;
    host.style.right = 'auto';
    host.style.bottom = 'auto';
  });

  header.addEventListener('pointerup', () => {
    dragging = false;
  });
}

function applyTierParam(tier: string | null): void {
  const url = new URL(window.location.href);
  if (tier) {
    url.searchParams.set(TIER_PARAM, tier);
  } else {
    url.searchParams.delete(TIER_PARAM);
  }
  window.location.assign(url.toString());
}

function attachSimulator(shadowRoot: ShadowRoot, _onUpdate: () => void): void {
  shadowRoot.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    if (target.getAttribute('data-devtools-action') !== 'simulate') return;

    const value = target.value;
    applyTierParam(value || null);
  });

  shadowRoot.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.getAttribute('data-devtools-action') !== 'reset') return;

    applyTierParam(null);
  });
}
