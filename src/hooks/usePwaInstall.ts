import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY_DISMISSED = 'lumina_pwa_install_dismissed_time';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null);

  // Check initial environment
  useEffect(() => {
    // 1. Check if running inside an iframe
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }

    // 2. Check if already standalone
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) {
      setIsInstalled(true);
    }

    // 3. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // 4. Check if user previously dismissed the prompt recently (e.g. within 3 days)
    const dismissedTimestamp = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedTimestamp) {
      const timePassed = Date.now() - parseInt(dismissedTimestamp, 10);
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      if (timePassed < threeDaysInMs) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
        setIsDismissed(false);
      }
    }

    // 5. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // If we got a fresh beforeinstallprompt event, we can offer installation
      console.log('[Lumina PWA] Captured beforeinstallprompt event');
    };

    // 6. Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[Lumina PWA] Application installed successfully');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallOutcome('accepted');
      localStorage.removeItem(STORAGE_KEY_DISMISSED);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    if (!deferredPrompt) {
      return 'unsupported';
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setInstallOutcome(choice.outcome);
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return choice.outcome;
    } catch (err) {
      console.warn('[Lumina PWA] Error invoking installation prompt:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback((days: number = 3) => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());
  }, []);

  const resetDismiss = useCallback(() => {
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEY_DISMISSED);
  }, []);

  return {
    canInstallNative: Boolean(deferredPrompt),
    deferredPrompt,
    isInstalled,
    isStandalone,
    isIOS,
    isIframe,
    isDismissed,
    installOutcome,
    triggerInstall,
    dismissPrompt,
    resetDismiss,
  };
}
