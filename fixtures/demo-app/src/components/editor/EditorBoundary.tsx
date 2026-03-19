import { adaptive } from '@adaptive-bundle/react';

const EditorBoundary = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
  name: 'Editor',
  loading: 'lazy',
});

export default EditorBoundary;
