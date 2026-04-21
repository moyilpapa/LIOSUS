import React from 'react';
import { StoryEngine } from './components/StoryEngine';
import { motion } from 'motion/react';

export default function App() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#050308]">
      {/* Frosted Glass Background Layer */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,_#2e1065_0%,_transparent_50%),radial-gradient(circle_at_80%_70%,_#5b21b6_0%,_transparent_50%)] opacity-40 pointer-events-none" />
      
      <nav className="relative z-50 w-full h-20 px-10 flex items-center justify-between border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 accent-gradient rounded-lg flex items-center justify-center neon-glow">
            <span className="text-white font-black text-xs">L</span>
          </div>
          <span className="text-xl font-bold tracking-[0.2em] uppercase">Liosus</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] uppercase opacity-40 tracking-[0.2em]">Core Status</span>
            <span className="text-xs font-mono text-cyan-400 mt-1">NSR</span>
          </div>
          <div className="relative w-8 h-8 rounded-full frosted-glass-sm flex items-center justify-center border border-white/5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
          </div>
        </motion.div>
      </nav>

      <section className="relative z-10">
        <StoryEngine />
      </section>

      {/* Decorative Footer Detail */}
      <footer className="fixed bottom-0 w-full p-10 flex items-end justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-1 opacity-20">
          <div className="w-32 h-[1px] bg-white/20" />
          <span className="text-[10px] uppercase text-white/40 font-bold tracking-tighter italic">Neural Architecture</span>
        </div>
        
        <div className="flex gap-3 opacity-40">
          <div className="w-12 h-12 rounded-full frosted-glass-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
          <div className="w-12 h-12 rounded-full frosted-glass-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          </div>
        </div>
      </footer>
    </main>
  );
}
