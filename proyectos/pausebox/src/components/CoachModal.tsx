import React, { useState } from "react";
import { Repetition, WorkoutSettings } from "../types";
import { speakText } from "../lib/audioHelper";
import { 
  Sparkles, 
  X, 
  Send, 
  Volume2, 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  reps: Repetition[];
  settings: WorkoutSettings;
}

export default function CoachModal({ isOpen, onClose, reps, settings }: CoachModalProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ sender: "user" | "coach"; text: string }>>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generar reporte biomecánico local si no hay backend (ej. en GitHub Pages)
  const generateLocalBiomechanicReport = (repsList: Repetition[], workoutSettings: WorkoutSettings): string => {
    if (repsList.length === 0) {
      return `### 1. Análisis Técnico de la Serie
Aún no has registrado repeticiones en esta serie. Para sacarle el máximo partido a la sentadilla con pausa:
- Realiza un buen calentamiento con activación de glúteo y movilidad de tobillos.
- Toma aire en el diafragma antes de iniciar la bajada y mantén el braceo constante.

### 2. Consejos Biomecánicos
- **Estabilidad en el fondo**: No relajes la musculatura ni te sientes pasivamente; mantén la tensión isométrica activa durante los ${workoutSettings.pauseDuration} segundos.
- **Tripod Foot**: Apoya con firmeza el talón, la base del primer dedo y la del quinto dedo.

### 3. Recomendación
- Configura tu pausa en **${workoutSettings.pauseDuration}s** y busca romper la paralela a **${workoutSettings.targetAngle}°**.

### 4. Fuego del Entrenador
*"¡El dolor de la pausa es donde se forja la verdadera fuerza! A por la serie."*`;
    }

    const total = repsList.length;
    const valids = repsList.filter(r => r.success).length;
    const avgPause = (repsList.reduce((acc, r) => acc + r.actualPause, 0) / total).toFixed(1);
    const minAngleReached = Math.min(...repsList.map(r => r.minAngle));
    const isDepthGood = minAngleReached <= workoutSettings.targetAngle;

    return `### 1. Análisis Técnico de la Serie
- **Volumen y Acierto**: Completadas **${valids} de ${total} repeticiones** válidas.
- **Consistencia de Pausa**: Promedio real en el fondo de **${avgPause}s** (objetivo: ${workoutSettings.pauseDuration}s).
- **Profundidad Máxima**: Flexión de rodilla más profunda alcanzada: **${minAngleReached}°** (objetivo: ${workoutSettings.targetAngle}°).
${isDepthGood ? "✅ Has alcanzado y roto la profundidad reglamentaria con solvencia." : "⚠️ Te has quedado ligeramente por encima de la profundidad deseada en algunas repeticiones."}

### 2. Consejos Biomecánicos Clave
- **Tensión Continua**: Evita relajar los erectores espinales o la cadera en el segundo 2 de la pausa. Mantén el abdomen empujando contra el cinturón.
- **Apertura de Rodillas**: Enfoca las rodillas en la dirección de las puntas de los pies para abrir espacio a la pelvis.
- **Subida Explosiva**: Al recibir la señal de salida, empuja el suelo de forma inmediata sin balancear el torso hacia delante.

### 3. Recomendación para la Siguiente Serie
${valids === total 
  ? `Excelente control. Mantén el peso actual e incrementa la pausa a **${workoutSettings.pauseDuration + 0.5}s** o añade 2.5 kg.` 
  : `Mantén la carga actual y concéntrate en no anticipar la subida antes de los **${workoutSettings.pauseDuration}s** completos.`}

### 4. Fuego del Entrenador
*"La verdadera fuerza no se demuestra rebotando, sino dominando el peso en su punto más difícil. ¡A por la siguiente!"*`;
  };

  // Solicitar feedback automático al abrir o regenerar
  const fetchCoachFeedback = async (customMessage?: string) => {
    setErrorMsg(null);
    if (!customMessage) {
      setLoading(true);
    } else {
      setChatLoading(true);
    }

    try {
      const response = await fetch("/api/coach-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reps,
          settings,
          message: customMessage || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (customMessage) {
        setConversation((prev) => [
          ...prev,
          { sender: "user", text: customMessage },
          { sender: "coach", text: data.feedback }
        ]);
        setUserQuery("");
      } else {
        setFeedback(data.feedback);
      }
    } catch (err: any) {
      // Fallback local instantáneo para despliegue estático (GitHub Pages)
      if (customMessage) {
        const localReply = `Consejo biomecánico: Para "${customMessage}", asegúrate de mantener los pies anclados al suelo, controlar el descenso en 2-3 segundos, respirar hondo con la maniobra de Valsalva antes de iniciar la bajada y enfocar la mirada fija al frente para mantener la columna neutra.`;
        setConversation((prev) => [
          ...prev,
          { sender: "user", text: customMessage },
          { sender: "coach", text: localReply }
        ]);
        setUserQuery("");
      } else {
        const report = generateLocalBiomechanicReport(reps, settings);
        setFeedback(report);
      }
    } finally {
      setLoading(false);
      setChatLoading(false);
    }
  };

  // Cargar feedback inicial al abrir si aún no existe
  React.useEffect(() => {
    if (isOpen && !feedback && !loading) {
      fetchCoachFeedback();
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || chatLoading) return;
    fetchCoachFeedback(userQuery.trim());
  };

  const handleSpeakFeedback = () => {
    if (!feedback) return;
    // Extraer texto limpio sin asteriscos
    const cleanText = feedback.replace(/\*\*/g, "").replace(/#/g, "").slice(0, 300);
    speakText(cleanText, settings.volume || 0.8);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div 
          initial={{ scale: 0.94, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 20 }}
          className="bg-zinc-950 border border-brand/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(226,255,49,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_12px_rgba(226,255,49,0.3)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">COACH AI POWERLIFTING</h3>
                  <span className="text-[8px] bg-brand text-black font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">
                    GEMINI 3.5
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">Análisis biomecánico en tiempo real de tu serie de sentadillas</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Context Strip */}
          <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between font-mono text-[9px] text-zinc-400 flex-wrap gap-2">
            <div>
              <span>PAUSA OBJ: <strong className="text-white">{settings.pauseDuration}s</strong></span>
              <span className="mx-2">•</span>
              <span>ÁNGULO OBJ: <strong className="text-white">{settings.targetAngle}°</strong></span>
            </div>
            <div>
              <span>REPETICIONES ANALIZADAS: <strong className="text-brand">{reps.length}</strong></span>
              <span className="mx-2">•</span>
              <span>VÁLIDAS: <strong className="text-emerald-400">{reps.filter(r => r.success).length}</strong></span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs font-mono text-zinc-300 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-brand animate-spin" />
                <span className="text-xs uppercase tracking-widest font-black text-white">Analizando Biomecánica con Gemini AI...</span>
                <span className="text-[10px] text-zinc-500">Evaluando profundidad, tensión en el fondo y consistencia isométrica</span>
              </div>
            ) : errorMsg ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-2 text-red-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase">
                  <AlertCircle className="h-4 w-4 text-red-400" /> Error al generar feedback
                </div>
                <p className="text-[11px] leading-relaxed">{errorMsg}</p>
                <button
                  onClick={() => fetchCoachFeedback()}
                  className="self-start mt-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] uppercase font-bold transition-all cursor-pointer"
                >
                  Reintentar análisis
                </button>
              </div>
            ) : (
              <>
                {/* Main Coach Feedback Box */}
                {feedback && (
                  <div className="bg-white/[0.03] border border-brand/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-wider">
                        <Flame className="h-4 w-4 text-brand fill-brand" /> INFORME TÉCNICO DE LA SERIE
                      </div>
                      <button
                        onClick={handleSpeakFeedback}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[9px] text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                        title="Escuchar por voz"
                      >
                        <Volume2 className="h-3 w-3 text-brand" /> Escuchar
                      </button>
                    </div>

                    <div className="text-zinc-200 text-[11px] leading-relaxed space-y-3 font-sans whitespace-pre-wrap">
                      {feedback}
                    </div>
                  </div>
                )}

                {/* Conversation thread for follow-up questions */}
                {conversation.length > 0 && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Preguntas y Aclaraciones Técnicas</span>
                    {conversation.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl text-[11px] max-w-[88%] leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-brand/15 text-white self-end border border-brand/30"
                            : "bg-white/5 text-zinc-200 self-start border border-white/10 font-sans whitespace-pre-wrap"
                        }`}
                      >
                        <span className="block text-[8px] uppercase tracking-wider font-mono font-bold mb-1 text-zinc-400">
                          {msg.sender === "user" ? "Tú" : "Coach Gemini"}
                        </span>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Follow-up question input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-black/60 border-t border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Haz una pregunta técnica al Coach (ej. ¿cómo evitar que se me vayan los talones?)..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              disabled={loading || chatLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand font-sans"
            />
            <button
              type="submit"
              disabled={!userQuery.trim() || loading || chatLoading}
              className="px-4 py-2.5 rounded-xl bg-brand text-black font-black uppercase text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {chatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Preguntar</span>
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
