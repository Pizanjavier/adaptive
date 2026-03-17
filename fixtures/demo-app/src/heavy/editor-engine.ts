export const EDITOR_ENGINE = 'EDITOR_ENGINE_PAYLOAD_' + 'x'.repeat(20_000);

export interface EditorState {
  content: string;
  cursorPos: number;
  selections: Array<{ start: number; end: number }>;
}

export function createEditor(initialContent = ''): EditorState {
  return {
    content: initialContent,
    cursorPos: 0,
    selections: [],
  };
}
