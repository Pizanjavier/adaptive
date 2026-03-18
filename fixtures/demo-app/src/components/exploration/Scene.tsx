import { adaptive } from '@adaptive/react';

const Scene = adaptive({
  high: () => import('./ThreeScene'),
  low: () => import('./StaticScene'),
  name: 'Scene3D',
});

export default Scene;
