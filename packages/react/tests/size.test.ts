import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

describe('size budget', () => {
  it('@adaptive-bundle/react is under 2KB gzipped', () => {
    const distPath = resolve(__dirname, '../dist/index.js');
    const content = readFileSync(distPath);
    const gzipped = gzipSync(content);

    expect(gzipped.length).toBeLessThanOrEqual(2048);
  });
});
