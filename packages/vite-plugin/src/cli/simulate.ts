import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const IMPORT_RE = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractImports(source: string): string[] {
  const imports: string[] = [];
  let match: RegExpExecArray | null;

  const staticRe = new RegExp(IMPORT_RE.source, 'g');
  while ((match = staticRe.exec(source)) !== null) {
    imports.push(match[1]);
  }

  const dynamicRe = new RegExp(DYNAMIC_IMPORT_RE.source, 'g');
  while ((match = dynamicRe.exec(source)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function categorizeImports(imports: string[]) {
  const nodeModules: string[] = [];
  const local: string[] = [];

  for (const imp of imports) {
    if (imp.startsWith('.') || imp.startsWith('/')) {
      local.push(imp);
    } else {
      nodeModules.push(imp);
    }
  }

  return { nodeModules, local };
}

export async function runSimulate(targetPath: string | undefined, _flags: Record<string, string>) {
  if (!targetPath) {
    process.stderr.write('Usage: adaptive simulate <component-path>\n');
    process.exitCode = 1;
    return;
  }

  const fullPath = resolve(targetPath);
  if (!existsSync(fullPath)) {
    process.stderr.write(`File not found: ${fullPath}\n`);
    process.exitCode = 1;
    return;
  }

  const source = readFileSync(fullPath, 'utf-8');
  const imports = extractImports(source);
  const { nodeModules, local } = categorizeImports(imports);

  process.stdout.write(`\nSimulating adaptive boundary for ${targetPath}...\n\n`);

  if (nodeModules.length > 0) {
    process.stdout.write('  External dependencies (potential high-variant exclusives):\n');
    for (const dep of nodeModules) {
      process.stdout.write(`    ${dep}\n`);
    }
  }

  if (local.length > 0) {
    process.stdout.write('\n  Local imports:\n');
    for (const dep of local) {
      process.stdout.write(`    ${dep}\n`);
    }
  }

  process.stdout.write(
    `\n  To proceed: npx adaptive init ${targetPath}\n\n` +
      'Note: Accurate size data requires a full Vite build.\n',
  );
}
