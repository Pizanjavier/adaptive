import type { OverlayConfig, OverlayInstance, OverlayPosition } from '../types.js';
import { collectState } from './state.js';
import { renderOverlay } from './render.js';
import { attachControls } from './controls.js';
import { OVERLAY_STYLES } from './styles.js';

const POSITION_MAP: Record<OverlayPosition, Record<string, string>> = {
  'bottom-right': { bottom: '16px', right: '16px' },
  'bottom-left': { bottom: '16px', left: '16px' },
  'top-right': { top: '16px', right: '16px' },
  'top-left': { top: '16px', left: '16px' },
};

function applyPosition(el: HTMLElement, position: OverlayPosition): void {
  el.style.position = 'fixed';
  const pos = POSITION_MAP[position];
  for (const [prop, value] of Object.entries(pos)) {
    el.style.setProperty(prop, value);
  }
}

export function createOverlay(config: OverlayConfig = {}): OverlayInstance {
  const position = config.position ?? 'bottom-right';

  const host = document.createElement('div');
  host.id = '__adaptive-devtools';
  applyPosition(host, position);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = OVERLAY_STYLES;
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.className = config.collapsed ? 'panel collapsed' : 'panel';
  shadow.appendChild(panel);

  function update(): void {
    const state = collectState();
    panel.innerHTML = renderOverlay(state);
  }

  update();
  attachControls(shadow, update);
  document.body.appendChild(host);

  const observer = new MutationObserver(() => update());
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-adaptive', 'data-adaptive-error'],
  });

  listenHmr(update);

  return {
    update,
    destroy() {
      observer.disconnect();
      host.remove();
    },
  };
}

function listenHmr(onUpdate: () => void): void {
  if (typeof import.meta === 'undefined') return;
  const hot = (import.meta as unknown as { hot?: { on(event: string, cb: () => void): void } }).hot;
  if (!hot) return;

  hot.on('adaptive:force-tier', () => {
    onUpdate();
  });
}
