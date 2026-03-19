import { describe, it, expect } from 'vitest';
import { scanSource } from '../src/analysis/scanner.js';

describe('scanSource', () => {
  it('finds adaptive() with high/low pattern', () => {
    const source = `
const Dashboard = adaptive({
  high: () => import('./DashboardFull'),
  low: () => import('./DashboardLite'),
});
`;
    const results = scanSource(source, 'src/Dashboard.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].highImport).toBe('./DashboardFull');
    expect(results[0].lowImport).toBe('./DashboardLite');
    expect(results[0].filePath).toBe('src/Dashboard.tsx');
  });

  it('finds adaptive() with component/lowFallback pattern', () => {
    const source = `
const Editor = adaptive({
  component: () => import('./EditorFull'),
  lowFallback: () => import('./EditorLite'),
});
`;
    const results = scanSource(source, 'src/Editor.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].componentImport).toBe('./EditorFull');
    expect(results[0].lowFallbackImport).toBe('./EditorLite');
  });

  it('finds Adaptive.High JSX pattern', () => {
    const source = `
<Adaptive.High imports={() => import('./HeavyChart')} />
`;
    const results = scanSource(source, 'src/Chart.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].highImport).toBe('./HeavyChart');
  });

  it('finds Adaptive.Low JSX pattern', () => {
    const source = `
<Adaptive.Low imports={() => import('./LiteChart')} />
`;
    const results = scanSource(source, 'src/Chart.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].lowImport).toBe('./LiteChart');
  });

  it('finds multiple boundaries in one file', () => {
    const source = `
const A = adaptive({
  high: () => import('./AHigh'),
  low: () => import('./ALow'),
});
const B = adaptive({
  high: () => import('./BHigh'),
  low: () => import('./BLow'),
});
`;
    const results = scanSource(source, 'src/Page.tsx');
    expect(results).toHaveLength(2);
    expect(results[0].highImport).toBe('./AHigh');
    expect(results[1].highImport).toBe('./BHigh');
  });

  it('returns empty array for files with no adaptive calls', () => {
    const source = `export const foo = 42;`;
    const results = scanSource(source, 'src/utils.ts');
    expect(results).toHaveLength(0);
  });

  it('extracts correct line numbers', () => {
    const source = `import React from 'react';

const X = adaptive({
  high: () => import('./X'),
  low: () => import('./Y'),
});
`;
    const results = scanSource(source, 'src/X.tsx');
    expect(results[0].line).toBe(3);
  });

  it('extracts requires array from adaptive() calls', () => {
    const source = `
const Player = adaptive({
  high: () => import('./PlayerHigh'),
  low: () => import('./PlayerLow'),
  requires: ['dolby-vision', 'hdr10'],
});
`;
    const results = scanSource(source, 'src/Player.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].requires).toEqual(['dolby-vision', 'hdr10']);
  });

  it('extracts capabilityFallbackImport from adaptive() calls', () => {
    const source = `
const Player = adaptive({
  high: () => import('./PlayerHigh'),
  low: () => import('./PlayerLow'),
  requires: ['dolby-vision'],
  capabilityFallback: () => import('./StandardPlayer'),
});
`;
    const results = scanSource(source, 'src/Player.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].capabilityFallbackImport).toBe('./StandardPlayer');
  });

  it('boundaries without requires have undefined requires', () => {
    const source = `
const Widget = adaptive({
  high: () => import('./WidgetHigh'),
  low: () => import('./WidgetLow'),
});
`;
    const results = scanSource(source, 'src/Widget.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].requires).toBeUndefined();
    expect(results[0].capabilityFallbackImport).toBeUndefined();
  });

  it('extracts loading prop from adaptive() calls', () => {
    const source = `
const Scene = adaptive({
  high: () => import('./SceneHigh'),
  low: () => import('./SceneLow'),
  loading: 'lazy',
});
`;
    const results = scanSource(source, 'src/Scene.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].loading).toBe('lazy');
  });

  it('boundaries without loading have undefined loading', () => {
    const source = `
const Widget = adaptive({
  high: () => import('./WidgetHigh'),
  low: () => import('./WidgetLow'),
});
`;
    const results = scanSource(source, 'src/Widget.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].loading).toBeUndefined();
  });

  it('handles medium variant', () => {
    const source = `
const Widget = adaptive({
  high: () => import('./WidgetHigh'),
  medium: () => import('./WidgetMedium'),
  low: () => import('./WidgetLow'),
});
`;
    const results = scanSource(source, 'src/Widget.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].mediumImport).toBe('./WidgetMedium');
  });
});
