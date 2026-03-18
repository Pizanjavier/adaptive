import { adaptive } from '@adaptive/react';

const Chart = adaptive({
  high: () => import('./AnimatedChart'),
  low: () => import('./StaticChart'),
  name: 'Chart',
});

export default Chart;
