import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoryIntelligenceObject } from '../types/story';
import { ChevronLeft, ChevronRight, Download, Play, Pause, RefreshCw } from 'lucide-react';

interface MoviePlayerProps {
  sio: StoryIntelligenceObject;
  images: Record<string, string>;
  narration: Record<string, string>;
  onClose: () => void;
}

export const MoviePlayer: React.FC<MoviePlayerProps> = ({ sio, images, narration, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentScene = sio.scenes[currentIndex];
  const currentImage = images[currentScene.id];
  const currentAudio = narration[currentScene.id];

  useEffect(() => {
    let autoAdvanceTimer: NodeJS.Timeout | null = null;

    if (isPlaying) {
      if (currentAudio && currentAudio.startsWith('data:audio')) {
        // Play Audio Narration
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        if (audioRef.current.src !== currentAudio) {
          audioRef.current.src = currentAudio;
          audioRef.current.load();
        }

        audioRef.current.play().catch(err => {
          console.warn("Audio playback failed, falling back to timer-based advance", err);
          // Fallback to timer if playback fails
          autoAdvanceTimer = setTimeout(() => {
            handleNextAuto();
          }, 6000);
        });
        
        audioRef.current.onended = () => {
          handleNextAuto();
        };
      } else {
        // No narration or quota exceeded: Fallback to silent transition
        console.log("No narration available, using timer-based advance");
        autoAdvanceTimer = setTimeout(() => {
          handleNextAuto();
        }, 7000); // 7 seconds per scene when silent
      }
    } else {
      audioRef.current?.pause();
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    }

    return () => {
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    };
  }, [isPlaying, currentIndex, currentAudio]);

  const handleNextAuto = () => {
    if (currentIndex < sio.scenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < sio.scenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${sio.title.replace(/\s+/g, '_')}_Scene_${currentIndex + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = currentImage;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Cinematic Asset Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          {currentImage ? (
            <motion.img
              src={currentImage}
              alt={currentScene.title}
              className="w-full h-full object-cover"
              animate={{
                scale: [1, 1.08],
                x: [0, -20, 0],
                y: [0, 10, 0]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear"
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
            </div>
          )}
          {/* Edge vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Narrative HUD */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-12">
        <div className="flex justify-between items-start pt-4">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="frosted-glass-sm px-6 py-3 rounded-2xl"
          >
            <h1 className="text-2xl font-bold tracking-tight text-white/90">{sio.title}</h1>
            <p className="text-cyan-300 text-sm font-mono uppercase tracking-[0.2em] mt-1">Scene {currentIndex + 1} / {sio.scenes.length}</p>
          </motion.div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownload}
              title="Download Scene Frame"
              className="p-3 frosted-glass-sm rounded-full hover:bg-white/10 hover:text-cyan-400 transition-all active:scale-90"
            >
              <Download className="w-6 h-6" />
            </button>
            <button 
              onClick={onClose}
              title="Exit Player"
              className="p-3 frosted-glass-sm rounded-full hover:bg-white/10 transition-all active:scale-90"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center w-full gap-8 mt-auto">
          {/* Caption Overlay (Appears after 1s delay as requested) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id + "-caption"}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="max-w-3xl w-full text-center px-10 py-5 frosted-glass border border-white/5 shadow-3xl rounded-[2rem]"
            >
              <p className="text-lg md:text-xl font-light leading-relaxed text-white/80 tracking-wide drop-shadow-sm">
                {currentScene.narration}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Controls Bar */}
          <div className="flex items-center gap-8 pb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-4 frosted-glass-sm rounded-full disabled:opacity-20 hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-7 bg-white text-black rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center neon-glow"
              >
                {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
              </button>

              <button 
                onClick={handleNext}
                disabled={currentIndex === sio.scenes.length - 1}
                className="p-4 frosted-glass-sm rounded-full disabled:opacity-20 hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
