import { SAMPLE_DATA } from '../../heavy/chart-engine';

export default function StaticChart() {
  const max = Math.max(...SAMPLE_DATA.map((d) => d.value));

  return (
    <div className="static-fallback">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Value</th>
            <th style={{ width: '50%' }}>Distribution</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_DATA.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{d.value}</td>
              <td>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: '#e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(d.value / max) * 100}%`,
                      height: '100%',
                      background: '#2563eb',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
