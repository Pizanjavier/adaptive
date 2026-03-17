import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runInit } from '../src/cli/init.js';
import { runValidate } from '../src/cli/validate.js';

describe('cli init', () => {
  let tempDir: string;
  let origExitCode: number | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'adaptive-cli-'));
    origExitCode = process.exitCode as number | undefined;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    process.exitCode = origExitCode as typeof process.exitCode;
  });

  it('scaffolds lite and adaptive files', async () => {
    const componentPath = join(tempDir, 'MapView.tsx');
    writeFileSync(
      componentPath,
      `interface MapViewProps { center: [number, number]; }
export default function MapView(props: MapViewProps) {
  return <div>Map</div>;
}`,
      'utf-8',
    );

    await runInit(componentPath, {});

    const litePath = join(tempDir, 'MapViewLite.tsx');
    const adaptivePath = join(tempDir, 'MapView.adaptive.tsx');

    expect(existsSync(litePath)).toBe(true);
    expect(existsSync(adaptivePath)).toBe(true);

    const liteContent = readFileSync(litePath, 'utf-8');
    expect(liteContent).toContain('MapViewLite');
    expect(liteContent).toContain('TODO');

    const adaptiveContent = readFileSync(adaptivePath, 'utf-8');
    expect(adaptiveContent).toContain('adaptive');
    expect(adaptiveContent).toContain('./MapView');
    expect(adaptiveContent).toContain('./MapViewLite');
  });

  it('reports error for missing file', async () => {
    await runInit('/nonexistent/file.tsx', {});
    expect(process.exitCode).toBe(1);
  });

  it('reports error when no path given', async () => {
    await runInit(undefined, {});
    expect(process.exitCode).toBe(1);
  });
});

describe('cli validate', () => {
  let tempDir: string;
  let origExitCode: number | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'adaptive-validate-'));
    origExitCode = process.exitCode as number | undefined;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    process.exitCode = origExitCode as typeof process.exitCode;
  });

  it('reports no boundaries when src is empty', async () => {
    await runValidate({ src: tempDir });
  });

  it('validates boundaries with missing variants', async () => {
    const source = `
const Dashboard = adaptive({
  high: () => import('./DashboardFull'),
});
`;
    writeFileSync(join(tempDir, 'Dashboard.tsx'), source, 'utf-8');
    await runValidate({ src: tempDir });
    expect(process.exitCode).toBe(1);
  });

  it('passes valid boundaries', async () => {
    const source = `
const Dashboard = adaptive({
  high: () => import('./DashboardFull'),
  low: () => import('./DashboardLite'),
});
`;
    writeFileSync(join(tempDir, 'Dashboard.tsx'), source, 'utf-8');
    await runValidate({ src: tempDir });
    expect(process.exitCode).toBeUndefined();
  });
});
