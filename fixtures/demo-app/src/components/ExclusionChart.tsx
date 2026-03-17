import { adaptive } from '@adaptive/react';
import { SimpleTable } from './SimpleTable';

const ExclusionChart = adaptive({
  component: () => import('./HeavyChart'),
  lowFallback: <SimpleTable />,
  name: 'ExclusionChart',
});

export default ExclusionChart;
