import { useState } from 'react';
import { geminiClient } from '@/integrations/gemini/client';
import { toast } from '@/hooks/use-toast';

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const generateResponse = async (prompt: string): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      toast({
        title: "AI Not Available",
        description: "Gemini API key not configured",
        variant: "destructive",
      });
      return "AI service is not available. Please configure the Gemini API key.";
    }

    setLoading(true);
    try {
      const result = await geminiClient.generateContent(prompt);
      setResponse(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "AI Error",
        description: errorMessage,
        variant: "destructive",
      });
      return `Error: ${errorMessage}`;
    } finally {
      setLoading(false);
    }
  };

  const streamResponse = async (prompt: string, onChunk: (chunk: string) => void): Promise<void> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      toast({
        title: "AI Not Available",
        description: "Gemini API key not configured",
        variant: "destructive",
      });
      onChunk("AI service is not available. Please configure the Gemini API key.");
      return;
    }

    setLoading(true);
    try {
      await geminiClient.streamContent(prompt, onChunk);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "AI Error",
        description: errorMessage,
        variant: "destructive",
      });
      onChunk(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    response,
    generateResponse,
    streamResponse
  };
};