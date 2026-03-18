export default function StaticScene() {
  return (
    <div className="scene-static">
      <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
        <ellipse cx="140" cy="140" rx="100" ry="100" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        <ellipse
          cx="140"
          cy="140"
          rx="100"
          ry="40"
          stroke="#cbd5e1"
          strokeWidth="1"
          fill="none"
          transform="rotate(60 140 140)"
        />
        <ellipse
          cx="140"
          cy="140"
          rx="100"
          ry="40"
          stroke="#cbd5e1"
          strokeWidth="1"
          fill="none"
          transform="rotate(-60 140 140)"
        />
        <ellipse cx="140" cy="140" rx="100" ry="40" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        <circle cx="140" cy="140" r="4" fill="#94a3b8" />
        <text
          x="140"
          y="260"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="13"
          fontFamily="Inter, system-ui"
        >
          Static wireframe (low-tier device)
        </text>
      </svg>
    </div>
  );
}
