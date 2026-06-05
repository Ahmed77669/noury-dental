'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, Heart } from 'lucide-react';

interface IntroEnvelopeProps {
  onComplete: () => void;
}

export default function IntroEnvelope({ onComplete }: IntroEnvelopeProps) {
  const [stage, setStage] = useState<'enter' | 'open' | 'slide' | 'zoom' | 'finished'>('enter');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-progress animation stages
  useEffect(() => {
    // Stage 1: Scale & fade in the envelope (enter) -> then open the top flap
    const timer1 = setTimeout(() => {
      setStage('open');
    }, 1200);

    // Stage 2: Slide the letter upwards
    const timer2 = setTimeout(() => {
      setStage('slide');
    }, 2400);

    // Stage 3: Bring the letter forward, zoom, and center it
    const timer3 = setTimeout(() => {
      setStage('zoom');
    }, 3800);

    // Stage 4: Fade in the buttons and final decorative elements
    const timer4 = setTimeout(() => {
      setStage('finished');
    }, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Music Toggle
  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Audio play blocked by browser policy:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Skip / Continue handler
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Set local storage flag so it won't show on subsequent visits
    localStorage.setItem('noury_intro_seen', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070913]/95 backdrop-blur-xl overflow-hidden select-none font-cairo">
      {/* Background soft glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-rose-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

      {/* Music Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleMusic}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-pink-900/40 bg-pink-950/20 text-pink-300 hover:bg-pink-900/30 active:scale-95 transition-all text-xs"
        >
          {isPlaying ? (
            <>
              <Volume2 size={14} className="animate-bounce" />
              <span>كتم الموسيقى</span>
            </>
          ) : (
            <>
              <VolumeX size={14} />
              <span>تشغيل الموسيقى 🎵</span>
            </>
          )}
        </button>
      </div>

      {/* 3D Scene Wrapper */}
      <div 
        className="relative flex items-center justify-center w-[340px] h-[360px] md:w-[460px] md:h-[450px]"
        style={{ perspective: 1200 }}
      >
        {/* ENVELOPE GROUP */}
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-[320px] h-[220px] md:w-[420px] md:h-[280px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* 1. Envelope Back Flap */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1b1222] to-[#25152a] rounded-b-2xl border border-pink-900/20 shadow-2xl z-10" />

          {/* 2. The Letter */}
          <motion.div
            variants={{
              enter: { y: 15, scale: 0.96, zIndex: 12 },
              open: { y: 15, scale: 0.96, zIndex: 12 },
              slide: { y: -130, scale: 0.98, zIndex: 12 },
              zoom: { y: -30, scale: 1.15, zIndex: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
              finished: { y: -30, scale: 1.15, zIndex: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
            }}
            animate={stage}
            transition={{
              type: 'spring',
              stiffness: stage === 'zoom' ? 70 : 80,
              damping: stage === 'zoom' ? 15 : 18,
            }}
            className="absolute left-[5%] top-[5%] w-[90%] h-[90%] bg-gradient-to-br from-[#fefdfb] via-[#faf7f0] to-[#f4eee1] rounded-xl border border-amber-200/50 p-6 flex flex-col items-center justify-between text-[#2c1d30] shadow-md cursor-default select-text"
          >
            {/* Soft Paper Texture Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(#ebd9bd_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-10 rounded-xl pointer-events-none" />

            {/* Letter Top Details */}
            <div className="w-full flex items-center justify-between border-b border-amber-200/40 pb-2 mb-2">
              <span className="text-[10px] text-amber-800/60 uppercase tracking-widest">Noury / نوري</span>
              <Heart size={14} className="text-red-400 fill-red-400 animate-pulse" />
            </div>

            {/* Letter Body Content */}
            <div className="flex-1 flex flex-col justify-center text-center my-3 w-full">
              <p className="text-sm md:text-base font-semibold leading-relaxed text-[#3a2240] drop-shadow-sm select-none" dir="rtl">
                الموقع ده معمول علشان نور بس 😌❤️
              </p>
              <p className="text-xs md:text-sm text-[#543b5b] mt-3 leading-relaxed select-none" dir="rtl">
                بس بما إنك هنا خلاص… خدي لفة حلوة في الموقع بتاعك 😉
              </p>
            </div>

            {/* Letter Footer (Continue button inside letter) */}
            <AnimatePresence>
              {(stage === 'zoom' || stage === 'finished') && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  onClick={handleClose}
                  className="w-full py-2 bg-gradient-to-r from-pink-900 to-[#4e1c5a] hover:from-pink-800 hover:to-[#5e226d] text-amber-50 active:scale-98 transition-all rounded-lg font-medium text-xs tracking-wider shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles size={13} className="text-amber-200 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>دخول إلى الموقع (Continue)</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 3. Front Left Flap */}
          <div 
            className="absolute left-0 bottom-0 top-0 w-[50%] bg-[#21152a] z-20 rounded-bl-2xl border-l border-pink-950/20 shadow-md"
            style={{ 
              clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
              boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
            }}
          />

          {/* 4. Front Right Flap */}
          <div 
            className="absolute right-0 bottom-0 top-0 w-[50%] bg-[#21152a] z-20 rounded-br-2xl border-r border-pink-950/20 shadow-md"
            style={{ 
              clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
              boxShadow: '-4px 0 10px rgba(0,0,0,0.1)'
            }}
          />

          {/* 5. Front Bottom Flap */}
          <div 
            className="absolute left-0 right-0 bottom-0 h-[60%] bg-gradient-to-t from-[#1b0e22] to-[#25152c] z-22 rounded-b-2xl border-b border-pink-950/20 shadow-md"
            style={{ 
              clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
              boxShadow: '0 -4px 10px rgba(0,0,0,0.1)'
            }}
          />

          {/* 6. Top Flap (Rotating flap) */}
          <motion.div
            variants={{
              enter: { rotateX: 0, zIndex: 25 },
              open: { 
                rotateX: 180, 
                zIndex: 5,
                transition: { duration: 1.0, ease: 'easeInOut' }
              },
              slide: { rotateX: 180, zIndex: 5 },
              zoom: { rotateX: 180, zIndex: 5 },
              finished: { rotateX: 180, zIndex: 5 }
            }}
            animate={stage}
            className="absolute left-0 right-0 top-0 h-[50%] bg-[#2d1b35] origin-top border-t border-pink-900/10 shadow-inner"
            style={{ 
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              backfaceVisibility: 'hidden',
            }}
          />
        </motion.div>
      </div>

      {/* Quick Skip Footer Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 3 }}
        className="absolute bottom-6 text-center text-[10px] text-pink-300/40 tracking-wider hover:opacity-100 transition-opacity cursor-pointer"
        onClick={handleClose}
      >
        اضغطي لتخطي المقدمة (Skip)
      </motion.div>
    </div>
  );
}
