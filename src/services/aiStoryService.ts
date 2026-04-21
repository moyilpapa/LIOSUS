import { getGenAI, MODELS } from "../lib/gemini";
import { StoryIntelligenceObject, Emotion } from "../types/story";
import { Type } from "@google/genai";

const SIO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          role: { type: Type.STRING },
          visualTraits: { type: Type.STRING }
        },
        required: ["name", "description", "role", "visualTraits"]
      }
    },
    setting: { type: Type.STRING },
    events: { type: Type.ARRAY, items: { type: Type.STRING } },
    emotionMap: { type: Type.ARRAY, items: { type: Type.STRING } },
    moral: { type: Type.STRING },
    suggestedAge: { type: Type.NUMBER },
    gapAnalysis: { type: Type.STRING },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          narration: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          emotion: { type: Type.STRING, enum: ['magical', 'energetic', 'somber', 'tense', 'joyful'] },
          visualStyle: { type: Type.STRING }
        },
        required: ["id", "title", "content", "narration", "imagePrompt", "emotion", "visualStyle"]
      }
    }
  },
  required: ["title", "characters", "setting", "events", "emotionMap", "moral", "scenes", "suggestedAge"]
};

export const extractStoryIntelligence = async (input: string): Promise<StoryIntelligenceObject> => {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: `
      You are a 2099 story architect. 
      Input from parent: "${input}"
      
      Tasks:
      1. Normalize this into a cinematic Story Intelligence Object (SIO).
      2. Ensure the narrative flows in 3-5 scenes.
      3. For character visualTraits, provide a "Visual Reference Guide" description (e.g. "Liam: A tall 10-year-old boy with messy raven-black hair, wearing a glowing red techno-armor and brown leather gloves").
      4. CRITICAL INSTRUCTION: To maintain character consistency, EVERY 'imagePrompt' MUST start with the exact Visual Reference descriptions for every character in that scene. Do not use generic terms like "the boy"; use "Liam (as described in traits)". 
      5. The 'visualStyle' for EVERY scene MUST be: "Hyper-realistic Pixar-style 3D animation, volumetric lighting, ray-traced shadows, cinematic 8k resolution, magical atmosphere".
      6. SAFETY MANDATE: Ensure every scene and image prompt is strictly G-rated and kid-friendly. Characters must be fully and appropriately clothed in all descriptions. No adult themes, violence, or suggestive content.
    `,
    config: {
      systemInstruction: "You are the Liosus Safety Architect. Your job is to extract memories and turn them into strictly G-rated children's stories. You must ensure all character descriptions include full, modest clothing and prevent any adult, violent, or suggestive content from entering the story intelligence object.",
      responseMimeType: "application/json",
      responseSchema: SIO_SCHEMA as any
    }
  });

  if (!response.text) throw new Error("Failed to extract story intelligence.");
  return JSON.parse(response.text);
};

export const generateSceneImage = async (prompt: string, style: string): Promise<string> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: {
        parts: [{ text: `Strictly G-rated, kid-friendly movie scene. Characters must be modestly and fully clothed. No adult, suggestive, or violent themes. Style: ${style}. Frame: ${prompt}` }]
      },
      config: {
        systemInstruction: "You are a child-safe image architect. You generate beautiful, magical, G-rated cinematic art. You MUST filter out all adult content, nudity, or suggestive elements. Every character must be fully and appropriately dressed for a children's story.",
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
    if (!part?.inlineData?.data) throw new Error("No image data returned from Gemini");
    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    if (error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Image Quota Exceeded. Using cinematic themed fallback.");
      // Return a themed cinematic landscape from a stable source
      const seeds = ['nebula', 'magic-forest', 'starlight', 'cyberpunk', 'dreamscape'];
      const seed = seeds[Math.floor(Math.random() * seeds.length)];
      return `https://picsum.photos/seed/liosus-${seed}/1280/720?blur=1`;
    }
    console.error("Image generation error:", error);
    // Standard fallback
    return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 20))}/1280/720`;
  }
};

export const generateSceneNarration = async (text: string, emotion: Emotion): Promise<string> => {
  // Map emotion to a voice hint
  const emotionHints: Record<Emotion, string> = {
    magical: "Whispering with wonder",
    energetic: "Fast and excited",
    somber: "Slow and thoughtful",
    tense: "Low and urgent",
    joyful: "Bright and happy"
  };

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: [{ parts: [{ text: `[${emotionHints[emotion]}] ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' } // Warm and friendly
            }
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
    const base64Audio = part?.inlineData?.data;
    
    if (!base64Audio || base64Audio.length < 100) {
      throw new Error("No valid audio data returned from Gemini");
    }
    
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error: any) {
    if (error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("TTS Quota Exceeded. Narration will be disabled for this scene.");
    } else {
      console.error("TTS generation error:", error);
    }
    // Return empty string to signify no audio available
    return "";
  }
};
