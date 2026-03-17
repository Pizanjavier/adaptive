import type { BoundaryAnalysis } from '../types.js';

export interface JsonReport {
  timestamp: string;
  boundaryCount: number;
  boundaries: BoundaryAnalysis[];
  totals: {
    highTierSize: number;
    lowTierSize: number;
    totalSavings: number;
    reductionPercent: number;
  };
}

function computeTotals(analyses: BoundaryAnalysis[]) {
  let highTierSize = 0;
  let lowTierSize = 0;
  let totalSavings = 0;

  for (const a of analyses) {
    const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
    highTierSize += a.highSize + shared;
    lowTierSize += a.lowSize + shared;
    totalSavings += a.savings;
  }

  const reductionPercent =
    highTierSize > 0 ? Number(((totalSavings / highTierSize) * 100).toFixed(1)) : 0;

  return { highTierSize, lowTierSize, totalSavings, reductionPercent };
}

export function formatJsonReport(analyses: BoundaryAnalysis[]): JsonReport {
  return {
    timestamp: new Date().toISOString(),
    boundaryCount: analyses.length,
    boundaries: analyses,
    totals: computeTotals(analyses),
  };
}

export function formatJsonString(analyses: BoundaryAnalysis[]): string {
  return JSON.stringify(formatJsonReport(analyses), null, 2);
}
