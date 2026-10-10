import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import './lib/theme';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline PWA caching & reliable offline mobile access
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('PWA: New content available, updating service worker cache.');
  },
  onOfflineReady() {
    console.info('PWA: Application offline cache ready for mobile network resilience.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
