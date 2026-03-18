import { adaptive } from '@adaptive-bundle/react';

const MediaPlayer = adaptive({
  high: () => import('./DolbyPlayer'),
  low: () => import('./StandardPlayer'),
  requires: ['dolby-atmos'],
  capabilityFallback: () => import('./StandardPlayer'),
  name: 'MediaPlayer',
});

export default MediaPlayer;
