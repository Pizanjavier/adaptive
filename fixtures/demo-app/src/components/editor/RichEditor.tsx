import { useState, useRef } from 'react';
import {
  createEditorState,
  applyFormat,
  markdownToHtml,
  SAMPLE_CONTENT,
  type FormatAction,
} from '../../heavy/editor-engine';

const TOOLBAR: Array<{ action: FormatAction; label: string }> = [
  { action: 'bold', label: 'B' },
  { action: 'italic', label: 'I' },
  { action: 'heading', label: 'H2' },
  { action: 'code', label: '</>' },
  { action: 'link', label: 'Link' },
  { action: 'list', label: 'List' },
  { action: 'quote', label: 'Quote' },
];

export default function RichEditor() {
  const [state, setState] = useState(() => createEditorState(SAMPLE_CONTENT));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleFormat(action: FormatAction) {
    const el = textareaRef.current;
    if (!el) return;

    const result = applyFormat(state.content, el.selectionStart, el.selectionEnd, action);

    setState(createEditorState(result.content));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.cursorPos, result.cursorPos);
    });
  }

  function handleChange(value: string) {
    setState(createEditorState(value));
  }

  return (
    <div>
      <div className="editor-toolbar">
        {TOOLBAR.map(({ action, label }) => (
          <button key={action} onClick={() => handleFormat(action)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <textarea
          ref={textareaRef}
          className="editor-content"
          value={state.content}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            border: 'none',
            borderRight: '1px solid var(--border)',
            resize: 'none',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        />
        <div
          className="editor-preview"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(state.content) }}
        />
      </div>

      <div className="editor-stats">
        <span>{state.wordCount} words</span>
        <span>{state.charCount} characters</span>
      </div>
    </div>
  );
}
