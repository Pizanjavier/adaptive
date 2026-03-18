import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

const budgets = {
  core: 3072,
  react: 2048,
};

let failed = false;

for (const [pkg, maxBytes] of Object.entries(budgets)) {
  const distDir = join('packages', pkg, 'dist');
  const indexPath = join(distDir, 'index.js');

  if (!existsSync(indexPath)) {
    console.error(`❌ ${pkg}: dist/index.js not found (run build first)`);
    failed = true;
    continue;
  }

  const content = readFileSync(indexPath);
  const gzipped = gzipSync(content);
  const size = gzipped.length;

  if (size > maxBytes) {
    console.error(`❌ @adaptive/${pkg}: ${size} bytes gzipped (budget: ${maxBytes})`);
    failed = true;
  } else {
    console.log(`✅ @adaptive/${pkg}: ${size} bytes gzipped (budget: ${maxBytes})`);
  }
}

if (failed) process.exit(1);
