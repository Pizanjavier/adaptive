import type { BoundaryAnalysis } from '../types.js';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatKB(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}MB`;
  return `${Math.round(kb)}KB`;
}

function computeTotals(analyses: BoundaryAnalysis[]) {
  let totalHigh = 0;
  let totalLow = 0;
  let totalSavings = 0;

  for (const a of analyses) {
    const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
    totalHigh += a.highSize + shared;
    totalLow += a.lowSize + shared;
    totalSavings += a.savings;
  }

  const reductionPct = totalHigh > 0 ? ((totalSavings / totalHigh) * 100).toFixed(1) : '0.0';

  return { totalHigh, totalLow, totalSavings, reductionPct };
}

function renderBarChart(analyses: BoundaryAnalysis[], maxSize: number): string {
  if (maxSize === 0) return '';
  const rows = analyses
    .map((a) => {
      const highPct = Math.round((a.highSize / maxSize) * 100);
      const lowPct = Math.round((a.lowSize / maxSize) * 100);
      const name = escapeHtml(a.boundary.name);
      return `
      <div style="margin-bottom:12px">
        <div style="font-weight:600;margin-bottom:4px">${name}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:40px;text-align:right;font-size:12px">High</span>
          <div style="background:#e74c3c;height:20px;width:${highPct}%;border-radius:3px"></div>
          <span style="font-size:12px">${formatKB(a.highSize)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          <span style="width:40px;text-align:right;font-size:12px">Low</span>
          <div style="background:#2ecc71;height:20px;width:${Math.max(lowPct, 1)}%;border-radius:3px"></div>
          <span style="font-size:12px">${formatKB(a.lowSize)}</span>
        </div>
      </div>`;
    })
    .join('');
  return rows;
}

function renderBoundaryTable(analyses: BoundaryAnalysis[]): string {
  const rows = analyses
    .map(
      (a) => `
    <tr>
      <td>${escapeHtml(a.boundary.name)}</td>
      <td>${escapeHtml(a.boundary.filePath)}:${a.boundary.line}</td>
      <td style="text-align:right">${formatKB(a.highSize)}</td>
      <td style="text-align:right">${formatKB(a.lowSize)}</td>
      <td style="text-align:right">${formatKB(a.savings)}</td>
      <td style="text-align:right">${a.savingsPercent.toFixed(1)}%</td>
    </tr>`,
    )
    .join('');

  return `<table style="width:100%;border-collapse:collapse;margin-top:16px">
    <thead><tr style="border-bottom:2px solid #333;text-align:left">
      <th>Boundary</th><th>Location</th>
      <th style="text-align:right">High</th><th style="text-align:right">Low</th>
      <th style="text-align:right">Savings</th><th style="text-align:right">%</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function formatHtmlReport(analyses: BoundaryAnalysis[]): string {
  const { totalHigh, totalLow, totalSavings, reductionPct } = computeTotals(analyses);
  const maxSize = Math.max(...analyses.map((a) => a.highSize), 1);
  const timestamp = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Adaptive Build Report</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:900px;margin:0 auto;padding:24px;color:#222}
  h1{margin-bottom:4px}
  .summary{display:flex;gap:24px;margin:20px 0}
  .card{background:#f5f5f5;border-radius:8px;padding:16px 24px;flex:1;text-align:center}
  .card .value{font-size:28px;font-weight:700}
  .card .label{font-size:13px;color:#666;margin-top:4px}
  table td,table th{padding:8px 12px}
  tbody tr:nth-child(even){background:#f9f9f9}
</style>
</head>
<body>
<h1>Adaptive Build Report</h1>
<p style="color:#666">${timestamp} &mdash; ${analyses.length} boundaries analyzed</p>
<div class="summary">
  <div class="card"><div class="value">${formatKB(totalHigh)}</div><div class="label">High-tier bundle</div></div>
  <div class="card"><div class="value">${formatKB(totalLow)}</div><div class="label">Low-tier bundle</div></div>
  <div class="card"><div class="value">${formatKB(totalSavings)}</div><div class="label">Total savings</div></div>
  <div class="card"><div class="value">${reductionPct}%</div><div class="label">Reduction</div></div>
</div>
<h2>Size Comparison</h2>
${renderBarChart(analyses, maxSize)}
<h2>Boundary Details</h2>
${renderBoundaryTable(analyses)}
</body>
</html>`;
}
