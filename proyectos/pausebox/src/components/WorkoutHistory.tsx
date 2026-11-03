import React, { useState, useEffect } from "react";
import { WorkoutSession, Repetition } from "../types";
import { 
  History, 
  Trash2, 
  Download, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface WorkoutHistoryProps {
  onSelectSessionForCoach?: (reps: Repetition[], targetPause: number, targetAngle: number) => void;
}

export default function WorkoutHistory({ onSelectSessionForCoach }: WorkoutHistoryProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const loadSessions = () => {
    try {
      const saved = localStorage.getItem("pause_squat_history_sessions_v1");
      if (saved) {
        setSessions(JSON.parse(saved));
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.warn("Error cargando historial de sesiones:", e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const clearAllHistory = () => {
    if (confirm("¿Estás seguro de que deseas eliminar todo el historial de entrenamientos? Esta acción no se puede deshacer.")) {
      localStorage.removeItem("pause_squat_history_sessions_v1");
      setSessions([]);
    }
  };

  const exportHistoryJSON = () => {
    if (sessions.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pausebox_historial_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calcular métricas acumuladas
  const allReps = sessions.flatMap((s) => s.reps);
  const totalRepsCount = allReps.length;
  const successfulRepsCount = allReps.filter((r) => r.success).length;
  const successRate = totalRepsCount > 0 ? Math.round((successfulRepsCount / totalRepsCount) * 100) : 0;
  const avgPauseTime = totalRepsCount > 0 
    ? (allReps.reduce((acc, r) => acc + r.actualPause, 0) / totalRepsCount).toFixed(1)
    : "0.0";
  const perfectRepsCount = allReps.filter((r) => r.quality === "PERFECT").length;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Global KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-3.5 flex flex-col backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
            <Trophy className="h-3 w-3 text-brand" /> Reps Totales
          </div>
          <span className="text-xl font-black text-white mt-1 font-mono">{totalRepsCount}</span>
          <span className="text-[8px] text-zinc-500 font-mono mt-0.5">{sessions.length} series registradas</span>
        </div>

        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-3.5 flex flex-col backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Tasa de Éxito
          </div>
          <span className="text-xl font-black text-brand mt-1 font-mono">{successRate}%</span>
          <span className="text-[8px] text-zinc-500 font-mono mt-0.5">{successfulRepsCount} de {totalRepsCount} válidas</span>
        </div>

        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-3.5 flex flex-col backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
            <Clock className="h-3 w-3 text-sky-400" /> Pausa Media
          </div>
          <span className="text-xl font-black text-white mt-1 font-mono">{avgPauseTime}s</span>
          <span className="text-[8px] text-zinc-500 font-mono mt-0.5">En el fondo isométrico</span>
        </div>

        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-3.5 flex flex-col backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-yellow-400" /> Calidad Perfecta
          </div>
          <span className="text-xl font-black text-yellow-300 mt-1 font-mono">{perfectRepsCount}</span>
          <span className="text-[8px] text-zinc-500 font-mono mt-0.5">Sin balanceos ni fallos</span>
        </div>
      </div>

      {/* 2. Controls Action Strip */}
      <div className="flex items-center justify-between bg-zinc-950/60 border border-white/5 rounded-2xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white font-mono">
            HISTORIAL DE SERIES ({sessions.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportHistoryJSON}
            disabled={sessions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Exportar archivo JSON"
          >
            <Download className="h-3 w-3" /> Exportar
          </button>

          <button
            onClick={clearAllHistory}
            disabled={sessions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Borrar todo el historial"
          >
            <Trash2 className="h-3 w-3" /> Vaciar
          </button>
        </div>
      </div>

      {/* 3. Session List */}
      <div className="flex flex-col gap-3">
        {sessions.length === 0 ? (
          <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-md">
            <History className="h-8 w-8 text-zinc-700 animate-pulse mb-2" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono">No hay series finalizadas aún</span>
            <p className="text-[10px] text-zinc-600 font-mono mt-1 max-w-xs">
              Cuando termines una serie en la cámara y pulses "Finalizar y Guardar Serie", se guardará aquí automáticamente.
            </p>
          </div>
        ) : (
          sessions.map((session, sIdx) => {
            const isExpanded = expandedSessionId === session.id;
            const validInSession = session.reps.filter((r) => r.success).length;

            return (
              <div 
                key={session.id}
                className="bg-zinc-950/70 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all backdrop-blur-md"
              >
                {/* Session Header Card */}
                <div 
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                  className="px-4 py-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center font-mono">
                      <span className="text-[7px] text-zinc-500 uppercase">SERIE</span>
                      <span className="text-xs font-black text-brand leading-none">#{sessions.length - sIdx}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">
                          {session.reps.length} Repeticiones
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {validInSession}/{session.reps.length} OK
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono mt-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{session.date}</span>
                        <span>•</span>
                        <span>Obj: {session.targetPause}s @ {session.targetAngle}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectSessionForCoach && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSessionForCoach(session.reps, session.targetPause, session.targetAngle);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                        title="Analizar esta serie con Coach Gemini"
                      >
                        <Sparkles className="h-3 w-3" /> Coach AI
                      </button>
                    )}

                    <div className="text-zinc-500">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Repetitions Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 flex flex-col gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                      Desglose de Repeticiones:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {session.reps.map((rep, rIdx) => (
                        <div
                          key={rep.id}
                          className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between text-[10px] font-mono"
                        >
                          <div className="flex items-center gap-2">
                            {rep.success ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-white">REP {rIdx + 1}</span>
                              <div className="text-[8px] text-zinc-500">
                                Pausa: <strong className="text-zinc-300">{rep.actualPause.toFixed(1)}s</strong> | Ángulo: <strong className="text-zinc-300">{rep.minAngle}°</strong>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                            rep.quality === "PERFECT" 
                              ? "bg-brand/20 text-brand" 
                              : rep.success 
                                ? "bg-white/10 text-zinc-300"
                                : "bg-red-500/20 text-red-400"
                          }`}>
                            {rep.quality}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
