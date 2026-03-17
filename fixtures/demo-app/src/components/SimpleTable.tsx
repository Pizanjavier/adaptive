const rows = [
  { label: 'CPU', value: '4 cores' },
  { label: 'Memory', value: '4 GB' },
  { label: 'GPU', value: 'Integrated' },
];

export function SimpleTable() {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Metric</th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.label}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
