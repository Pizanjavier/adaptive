import { Suspense } from 'react';
import { Adaptive } from '@adaptive-bundle/react';
import EditorBoundary from '../components/editor/EditorBoundary';

export default function EditorPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Editor</h1>
        <p>
          Rich markdown editor with live preview on high-tier devices. Basic textarea on low-tier
          devices.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Markdown Editor</h2>
          <Adaptive.High>
            <span className="tier-badge high">Rich Editor</span>
          </Adaptive.High>
          <Adaptive.Low>
            <span className="tier-badge low">Basic Textarea</span>
          </Adaptive.Low>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <Suspense fallback={<EditorSkeleton />}>
            <EditorBoundary />
          </Suspense>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2>What Changed</h2>
        </div>
        <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
          <Adaptive.High>
            <div style={{ color: 'var(--text-secondary)' }}>
              <p>
                The <strong>high-tier</strong> editor includes:
              </p>
              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                <li>Formatting toolbar (bold, italic, heading, code, etc.)</li>
                <li>Side-by-side markdown source and rendered preview</li>
                <li>Real-time word and character count</li>
                <li>Markdown-to-HTML rendering engine</li>
              </ul>
            </div>
          </Adaptive.High>
          <Adaptive.Low>
            <div style={{ color: 'var(--text-secondary)' }}>
              <p>
                The <strong>low-tier</strong> editor provides a plain textarea with word count — no
                formatting toolbar, no preview pane, no markdown engine. This saves the editor
                engine module from the bundle.
              </p>
            </div>
          </Adaptive.Low>
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return <div style={{ minHeight: 280, background: '#fafafa' }} />;
}
