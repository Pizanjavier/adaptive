import { useState } from 'react';

export default function BasicEditor() {
  const [text, setText] = useState('Hello, Basic Editor!');

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      style={{
        width: '100%',
        minHeight: 120,
        fontFamily: 'sans-serif',
        padding: 8,
        border: '1px solid #ccc',
        borderRadius: 4,
      }}
    />
  );
}
