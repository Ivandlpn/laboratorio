import React, { useState, useEffect, useRef } from "react";
import { Repetition, WorkoutSession, WorkoutSettings } from "./types";
import CameraTracker from "./components/CameraTracker";
import RoundCounter from "./components/RoundCounter";
import WorkoutHistory from "./components/WorkoutHistory";
import CoachModal from "./components/CoachModal";
import { speakText, playSoundCue, unlockAudio } from "./lib/audioHelper";
import { 
  Dumbbell, 
  Volume2, 
  VolumeX, 
  Bell, 
  Mic, 
  Save, 
  Check, 
  Trash2, 
  Sparkles, 
  Clock, 
  Target, 
  Activity, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Minus, 
  Sun, 
  History, 
  Bot,
  Flame,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // 1. Initial State Definitions
  const [settings, setSettings] = useState<WorkoutSettings>({
    pauseDuration: 3,
    targetAngle: 100, // parallel by default
    soundType: "BEEPS",
    volume: 0.6,
    isSimulationMode: false
  });

  const [activeSessionReps, setActiveSessionReps] = useState<Repetition[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [statsSummary, setStatsSummary] = useState({ total: 0, valid: 0 });
  const [activeTab, setActiveTab] = useState<"detector" | "history" | "rounds">("detector");

  // Coach AI Gemini Modal State
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [coachAnalysisReps, setCoachAnalysisReps] = useState<Repetition[]>([]);
  const [coachTargetPause, setCoachTargetPause] = useState(3);
  const [coachTargetAngle, setCoachTargetAngle] = useState(100);

  const openCoachForSession = (reps: Repetition[] = activeSessionReps, targetPause = settings.pauseDuration, targetAngle = settings.targetAngle) => {
    setCoachAnalysisReps(reps);
    setCoachTargetPause(targetPause);
    setCoachTargetAngle(targetAngle);
    setShowCoachModal(true);
  };

  // Screen Wake Lock API State
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async (silent = false) => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      if (!silent) console.warn("Wake Lock API not supported in this browser");
      setIsWakeLockActive(false);
      return;
    }
    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        setIsWakeLockActive(true);
        return;
      }
      const lock = await (navigator as any).wakeLock.request("screen");
      wakeLockRef.current = lock;
      setIsWakeLockActive(true);

      lock.addEventListener("release", () => {
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      });
    } catch (err: any) {
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
        console.warn("Error releasing wake lock:", err);
      }
    }
  };

  const toggleWakeLock = () => {
    if (isWakeLockActive) {
      releaseWakeLock();
    } else {
      requestWakeLock(false);
    }
  };

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

  // 2. Load and persist state on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("pause_squat_settings_v1");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const sanitized: WorkoutSettings = {
          pauseDuration: typeof parsed.pauseDuration === "number" && !isNaN(parsed.pauseDuration)
            ? parsed.pauseDuration
            : typeof parsed.pauseDuration === "string"
              ? parseFloat(parsed.pauseDuration) || 3
              : 3,
          targetAngle: typeof parsed.targetAngle === "number" && !isNaN(parsed.targetAngle)
            ? parsed.targetAngle
            : typeof parsed.targetAngle === "string"
              ? parseInt(parsed.targetAngle, 10) || 100
              : 100,
          soundType: parsed.soundType === "VOICE" || parsed.soundType === "BEEPS" || parsed.soundType === "MUTE"
            ? parsed.soundType
            : "BEEPS",
          volume: typeof parsed.volume === "number" && !isNaN(parsed.volume)
            ? parsed.volume
            : typeof parsed.volume === "string"
              ? parseFloat(parsed.volume) || 0.6
              : 0.6,
          isSimulationMode: !!parsed.isSimulationMode
        };
        setSettings(sanitized);
      }

      const savedReps = localStorage.getItem("pause_squat_active_reps_v1");
      if (savedReps) {
        setActiveSessionReps(JSON.parse(savedReps));
      }
    } catch (e) {
      console.warn("Could not restore data from localStorage", e);
    }
  }, []);

  // Update stats summary whenever active reps change
  useEffect(() => {
    const total = activeSessionReps.length;
    const valid = activeSessionReps.filter(r => r.success).length;
    setStatsSummary({ total, valid });
  }, [activeSessionReps]);

  // Persist settings whenever they change
  const handleSettingsChange = (newSettings: WorkoutSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("pause_squat_settings_v1", JSON.stringify(newSettings));
    } catch (e) {
      console.warn(e);
    }
  };

  const updateSetting = <K extends keyof WorkoutSettings>(key: K, value: WorkoutSettings[K]) => {
    handleSettingsChange({
      ...settings,
      [key]: value
    });
  };

  // Add a newly tracked repetition
  const handleRepCompleted = (rep: Repetition) => {
    const updatedReps = [...activeSessionReps, rep];
    setActiveSessionReps(updatedReps);
    try {
      localStorage.setItem("pause_squat_active_reps_v1", JSON.stringify(updatedReps));
    } catch (e) {
      console.warn(e);
    }
  };

  // Clear current active series
  const handleClearActiveSet = () => {
    if (confirm("¿Deseas reiniciar esta serie de entrenamiento? Se borrarán las repeticiones actuales.")) {
      setActiveSessionReps([]);
      try {
        localStorage.removeItem("pause_squat_active_reps_v1");
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Save series to persistent workout history
  const handleSaveSet = () => {
    if (activeSessionReps.length === 0) return;

    // Save in persistent history log
    try {
      const newSession: WorkoutSession = {
        id: "session_" + Date.now(),
        date: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        }),
        reps: activeSessionReps,
        targetPause: settings.pauseDuration,
        targetAngle: settings.targetAngle
      };

      const existingHistoryStr = localStorage.getItem("pause_squat_history_sessions_v1");
      const historyList: WorkoutSession[] = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
      historyList.unshift(newSession);
      localStorage.setItem("pause_squat_history_sessions_v1", JSON.stringify(historyList));
    } catch (e) {
      console.warn("Error saving workout history session", e);
    }

    // Voice confirmation / log toast
    if (settings.soundType === "VOICE") {
      speakText("Serie completada y guardada. ¡Excelente trabajo!", settings.volume);
    } else {
      playSoundCue("READY", settings.soundType, settings.volume);
    }

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 3500);

    // Clear active reps
    setActiveSessionReps([]);
    try {
      localStorage.removeItem("pause_squat_active_reps_v1");
    } catch (e) {
      console.warn(e);
    }
  };

  // Pre-configured pause times
  const pausePresets = [1, 2, 3, 4, 5];

  // Pre-configured depth angles
  const depthPresets = [
    { label: "Profunda", angle: 90, desc: "Bajo paralela" },
    { label: "Paralela", angle: 100, desc: "Muslos suelo" },
    { label: "Alta", angle: 110, desc: "Conservadora" }
  ];

  return (
    <div 
      className="min-h-screen bg-black text-zinc-100 flex flex-col antialiased relative overflow-x-hidden"
      onTouchStart={unlockAudio}
      onClick={unlockAudio}
    >
      {/* 0. HIGH CONTRAST DOT GRID BACKGROUND */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      
      {/* 1. COMPACT SPORTY TOP HEADER */}
      <header className="sticky top-0 z-40 bg-black/85 border-b border-white/5 backdrop-blur-md px-4 py-3" id="main-header">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-brand rounded-full flex items-center justify-center text-black shadow-[0_0_12px_rgba(226,255,49,0.4)]">
              <Dumbbell className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tighter text-white uppercase italic">
                  Pause <span className="text-brand">Box</span>
                </h1>
                <span className="text-[8px] bg-brand/10 text-brand font-black px-1.5 py-0.2 rounded-md border border-brand/20 uppercase tracking-wider font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[7px] text-zinc-500 font-mono tracking-widest uppercase">
                DETECTOR BIOMECÁNICO CON IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Screen Wake Lock visual status indicator button */}
            <button
              onClick={toggleWakeLock}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer border ${
                isWakeLockActive
                  ? "bg-brand/10 text-brand border-brand/30 shadow-[0_0_12px_rgba(226,255,49,0.2)] hover:bg-brand/20"
                  : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
              title={isWakeLockActive ? "Pantalla mantenida activa. Clic para cambiar." : "Activar pantalla activa"}
            >
              <Sun className={`h-3.5 w-3.5 ${isWakeLockActive ? "animate-[spin_12s_linear_infinite] text-brand" : "text-zinc-500"}`} />
              <span className="hidden xs:inline sm:inline">
                {isWakeLockActive ? "PANTALLA ACTIVA" : "PANTALLA NORMAL"}
              </span>
              {isWakeLockActive && <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ping" />}
            </button>

            {/* Quick Help Toggle */}
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-all"
              title="Ayuda técnica"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Navigation Sub-header (Athletic Segmented Control) */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3 relative z-20">
        <div className="grid grid-cols-3 p-1.5 bg-zinc-950/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab("detector")}
            className={`py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeTab === "detector" 
                ? "bg-brand text-black shadow-[0_2px_15px_rgba(226,255,49,0.35)] font-black" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="h-4 w-4 shrink-0" /> 
            <span>Cámara</span>
          </button>

          <button 
            onClick={() => setActiveTab("history")}
            className={`py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeTab === "history" 
                ? "bg-brand text-black shadow-[0_2px_15px_rgba(226,255,49,0.35)] font-black" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <History className="h-4 w-4 shrink-0" /> 
            <span>Historial</span>
          </button>

          <button 
            onClick={() => setActiveTab("rounds")}
            className={`py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeTab === "rounds" 
                ? "bg-brand text-black shadow-[0_2px_15px_rgba(226,255,49,0.35)] font-black" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" /> 
            <span>Rondas</span>
          </button>
        </div>
      </div>

      {/* 2. HELP INFO SHEET */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-950 border-b border-white/10 relative z-30"
          >
            <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-3 text-xs leading-normal font-mono text-zinc-400">
              <div className="flex items-center gap-1 text-brand font-bold uppercase tracking-wider">
                <AlertCircle className="h-3.5 w-3.5" /> GUÍA RÁPIDA DE USO
              </div>
              <p>
                1. <strong>Cámara Trasera o Frontal</strong>: Puedes cambiar entre la cámara delantera y trasera con el botón <em>CAM TRASERA</em> para apoyar el teléfono en el suelo enfocando de perfil.
              </p>
              <p>
                2. <strong>Línea de Paralela Láser</strong>: La app proyecta una línea horizontal virtual. Cuando rompas la paralela ({settings.targetAngle}°), la línea brillará en verde neón.
              </p>
              <p>
                3. <strong>Cuenta Atrás de Preparación (PREP 3s)</strong>: Pulsa el botón para tener 3 segundos de preparación antes de iniciar la primera repetición.
              </p>
              <p>
                4. <strong>Coach AI con Gemini</strong>: Al terminar una serie, pulsa <em>Consultar Coach AI</em> para recibir feedback biomecánico y motivacional experto.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN CONTAINER - Optimized for mobile viewports */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "detector" && (
            <motion.div
              key="detector-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* BLOCK A: BIO-TRACKER / CAMERA CANVAS (Main Stage) */}
              <section className="w-full">
                <CameraTracker 
                  settings={settings} 
                  onRepCompleted={handleRepCompleted}
                  activeSessionReps={activeSessionReps}
                  onToggleSimulation={() => updateSetting("isSimulationMode", !settings.isSimulationMode)}
                />
              </section>

              {/* BLOCK B: QUICK SETTINGS PANEL */}
              <section className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">AJUSTES DE ENTRENAMIENTO</span>
                  
                  {/* Simulation switch badge */}
                  <button
                    onClick={() => updateSetting("isSimulationMode", !settings.isSimulationMode)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      settings.isSimulationMode
                        ? "bg-amber-950 border border-amber-500/30 text-amber-400"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {settings.isSimulationMode ? "★ SIMULACIÓN ACTIVA" : "PROBAR SIN CÁMARA"}
                  </button>
                </div>

                {/* 1. Pause Slider with Ergonomic 44px Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Clock className="h-3.5 w-3.5 text-brand" /> TIEMPO DE PAUSA
                    </label>
                    <span className="text-xs font-black text-brand font-mono">
                      {settings.pauseDuration} Segundos
                    </span>
                  </div>
                  
                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-5 gap-2 my-0.5">
                    {pausePresets.map((val) => (
                      <button
                        key={val}
                        onClick={() => updateSetting("pauseDuration", val)}
                        className={`min-h-[44px] rounded-xl text-xs font-black font-mono transition-all cursor-pointer flex items-center justify-center ${
                          settings.pauseDuration === val
                            ? "bg-brand text-black shadow-[0_0_12px_rgba(226,255,49,0.3)] scale-[1.02]"
                            : "bg-white/5 text-zinc-300 border border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {val}s
                      </button>
                    ))}
                  </div>

                  {/* Micro-adjustment control track */}
                  <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-xl mt-1">
                    <button
                      onClick={() => {
                        const nextVal = Math.max(1, settings.pauseDuration - 0.5);
                        updateSetting("pauseDuration", nextVal);
                      }}
                      disabled={settings.pauseDuration <= 1}
                      className="min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Restar 0.5 segundos"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={settings.pauseDuration}
                      onChange={(e) => updateSetting("pauseDuration", parseFloat(e.target.value))}
                      className="flex-1 accent-brand bg-white/5 h-2 rounded-lg cursor-pointer"
                    />

                    <button
                      onClick={() => {
                        const nextVal = Math.min(5, settings.pauseDuration + 0.5);
                        updateSetting("pauseDuration", nextVal);
                      }}
                      disabled={settings.pauseDuration >= 5}
                      className="min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Sumar 0.5 segundos"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Angle Slider */}
                <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Target className="h-3.5 w-3.5 text-brand" /> PROFUNDIDAD OBJETIVO
                    </label>
                    <span className="text-xs font-black text-brand font-mono">
                      {settings.targetAngle}° {settings.targetAngle <= 95 ? "(Profunda)" : settings.targetAngle <= 105 ? "(Paralela)" : "(Alta)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-0.5">
                    {depthPresets.map((p) => (
                      <button
                        key={p.angle}
                        onClick={() => updateSetting("targetAngle", p.angle)}
                        className={`min-h-[44px] px-2 rounded-xl text-left flex flex-col justify-center items-center transition-all cursor-pointer border ${
                          settings.targetAngle === p.angle
                            ? "bg-white/10 border-brand/40 text-white shadow-[0_0_10px_rgba(226,255,49,0.15)]"
                            : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{p.label}</span>
                        <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{p.angle}°</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 bg-white/5 px-3 py-2 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase shrink-0">Precisión:</span>
                    <input
                      type="range"
                      min="85"
                      max="115"
                      step="1"
                      value={settings.targetAngle}
                      onChange={(e) => updateSetting("targetAngle", parseInt(e.target.value))}
                      className="flex-1 accent-brand bg-white/5 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3. Audio / Sounds Switcher */}
                <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Volume2 className="h-3.5 w-3.5 text-brand" /> TIPO DE AUDIO
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateSetting("soundType", "BEEPS")}
                      className={`min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                        settings.soundType === "BEEPS"
                          ? "bg-white/10 border-brand/40 text-white"
                          : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" /> Pitidos
                    </button>

                    <button
                      onClick={() => updateSetting("soundType", "VOICE")}
                      className={`min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                        settings.soundType === "VOICE"
                          ? "bg-white/10 border-brand/40 text-white"
                          : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <Mic className="h-3.5 w-3.5" /> Voz AI
                    </button>

                    <button
                      onClick={() => updateSetting("soundType", "MUTE")}
                      className={`min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                        settings.soundType === "MUTE"
                          ? "bg-white/10 border-red-500/30 text-white"
                          : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <VolumeX className="h-3.5 w-3.5 text-red-400" /> Silencio
                    </button>
                  </div>

                  {settings.soundType !== "MUTE" && (
                    <div className="flex items-center gap-2 mt-1.5 bg-white/5 px-3 py-2 rounded-xl">
                      <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.1"
                        value={settings.volume}
                        onChange={(e) => updateSetting("volume", parseFloat(e.target.value))}
                        className="flex-1 accent-brand bg-white/5 h-2 rounded-lg cursor-pointer"
                      />
                      <span className="text-[9px] font-mono text-zinc-300 font-bold">{Math.round(settings.volume * 100)}%</span>
                    </div>
                  )}
                </div>

              </section>

              {/* BLOCK C: ACTIVE SET PANEL (REP COUNTER & COACH AI TRIGGER) */}
              <section className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-3.5 backdrop-blur-md">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div>
                    <span className="text-[10px] text-brand font-black uppercase tracking-widest font-mono">SERIE ACTIVA</span>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-tight mt-0.5">Historial del Set</h3>
                  </div>
                  
                  {/* Quick counters */}
                  <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300">Reps: <strong className="text-white">{statsSummary.total}</strong></span>
                    <span className="px-2.5 py-1 rounded-lg bg-brand/10 text-brand">OK: <strong className="text-brand">{statsSummary.valid}</strong></span>
                  </div>
                </div>

                {/* Direct Coach AI Trigger Button (High Visual Impact Shimmer) */}
                <button
                  onClick={() => openCoachForSession(activeSessionReps)}
                  className="w-full py-3.5 px-4 rounded-2xl shimmer-coach-btn border border-brand/40 text-brand font-black text-xs uppercase tracking-wider flex items-center justify-between hover:border-brand hover:scale-[1.01] transition-all cursor-pointer shadow-[0_4px_25px_rgba(226,255,49,0.18)] active:scale-95"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-black/60 border border-brand/40 flex items-center justify-center text-brand">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none text-white font-extrabold tracking-wide">ANÁLISIS COACH AI</span>
                      <span className="block text-[8px] text-brand/90 font-mono mt-0.5 font-bold">POWERLIFTING BIOMECHANICS</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-brand" />
                </button>

                {/* List of completed reps in current set with telemetry bar */}
                <div className="min-h-[80px] max-h-[190px] overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
                  {activeSessionReps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Activity className="h-6 w-6 text-zinc-700 animate-pulse mb-1.5" />
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Aún no hay repeticiones grabadas</p>
                      <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">Colócate frente a la cámara o prueba la simulación</p>
                    </div>
                  ) : (
                    [...activeSessionReps].reverse().map((rep, idx) => {
                      const pausePercent = Math.min(100, Math.round((rep.actualPause / rep.targetPause) * 100));
                      return (
                        <div 
                          key={rep.id}
                          className="flex flex-col bg-white/[0.03] border border-white/5 hover:border-white/15 rounded-2xl px-3.5 py-2.5 font-mono text-xs transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {rep.success ? (
                                <div className="h-5 w-5 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black text-white">REP {activeSessionReps.length - idx}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                    rep.quality === "PERFECT" 
                                      ? "bg-brand/20 text-brand border border-brand/30" 
                                      : "bg-white/10 text-zinc-300"
                                  }`}>
                                    {rep.quality === "PERFECT" ? "Perfecta" : "Válida"}
                                  </span>
                                </div>
                                <div className="text-[8px] text-zinc-400 flex gap-2.5 mt-0.5 font-bold uppercase">
                                  <span>Pausa: <strong className="text-zinc-100">{rep.actualPause.toFixed(1)}s</strong> / {rep.targetPause}s</span>
                                  <span>Ángulo: <strong className="text-zinc-100">{rep.minAngle}°</strong></span>
                                </div>
                              </div>
                            </div>
                            
                            <span className="text-[8px] text-zinc-600 font-bold shrink-0">{rep.timestamp}</span>
                          </div>

                          {/* Mini Telemetry Pause Progress Bar */}
                          <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${rep.success ? 'bg-brand' : 'bg-red-500'}`}
                              style={{ width: `${pausePercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Core Controls Actions */}
                <div className="flex gap-2.5 pt-1.5">
                  <button
                    onClick={handleClearActiveSet}
                    disabled={activeSessionReps.length === 0}
                    className={`min-h-[48px] px-4 rounded-xl border flex items-center justify-center text-zinc-400 hover:text-red-400 cursor-pointer transition-all ${
                      activeSessionReps.length > 0
                        ? "bg-white/5 hover:bg-white/10 border-white/10"
                        : "bg-zinc-950/20 text-zinc-700 border-transparent cursor-not-allowed"
                    }`}
                    title="Borrar serie"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>

                  <button
                    onClick={handleSaveSet}
                    disabled={activeSessionReps.length === 0}
                    className={`flex-1 min-h-[48px] py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeSessionReps.length > 0
                        ? "bg-brand text-black hover:scale-[1.01] shadow-[0_4px_16px_rgba(226,255,49,0.3)]"
                        : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
                    }`}
                  >
                    <Save className="h-4 w-4 stroke-[2.5px]" /> Finalizar y Guardar Serie
                  </button>
                </div>

              </section>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <WorkoutHistory 
                onSelectSessionForCoach={(reps, p, a) => openCoachForSession(reps, p, a)}
              />
            </motion.div>
          )}

          {activeTab === "rounds" && (
            <motion.div
              key="rounds-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <RoundCounter 
                soundType={settings.soundType}
                volume={settings.volume}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. SUCCESS SAVE OVERLAY NOTIFICATION WITH QUICK COACH TRIGGER */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand text-black font-black px-5 py-3 rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(226,255,49,0.5)] border border-brand/50 max-w-sm w-[90%]"
          >
            <Check className="h-5 w-5 border-2 border-black rounded-full stroke-[3px] shrink-0" />
            <div className="text-left flex-1">
              <span className="block font-black uppercase tracking-wider text-[10px] leading-none">Serie Guardada con Éxito</span>
              <span className="block font-bold mt-0.5 text-zinc-900 font-sans text-xs leading-none">Guardada en tu Historial de Entrenamientos.</span>
            </div>
            <button
              onClick={() => openCoachForSession(coachAnalysisReps)}
              className="px-2.5 py-1.5 rounded-lg bg-black text-brand text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:bg-zinc-900"
            >
              <Sparkles className="h-3 w-3" /> Coach
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. COACH AI MODAL */}
      <CoachModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        reps={coachAnalysisReps}
        settings={{
          ...settings,
          pauseDuration: coachTargetPause,
          targetAngle: coachTargetAngle
        }}
      />

      {/* 6. MINIMAL FOOTER */}
      <footer className="bg-black py-5 border-t border-white/5 text-center text-zinc-700 text-[8px] font-mono tracking-widest uppercase mt-auto">
        <p>PAUSE BOX PRO SYSTEM • POWERED BY AI & BIOMECHANICS • © {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
}
