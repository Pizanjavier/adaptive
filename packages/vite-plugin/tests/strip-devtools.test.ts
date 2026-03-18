import { describe, it, expect } from 'vitest';
import { stripDevtoolsImport } from '../src/strip-devtools.js';

describe('stripDevtoolsImport', () => {
  it('replaces single-quote dynamic import', () => {
    const code = "if (dev) import('@adaptive/devtools').then(m => m.init())";
    const result = stripDevtoolsImport(code, '/app/main.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('Promise.resolve({init(){},destroy(){}})');
    expect(result!.code).not.toContain('@adaptive/devtools');
  });

  it('replaces double-quote dynamic import', () => {
    const code = 'import("@adaptive/devtools").then(m => m.init())';
    const result = stripDevtoolsImport(code, '/app/main.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('Promise.resolve({init(){},destroy(){}})');
  });

  it('returns null for code without devtools import', () => {
    const code = "import { adaptive } from '@adaptive/react'";
    const result = stripDevtoolsImport(code, '/app/main.ts');
    expect(result).toBeNull();
  });

  it('returns null for node_modules', () => {
    const code = "import('@adaptive/devtools')";
    const result = stripDevtoolsImport(code, '/node_modules/foo/index.js');
    expect(result).toBeNull();
  });

  it('replaces multiple occurrences', () => {
    const code = `import('@adaptive/devtools');import("@adaptive/devtools")`;
    const result = stripDevtoolsImport(code, '/app/main.ts');
    expect(result).not.toBeNull();
    expect(result!.code).not.toContain('@adaptive/devtools');
  });

  it('does not replace static imports', () => {
    const code = "import { init } from '@adaptive/devtools'";
    const result = stripDevtoolsImport(code, '/app/main.ts');
    expect(result).toBeNull();
  });
});
