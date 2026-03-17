import { adaptive } from '@adaptive/react';

const VariantEditor = adaptive({
  high: () => import('./RichEditor'),
  low: () => import('./BasicEditor'),
  name: 'VariantEditor',
});

export default VariantEditor;
