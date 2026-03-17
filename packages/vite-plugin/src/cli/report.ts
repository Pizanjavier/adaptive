import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { formatConsoleReport } from '../reports/console.js';
import { formatHtmlReport } from '../reports/html.js';
import type { BoundaryAnalysis } from '../types.js';

const DEFAULT_REPORT_DIR = './adaptive-reports';

export async function runReport(flags: Record<string, string>) {
  const reportDir = resolve(flags.output ?? DEFAULT_REPORT_DIR);
  const format = flags.format ?? 'console';
  const cachedPath = join(reportDir, 'report.json');

  if (!existsSync(cachedPath)) {
    process.stderr.write(
      `No cached build data found at ${cachedPath}\n` +
        'Run a full Vite build first with report: true and reportFormat: "json".\n',
    );
    process.exitCode = 1;
    return;
  }

  const raw = readFileSync(cachedPath, 'utf-8');
  const data = JSON.parse(raw) as { boundaries: BoundaryAnalysis[] };
  const analyses = data.boundaries;

  if (format === 'console') {
    const output = formatConsoleReport(analyses);
    process.stdout.write(output);
    return;
  }

  if (format === 'html') {
    const output = formatHtmlReport(analyses);
    const outPath = join(reportDir, 'report.html');
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    writeFileSync(outPath, output, 'utf-8');
    process.stdout.write(`HTML report written to ${outPath}\n`);
    return;
  }

  if (format === 'json') {
    process.stdout.write(`JSON report already at ${cachedPath}\n`);
    return;
  }

  process.stderr.write(`Unknown format: ${format}\n`);
  process.exitCode = 1;
}
