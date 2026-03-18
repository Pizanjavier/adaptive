import { adaptive } from '@adaptive-bundle/react';

const Metrics = adaptive({
  high: () => import('./AnimatedMetrics'),
  low: () => import('./StaticMetrics'),
  name: 'Metrics',
});

export default Metrics;
