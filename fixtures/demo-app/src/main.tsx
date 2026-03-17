import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdaptiveProvider } from '@adaptive/react';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdaptiveProvider>
      <App />
    </AdaptiveProvider>
  </StrictMode>,
);
