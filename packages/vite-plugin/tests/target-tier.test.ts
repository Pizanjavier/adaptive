import { describe, it, expect } from 'vitest';
import { transformForTargetTier } from '../src/target-tier.js';
import type { ResolvedConfig } from '../src/types.js';

function makeConfig(targetTier?: 'high' | 'low'): ResolvedConfig {
  return {
    analysisSizeThreshold: 50,
    report: true,
    reportFormat: 'console',
    reportDir: './adaptive-reports',
    preloadHints: true,
    ssrDefaultTier: 'low',
    sizeOverrides: {},
    devtools: false,
    targetTier,
  };
}

describe('transformForTargetTier', () => {
  it('returns null when no targetTier configured', () => {
    const source = `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`;
    expect(transformForTargetTier(source, 'test.tsx', makeConfig())).toBeNull();
  });

  it('returns null for files without adaptive calls or inline blocks', () => {
    const source = `export const foo = 42;`;
    expect(transformForTargetTier(source, 'test.tsx', makeConfig('high'))).toBeNull();
  });

  describe('adaptive() call transforms', () => {
    it('replaces two-variant with static import for high tier', () => {
      const source = `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`;
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain("import __adaptive_static_0 from './A';");
      expect(result).toContain('const X = __adaptive_static_0;');
      expect(result).not.toContain('adaptive({');
    });

    it('replaces two-variant with static import for low tier', () => {
      const source = `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`;
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('low'))!;
      expect(result).toContain("import __adaptive_static_0 from './B';");
      expect(result).toContain('const X = __adaptive_static_0;');
    });

    it('replaces exclusion pattern with static import for high tier', () => {
      const source = `const X = adaptive({ component: () => import('./Full'), lowFallback: null });`;
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain("import __adaptive_static_0 from './Full';");
      expect(result).toContain('const X = __adaptive_static_0;');
    });

    it('skips exclusion pattern for low tier (lowFallback is JSX, not an import)', () => {
      const source = `const X = adaptive({ component: () => import('./Heavy'), lowFallback: <img src="/map.png" /> });`;
      expect(transformForTargetTier(source, 'test.tsx', makeConfig('low'))).toBeNull();
    });

    it('handles multiple adaptive calls', () => {
      const source = [
        `const A = adaptive({ high: () => import('./AHigh'), low: () => import('./ALow') });`,
        `const B = adaptive({ high: () => import('./BHigh'), low: () => import('./BLow') });`,
      ].join('\n');
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain("import __adaptive_static_0 from './AHigh';");
      expect(result).toContain("import __adaptive_static_1 from './BHigh';");
      expect(result).toContain('const A = __adaptive_static_0;');
      expect(result).toContain('const B = __adaptive_static_1;');
    });
  });

  describe('Adaptive.High/Low JSX transforms', () => {
    it('keeps High children and removes Low block for high tier', () => {
      const source = `<Adaptive.High><Fancy /></Adaptive.High><Adaptive.Low><Simple /></Adaptive.Low>`;
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain('<Fancy />');
      expect(result).not.toContain('Adaptive.High');
      expect(result).toContain('{null}');
      expect(result).not.toContain('<Simple />');
    });

    it('keeps Low children and removes High block for low tier', () => {
      const source = `<Adaptive.High><Fancy /></Adaptive.High><Adaptive.Low><Simple /></Adaptive.Low>`;
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('low'))!;
      expect(result).toContain('<Simple />');
      expect(result).not.toContain('Adaptive.Low');
      expect(result).toContain('{null}');
      expect(result).not.toContain('<Fancy />');
    });

    it('handles blocks with attributes', () => {
      const source = `<Adaptive.High imports={() => import('./x')}><Chart /></Adaptive.High>`;
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain('<Chart />');
      expect(result).not.toContain('Adaptive.High');
    });
  });

  describe('import cleanup', () => {
    it('removes adaptive import when no longer used', () => {
      const source = [
        `import { adaptive } from '@adaptive-bundle/react';`,
        `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`,
      ].join('\n');
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).not.toContain('@adaptive-bundle/react');
    });

    it('preserves other imports from the same package', () => {
      const source = [
        `import { adaptive, useTier } from '@adaptive-bundle/react';`,
        `const X = adaptive({ high: () => import('./A'), low: () => import('./B') });`,
      ].join('\n');
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain("import { useTier } from '@adaptive-bundle/react';");
      expect(result).not.toContain('adaptive,');
    });

    it('removes Adaptive import when inline blocks are fully resolved', () => {
      const source = [
        `import { Adaptive } from '@adaptive-bundle/react';`,
        `<Adaptive.High><Chart /></Adaptive.High>`,
        `<Adaptive.Low><Table /></Adaptive.Low>`,
      ].join('\n');
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).not.toContain('@adaptive-bundle/react');
    });
  });

  describe('combined transforms', () => {
    it('handles adaptive() calls and inline blocks in the same file', () => {
      const source = [
        `import { adaptive, Adaptive } from '@adaptive-bundle/react';`,
        `const Editor = adaptive({ high: () => import('./Rich'), low: () => import('./Basic') });`,
        `function App() {`,
        `  return <div>`,
        `    <Adaptive.High><Fancy /></Adaptive.High>`,
        `    <Adaptive.Low><Simple /></Adaptive.Low>`,
        `  </div>;`,
        `}`,
      ].join('\n');
      const result = transformForTargetTier(source, 'test.tsx', makeConfig('high'))!;
      expect(result).toContain("import __adaptive_static_0 from './Rich';");
      expect(result).toContain('const Editor = __adaptive_static_0;');
      expect(result).toContain('<Fancy />');
      expect(result).toContain('{null}');
      expect(result).not.toContain('@adaptive-bundle/react');
    });
  });
});
