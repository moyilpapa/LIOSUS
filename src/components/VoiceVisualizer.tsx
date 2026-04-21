import React from 'react';
import { motion } from 'motion/react';

interface VoiceVisualizerProps {
  isRecording: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isRecording }) => {
  return (
    <div className="flex items-center gap-1.5 h-16 pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-cyan-400 rounded-full"
          animate={isRecording ? {
            height: [10, Math.random() * 50 + 10, 10],
            backgroundColor: ['#00f2ff', '#bc13fe', '#00f2ff']
          } : {
            height: 4,
            backgroundColor: '#334155'
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
