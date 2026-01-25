import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ImageUploadProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onCancel, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      
      // Extract base64 without the data URL prefix
      const base64 = result.split(',')[1];
      setSelectedFile({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onImageSelect(selectedFile.base64, selectedFile.mimeType);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-primary/5 transition-colors"
        >
          <div className="text-4xl">📷</div>
          <div className="text-center">
            <p className="text-foreground font-medium">Toque para selecionar uma imagem</p>
            <p className="text-sm text-muted-foreground mt-1">
              Foto de texto manuscrito em papel ou caderno
            </p>
          </div>
        </motion.button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain bg-muted"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Transcrevendo...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 rounded-xl border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Trocar imagem
            </button>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 rounded-xl border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !selectedFile}
              className={`flex-1 py-2 px-4 rounded-xl font-bold ${
                !isProcessing && selectedFile
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processando...' : 'Transcrever'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
