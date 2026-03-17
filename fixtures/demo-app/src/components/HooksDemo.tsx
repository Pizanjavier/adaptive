import { useAdaptive, useTier } from '@adaptive/react';

export default function HooksDemo() {
  const tier = useTier();
  const { shouldDefer, effectiveType, profile } = useAdaptive();

  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
      <dt style={{ fontWeight: 'bold' }}>Tier</dt>
      <dd style={{ margin: 0 }}>{tier}</dd>

      <dt style={{ fontWeight: 'bold' }}>Score</dt>
      <dd style={{ margin: 0 }}>{profile.score.toFixed(3)}</dd>

      <dt style={{ fontWeight: 'bold' }}>Should Defer</dt>
      <dd style={{ margin: 0 }}>{shouldDefer ? 'Yes' : 'No'}</dd>

      <dt style={{ fontWeight: 'bold' }}>Effective Type</dt>
      <dd style={{ margin: 0 }}>{effectiveType ?? 'unknown'}</dd>

      <dt style={{ fontWeight: 'bold' }}>CPU Cores</dt>
      <dd style={{ margin: 0 }}>{profile.probes.cpuCores ?? 'unknown'}</dd>

      <dt style={{ fontWeight: 'bold' }}>Memory</dt>
      <dd style={{ margin: 0 }}>{profile.probes.memoryGB ?? 'unknown'} GB</dd>
    </dl>
  );
}
