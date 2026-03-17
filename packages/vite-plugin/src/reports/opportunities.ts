import type { Opportunity } from '../analysis/opportunities.js';

function fmtKB(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}MB`;
  return kb < 10 ? `${kb.toFixed(1)}KB` : `${Math.round(kb)}KB`;
}

function impactIcon(impact: Opportunity['impact']): string {
  if (impact === 'high') return '\u{1F534}';
  if (impact === 'medium') return '\u{1F7E1}';
  return '\u{1F7E2}';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatOpportunitiesConsole(opportunities: Opportunity[]): string {
  if (opportunities.length === 0) return '';

  const lines = ['\u{1F4A1} Optimization Opportunities', '\u2500'.repeat(55), ''];

  for (let i = 0; i < opportunities.length; i++) {
    const o = opportunities[i];
    const icon = impactIcon(o.impact);
    lines.push(`  ${i + 1}. ${icon} ${o.moduleName} (${fmtKB(o.size)})`);
    if (o.importedBy.length > 0) {
      lines.push(`     \u251C\u2500 imported by: ${o.importedBy.slice(0, 3).join(', ')}`);
    }
    lines.push(`     \u2514\u2500 ${o.suggestion}`);
    if (i < opportunities.length - 1) lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}

function impactBadge(impact: Opportunity['impact']): string {
  const colors: Record<string, string> = {
    high: '#dc2626',
    medium: '#d97706',
    low: '#059669',
  };
  const bg = colors[impact] ?? '#475569';
  return `<span style="background:${bg};color:#fff;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase">${impact}</span>`;
}

export function formatOpportunitiesHtml(opportunities: Opportunity[]): string {
  if (opportunities.length === 0) return '';

  const cards = opportunities
    .map(
      (o, i) => `
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 20px;border-left:3px solid ${o.impact === 'high' ? '#dc2626' : o.impact === 'medium' ? '#d97706' : '#059669'}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;color:#f1f5f9">${i + 1}. ${esc(o.moduleName)}</span>
        <span style="display:flex;align-items:center;gap:8px">
          <span style="color:#fbbf24;font-weight:600">${fmtKB(o.size)}</span>
          ${impactBadge(o.impact)}
        </span>
      </div>
      ${o.importedBy.length > 0 ? `<div style="font-size:12px;color:#64748b;margin-bottom:6px">Imported by: ${o.importedBy.slice(0, 3).map(esc).join(', ')}</div>` : ''}
      <div style="font-size:13px;color:#94a3b8;font-family:monospace">${esc(o.suggestion)}</div>
    </div>`,
    )
    .join('\n');

  return `
<h2>Optimization Opportunities</h2>
<p style="color:#64748b;margin-bottom:16px">${opportunities.length} module${opportunities.length !== 1 ? 's' : ''} could benefit from adaptive boundaries</p>
<div style="display:grid;gap:12px">
${cards}
</div>`;
}
