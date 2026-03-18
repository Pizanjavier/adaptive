import { adaptive } from '@adaptive-bundle/react';

const Chart = adaptive({
  high: () => import('./AnimatedChart'),
  low: () => import('./StaticChart'),
  name: 'Chart',
});

export default Chart;
