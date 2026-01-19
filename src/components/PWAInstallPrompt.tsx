import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed or in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);

    // Show prompt after delay if not dismissed recently (24 hours)
    if (!standalone && hoursSinceDismiss > 24) {
      const timer = setTimeout(() => {
        if (iOS) {
          setShowIOSInstructions(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt after a delay
      if (hoursSinceDismiss > 24) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {/* Android/Chrome Install Prompt */}
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <img 
                src="/pwa-icons/icon-144x144.png" 
                alt="Tranquili+" 
                className="w-10 h-10 rounded-lg"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Instalar Tranquili+
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Adicione à sua tela inicial para acesso rápido e offline
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                >
                  Agora não
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS Install Instructions */}
      {showIOSInstructions && isIOS && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <img 
                src="/pwa-icons/icon-144x144.png" 
                alt="Tranquili+" 
                className="w-10 h-10 rounded-lg"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Instalar Tranquili+
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para instalar no seu iPhone/iPad:
              </p>
              
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Toque em</span>
                  <Share className="h-4 w-4 text-primary" />
                  <span>Compartilhar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Role e toque em</span>
                  <Plus className="h-4 w-4 text-primary" />
                  <span>"Adicionar à Tela de Início"</span>
                </li>
              </ol>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="mt-3"
              >
                Entendi
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
