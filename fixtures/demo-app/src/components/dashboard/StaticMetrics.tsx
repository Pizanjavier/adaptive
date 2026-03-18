interface Metric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const METRICS: Metric[] = [
  { label: 'Bundle Size', value: '847 KB', change: '-62%', positive: true },
  { label: 'Low-Tier Bundle', value: '142 KB', change: '-84%', positive: true },
  { label: 'Boundaries', value: '12', change: '+4', positive: true },
  { label: 'Detection', value: '23 ms', change: '-18ms', positive: true },
];

export default function StaticMetrics() {
  return (
    <div className="metrics-grid">
      {METRICS.map((m) => (
        <div key={m.label} className="metric-card">
          <div className="value">{m.value}</div>
          <div className="label">{m.label}</div>
          <div className={`change ${m.positive ? 'positive' : 'negative'}`}>
            {m.change} vs. baseline
          </div>
        </div>
      ))}
    </div>
  );
}
