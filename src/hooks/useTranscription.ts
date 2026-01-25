import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribeImage = useCallback(async (imageBase64: string, mimeType: string): Promise<string | null> => {
    setIsTranscribing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-handwriting', {
        body: { imageBase64, mimeType }
      });

      if (error) {
        console.error('Transcription error:', error);
        toast({
          title: 'Erro na transcrição',
          description: 'Não foi possível transcrever a imagem. Tente novamente.',
          variant: 'destructive',
        });
        return null;
      }

      if (data?.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive',
        });
        return null;
      }

      const transcription = data?.transcription;
      
      if (!transcription || transcription.includes('Não foi possível identificar')) {
        toast({
          title: 'Texto não identificado',
          description: 'Não foi possível identificar texto manuscrito na imagem. Tente com outra imagem.',
          variant: 'destructive',
        });
        return null;
      }

      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar a imagem.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const transcribeCanvasImage = useCallback(async (dataUrl: string): Promise<string | null> => {
    // Extract base64 and mime type from data URL
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      toast({
        title: 'Erro',
        description: 'Formato de imagem inválido.',
        variant: 'destructive',
      });
      return null;
    }

    const [, mimeType, base64] = matches;
    return transcribeImage(base64, mimeType);
  }, [transcribeImage]);

  return {
    isTranscribing,
    transcribeImage,
    transcribeCanvasImage,
  };
}
