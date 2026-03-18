import { adaptive } from '@adaptive/react';

const EditorBoundary = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
  name: 'Editor',
});

export default EditorBoundary;
