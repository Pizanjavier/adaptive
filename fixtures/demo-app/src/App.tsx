import { Suspense } from 'react';
import ExclusionChart from './components/ExclusionChart';
import VariantEditor from './components/VariantEditor';
import InlineDemo from './components/InlineDemo';
import HooksDemo from './components/HooksDemo';

const sectionStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
};

export default function App() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1>Adaptive Demo</h1>
      <p style={{ color: '#666' }}>
        Add <code>?adaptive_tier=low</code> to the URL to simulate a low-tier device.
      </p>

      <section style={sectionStyle}>
        <h2>1. Hooks</h2>
        <HooksDemo />
      </section>

      <section style={sectionStyle}>
        <h2>2. Inline Tier Boundaries</h2>
        <InlineDemo />
      </section>

      <section style={sectionStyle}>
        <h2>3. Exclusion Pattern (Chart)</h2>
        <Suspense fallback={<p>Loading chart…</p>}>
          <ExclusionChart />
        </Suspense>
      </section>

      <section style={sectionStyle}>
        <h2>4. Variant Pattern (Editor)</h2>
        <Suspense fallback={<p>Loading editor…</p>}>
          <VariantEditor />
        </Suspense>
      </section>
    </div>
  );
}
