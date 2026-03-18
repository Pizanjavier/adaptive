import { adaptive } from '@adaptive/react';

const Metrics = adaptive({
  high: () => import('./AnimatedMetrics'),
  low: () => import('./StaticMetrics'),
  name: 'Metrics',
});

export default Metrics;
