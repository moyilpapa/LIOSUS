import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, Sparkles, Film, AlertCircle, RefreshCw, Type, Wand2 } from 'lucide-react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { MoviePlayer } from './MoviePlayer';
import { extractStoryIntelligence, generateSceneImage, generateSceneNarration } from '../services/aiStoryService';
import { StoryIntelligenceObject, StoryState } from '../types/story';

export const StoryEngine: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    rawInput: "",
    inputType: 'text',
    isProcessing: false,
    sio: null,
    currentSceneIndex: 0,
    isGeneratingAssets: false,
    generatedImages: {},
    narrationAudio: {}
  });

  const [isRecording, setIsRecording] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setState(prev => ({ ...prev, rawInput: prev.rawInput + " " + currentTranscript, inputType: 'voice' }));
        };

        recognitionRef.current.onerror = (err: any) => {
          console.error("Speech Recognition Error:", err);
          setIsRecording(false);
          setError("Voice capture failed. Try typing instead.");
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setState(prev => ({ ...prev, rawInput: "", inputType: 'voice' }));
    }
    setIsRecording(!isRecording);
  };

  const handleProcess = async () => {
    if (!state.rawInput.trim()) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      setError(null);

      const sio = await extractStoryIntelligence(state.rawInput);
      setState(prev => ({ ...prev, sio, isProcessing: false, isGeneratingAssets: true }));
      
      // Kick off asset generation (non-blocking)
      generateAssets(sio);
    } catch (err: any) {
      console.error("Processing error:", err);
      setError("AI Engine misfired. Our 2099 tech is still warming up. " + (err.message || ""));
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const generateAssets = async (sio: StoryIntelligenceObject) => {
    for (const scene of sio.scenes) {
      try {
        // Parallelize Image and Audio for each scene
        const [visualUrl, audio] = await Promise.all([
          generateSceneImage(scene.imagePrompt, scene.visualStyle),
          generateSceneNarration(scene.narration, scene.emotion)
        ]);

        setState(prev => ({
          ...prev,
          generatedImages: { ...prev.generatedImages, [scene.id]: visualUrl },
          narrationAudio: { ...prev.narrationAudio, [scene.id]: audio }
        }));
      } catch (err: any) {
        console.error(`Asset generation failed for scene ${scene.id}`, err);
      }
    }
    setState(prev => ({ ...prev, isGeneratingAssets: false }));
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-8 pointer-events-auto">
      <AnimatePresence mode="wait">
        {!state.sio ? (
          <motion.div
            key="input-stage"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col gap-12"
          >
            {/* Header Area */}
            <div className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4"
              >
                <Sparkles className="w-3 h-3" />
                NEURAL STORYTELLER
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
                Liosus <span className="text-cyan-400">Memory</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                Speak or type a real-life moment. Lumina AI will weave it into a cinematic masterpiece for your little ones.
              </p>
            </div>

            {/* Multimodal Inlet */}
            <div className="frosted-glass p-8 rounded-[2.5rem] relative holographic-glow">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, inputType: 'text' }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${state.inputType === 'text' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'text-slate-400'}`}
                    >
                      <Type className="w-4 h-4" />
                      Text
                    </button>
                    <button 
                      onClick={() => setState(prev => ({ ...prev, inputType: 'voice' }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${state.inputType === 'voice' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'text-slate-400'}`}
                    >
                      <Mic className="w-4 h-4" />
                      Voice
                    </button>
                  </div>
                  <VoiceVisualizer isRecording={isRecording} />
                </div>

                <div className="relative group frosted-glass-sm rounded-3xl border border-white/5 overflow-hidden">
                  <textarea
                    value={state.rawInput}
                    onChange={(e) => setState(prev => ({ ...prev, rawInput: e.target.value, inputType: 'text' }))}
                    placeholder={isRecording ? "Listening to your story..." : "A trip to the park, a funny bedtime moment, or a lesson learned..."}
                    className="w-full h-48 bg-transparent p-6 pb-24 text-xl font-light focus:outline-none transition-all placeholder:text-slate-600 resize-none overflow-y-auto custom-scrollbar"
                  />
                  
                  <div className="absolute bottom-4 right-4 flex items-center gap-3 z-10">
                    <button
                      onClick={toggleRecording}
                      className={`p-4 rounded-2xl transition-all frosted-glass-sm ${isRecording ? 'text-red-400 border-red-500/30' : 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'}`}
                    >
                      {isRecording ? <div className="w-6 h-6 animate-pulse bg-red-500 rounded-sm" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={handleProcess}
                      disabled={state.isProcessing || !state.rawInput.trim()}
                      className="accent-gradient px-10 py-5 rounded-full text-white font-bold tracking-[0.2em] uppercase text-[10px] shadow-[0_10px_40px_rgba(8,145,178,0.3)] hover:scale-105 hover:brightness-110 hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-20 transition-all flex items-center"
                    >
                      {state.isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Movie</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
              >
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="processing-stage"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-12 text-center"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">{state.sio.title}</h2>
              <p className="text-cyan-400 font-mono tracking-widest uppercase text-sm">
                Rendering Cinematic Frames...
              </p>
            </div>

            {/* Asset Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {state.sio.scenes.map((scene, idx) => (
                <div key={scene.id} className="frosted-glass-sm p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Phase {idx + 1}</span>
                    <span className="font-light text-cyan-50">{scene.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${state.generatedImages[scene.id] ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-white/10 animate-pulse'}`} />
                    <div className={`w-3 h-3 rounded-full ${state.narrationAudio[scene.id] ? 'bg-purple-400 shadow-[0_0_10px_#9333ea]' : 'bg-white/10 animate-pulse'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                    setState(prev => ({ ...prev, sio: null, generatedImages: {}, narrationAudio: {} }));
                }}
                className="px-10 py-5 frosted-glass-sm rounded-full font-bold hover:bg-white/10 transition-all text-[10px] tracking-widest uppercase border border-white/5"
              >
                Reset Core
              </button>
              <button
                onClick={() => setShowPlayer(true)}
                disabled={Object.keys(state.generatedImages).length === 0}
                className="accent-gradient px-12 py-5 rounded-full text-white font-bold tracking-[0.2em] uppercase text-[10px] shadow-[0_10px_40px_rgba(8,145,178,0.3)] hover:scale-105 hover:brightness-110 hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-20 transition-all flex items-center"
              >
                <Film className="w-4 h-4 mr-2" />
                Watch Movie
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPlayer && state.sio && (
        <MoviePlayer 
          sio={state.sio} 
          images={state.generatedImages} 
          narration={state.narrationAudio} 
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};
