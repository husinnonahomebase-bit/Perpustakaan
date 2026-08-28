import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Offline PWA Capabilities
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Lumina PWA] Service worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Lumina PWA] Service worker registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register so offline caching and PWA testing works seamlessly
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Lumina PWA Dev] Service worker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Lumina PWA Dev] Service worker notice:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
