import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(import.meta.dirname, '..', 'dist', 'assets');

let files;
try {
  files = readdirSync(distDir);
} catch {
  console.error('❌ dist/assets not found. Run `vite build` first.');
  process.exit(1);
}

const jsFiles = files.filter((f) => f.endsWith('.js'));
console.log(`\nFound ${jsFiles.length} JS chunks in dist/assets/:\n`);
jsFiles.forEach((f) => console.log(`  ${f}`));

const adaptiveChunks = jsFiles.filter((f) => f.includes('adaptive'));
if (adaptiveChunks.length === 0) {
  console.warn('\n⚠️  No adaptive-* chunks found. Plugin may not have split chunks.');
}

let passed = true;

for (const file of jsFiles) {
  const content = readFileSync(join(distDir, file), 'utf-8');
  const hasChart = content.includes('CHART_ENGINE_PAYLOAD_');
  const hasEditor = content.includes('EDITOR_ENGINE_PAYLOAD_');
  const isLow = file.includes('-low');

  if (isLow && hasChart) {
    console.error(`\n❌ FAIL: Low chunk "${file}" contains CHART_ENGINE`);
    passed = false;
  }
  if (isLow && hasEditor) {
    console.error(`\n❌ FAIL: Low chunk "${file}" contains EDITOR_ENGINE`);
    passed = false;
  }
  if (hasChart || hasEditor) {
    console.log(`\n  📦 "${file}" contains: ${[hasChart && 'CHART_ENGINE', hasEditor && 'EDITOR_ENGINE'].filter(Boolean).join(', ')}`);
  }
}

console.log(passed ? '\n✅ Chunk isolation check passed.\n' : '\n❌ Chunk isolation check FAILED.\n');
process.exit(passed ? 0 : 1);
