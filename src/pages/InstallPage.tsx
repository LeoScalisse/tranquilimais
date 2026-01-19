import React, { useState, useEffect } from 'react';
import { Download, Share, Plus, Check, Smartphone, Zap, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, title: 'Acesso Rápido', description: 'Abra direto da sua tela inicial' },
    { icon: Zap, title: 'Super Rápido', description: 'Carregamento instantâneo' },
    { icon: WifiOff, title: 'Funciona Offline', description: 'Use mesmo sem internet' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <img 
            src="/pwa-icons/icon-192x192.png" 
            alt="Tranquili+" 
            className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
          />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Tranquili+</h1>
        <p className="text-primary-foreground/80">Sua jornada para uma vida mais leve</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">App Instalado!</h2>
            <p className="text-muted-foreground mb-6">
              O Tranquili+ já está na sua tela inicial
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar ao App
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Install Instructions */}
            {isIOS ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Como instalar no iPhone/iPad
                </h2>
                
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      1
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Toque no ícone</span>
                      <Share className="h-5 w-5 text-primary" />
                      <span>na barra do Safari</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      2
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Role para baixo e toque em</span>
                      <Plus className="h-5 w-5 text-primary" />
                      <span>"Adicionar à Tela de Início"</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      3
                    </span>
                    <span className="text-muted-foreground">
                      Confirme tocando em "Adicionar"
                    </span>
                  </li>
                </ol>
              </motion.div>
            ) : deferredPrompt ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="w-full text-lg py-6"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Instalar Tranquili+
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Rápido, seguro e não ocupa espaço
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Como instalar
                </h2>
                <p className="text-muted-foreground mb-4">
                  Abra o menu do navegador (três pontos) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 text-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-muted-foreground"
        >
          Continuar no navegador
        </Button>
      </div>
    </div>
  );
};

export default InstallPage;
