import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration';

// Suppress benign Vite HMR WebSocket connection warnings in sandboxed preview iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason?.message || reason?.stack || (typeof reason === 'string' ? reason : '') || String(reason || '')).toLowerCase();
    if (msg.includes('websocket') || msg.includes('vite') || msg.includes('closed without')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = (event.message || event.error?.message || '').toLowerCase();
    if (msg.includes('websocket') || msg.includes('vite') || msg.includes('closed without')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker to cache essential study resources for offline capability
registerServiceWorker();
