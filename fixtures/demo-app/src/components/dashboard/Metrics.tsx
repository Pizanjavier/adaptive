import { adaptive } from '@adaptive-bundle/react';

const Metrics = adaptive({
  high: () => import('./AnimatedMetrics'),
  low: () => import('./StaticMetrics'),
  name: 'Metrics',
  loading: 'eager',
});

export default Metrics;
