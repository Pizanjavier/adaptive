import { EDITOR_ENGINE, createEditor } from '../heavy/editor-engine';
import { useState } from 'react';

export default function RichEditor() {
  const [state, setState] = useState(() => createEditor('Hello, Rich Editor!'));

  return (
    <div>
      <p>Engine loaded: {EDITOR_ENGINE.length.toLocaleString()} chars</p>
      <textarea
        value={state.content}
        onChange={(e) => setState({ ...state, content: e.target.value })}
        style={{
          width: '100%',
          minHeight: 120,
          fontFamily: 'monospace',
          padding: 8,
          border: '2px solid #4a90d9',
          borderRadius: 4,
        }}
      />
      <p style={{ fontSize: 12, color: '#666' }}>
        Cursor: {state.cursorPos} | Selections: {state.selections.length}
      </p>
    </div>
  );
}
