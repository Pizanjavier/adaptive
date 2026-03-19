export default function Impact() {
  return (
    <div>
      <div className="page-header">
        <h1>Impact Analysis</h1>
        <p>
          Estimated bundle savings, parse time improvements, and loading strategy breakdown for each
          adaptive boundary in this app.
        </p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2>Bundle Size Comparison</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="impact-table">
            <thead>
              <tr>
                <th>Boundary</th>
                <th>High Variant</th>
                <th>Low Variant</th>
                <th>Savings</th>
                <th>Loading</th>
              </tr>
            </thead>
            <tbody>
              {BOUNDARIES.map((b) => (
                <tr key={b.name}>
                  <td>
                    <strong>{b.name}</strong>
                  </td>
                  <td>{b.highKB} KB</td>
                  <td>{b.lowKB} KB</td>
                  <td style={{ color: 'var(--tier-high)' }}>
                    {b.highKB - b.lowKB} KB ({Math.round(((b.highKB - b.lowKB) / b.highKB) * 100)}
                    %)
                  </td>
                  <td>
                    <span className={`loading-badge ${b.loading}`}>{b.loading}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Parse Time Estimates</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="impact-table">
              <thead>
                <tr>
                  <th>Boundary</th>
                  <th>Low-end (SD 4xx)</th>
                  <th>Desktop</th>
                </tr>
              </thead>
              <tbody>
                {BOUNDARIES.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>{(b.highKB * 0.8).toFixed(0)} ms</td>
                    <td>{(b.highKB * 0.1).toFixed(0)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
              Estimate: ~0.8ms/KB on Snapdragon 4xx, ~0.1ms/KB on modern desktop.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Download Time Estimates</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="impact-table">
              <thead>
                <tr>
                  <th>Boundary</th>
                  <th>3G (1.5 Mbps)</th>
                  <th>4G (10 Mbps)</th>
                </tr>
              </thead>
              <tbody>
                {BOUNDARIES.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>{((b.highKB * 8) / 1500).toFixed(1)}s</td>
                    <td>{((b.highKB * 8) / 10000).toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
              Download times for high-tier variant (worst case for low-end devices).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Loading Strategies</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="impact-table">
              <thead>
                <tr>
                  <th>Boundary</th>
                  <th>Strategy</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {BOUNDARIES.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>
                      <span className={`loading-badge ${b.loading}`}>{b.loading}</span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{b.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Total Impact</h2>
          </div>
          <div className="card-body">
            <div className="impact-summary">
              <div className="impact-stat">
                <span className="impact-value">{totalSavings} KB</span>
                <span className="impact-label">Total savings (low tier)</span>
              </div>
              <div className="impact-stat">
                <span className="impact-value">{savingsPercent}%</span>
                <span className="impact-label">Average reduction</span>
              </div>
              <div className="impact-stat">
                <span className="impact-value">{lazyCount}</span>
                <span className="impact-label">Lazy-loaded boundaries</span>
              </div>
              <div className="impact-stat">
                <span className="impact-value">{eagerCount}</span>
                <span className="impact-label">Eager-loaded (critical)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BoundaryData {
  name: string;
  highKB: number;
  lowKB: number;
  loading: 'eager' | 'lazy' | 'viewport';
  rationale: string;
}

const BOUNDARIES: BoundaryData[] = [
  {
    name: 'Metrics',
    highKB: 48,
    lowKB: 3,
    loading: 'eager',
    rationale: 'Above-the-fold on dashboard — preloaded for instant render',
  },
  {
    name: 'Chart',
    highKB: 32,
    lowKB: 2,
    loading: 'viewport',
    rationale: 'Mid-page content — loads on first render (default)',
  },
  {
    name: 'Scene3D',
    highKB: 620,
    lowKB: 4,
    loading: 'lazy',
    rationale: 'Separate page with 600KB+ Three.js — deferred until scrolled into view',
  },
  {
    name: 'Editor',
    highKB: 180,
    lowKB: 8,
    loading: 'lazy',
    rationale: 'Heavy code editor — lazy to avoid blocking initial page load',
  },
  {
    name: 'MediaPlayer',
    highKB: 95,
    lowKB: 12,
    loading: 'viewport',
    rationale: 'Capability-gated (Dolby) — standard loading with build-time pruning',
  },
];

const totalSavings = BOUNDARIES.reduce((sum, b) => sum + (b.highKB - b.lowKB), 0);
const savingsPercent = Math.round(
  (BOUNDARIES.reduce((sum, b) => sum + (b.highKB - b.lowKB) / b.highKB, 0) / BOUNDARIES.length) *
    100,
);
const lazyCount = BOUNDARIES.filter((b) => b.loading === 'lazy').length;
const eagerCount = BOUNDARIES.filter((b) => b.loading === 'eager').length;
