import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  isUpdating: boolean;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration);
      
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if app is installed (standalone mode)
  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(standalone);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  const updateApp = useCallback(async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } finally {
      setIsUpdating(false);
    }
  }, [updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
  }, [setOfflineReady]);

  const status: PWAStatus = {
    isOnline,
    isInstalled,
    needRefresh,
    offlineReady,
    isUpdating,
  };

  return {
    ...status,
    updateApp,
    dismissUpdate,
    dismissOfflineReady,
  };
}
