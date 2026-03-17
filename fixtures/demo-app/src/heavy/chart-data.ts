export const CHART_ENGINE = 'CHART_ENGINE_PAYLOAD_' + 'x'.repeat(20_000);

export function renderChart(data: number[]): string {
  const max = Math.max(...data);
  return data
    .map((v) => {
      const bar = '█'.repeat(Math.round((v / max) * 30));
      return `${v.toString().padStart(4)} │${bar}`;
    })
    .join('\n');
}
