import { describe, it, expect } from 'vitest';
import { checkBudgets } from '../src/budget.js';
import type { BoundaryAnalysis, BudgetConfig } from '../src/types.js';

function createAnalysis(
  name: string,
  highSizeKB: number,
  lowSizeKB: number,
  savingsPercent: number,
): BoundaryAnalysis {
  return {
    boundary: { name, filePath: `src/${name}.tsx`, line: 1 },
    highSize: highSizeKB * 1024,
    lowSize: lowSizeKB * 1024,
    mediumSize: 0,
    exclusiveHighDeps: [{ id: 'dep', size: highSizeKB * 1024 }],
    exclusiveLowDeps: [],
    sharedDeps: [{ id: 'shared', size: 10 * 1024 }],
    savings: highSizeKB * 1024,
    savingsPercent,
  };
}

describe('checkBudgets', () => {
  it('passes when all budgets are met', () => {
    const analyses = [createAnalysis('Dashboard', 100, 10, 80)];
    const budget: BudgetConfig = {
      maxLowTierBundle: 200,
      maxHighVariant: 500,
      minSavingsPercent: 40,
    };
    const result = checkBudgets(analyses, budget);
    expect(result.passed).toBe(true);
    expect(result.messages).toHaveLength(0);
  });

  it('fails when low-tier bundle exceeds budget', () => {
    const analyses = [createAnalysis('Dashboard', 300, 180, 50)];
    const budget: BudgetConfig = {
      maxLowTierBundle: 100,
      enforce: 'error',
    };
    const result = checkBudgets(analyses, budget);
    expect(result.passed).toBe(false);
    expect(result.messages[0]).toContain('OVER BUDGET');
    expect(result.messages[0]).toContain('Low-tier bundle');
  });

  it('fails when high variant exceeds budget', () => {
    const analyses = [createAnalysis('MapView', 600, 5, 95)];
    const budget: BudgetConfig = {
      maxHighVariant: 500,
      enforce: 'error',
    };
    const result = checkBudgets(analyses, budget);
    expect(result.passed).toBe(false);
    expect(result.messages[0]).toContain('MapView');
  });

  it('warns when savings percent is below minimum', () => {
    const analyses = [createAnalysis('Hero', 20, 15, 25)];
    const budget: BudgetConfig = {
      minSavingsPercent: 40,
      enforce: 'warn',
    };
    const result = checkBudgets(analyses, budget);
    expect(result.passed).toBe(false);
    expect(result.messages[0]).toContain('WARNING');
    expect(result.messages[0]).toContain('25.0%');
  });

  it('uses warn prefix by default', () => {
    const analyses = [createAnalysis('Hero', 20, 15, 25)];
    const budget: BudgetConfig = { minSavingsPercent: 40 };
    const result = checkBudgets(analyses, budget);
    expect(result.messages[0]).toContain('WARNING');
  });

  it('checks multiple budgets simultaneously', () => {
    const analyses = [
      createAnalysis('Dashboard', 600, 150, 30),
      createAnalysis('Editor', 200, 50, 20),
    ];
    const budget: BudgetConfig = {
      maxHighVariant: 500,
      minSavingsPercent: 40,
      enforce: 'error',
    };
    const result = checkBudgets(analyses, budget);
    expect(result.passed).toBe(false);
    expect(result.messages.length).toBeGreaterThanOrEqual(2);
  });
});
