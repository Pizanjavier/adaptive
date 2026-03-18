import type { BoundaryAnalysis } from '../types.js';
import type { Opportunity } from '../analysis/opportunities.js';

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtKB(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}MB`;
  return kb < 10 ? `${kb.toFixed(1)}KB` : `${Math.round(kb)}KB`;
}

function badge(tier: string, color: string): string {
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600">${tier}</span>`;
}

function renderBoundaryRow(a: BoundaryAnalysis): string {
  const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
  return `<tr>
    <td style="font-weight:500">${esc(a.boundary.name)}</td>
    <td style="font-family:monospace;font-size:12px">${esc(a.boundary.filePath)}:${a.boundary.line}</td>
    <td style="text-align:right;color:#60a5fa">${fmtKB(a.highSize)}</td>
    <td style="text-align:right;color:#34d399">${fmtKB(a.lowSize)}</td>
    <td style="text-align:right;color:#94a3b8">${fmtKB(shared)}</td>
    <td style="text-align:right;color:#fbbf24">${fmtKB(a.savings)}</td>
    <td style="text-align:right">${badge(a.savingsPercent.toFixed(1) + '%', a.savingsPercent >= 30 ? '#059669' : a.savingsPercent >= 15 ? '#d97706' : '#dc2626')}</td>
  </tr>`;
}

function renderDeps(a: BoundaryAnalysis): string {
  const sections = [
    { label: 'High-only', deps: a.exclusiveHighDeps, color: '#60a5fa' },
    { label: 'Low-only', deps: a.exclusiveLowDeps, color: '#34d399' },
    { label: 'Shared', deps: a.sharedDeps, color: '#94a3b8' },
  ];

  return sections
    .filter((s) => s.deps.length > 0)
    .map(
      (s) => `<div style="margin-top:4px">
      <span style="color:${s.color};font-size:11px;font-weight:600">${s.label}:</span>
      ${s.deps.map((d) => `<span style="font-family:monospace;font-size:11px;color:#94a3b8;margin-left:8px">${esc(d.id.split('/').pop() ?? d.id)} (${fmtKB(d.size)})</span>`).join('')}
    </div>`,
    )
    .join('');
}

function renderOpportunities(opportunities: Opportunity[]): string {
  if (opportunities.length === 0) return '';
  return `<h2>Optimization Opportunities</h2>
    <div style="display:grid;gap:8px">
      ${opportunities
        .map(
          (
            o,
          ) => `<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px 16px">
        <div style="font-weight:500;color:#e2e8f0">${esc(o.suggestion)}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px">${esc(o.moduleName)} · ${badge(o.impact, o.impact === 'high' ? '#dc2626' : o.impact === 'medium' ? '#d97706' : '#475569')}</div>
        ${o.potentialSavings ? `<div style="font-size:12px;color:#fbbf24;margin-top:4px">Potential savings: ${fmtKB(o.potentialSavings)}</div>` : ''}
      </div>`,
        )
        .join('')}
    </div>`;
}

export function generateDashboardHtml(
  analyses: BoundaryAnalysis[],
  opportunities: Opportunity[],
): string {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Adaptive Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#e2e8f0;min-height:100vh;padding:32px 24px}
.wrap{max-width:1024px;margin:0 auto}
h1{font-size:28px;font-weight:700;color:#f8fafc}
h2{font-size:18px;font-weight:600;color:#cbd5e1;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #1e293b}
table{width:100%;border-collapse:collapse}
th{padding:10px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #334155}
td{padding:10px 12px}
tbody tr{border-bottom:1px solid #1e293b;transition:background .15s}
tbody tr:hover{background:rgba(255,255,255,0.03)}
.simulator{background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin:24px 0}
.simulator select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:8px 12px;border-radius:8px;font-size:14px}
.foot{text-align:center;color:#475569;font-size:12px;margin-top:40px;padding-top:16px;border-top:1px solid #1e293b}
details{margin-top:8px}
summary{cursor:pointer;color:#94a3b8;font-size:12px}
</style></head><body><div class="wrap">
<h1>Adaptive Dashboard</h1>
<p style="color:#64748b;margin-top:4px">${analyses.length} boundaries · Dev server</p>

<div class="simulator">
  <div style="font-weight:600;margin-bottom:8px">Tier Simulator</div>
  <select id="tier-sim">
    <option value="">Auto (detected)</option>
    <option value="high">High</option>
    <option value="medium">Medium</option>
    <option value="low">Low</option>
  </select>
  <span id="sim-status" style="margin-left:12px;font-size:12px;color:#64748b"></span>
</div>

<h2>Boundaries</h2>
<table><thead><tr>
  <th>Name</th><th>Location</th><th style="text-align:right">High</th>
  <th style="text-align:right">Low</th><th style="text-align:right">Shared</th>
  <th style="text-align:right">Savings</th><th style="text-align:right">Impact</th>
</tr></thead><tbody>
${analyses
  .map(
    (a) => `${renderBoundaryRow(a)}
  <tr><td colspan="7" style="padding:4px 12px 12px">
    <details><summary>Dependencies</summary>${renderDeps(a)}</details>
  </td></tr>`,
  )
  .join('')}
</tbody></table>

${renderOpportunities(opportunities)}

<div class="foot">Generated by @adaptive-bundle/devtools</div>
</div>
<script>
const select = document.getElementById('tier-sim');
const status = document.getElementById('sim-status');
select.addEventListener('change', async () => {
  const tier = select.value;
  try {
    const res = await fetch('/__adaptive/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: tier || null }),
    });
    if (res.ok) status.textContent = tier ? 'Forced: ' + tier : 'Reset to auto';
    else status.textContent = 'Error: ' + res.statusText;
  } catch (e) { status.textContent = 'Failed to connect'; }
});
if (import.meta.hot) {
  import.meta.hot.on('adaptive:analysis-update', () => location.reload());
}
</script></body></html>`;
}
