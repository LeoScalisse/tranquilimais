import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, WifiOff, Wifi, Check, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

const PWALifecycle: React.FC = () => {
  const {
    isOnline,
    needRefresh,
    offlineReady,
    isUpdating,
    updateApp,
    dismissUpdate,
    dismissOfflineReady,
  } = usePWA();

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <WifiOff className="h-4 w-4" />
            <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Toast */}
      <AnimatePresence>
        {isOnline && (
          <motion.div
            key="online-toast"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            className="hidden"
          />
        )}
      </AnimatePresence>

      {/* Update Available Toast */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl"
          >
            <button
              onClick={dismissUpdate}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Atualização Disponível
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Uma nova versão do app está pronta para ser instalada.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={updateApp}
                    size="sm"
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar Agora
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={dismissUpdate}
                    variant="ghost"
                    size="sm"
                  >
                    Depois
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Ready Toast */}
      <AnimatePresence>
        {offlineReady && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 bg-card border border-green-200 rounded-2xl p-4 shadow-xl"
          >
            <button
              onClick={dismissOfflineReady}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-6 w-6 text-green-600" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Pronto para uso offline!
                </h3>
                <p className="text-sm text-muted-foreground">
                  O app foi salvo e pode ser usado mesmo sem internet.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWALifecycle;
