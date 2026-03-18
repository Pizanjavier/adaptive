export interface DataPoint {
  label: string;
  value: number;
}

export interface ChartConfig {
  data: DataPoint[];
  width: number;
  height: number;
  lineColor: string;
  fillColor: string;
  gridColor: string;
  textColor: string;
  animated: boolean;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function drawChart(ctx: CanvasRenderingContext2D, config: ChartConfig, progress = 1): void {
  const { data, width, height, lineColor, fillColor, gridColor, textColor } = config;
  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;
  const maxVal = Math.max(...data.map((d) => d.value));
  const t = easeOutCubic(Math.min(progress, 1));

  ctx.clearRect(0, 0, width, height);

  drawGrid(ctx, width, height, plotW, plotH, maxVal, gridColor, textColor);
  drawLabels(ctx, data, plotW, height, textColor);
  drawArea(ctx, data, plotW, plotH, maxVal, fillColor, t);
  drawLine(ctx, data, plotW, plotH, maxVal, lineColor, t);
  drawDots(ctx, data, plotW, plotH, maxVal, lineColor, t);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  plotW: number,
  plotH: number,
  maxVal: number,
  gridColor: string,
  textColor: string,
): void {
  const steps = 5;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = textColor;
  ctx.font = '11px system-ui';
  ctx.textAlign = 'right';

  for (let i = 0; i <= steps; i++) {
    const y = PADDING.top + (plotH / steps) * i;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y);
    ctx.lineTo(PADDING.left + plotW, y);
    ctx.stroke();

    const val = Math.round(maxVal * (1 - i / steps));
    ctx.fillText(String(val), PADDING.left - 8, y + 4);
  }
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  plotW: number,
  height: number,
  textColor: string,
): void {
  ctx.fillStyle = textColor;
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';

  const step = plotW / (data.length - 1);
  for (let i = 0; i < data.length; i++) {
    ctx.fillText(data[i].label, PADDING.left + step * i, height - 10);
  }
}

function getPoint(
  data: DataPoint[],
  idx: number,
  plotW: number,
  plotH: number,
  maxVal: number,
  t: number,
): [number, number] {
  const step = plotW / (data.length - 1);
  const x = PADDING.left + step * idx;
  const y = PADDING.top + plotH - lerp(0, (data[idx].value / maxVal) * plotH, t);
  return [x, y];
}

function drawArea(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  plotW: number,
  plotH: number,
  maxVal: number,
  fillColor: string,
  t: number,
): void {
  ctx.beginPath();
  const [x0, y0] = getPoint(data, 0, plotW, plotH, maxVal, t);
  ctx.moveTo(x0, y0);

  for (let i = 1; i < data.length; i++) {
    const [x, y] = getPoint(data, i, plotW, plotH, maxVal, t);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(PADDING.left + plotW, PADDING.top + plotH);
  ctx.lineTo(PADDING.left, PADDING.top + plotH);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  plotW: number,
  plotH: number,
  maxVal: number,
  lineColor: string,
  t: number,
): void {
  ctx.beginPath();
  const [x0, y0] = getPoint(data, 0, plotW, plotH, maxVal, t);
  ctx.moveTo(x0, y0);

  for (let i = 1; i < data.length; i++) {
    const [x, y] = getPoint(data, i, plotW, plotH, maxVal, t);
    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  plotW: number,
  plotH: number,
  maxVal: number,
  color: string,
  t: number,
): void {
  for (let i = 0; i < data.length; i++) {
    const [x, y] = getPoint(data, i, plotW, plotH, maxVal, t);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export const SAMPLE_DATA: DataPoint[] = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 58 },
  { label: 'Mar', value: 35 },
  { label: 'Apr', value: 74 },
  { label: 'May', value: 63 },
  { label: 'Jun', value: 89 },
  { label: 'Jul', value: 71 },
  { label: 'Aug', value: 95 },
  { label: 'Sep', value: 82 },
  { label: 'Oct', value: 67 },
  { label: 'Nov', value: 78 },
  { label: 'Dec', value: 91 },
];
