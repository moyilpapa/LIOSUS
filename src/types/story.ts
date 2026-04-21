/**
 * Story Intelligence Object (SIO) types.
 */

export type Emotion = 'magical' | 'energetic' | 'somber' | 'tense' | 'joyful';

export interface Character {
  name: string;
  description: string;
  role: string;
  visualTraits: string;
}

export interface Scene {
  id: string;
  title: string;
  content: string;
  narration: string;
  imagePrompt: string;
  emotion: Emotion;
  visualStyle: string;
}

export interface StoryIntelligenceObject {
  title: string;
  characters: Character[];
  setting: string;
  events: string[];
  emotionMap: string[]; // Timeline of emotions
  moral: string;
  scenes: Scene[];
  suggestedAge: number;
  gapAnalysis?: string; // Missing info AI detected
}

export interface StoryState {
  rawInput: string;
  inputType: 'voice' | 'text';
  isProcessing: boolean;
  sio: StoryIntelligenceObject | null;
  currentSceneIndex: number;
  isGeneratingAssets: boolean;
  generatedImages: Record<string, string>; // Scene ID -> Base64/DataURL
  narrationAudio: Record<string, string>; // Scene ID -> Base64
}
