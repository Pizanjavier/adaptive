import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BoundaryAnalysis, ResolvedConfig } from '../types.js';
import type { Opportunity } from '../analysis/opportunities.js';
import { formatConsoleReport } from './console.js';
import { formatJsonString } from './json.js';
import { formatHtmlReport } from './html.js';
import { appendHistory } from './history.js';
import { formatOpportunitiesConsole, formatOpportunitiesHtml } from './opportunities.js';

export function generateReports(
  analyses: BoundaryAnalysis[],
  config: ResolvedConfig,
  opportunities: Opportunity[] = [],
): string | undefined {
  if (!config.report) return undefined;
  if (analyses.length === 0 && opportunities.length === 0) return undefined;

  const { reportFormat, reportDir } = config;
  const oppConsole = formatOpportunitiesConsole(opportunities);
  const oppHtml = formatOpportunitiesHtml(opportunities);

  if (reportFormat === 'console') {
    const output = formatConsoleReport(analyses, oppConsole);
    process.stdout.write(output);
    return output;
  }

  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  if (reportFormat === 'json') {
    const output = formatJsonString(analyses);
    writeFileSync(join(reportDir, 'report.json'), output, 'utf-8');
    appendHistory(reportDir, analyses);
    return output;
  }

  if (reportFormat === 'html') {
    const output = formatHtmlReport(analyses, oppHtml);
    writeFileSync(join(reportDir, 'report.html'), output, 'utf-8');
    appendHistory(reportDir, analyses);
    return output;
  }

  return undefined;
}

export { formatConsoleReport } from './console.js';
export { formatJsonString, formatJsonReport } from './json.js';
export { formatHtmlReport } from './html.js';
export { appendHistory, readHistory } from './history.js';
export { formatOpportunitiesConsole, formatOpportunitiesHtml } from './opportunities.js';
