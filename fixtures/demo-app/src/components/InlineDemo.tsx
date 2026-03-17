import { Adaptive } from '@adaptive/react';

export default function InlineDemo() {
  return (
    <div>
      <Adaptive.High>
        <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>
          High-tier content: animations, transitions, and rich interactions enabled.
        </p>
      </Adaptive.High>
      <Adaptive.Low>
        <p style={{ color: '#c62828', fontWeight: 'bold' }}>
          Low-tier content: simplified UI for better performance on this device.
        </p>
      </Adaptive.Low>
    </div>
  );
}
