import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdaptiveProvider } from '@adaptive/react';
import App from './App';
import './styles.css';

if (import.meta.env.DEV) {
  import('@adaptive/devtools').then((m) => m.init({ position: 'bottom-right' }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdaptiveProvider>
      <App />
    </AdaptiveProvider>
  </StrictMode>,
);
