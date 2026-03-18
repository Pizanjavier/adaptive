import { useState } from 'react';

const PLACEHOLDER = `## Adaptive Plugin

Build intelligent bundles that adapt to device capabilities.

- Ship 60-90% less JS to low-end devices
- Zero runtime cost with targetTier builds
- Works with React, Vue, Svelte, Next.js, Nuxt`;

export default function BasicEditor() {
  const [content, setContent] = useState(PLACEHOLDER);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="editor-toolbar" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        Plain text mode (low-tier device)
      </div>

      <textarea
        className="editor-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: '100%',
          border: 'none',
          resize: 'vertical',
          fontFamily: 'monospace',
          fontSize: 13,
        }}
      />

      <div className="editor-stats">
        <span>{wordCount} words</span>
        <span>{content.length} characters</span>
      </div>
    </div>
  );
}
