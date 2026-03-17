import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { scanSource } from '../analysis/scanner.js';
import { formatConsoleReport } from '../reports/console.js';
import type { BoundaryAnalysis, AdaptiveBoundary } from '../types.js';

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      collectSourceFiles(fullPath, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

function fakeAnalysis(boundary: AdaptiveBoundary): BoundaryAnalysis {
  return {
    boundary,
    highSize: 0,
    lowSize: 0,
    mediumSize: 0,
    exclusiveHighDeps: [],
    exclusiveLowDeps: [],
    sharedDeps: [],
    savings: 0,
    savingsPercent: 0,
  };
}

export async function runAnalyze(flags: Record<string, string>) {
  const srcDir = resolve(flags.src ?? 'src');
  process.stdout.write(`Analyzing ${srcDir}...\n`);

  const files = collectSourceFiles(srcDir);
  const allBoundaries: AdaptiveBoundary[] = [];

  for (const file of files) {
    const code = readFileSync(file, 'utf-8');
    const boundaries = scanSource(code, file);
    allBoundaries.push(...boundaries);
  }

  if (allBoundaries.length === 0) {
    process.stdout.write('No adaptive boundaries found.\n');
    return;
  }

  const analyses = allBoundaries.map(fakeAnalysis);
  const report = formatConsoleReport(analyses);
  process.stdout.write(report);
  process.stdout.write(
    '\nNote: Size data requires a full Vite build. Run `vite build` for accurate sizes.\n',
  );
}
