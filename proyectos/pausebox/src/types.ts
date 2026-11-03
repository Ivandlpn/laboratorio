export type SquatState = 
  | "STANDING"      // Standing fully extended
  | "DESCENDING"    // Going down, knee angle decreasing but hasn't hit target depth yet
  | "HOLDING"       // Inside target depth (pause phase), timer active
  | "COMPLETED_HOLD" // Finished required pause duration, awaiting return to stand (UP arrow displayed)
  | "REP_DONE";      // Temporary transition state to count rep

export type SoundOption = "VOICE" | "BEEPS" | "MUTE";

export interface Repetition {
  id: string;
  timestamp: string;
  targetPause: number;      // seconds
  actualPause: number;      // seconds
  minAngle: number;         // degrees (minimum knee angle reached)
  success: boolean;         // did they hold for the target duration?
  quality: "PERFECT" | "NORMAL" | "SHORT_PAUSE" | "INSUFFICIENT_DEPTH";
}

export interface WorkoutSession {
  id: string;
  date: string;
  reps: Repetition[];
  targetPause: number;
  targetAngle: number;
}

export interface WorkoutSettings {
  pauseDuration: number;    // target pause (e.g. 3)
  targetAngle: number;      // target knee angle for depth (e.g. 100)
  soundType: SoundOption;
  volume: number;           // 0.0 to 1.0
  isSimulationMode: boolean; // allow testing without camera
}
