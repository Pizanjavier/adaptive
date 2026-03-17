import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { formatConsoleReport } from '../src/reports/console.js';
import { formatJsonReport, formatJsonString } from '../src/reports/json.js';
import { formatHtmlReport } from '../src/reports/html.js';
import { appendHistory, readHistory } from '../src/reports/history.js';
import type { BoundaryAnalysis } from '../src/types.js';

function createAnalysis(name: string, highSize: number, lowSize: number): BoundaryAnalysis {
  return {
    boundary: { name, filePath: `src/${name}.tsx`, line: 5 },
    highSize: highSize * 1024,
    lowSize: lowSize * 1024,
    mediumSize: 0,
    exclusiveHighDeps: [{ id: 'heavy-lib', size: highSize * 1024 }],
    exclusiveLowDeps: lowSize > 0 ? [{ id: 'lite-lib', size: lowSize * 1024 }] : [],
    sharedDeps: [{ id: 'react', size: 42 * 1024 }],
    savings: highSize * 1024,
    savingsPercent: highSize > 0 ? (highSize / (highSize + lowSize + 42)) * 100 : 0,
  };
}

const sampleAnalyses: BoundaryAnalysis[] = [
  createAnalysis('Dashboard', 487, 12),
  createAnalysis('Editor', 156, 2),
];

describe('console report', () => {
  it('contains header and boundary count', () => {
    const output = formatConsoleReport(sampleAnalyses);
    expect(output).toContain('Adaptive Build Report');
    expect(output).toContain('Adaptive Boundaries: 2 found');
  });

  it('contains boundary names and locations', () => {
    const output = formatConsoleReport(sampleAnalyses);
    expect(output).toContain('Dashboard');
    expect(output).toContain('src/Dashboard.tsx:5');
    expect(output).toContain('Editor');
  });

  it('contains savings summary', () => {
    const output = formatConsoleReport(sampleAnalyses);
    expect(output).toContain('Total potential savings');
    expect(output).toContain('high-tier');
    expect(output).toContain('low-tier');
    expect(output).toContain('reduction');
  });

  it('handles empty analyses', () => {
    const output = formatConsoleReport([]);
    expect(output).toContain('0 found');
  });
});

describe('json report', () => {
  it('has required fields', () => {
    const report = formatJsonReport(sampleAnalyses);
    expect(report.timestamp).toBeDefined();
    expect(report.boundaryCount).toBe(2);
    expect(report.boundaries).toHaveLength(2);
    expect(report.totals).toBeDefined();
    expect(report.totals.highTierSize).toBeGreaterThan(0);
    expect(report.totals.totalSavings).toBeGreaterThan(0);
  });

  it('produces valid JSON string', () => {
    const str = formatJsonString(sampleAnalyses);
    const parsed = JSON.parse(str);
    expect(parsed.boundaryCount).toBe(2);
  });
});

describe('html report', () => {
  it('is valid self-contained HTML', () => {
    const html = formatHtmlReport(sampleAnalyses);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');
  });

  it('contains boundary data', () => {
    const html = formatHtmlReport(sampleAnalyses);
    expect(html).toContain('Dashboard');
    expect(html).toContain('Editor');
    expect(html).toContain('Adaptive Build Report');
  });

  it('has no external CSS references', () => {
    const html = formatHtmlReport(sampleAnalyses);
    expect(html).not.toContain('link rel="stylesheet"');
    expect(html).not.toContain('href=');
  });
});

describe('history', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'adaptive-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates history.json if it does not exist', () => {
    appendHistory(tempDir, sampleAnalyses);
    const filePath = join(tempDir, 'history.json');
    expect(existsSync(filePath)).toBe(true);
  });

  it('appends entries to history', () => {
    appendHistory(tempDir, sampleAnalyses);
    appendHistory(tempDir, sampleAnalyses);
    const history = readHistory(tempDir);
    expect(history).toHaveLength(2);
    expect(history[0].boundaryCount).toBe(2);
  });

  it('reads empty array for missing file', () => {
    const history = readHistory(tempDir);
    expect(history).toEqual([]);
  });
});
