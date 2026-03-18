import type { BoundaryAnalysis } from '../types.js';

function fmtKB(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}MB`;
  if (kb >= 10) return `${Math.round(kb)}KB`;
  return `${kb.toFixed(1)}KB`;
}

function fmtDeps(deps: { id: string; size: number }[]): string {
  if (deps.length === 0) return '(none)';
  const names = deps
    .sort((a, b) => b.size - a.size)
    .slice(0, 3)
    .map((d) => d.id.split('/').pop() ?? d.id);
  const suffix = deps.length > 3 ? `, +${deps.length - 3} more` : '';
  return `(${names.join(', ')}${suffix})`;
}

function fmtBoundary(a: BoundaryAnalysis, i: number): string {
  const loc = `${a.boundary.filePath}:${a.boundary.line}`;
  const h = fmtKB(a.highSize).padStart(7);
  const l = fmtKB(a.lowSize).padStart(7);
  const s = fmtKB(a.savings);
  const pct = a.savingsPercent.toFixed(1);

  const lines = [
    `  ${i + 1}. ${a.boundary.name} (${loc})`,
    `     \u251C\u2500 high: ${h} ${fmtDeps(a.exclusiveHighDeps)}`,
    `     \u251C\u2500 low:  ${l} ${fmtDeps(a.exclusiveLowDeps)}`,
  ];

  if (a.pruned && a.pruned.length > 0) {
    for (const p of a.pruned) {
      lines.push(`     \u251C\u2500 PRUNED for ${p.tier}: ${p.reason}`);
    }
  }

  lines.push(`     \u2514\u2500 Savings for low-tier: ${s} (${pct}%)`);
  return lines.join('\n');
}

function computeTotals(analyses: BoundaryAnalysis[]) {
  let high = 0,
    low = 0,
    savings = 0;
  for (const a of analyses) {
    const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
    high += a.highSize + shared;
    low += a.lowSize + shared;
    savings += a.savings;
  }
  return { high, low, savings };
}

export function formatConsoleReport(analyses: BoundaryAnalysis[], extra?: string): string {
  const sep = '\u2550'.repeat(55);
  const { high, low, savings } = computeTotals(analyses);
  const pct = high > 0 ? ((savings / high) * 100).toFixed(1) : '0.0';

  const lines = [
    '',
    'Adaptive Build Report',
    sep,
    `Adaptive Boundaries: ${analyses.length} found`,
    '',
  ];

  for (let i = 0; i < analyses.length; i++) {
    lines.push(fmtBoundary(analyses[i], i));
    if (i < analyses.length - 1) lines.push('');
  }

  lines.push('');
  lines.push(`Total potential savings: ${fmtKB(savings)} for low-tier devices`);
  lines.push(`Total bundle (high-tier): ${fmtKB(high)}`);
  lines.push(`Total bundle (low-tier):  ${fmtKB(low)} (${pct}% reduction)`);
  lines.push(sep);

  if (extra) {
    lines.push('');
    lines.push(extra);
  }

  lines.push('');
  return lines.join('\n');
}
