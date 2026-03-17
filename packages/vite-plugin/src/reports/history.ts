import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BoundaryAnalysis } from '../types.js';

export interface HistoryEntry {
  timestamp: string;
  boundaryCount: number;
  totalHighSize: number;
  totalLowSize: number;
  totalSavings: number;
}

function toEntry(analyses: BoundaryAnalysis[]): HistoryEntry {
  let totalHighSize = 0;
  let totalLowSize = 0;
  let totalSavings = 0;

  for (const a of analyses) {
    const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
    totalHighSize += a.highSize + shared;
    totalLowSize += a.lowSize + shared;
    totalSavings += a.savings;
  }

  return {
    timestamp: new Date().toISOString(),
    boundaryCount: analyses.length,
    totalHighSize,
    totalLowSize,
    totalSavings,
  };
}

export function readHistory(reportDir: string): HistoryEntry[] {
  const filePath = join(reportDir, 'history.json');
  if (!existsSync(filePath)) return [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(reportDir: string, analyses: BoundaryAnalysis[]): void {
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const history = readHistory(reportDir);
  history.push(toEntry(analyses));

  const filePath = join(reportDir, 'history.json');
  writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
}
