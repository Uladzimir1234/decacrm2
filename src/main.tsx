import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Report frontend errors to API
window.addEventListener('error', (e) => {
  fetch('https://api.decacrm.live/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'window.error',
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack?.substring(0, 2000),
    }),
  }).catch(() => {});
});

window.addEventListener('unhandledrejection', (e) => {
  fetch('https://api.decacrm.live/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'unhandledrejection',
      message: String(e.reason),
      stack: e.reason?.stack?.substring(0, 2000),
    }),
  }).catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
