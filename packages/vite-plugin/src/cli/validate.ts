import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { scanSource } from '../analysis/scanner.js';
import type { AdaptiveBoundary } from '../types.js';

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

function validateBoundary(boundary: AdaptiveBoundary): string[] {
  const errors: string[] = [];
  const loc = `${boundary.filePath}:${boundary.line}`;

  const highPath = boundary.highImport ?? boundary.componentImport;
  const lowPath = boundary.lowImport ?? boundary.lowFallbackImport;

  if (!highPath) {
    errors.push(`[${loc}] ${boundary.name}: missing high/component variant`);
  }

  if (!lowPath) {
    errors.push(`[${loc}] ${boundary.name}: missing low/lowFallback variant`);
  }

  return errors;
}

export async function runValidate(flags: Record<string, string>) {
  const srcDir = resolve(flags.src ?? 'src');
  process.stdout.write(`Validating adaptive boundaries in ${srcDir}...\n`);

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

  const allErrors: string[] = [];
  for (const boundary of allBoundaries) {
    allErrors.push(...validateBoundary(boundary));
  }

  process.stdout.write(`Found ${allBoundaries.length} boundary(s).\n`);

  if (allErrors.length > 0) {
    process.stdout.write(`\nValidation errors:\n`);
    for (const err of allErrors) {
      process.stdout.write(`  ${err}\n`);
    }
    process.exitCode = 1;
  } else {
    process.stdout.write('All boundaries are valid.\n');
  }
}
