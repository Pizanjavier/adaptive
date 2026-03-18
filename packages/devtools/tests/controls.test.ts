import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachControls } from '../src/overlay/controls.js';

describe('attachControls', () => {
  let shadowRoot: ShadowRoot;
  let onUpdate: ReturnType<typeof vi.fn>;
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';

    assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:5173/', assign: assignSpy },
      writable: true,
    });

    const host = document.createElement('div');
    shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
      <div class="panel">
        <div class="header">
          <span>Title</span>
          <button class="collapse-btn" data-devtools-action="toggle">−</button>
        </div>
        <div class="body">
          <select data-devtools-action="simulate">
            <option value="">Auto</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
          <button data-devtools-action="reset">Reset</button>
        </div>
      </div>
    `;
    onUpdate = vi.fn();
    document.body.appendChild(host);
  });

  it('navigates with tier param when simulator changes', () => {
    attachControls(shadowRoot, onUpdate);
    const select = shadowRoot.querySelector('select')!;
    select.value = 'low';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(assignSpy).toHaveBeenCalledWith('http://localhost:5173/?adaptive_tier=low');
  });

  it('removes tier param on reset click', () => {
    window.location.href = 'http://localhost:5173/?adaptive_tier=low';
    attachControls(shadowRoot, onUpdate);
    const resetBtn = shadowRoot.querySelector('[data-devtools-action="reset"]')!;
    resetBtn.dispatchEvent(new Event('click', { bubbles: true }));

    expect(assignSpy).toHaveBeenCalledWith('http://localhost:5173/');
  });

  it('removes tier param when selecting auto', () => {
    window.location.href = 'http://localhost:5173/?adaptive_tier=high';
    attachControls(shadowRoot, onUpdate);
    const select = shadowRoot.querySelector('select')!;
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(assignSpy).toHaveBeenCalledWith('http://localhost:5173/');
  });

  it('toggles collapsed class on toggle click', () => {
    attachControls(shadowRoot, onUpdate);
    const toggleBtn = shadowRoot.querySelector('[data-devtools-action="toggle"]') as HTMLElement;
    const panel = shadowRoot.querySelector('.panel')!;

    toggleBtn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(panel.classList.contains('collapsed')).toBe(true);

    toggleBtn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(panel.classList.contains('collapsed')).toBe(false);
  });
});
