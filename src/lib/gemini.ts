import { GoogleGenAI } from "@google/genai";

export const MODELS = {
  TEXT: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image", 
  TTS: "gemini-3.1-flash-tts-preview"
};

/**
 * Gets a fresh instance of Gemini SDK.
 * As per guidelines, this should be called right before API calls when using Veo 
 * to ensure it uses the user's selected API key.
 */
export const getGenAI = () => {
  return new GoogleGenAI({ 
    apiKey: (process.env.API_KEY || process.env.GEMINI_API_KEY) as string 
  });
};

// Initial instance for non-Veo tasks (or as default)
export const ai = getGenAI();
