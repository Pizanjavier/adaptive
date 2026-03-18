import { motion } from 'framer-motion';

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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function AnimatedMetrics() {
  return (
    <div className="metrics-grid">
      {METRICS.map((m, i) => (
        <motion.div
          key={m.label}
          className="metric-card"
          custom={i}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="value">{m.value}</div>
          <div className="label">{m.label}</div>
          <div className={`change ${m.positive ? 'positive' : 'negative'}`}>
            {m.change} vs. baseline
          </div>
        </motion.div>
      ))}
    </div>
  );
}
