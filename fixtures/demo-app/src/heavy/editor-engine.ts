export interface EditorState {
  content: string;
  html: string;
  wordCount: number;
  charCount: number;
}

export type FormatAction = 'bold' | 'italic' | 'heading' | 'code' | 'link' | 'list' | 'quote';

const FORMAT_MAP: Record<FormatAction, { prefix: string; suffix: string }> = {
  bold: { prefix: '**', suffix: '**' },
  italic: { prefix: '_', suffix: '_' },
  heading: { prefix: '## ', suffix: '' },
  code: { prefix: '`', suffix: '`' },
  link: { prefix: '[', suffix: '](url)' },
  list: { prefix: '- ', suffix: '' },
  quote: { prefix: '> ', suffix: '' },
};

export function createEditorState(content = ''): EditorState {
  return {
    content,
    html: markdownToHtml(content),
    wordCount: countWords(content),
    charCount: content.length,
  };
}

export function applyFormat(
  content: string,
  selStart: number,
  selEnd: number,
  action: FormatAction,
): { content: string; cursorPos: number } {
  const { prefix, suffix } = FORMAT_MAP[action];
  const selected = content.slice(selStart, selEnd);
  const formatted = prefix + (selected || 'text') + suffix;
  const newContent = content.slice(0, selStart) + formatted + content.slice(selEnd);
  return {
    content: newContent,
    cursorPos: selStart + formatted.length,
  };
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function markdownToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      let html = escapeHtml(line);

      if (html.startsWith('## ')) {
        return `<h2>${html.slice(3)}</h2>`;
      }
      if (html.startsWith('&gt; ')) {
        return `<blockquote>${html.slice(5)}</blockquote>`;
      }
      if (html.startsWith('- ')) {
        return `<li>${html.slice(2)}</li>`;
      }

      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/_(.+?)_/g, '<em>$1</em>');
      html = html.replace(/`(.+?)`/g, '<code>$1</code>');
      html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

      return html ? `<p>${html}</p>` : '<br/>';
    })
    .join('\n');
}

export const SAMPLE_CONTENT = `## Adaptive Plugin

Build **intelligent** bundles that adapt to _device capabilities_.

- Ship 60-90% less JS to low-end devices
- Zero runtime cost with \`targetTier\` builds
- Works with React, Vue, Svelte, Next.js, Nuxt

> The only tool with first-class STB/CTV support.

Check the [documentation](https://github.com/adaptive) for details.`;
