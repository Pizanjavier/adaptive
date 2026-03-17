import type { BoundaryAnalysis } from '../types.js';

function formatKB(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}MB`;
  if (kb >= 100) return `${Math.round(kb)}KB`;
  if (kb >= 10) return `${Math.round(kb)}KB`;
  return `${kb.toFixed(1)}KB`;
}

function formatDeps(deps: { id: string; size: number }[]): string {
  if (deps.length === 0) return '(none)';
  const names = deps
    .sort((a, b) => b.size - a.size)
    .slice(0, 3)
    .map((d) => d.id.split('/').pop() ?? d.id);
  const suffix = deps.length > 3 ? `, +${deps.length - 3} more` : '';
  return `(${names.join(', ')}${suffix})`;
}

function formatBoundary(analysis: BoundaryAnalysis, index: number): string {
  const { boundary, highSize, lowSize, savings, savingsPercent } = analysis;
  const name = boundary.name;
  const loc = `${boundary.filePath}:${boundary.line}`;
  const highLabel = formatKB(highSize);
  const lowLabel = formatKB(lowSize);
  const savingsLabel = formatKB(savings);
  const pct = savingsPercent.toFixed(1);

  const lines = [
    `  ${index + 1}. ${name} (${loc})`,
    `     \u251C\u2500 high: ${highLabel.padStart(6)} ${formatDeps(analysis.exclusiveHighDeps)}`,
    `     \u251C\u2500 low:  ${lowLabel.padStart(6)} ${formatDeps(analysis.exclusiveLowDeps)}`,
    `     \u2514\u2500 Savings for low-tier: ${savingsLabel} (${pct}%)`,
  ];
  return lines.join('\n');
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

  return { totalHigh, totalLow, totalSavings };
}

export function formatConsoleReport(analyses: BoundaryAnalysis[]): string {
  const sep = '\u2550'.repeat(55);
  const { totalHigh, totalLow, totalSavings } = computeTotals(analyses);
  const reductionPct = totalHigh > 0 ? ((totalSavings / totalHigh) * 100).toFixed(1) : '0.0';

  const lines = [
    '',
    'Adaptive Build Report',
    sep,
    `Adaptive Boundaries: ${analyses.length} found`,
    '',
  ];

  for (let i = 0; i < analyses.length; i++) {
    lines.push(formatBoundary(analyses[i], i));
    if (i < analyses.length - 1) lines.push('');
  }

  lines.push('');
  lines.push(`Total potential savings: ${formatKB(totalSavings)} for low-tier devices`);
  lines.push(`Total bundle (high-tier): ${formatKB(totalHigh)}`);
  lines.push(`Total bundle (low-tier):  ${formatKB(totalLow)} (${reductionPct}% reduction)`);
  lines.push(sep);
  lines.push('');

  return lines.join('\n');
}
