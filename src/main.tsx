/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  // Reload page when a new service worker takes over to ensure latest assets are loaded
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || './';
    const swUrl = baseUrl.endsWith('/') ? `${baseUrl}sw.js` : `${baseUrl}/sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: baseUrl }).then(
      (registration) => {
        console.log('PWA ServiceWorker registered successfully with scope:', registration.scope);
        // Prompt for update check immediately on load
        registration.update();
      },
      (err) => {
        console.warn('PWA ServiceWorker registration notice:', err);
      }
    );
  });
}

