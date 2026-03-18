import { Suspense } from 'react';
import { Adaptive } from '@adaptive-bundle/react';
import Scene from '../components/exploration/Scene';

export default function Exploration() {
  return (
    <div>
      <div className="page-header">
        <h1>3D Explorer</h1>
        <p>
          Interactive 3D scene powered by Three.js — only loaded on high-tier devices. Low-tier
          devices get a static SVG wireframe instead.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Interactive Scene</h2>
          <Adaptive.High>
            <span className="tier-badge high">Three.js (~600KB)</span>
          </Adaptive.High>
          <Adaptive.Low>
            <span className="tier-badge low">Static SVG (~2KB)</span>
          </Adaptive.Low>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <Suspense fallback={<SceneSkeleton />}>
            <Scene />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>High-Tier Variant</h2>
          </div>
          <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
            <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>Three.js with React Three Fiber</li>
              <li>Real-time rotating torus knot</li>
              <li>PBR materials with distortion</li>
              <li>Orbit controls for interaction</li>
              <li>Dynamic lighting and shadows</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Low-Tier Variant</h2>
          </div>
          <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
            <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>Inline SVG wireframe (~2KB)</li>
              <li>No JavaScript runtime cost</li>
              <li>No GPU requirements</li>
              <li>Instant render, no loading</li>
              <li>Works on any browser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneSkeleton() {
  return (
    <div
      style={{
        height: 400,
        background: '#0f172a',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        fontSize: 14,
      }}
    >
      Loading scene...
    </div>
  );
}
