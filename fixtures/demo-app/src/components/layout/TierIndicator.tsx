import { useTier, useAdaptive } from '@adaptive/react';

export function TierIndicator() {
  const tier = useTier();
  const { profile } = useAdaptive();

  return (
    <div>
      <span className={`tier-badge ${tier}`}>
        {tier === 'high' ? '\u25B2' : '\u25BC'} {tier} tier
      </span>
      <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
        <div>Score: {profile.score.toFixed(2)}</div>
        <div>Cores: {profile.probes.cpuCores ?? 'N/A'}</div>
        <div>Memory: {profile.probes.memoryGB ?? 'N/A'} GB</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>?adaptive_tier=low to test</div>
    </div>
  );
}
