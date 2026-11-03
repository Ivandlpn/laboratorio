import React, { useState, useEffect, useRef } from "react";
import { SoundOption } from "../types";
import { playBeep, speakText } from "../lib/audioHelper";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Plus, Minus, Trophy, Flame, Sparkles, Volume2, VolumeX, Maximize2, Minimize2, Sun } from "lucide-react";

interface RoundCounterProps {
  soundType: SoundOption;
  volume: number;
}

export default function RoundCounter({ soundType, volume }: RoundCounterProps) {
  // Restore rounds and targets from localStorage if available
  const [currentRound, setCurrentRound] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("vortex_rounds_current_v1");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [targetRounds, setTargetRounds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("vortex_rounds_target_v1");
      return saved ? parseInt(saved, 10) : 10;
    } catch {
      return 10;
    }
  });

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  // Screen Wake Lock API State
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async (silent = false) => {
    if (!("wakeLock" in navigator)) {
      return;
    }
    try {
      if (wakeLockRef.current) {
        return; // Already active
      }
      const lock = await (navigator as any).wakeLock.request("screen");
      wakeLockRef.current = lock;
      setIsWakeLockActive(true);
      if (!silent) {
        console.log("Wake Lock prevent sleep active!");
      }
      
      lock.addEventListener("release", () => {
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      });
    } catch (err) {
      if (!silent) {
        console.warn("Could not acquire screen wake lock:", err);
      }
      setIsWakeLockActive(false);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      } catch (err) {
        console.warn("Could not release wake lock:", err);
      }
    }
  };

  // Auto request wake lock on mount / visibility change
  useEffect(() => {
    requestWakeLock(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock(true);
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);

  // Persist rounds
  useEffect(() => {
    try {
      localStorage.setItem("vortex_rounds_current_v1", currentRound.toString());
    } catch (e) {
      console.warn(e);
    }
  }, [currentRound]);

  // Persist target
  useEffect(() => {
    try {
      localStorage.setItem("vortex_rounds_target_v1", targetRounds.toString());
    } catch (e) {
      console.warn(e);
    }
  }, [targetRounds]);

  // Synchronize with Native Fullscreen Changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyNativeFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isCurrentlyNativeFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } catch (err) {
        console.warn("Native fullscreen blocked, falling back to virtual overlay:", err);
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      } catch (err) {
        setIsFullscreen(false);
      }
    }
  };

  // Handle tap increment
  const handleTapScreen = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on a control button, ignore it to prevent double actions
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    // Try to request wake lock on user interaction to guarantee permission
    requestWakeLock(true);

    if (currentRound >= 999) return;

    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);

    // Dynamic high-satisfaction beep
    if (soundType !== "MUTE") {
      if (nextRound === targetRounds) {
        // Celebratory sound
        if (soundType === "VOICE") {
          speakText("¡Entrenamiento completado! ¡Excelente esfuerzo!", volume);
        } else {
          playBeep(523.25, 0.12, volume); // C5
          setTimeout(() => playBeep(659.25, 0.12, volume), 100); // E5
          setTimeout(() => playBeep(783.99, 0.12, volume), 200); // G5
          setTimeout(() => playBeep(1046.50, 0.4, volume), 300); // C6
        }
      } else {
        // Standard high-tech click synth beep
        if (soundType === "VOICE") {
          speakText(`Ronda ${nextRound}`, volume);
        } else {
          playBeep(600, 0.08, volume * 0.9);
          setTimeout(() => playBeep(900, 0.05, volume * 1.1), 60);
        }
      }
    }

    // Try device vibration API
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // Silent block for iframe restrictions
      }
    }

    // Create ripple effect at tap position relative to the container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = { id: rippleIdRef.current++, x, y };
      setRipples((prev) => [...prev, newRipple]);
    }

    // Trigger celebration if target reached
    if (nextRound === targetRounds) {
      setShowCelebration(true);
    } else if (nextRound < targetRounds) {
      setShowCelebration(false);
    }
  };

  // Remove stale ripples after animation completes
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  // Adjust Target Rounds
  const incrementTarget = () => {
    if (targetRounds < 99) {
      setTargetRounds((t) => t + 1);
    }
  };

  const decrementTarget = () => {
    if (targetRounds > 1) {
      setTargetRounds((t) => t - 1);
      if (currentRound > targetRounds - 1) {
        setCurrentRound(targetRounds - 1);
      }
    }
  };

  // Subtract current round
  const handleDecrementRound = () => {
    if (currentRound > 0) {
      setCurrentRound((c) => c - 1);
      setShowCelebration(false);
      if (soundType !== "MUTE") {
        playBeep(350, 0.1, volume * 0.6);
      }
    }
  };

  // Reset rounds
  const handleReset = () => {
    if (currentRound > 0) {
      if (confirm("¿Quieres reiniciar el contador de rondas?")) {
        setCurrentRound(0);
        setShowCelebration(false);
        if (soundType !== "MUTE") {
          playBeep(220, 0.25, volume * 0.5);
        }
      }
    }
  };

  // Percentage calculations
  const progressPercent = Math.min(100, (currentRound / targetRounds) * 100);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col gap-4">
      
      {/* Tap Counter Board */}
      <div 
        ref={containerRef}
        onClick={handleTapScreen}
        id="round-tap-arena"
        className={`relative flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none group transition-all duration-300 ${
          isFullscreen 
            ? "fixed inset-0 z-[100] w-screen h-screen bg-black rounded-none aspect-auto shadow-none" 
            : "w-full aspect-[4/3] xs:aspect-[1.1] rounded-3xl bg-zinc-950 border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
        }`}
      >
        {/* Dynamic Ripples */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{ opacity: 0, scale: 12 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none bg-brand/15 z-0"
              style={{
                left: r.x - 20,
                top: r.y - 20,
                width: 40,
                height: 40,
              }}
            />
          ))}
        </AnimatePresence>

        {/* HUD Elements */}
        <div className={`absolute border-t border-l border-white/20 pointer-events-none transition-all duration-300 ${isFullscreen ? "top-8 left-8 w-8 h-8" : "top-4 left-4 w-5 h-5"}`} />
        <div className={`absolute border-t border-r border-white/20 pointer-events-none transition-all duration-300 ${isFullscreen ? "top-8 right-8 w-8 h-8" : "top-4 right-4 w-5 h-5"}`} />
        <div className={`absolute border-b border-l border-white/20 pointer-events-none transition-all duration-300 ${isFullscreen ? "bottom-8 left-8 w-8 h-8" : "bottom-4 left-4 w-5 h-5"}`} />
        <div className={`absolute border-b border-r border-white/20 pointer-events-none transition-all duration-300 ${isFullscreen ? "bottom-8 right-8 w-8 h-8" : "bottom-4 right-4 w-5 h-5"}`} />

        {/* Outer ambient glow based on alignment */}
        <div className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          showCelebration 
            ? "bg-brand/5 shadow-[inset_0_0_50px_rgba(226,255,49,0.15)]" 
            : "group-hover:bg-white/[0.01]"
        }`} />

        {/* Screen Awake / Wake Lock status indicator */}
        <div 
          className={`absolute z-30 rounded-xl px-2.5 bg-white/5 border border-white/10 flex items-center gap-1.5 transition-all text-[8px] font-mono font-bold tracking-wider uppercase pointer-events-none select-none ${
            isFullscreen ? "top-7 left-7 h-11" : "top-3 left-3 h-8"
          } ${isWakeLockActive ? "text-brand border-brand/20 bg-brand/5" : "text-zinc-500 bg-white/[0.01]"}`}
          title={isWakeLockActive ? "Pantalla siempre activa (Wake Lock activado)" : "Bloqueo de pantalla inactivo o no soportado"}
        >
          <Sun className={`h-3.5 w-3.5 ${isWakeLockActive ? "animate-[spin_15s_linear_infinite] text-brand drop-shadow-[0_0_4px_rgba(226,255,49,0.5)]" : "text-zinc-500"}`} />
          <span className="hidden xs:inline">
            {isWakeLockActive ? "Pantalla Activa" : "WakeLock Inactivo"}
          </span>
        </div>

        {/* Fullscreen control button */}
        <button
          onClick={toggleFullscreen}
          className={`absolute z-30 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:text-white text-zinc-400 active:scale-95 flex items-center justify-center transition-all cursor-pointer ${
            isFullscreen ? "top-7 right-7 h-11 w-11" : "top-3 right-3 h-8 w-8"
          }`}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        {/* Top hint bar */}
        <div className={`absolute left-1/2 -translate-x-1/2 z-10 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none transition-all duration-300 ${
          isFullscreen ? "top-8" : "top-4"
        }`}>
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ping" />
          <span className="text-[8px] font-black font-mono tracking-widest text-zinc-300 uppercase">
            TOCA LA PANTALLA PARA SUMAR
          </span>
        </div>

        {/* Central circular progress wheel with huge typography */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          
          <svg 
            viewBox="0 0 224 224" 
            className={`transform -rotate-90 transition-all duration-300 ${
              isFullscreen 
                ? "w-72 h-72 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px]" 
                : "w-56 h-56"
            }`}
          >
            {/* Background track circle */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-zinc-900 fill-transparent"
              strokeWidth="10"
            />
            {/* Glow effect filter */}
            <defs>
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Front active progress path */}
            <motion.circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-brand fill-transparent"
              strokeWidth="10"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              strokeLinecap="round"
              style={{ filter: "url(#neon-glow)" }}
            />
          </svg>

          {/* Core numerical dashboard centered in circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            
            {/* Flame/Trophy micro icon */}
            <AnimatePresence mode="wait">
              {showCelebration ? (
                <motion.div
                  key="trophy"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="text-brand mb-1"
                >
                  <Trophy className={`${isFullscreen ? "h-8 w-8" : "h-5 w-5"} drop-shadow-[0_0_8px_rgba(226,255,49,0.8)] transition-all duration-300`} />
                </motion.div>
              ) : (
                <motion.div
                  key="flame"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-orange-500 mb-1"
                >
                  <Flame className={`${isFullscreen ? "h-7 w-7" : "h-4 w-4"} animate-bounce transition-all duration-300`} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentRound}
                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.15, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
                className={`font-black italic tracking-tighter text-white transition-all duration-300 ${
                  isFullscreen ? "text-8xl sm:text-9xl md:text-[130px]" : "text-6xl"
                }`}
              >
                {currentRound}
              </motion.div>
            </AnimatePresence>

            <div className={`font-mono text-zinc-500 font-extrabold uppercase tracking-widest mt-0.5 transition-all duration-300 ${
              isFullscreen ? "text-sm" : "text-[10px]"
            }`}>
              / {targetRounds} RONDAS
            </div>

            {/* Percentage Badge */}
            <div className={`rounded bg-white/5 border border-white/5 font-mono font-bold text-zinc-400 transition-all duration-300 ${
              isFullscreen ? "mt-4 px-3 py-1 text-xs" : "mt-2.5 px-2 py-0.5 text-[9px]"
            }`}>
              {Math.round(progressPercent)}% completado
            </div>

          </div>

        </div>

        {/* Celebration Toast inside arena */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`absolute bg-brand text-black rounded-xl flex items-center justify-center gap-3 shadow-[0_10px_35px_rgba(226,255,49,0.5)] border border-brand/40 z-20 pointer-events-none transition-all duration-300 ${
                isFullscreen 
                  ? "bottom-12 left-12 right-12 p-5" 
                  : "bottom-6 left-6 right-6 px-4 py-2.5"
              }`}
            >
              <Sparkles className={`fill-black stroke-black shrink-0 ${isFullscreen ? "h-6 w-6" : "h-4 w-4"}`} />
              <div className="text-left">
                <span className={`block font-black uppercase tracking-wider leading-tight ${isFullscreen ? "text-xs" : "text-[9px]"}`}>OBJETIVO ALCANZADO</span>
                <span className={`block font-bold text-zinc-900 leading-none mt-0.5 ${isFullscreen ? "text-sm" : "text-[10px]"}`}>¡Buen entrenamiento! Todas las rondas completadas.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Minimal HUD Controls in Fullscreen */}
        {isFullscreen && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-zinc-900/95 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <button
              onClick={handleDecrementRound}
              disabled={currentRound === 0}
              className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="h-4 w-4" /> Ronda (-1)
            </button>
            <div className="w-[1px] h-6 bg-white/10" />
            <button
              onClick={() => {
                if (currentRound > 0 && confirm("¿Quieres reiniciar el contador de rondas?")) {
                  setCurrentRound(0);
                  setShowCelebration(false);
                  if (soundType !== "MUTE") {
                    playBeep(220, 0.25, volume * 0.5);
                  }
                }
              }}
              disabled={currentRound === 0}
              className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-red-400 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </button>
          </div>
        )}

      </div>

      {/* Tactile Control Panel - Settings below */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
            CONFIGURACIÓN DEL CONTADOR
          </span>
          <button
            onClick={handleReset}
            disabled={currentRound === 0}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              currentRound > 0
                ? "bg-white/5 hover:bg-white/10 text-red-400 border border-red-500/10"
                : "bg-zinc-950/20 text-zinc-700 border border-transparent cursor-not-allowed"
            }`}
          >
            <RotateCcw className="h-3 w-3" /> Reiniciar
          </button>
        </div>

        {/* Controls Layout */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Target adjustment widget */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Objetivo de Rondas
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementTarget}
                disabled={targetRounds <= 1}
                className="h-9 w-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              
              <div className="flex-1 text-center bg-white/5 border border-white/5 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black text-white">
                {targetRounds}
              </div>

              <button
                onClick={incrementTarget}
                disabled={targetRounds >= 99}
                className="h-9 w-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick round actions widget */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Corregir Cuenta
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDecrementRound}
                disabled={currentRound === 0}
                className="flex-1 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Descontar 1 ronda"
              >
                <Minus className="h-3 w-3" /> Ronda (-1)
              </button>

              <button
                onClick={(e) => {
                  // Manually trigger increment via button if preferred
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleTapScreen({
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    target: e.currentTarget
                  } as any);
                }}
                disabled={currentRound >= 999}
                className="flex-1 h-9 bg-brand text-black rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase hover:scale-[1.02] active:scale-95 cursor-pointer transition-all"
                title="Sumar 1 ronda"
              >
                <Plus className="h-3 w-3" /> Ronda (+1)
              </button>
            </div>
          </div>

        </div>

        {/* Tips & Guidance bar */}
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono leading-relaxed text-zinc-400 uppercase">
            Sugerencia: Coloca el móvil en el suelo o sobre una base estable cerca de ti mientras haces tus flexiones, planchas o saltos. Simplemente estira el brazo para tocar cualquier parte del área superior negra para contar cada ronda sin interrumpir tu concentración.
          </p>
        </div>

      </div>

    </div>
  );
}
