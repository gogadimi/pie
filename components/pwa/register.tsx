'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[PIE PWA] Registered', reg.scope);
    }).catch((err) => {
      console.error('[PIE PWA] Failed', err);
    });
  }, []);
  return null;
}
