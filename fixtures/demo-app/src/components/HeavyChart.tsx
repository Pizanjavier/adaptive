import { CHART_ENGINE, renderChart } from '../heavy/chart-data';

const sampleData = [12, 45, 78, 34, 56, 89, 23, 67];

export default function HeavyChart() {
  const chart = renderChart(sampleData);

  return (
    <div>
      <p>Engine loaded: {CHART_ENGINE.length.toLocaleString()} chars</p>
      <pre style={{ fontFamily: 'monospace', fontSize: 14 }}>{chart}</pre>
    </div>
  );
}
