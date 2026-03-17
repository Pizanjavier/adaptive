import type { BoundaryAnalysis, BudgetConfig } from './types.js';

export interface BudgetResult {
  passed: boolean;
  messages: string[];
}

export function checkBudgets(analyses: BoundaryAnalysis[], budget: BudgetConfig): BudgetResult {
  const messages: string[] = [];
  const enforce = budget.enforce ?? 'warn';
  const prefix = enforce === 'error' ? 'OVER BUDGET' : 'WARNING';

  if (budget.maxLowTierBundle !== undefined) {
    let totalLow = 0;
    for (const a of analyses) {
      const shared = a.sharedDeps.reduce((s, d) => s + d.size, 0);
      totalLow += a.lowSize + shared;
    }
    const maxBytes = budget.maxLowTierBundle * 1024;
    if (totalLow > maxBytes) {
      const totalKB = Math.round(totalLow / 1024);
      messages.push(
        `${prefix}: Low-tier bundle is ${totalKB}KB (budget: ${budget.maxLowTierBundle}KB)`,
      );
    }
  }

  if (budget.maxHighVariant !== undefined) {
    const maxBytes = budget.maxHighVariant * 1024;
    for (const a of analyses) {
      if (a.highSize > maxBytes) {
        const sizeKB = Math.round(a.highSize / 1024);
        messages.push(
          `${prefix}: ${a.boundary.name} high variant is ${sizeKB}KB (budget: ${budget.maxHighVariant}KB)`,
        );
      }
    }
  }

  if (budget.minSavingsPercent !== undefined) {
    for (const a of analyses) {
      if (a.savingsPercent < budget.minSavingsPercent) {
        messages.push(
          `${prefix}: ${a.boundary.name} saves only ${a.savingsPercent.toFixed(1)}% (minimum: ${budget.minSavingsPercent}%)`,
        );
      }
    }
  }

  return {
    passed: messages.length === 0,
    messages,
  };
}
