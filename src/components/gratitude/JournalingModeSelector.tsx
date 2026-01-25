import React from 'react';
import { motion } from 'framer-motion';

export type JournalingMode = 'type' | 'write-draw' | 'write-upload';

interface JournalingModeSelectorProps {
  onSelectMode: (mode: JournalingMode) => void;
}

const JournalingModeSelector: React.FC<JournalingModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Como você quer fazer seu journaling?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha a forma que preferir para registrar sua gratidão
        </p>
      </div>

      <div className="grid gap-3">
        {/* Write Option - Recommended */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative"
        >
          <div className="absolute -top-2 left-4 z-10">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              ✨ Recomendado
            </span>
          </div>
          
          <div className="border-2 border-primary rounded-xl overflow-hidden">
            <button
              onClick={() => onSelectMode('write-draw')}
              className="w-full p-4 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">✍️</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Escrever à mão</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escreva diretamente no quadro branco do app. A escrita manual ajuda na reflexão e memória.
                  </p>
                </div>
              </div>
            </button>
            
            <div className="border-t border-primary/20">
              <button
                onClick={() => onSelectMode('write-upload')}
                className="w-full p-4 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📷</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Enviar foto de escrita</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fotografe seu texto escrito em papel ou caderno e a IA transcreverá automaticamente.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Type Option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectMode('type')}
          className="w-full p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">⌨️</span>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Digitar</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Digite seu journaling usando o teclado.
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default JournalingModeSelector;
