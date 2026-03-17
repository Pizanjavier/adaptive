import type { BoundaryAnalysis } from '../types.js';

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtKB(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}MB`;
  return kb < 10 ? `${kb.toFixed(1)}KB` : `${Math.round(kb)}KB`;
}

function totals(analyses: BoundaryAnalysis[]) {
  let high = 0,
    low = 0,
    savings = 0;
  for (const a of analyses) {
    const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
    high += a.highSize + shared;
    low += a.lowSize + shared;
    savings += a.savings;
  }
  const pct = high > 0 ? ((savings / high) * 100).toFixed(1) : '0.0';
  return { high, low, savings, pct };
}

function badge(pct: number): string {
  const bg = pct >= 30 ? '#059669' : pct >= 15 ? '#d97706' : '#dc2626';
  return `<span style="background:${bg};color:#fff;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600">${pct.toFixed(1)}%</span>`;
}

function shortPath(p: string): string {
  const parts = p.split('/');
  return parts.length > 3 ? '…/' + parts.slice(-3).join('/') : p;
}

function bars(analyses: BoundaryAnalysis[], max: number): string {
  return analyses
    .map((a) => {
      const hPct = Math.max(Math.round((a.highSize / max) * 100), 2);
      const lPct = Math.max(Math.round((a.lowSize / max) * 100), 2);
      return `<div style="margin-bottom:16px">
      <div style="font-weight:600;margin-bottom:6px;color:#e2e8f0">${esc(a.boundary.name)}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <span style="width:36px;text-align:right;font-size:11px;color:#94a3b8">High</span>
        <div style="background:linear-gradient(90deg,#3b82f6,#6366f1);height:24px;width:${hPct}%;border-radius:6px;display:flex;align-items:center;padding:0 8px">
          ${hPct > 15 ? `<span style="color:#fff;font-size:11px;font-weight:600">${fmtKB(a.highSize)}</span>` : ''}
        </div>
        ${hPct <= 15 ? `<span style="font-size:11px;color:#94a3b8">${fmtKB(a.highSize)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="width:36px;text-align:right;font-size:11px;color:#94a3b8">Low</span>
        <div style="background:linear-gradient(90deg,#10b981,#34d399);height:24px;width:${lPct}%;border-radius:6px;display:flex;align-items:center;padding:0 8px">
          ${lPct > 15 ? `<span style="color:#fff;font-size:11px;font-weight:600">${fmtKB(a.lowSize)}</span>` : ''}
        </div>
        ${lPct <= 15 ? `<span style="font-size:11px;color:#94a3b8">${fmtKB(a.lowSize)}</span>` : ''}
      </div>
    </div>`;
    })
    .join('');
}

function table(analyses: BoundaryAnalysis[]): string {
  const rows = analyses
    .map(
      (a) => `<tr>
    <td style="font-weight:500">${esc(a.boundary.name)}</td>
    <td style="font-family:monospace;font-size:12px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(a.boundary.filePath)}:${a.boundary.line}">${esc(shortPath(a.boundary.filePath))}:${a.boundary.line}</td>
    <td style="text-align:right;color:#60a5fa">${fmtKB(a.highSize)}</td>
    <td style="text-align:right;color:#34d399">${fmtKB(a.lowSize)}</td>
    <td style="text-align:right;color:#fbbf24">${fmtKB(a.savings)}</td>
    <td style="text-align:right">${badge(a.savingsPercent)}</td>
  </tr>`,
    )
    .join('');

  return `<table style="width:100%;border-collapse:collapse"><thead>
    <tr style="border-bottom:1px solid #334155;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">
      <th style="padding:10px 12px">Boundary</th><th style="padding:10px 12px">Location</th>
      <th style="padding:10px 12px;text-align:right">High</th><th style="padding:10px 12px;text-align:right">Low</th>
      <th style="padding:10px 12px;text-align:right">Savings</th><th style="padding:10px 12px;text-align:right">Impact</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function card(value: string, label: string, accent: string, icon: string): string {
  return `<div style="background:rgba(255,255,255,0.05);backdrop-filter:blur(12px);border-radius:12px;padding:20px 24px;flex:1;text-align:center;border-left:3px solid ${accent}">
    <div style="font-size:32px;font-weight:700;color:#f1f5f9">${icon} ${value}</div>
    <div style="font-size:13px;color:#94a3b8;margin-top:6px">${label}</div>
  </div>`;
}

export function formatHtmlReport(analyses: BoundaryAnalysis[], extra?: string): string {
  const t = totals(analyses);
  const max = Math.max(...analyses.map((a) => a.highSize), 1);
  const ts = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Adaptive Build Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#e2e8f0;min-height:100vh;padding:32px 24px}
.wrap{max-width:960px;margin:0 auto}
h1{font-size:28px;font-weight:700;color:#f8fafc}
h2{font-size:18px;font-weight:600;color:#cbd5e1;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #1e293b}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
table td,table th{padding:10px 12px}
tbody tr{border-bottom:1px solid #1e293b;transition:background .15s}
tbody tr:hover{background:rgba(255,255,255,0.03)}
.foot{text-align:center;color:#475569;font-size:12px;margin-top:40px;padding-top:16px;border-top:1px solid #1e293b}
@media(max-width:640px){.cards{grid-template-columns:repeat(2,1fr)}}
</style></head><body><div class="wrap">
<h1>Adaptive Build Report</h1>
<p style="color:#64748b;margin-top:4px">${ts} — ${analyses.length} boundaries analyzed</p>
<div class="cards">
  ${card(fmtKB(t.high), 'High-tier bundle', '#3b82f6', '📦')}
  ${card(fmtKB(t.low), 'Low-tier bundle', '#10b981', '📱')}
  ${card(fmtKB(t.savings), 'Total savings', '#f59e0b', '💾')}
  ${card(t.pct + '%', 'Reduction', '#8b5cf6', '📉')}
</div>
<h2>Size Comparison</h2>
${bars(analyses, max)}
<h2>Boundary Details</h2>
${table(analyses)}
${extra ?? ''}
<div class="foot">Generated by @adaptive/vite-plugin</div>
</div></body></html>`;
}
