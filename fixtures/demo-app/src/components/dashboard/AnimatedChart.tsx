import { useEffect, useRef } from 'react';
import { drawChart, SAMPLE_DATA, type ChartConfig } from '../../heavy/chart-engine';

export default function AnimatedChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    startRef.current = performance.now();
    let raf: number;

    const config: ChartConfig = {
      data: SAMPLE_DATA,
      width: rect.width,
      height: rect.height,
      lineColor: '#2563eb',
      fillColor: 'rgba(37, 99, 235, 0.08)',
      gridColor: '#e5e7eb',
      textColor: '#64748b',
      animated: true,
    };

    function animate() {
      const elapsed = performance.now() - startRef.current;
      const progress = Math.min(elapsed / 1200, 1);
      drawChart(ctx!, config, progress);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    }

    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', height: 280 }} />
    </div>
  );
}
