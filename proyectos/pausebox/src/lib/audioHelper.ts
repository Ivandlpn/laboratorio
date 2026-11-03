import { SoundOption } from "../types";

let audioCtx: AudioContext | null = null;

// Initialize AudioContext lazily to bypass browser autoplay policies
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Explicit audio unlock for mobile Safari/Chrome
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch((err) => console.warn("Failed to resume context:", err));
    }
    // Also trigger speech synthesis mock to unlock voice on iOS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
    console.warn("Could not unlock audio context:", e);
  }
}

// Generate synthesizer beep with specific frequency, duration, and volume
export function playBeep(frequency: number, duration: number, volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade out smoothly to avoid clicking noises
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn("Audio Context beep failed", error);
  }
}

// Speak text using Speech Synthesis API
export function speakText(text: string, volume: number = 0.5) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  
  try {
    // Cancel any ongoing speech to avoid overlap delay
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 1.1; // Slightly faster for athletic response

    // Try to find a Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith("es") || v.lang.includes("Spanish")
    );
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Speech synthesis failed", error);
  }
}

// Vibration API Helper for Mobile Haptic Feedback
export function triggerVibration(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Vibration API error:", e);
    }
  }
}

// Preset: Short single vibration when pause starts
export function triggerStartPauseVibration() {
  triggerVibration(90);
}

// Preset: Two long pulses when pause duration is reached (signal to ascend)
export function triggerPauseReachedVibration() {
  triggerVibration([300, 150, 300]);
}

// Preset: Triumph pattern when a rep is successfully completed
export function triggerRepCompletedVibration() {
  triggerVibration([120, 60, 120, 60, 350]);
}

// Play athletic beeps based on action
export function playSoundCue(action: "START_PAUSE" | "TICK" | "UP_CUE" | "READY", option: SoundOption, volume: number = 0.5) {
  // Trigger tactile vibration patterns for mobile athletes
  if (action === "UP_CUE") {
    // Two long pulses when pause is finished
    triggerPauseReachedVibration();
  } else if (action === "START_PAUSE") {
    // One short vibration when starting pause at the bottom
    triggerStartPauseVibration();
  }

  if (option === "MUTE") return;

  const vol = volume;

  if (option === "BEEPS") {
    switch (action) {
      case "READY":
        playBeep(440, 0.3, vol);
        break;
      case "START_PAUSE":
        // Double medium beep
        playBeep(520, 0.15, vol);
        setTimeout(() => playBeep(520, 0.15, vol), 180);
        break;
      case "TICK":
        // Short soft tick
        playBeep(440, 0.08, vol * 0.7);
        break;
      case "UP_CUE":
        // Loud, long buzzer/high pitch beep
        playBeep(880, 0.5, vol * 1.2);
        break;
    }
  } else if (option === "VOICE") {
    switch (action) {
      case "READY":
        speakText("Listo, colócate.", vol);
        break;
      case "START_PAUSE":
        speakText("Abajo, pausa.", vol);
        break;
      case "TICK":
        // Standard voice countdown tick handled in state machine by reading numbers "3, 2, 1"
        break;
      case "UP_CUE":
        speakText("¡Sube, sube!", vol);
        break;
    }
  }
}
