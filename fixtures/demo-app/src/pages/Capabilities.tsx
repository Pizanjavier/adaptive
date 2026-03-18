import { Suspense } from 'react';
import { Adaptive } from '@adaptive-bundle/react';
import MediaPlayer from '../components/media/MediaBoundary';

export default function Capabilities() {
  return (
    <div>
      <div className="page-header">
        <h1>Capabilities</h1>
        <p>
          Components below use <code>requires</code> to declare device capabilities. The build
          prunes chunks when no device in a tier supports the required capability.
        </p>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <Suspense fallback={<div className="card" style={{ minHeight: 160 }} />}>
          <MediaPlayer />
        </Suspense>

        <div className="card">
          <div className="card-header">
            <h2>How It Works</h2>
          </div>
          <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
              The <code>MediaPlayer</code> boundary declares <code>requires: ['dolby-atmos']</code>.
              At build time, the plugin checks which devices in each tier support this capability.
            </p>
            <Adaptive.High>
              <p style={{ color: 'var(--tier-high)' }}>
                If no <strong>high-tier</strong> device has <code>dolby-atmos</code>, the Dolby
                chunk is pruned and the standard player is served instead.
              </p>
            </Adaptive.High>
            <Adaptive.Low>
              <p style={{ color: 'var(--tier-low)' }}>
                Low-tier devices without the capability get the <strong>standard player</strong>{' '}
                automatically.
              </p>
            </Adaptive.Low>
          </div>
        </div>
      </div>
    </div>
  );
}
