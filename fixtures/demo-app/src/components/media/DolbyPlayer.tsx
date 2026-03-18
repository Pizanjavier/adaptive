export default function DolbyPlayer() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Dolby Atmos Player</h3>
        <span className="tier-badge high">Dolby Atmos</span>
      </div>
      <div className="card-body">
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 8,
            padding: 24,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600 }}>Spatial Audio Experience</p>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            Dolby Atmos surround sound enabled
          </p>
        </div>
      </div>
    </div>
  );
}
