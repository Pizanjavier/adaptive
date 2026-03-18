export default function StandardPlayer() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Standard Player</h3>
        <span className="tier-badge low">Stereo</span>
      </div>
      <div className="card-body">
        <div
          style={{
            background: '#f1f5f9',
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600, color: '#475569' }}>Standard Audio</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
            Stereo playback (capability fallback)
          </p>
        </div>
      </div>
    </div>
  );
}
