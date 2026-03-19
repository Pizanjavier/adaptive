import { Suspense } from 'react';
import { Adaptive } from '@adaptive-bundle/react';
import Metrics from '../components/dashboard/Metrics';
import Chart from '../components/dashboard/Chart';

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Each card below loads a different component based on your device capabilities.</p>
      </div>

      <div style={{ position: 'relative' }}>
        <span
          className="loading-badge eager"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        >
          eager
        </span>
        <Suspense fallback={<MetricsSkeleton />}>
          <Metrics />
        </Suspense>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Performance Trend</h2>
            <AdaptiveLabel />
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <Suspense fallback={<ChartSkeleton />}>
              <Chart />
            </Suspense>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>How It Works</h2>
          </div>
          <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
              Adaptive detects device capabilities using hardware probes (CPU, memory, GPU) and
              loads the right variant for each boundary.
            </p>
            <Adaptive.High>
              <p style={{ color: 'var(--tier-high)' }}>
                Your device loaded the <strong>high-tier</strong> variants: animated metrics
                (framer-motion) and canvas chart with eased transitions.
              </p>
            </Adaptive.High>
            <Adaptive.Low>
              <p style={{ color: 'var(--tier-low)' }}>
                Your device loaded the <strong>low-tier</strong> variants: static metrics and an
                HTML table — saving ~160KB of JavaScript.
              </p>
            </Adaptive.Low>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="metrics-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="metric-card" style={{ minHeight: 96 }} />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div style={{ height: 280, background: '#fafafa' }} />;
}

function AdaptiveLabel() {
  return (
    <>
      <Adaptive.High>
        <span className="tier-badge high">Canvas</span>
      </Adaptive.High>
      <Adaptive.Low>
        <span className="tier-badge low">Table</span>
      </Adaptive.Low>
    </>
  );
}
