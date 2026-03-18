import type { OverlayState } from '../types.js';

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tierBadge(tier: string, score: number, confidence: number): string {
  return `<span class="tier-badge tier-${tier}">${tier.toUpperCase()}</span>
    <span style="margin-left:8px;font-size:12px;color:#94a3b8">
      score: ${score.toFixed(2)} · confidence: ${(confidence * 100).toFixed(0)}%
    </span>`;
}

function renderProbes(state: OverlayState): string {
  const p = state.profile.probes;
  const rows = [
    ['CPU Cores', p.cpuCores],
    ['Memory (GB)', p.memoryGB],
    ['GPU Tier', p.gpuTier],
    ['Screen', p.screenCategory],
    ['Touch Points', p.touchPoints],
  ];

  const net = state.profile.network;
  if (net.effectiveType) rows.push(['Network', net.effectiveType]);
  if (net.dataSaver !== null) rows.push(['Data Saver', net.dataSaver ? 'on' : 'off']);

  return rows
    .map(([label, value]) => {
      const cls = value === null ? 'probe-unavailable' : 'probe-value';
      const display = value === null ? 'n/a' : String(value);
      return `<div class="probe-row">
        <span class="probe-label">${esc(String(label))}</span>
        <span class="${cls}">${esc(display)}</span>
      </div>`;
    })
    .join('');
}

function renderBoundaries(state: OverlayState): string {
  if (state.boundaries.length === 0) {
    return '<div style="font-size:12px;color:#475569;font-style:italic">No boundaries detected</div>';
  }

  return state.boundaries
    .map((b) => {
      const cls = b.hasError ? 'variant-error' : `variant-${b.loadedVariant}`;
      return `<div class="boundary-item">
        <span class="boundary-name">${esc(b.name)}</span>
        <span class="boundary-variant ${cls}">${esc(b.loadedVariant)}</span>
      </div>`;
    })
    .join('');
}

function renderReasoning(state: OverlayState): string {
  return state.profile.reasoning.map((r) => `<div class="reasoning-item">${esc(r)}</div>`).join('');
}

function renderSimulator(state: OverlayState): string {
  const current = state.forcedTier ?? '';
  return `<div class="simulator">
    <div class="section-title">Tier Simulator</div>
    <select data-devtools-action="simulate">
      <option value="" ${!current ? 'selected' : ''}>Auto (detected)</option>
      <option value="high" ${current === 'high' ? 'selected' : ''}>High</option>
      <option value="medium" ${current === 'medium' ? 'selected' : ''}>Medium</option>
      <option value="low" ${current === 'low' ? 'selected' : ''}>Low</option>
    </select>
    ${current ? '<button class="reset-btn" data-devtools-action="reset">Reset forced tier</button>' : ''}
  </div>`;
}

export function renderOverlay(state: OverlayState): string {
  return `<div class="header">
    <span class="header-title">Adaptive Devtools</span>
    <button class="collapse-btn" data-devtools-action="toggle">−</button>
  </div>
  <div class="body">
    <div>${tierBadge(state.profile.tier, state.profile.score, state.profile.confidence)}</div>

    <div class="section">
      <div class="section-title">Probes</div>
      ${renderProbes(state)}
    </div>

    <div class="section">
      <div class="section-title">Reasoning</div>
      ${renderReasoning(state)}
    </div>

    <div class="section">
      <div class="section-title">Boundaries (${state.boundaries.length})</div>
      ${renderBoundaries(state)}
    </div>

    ${renderSimulator(state)}
  </div>`;
}
