import React, { useEffect, useRef, useState } from "react";
import { Repetition, SquatState, WorkoutSettings } from "../types";
import { playSoundCue, speakText, triggerRepCompletedVibration, playBeep } from "../lib/audioHelper";
import { 
  Activity, 
  Camera, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Play, 
  Info, 
  Maximize, 
  Minimize, 
  Sun, 
  Video, 
  Square, 
  Film, 
  Download, 
  Trash2, 
  X,
  SwitchCamera,
  Layers,
  Timer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Cache the Pose promise and instance globally to avoid double-initialization or Emscripten Module pollution in React 18 Strict Mode.
let globalPosePromise: Promise<any> | null = null;
let globalPoseInstance: any = null;

interface CameraTrackerProps {
  settings: WorkoutSettings;
  onRepCompleted: (rep: Repetition) => void;
  activeSessionReps: Repetition[];
  onToggleSimulation?: () => void;
}

export default function CameraTracker({ settings, onRepCompleted, activeSessionReps, onToggleSimulation }: CameraTrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [modelLoading, setModelLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Cargando módulos de visión...");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorActive, setDetectorActive] = useState(false);
  const [personInFrame, setPersonInFrame] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Camera Facing Mode: User (front/selfie) or Environment (back camera for gym floor)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const facingModeRef = useRef<"user" | "environment">("user");
  facingModeRef.current = facingMode;

  // Gym Focus Mode: Massive visual indicators for 2.5-3m distance
  const [isGymFocusMode, setIsGymFocusMode] = useState(true);

  // Preparation Countdown (3, 2, 1... GO!)
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const prepTimerRef = useRef<any>(null);

  // Bright Environment & Dynamic High Contrast UI State
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [autoContrastMode, setAutoContrastMode] = useState(true);
  const [frameLuminance, setFrameLuminance] = useState<number>(0);
  const frameCountRef = useRef<number>(0);

  // Hardware Ambient Light Sensor Integration (if supported by device)
  useEffect(() => {
    let sensor: any = null;
    if (typeof window !== "undefined" && "AmbientLightSensor" in window) {
      try {
        sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener("reading", () => {
          if (autoContrastMode && sensor.illuminance !== undefined) {
            // Bright sunlight threshold (>250 lux)
            setIsHighContrast(sensor.illuminance > 250);
          }
        });
        sensor.start();
      } catch (e) {
        // Sensor API optional
      }
    }
    return () => {
      if (sensor) {
        try { sensor.stop(); } catch (e) {}
      }
    };
  }, [autoContrastMode]);

  // Video Recording state & refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // seconds
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const startRecording = () => {
    try {
      // Capture stream from canvas (includes video + skeleton + angles HUD) or fallback to video element
      let stream: MediaStream | null = null;
      if (canvasRef.current) {
        stream = (canvasRef.current as any).captureStream(30);
      } else if (videoRef.current && videoRef.current.srcObject) {
        stream = videoRef.current.srcObject as MediaStream;
      }

      if (!stream) {
        alert("No hay flujo de vídeo activo para grabar.");
        return;
      }

      // Check supported codecs
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime || 'video/webm' });
        setRecordedVideoUrl((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return URL.createObjectURL(blob);
        });
        setShowVideoModal(true);
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Error al iniciar grabación:", err);
      alert("No se pudo iniciar la grabación de vídeo: " + (err.message || ""));
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const discardVideo = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setShowVideoModal(false);
  };

  const downloadVideo = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = `sentadilla_biomecanica_${new Date().toISOString().slice(0, 10)}_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatRecTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Cross-browser Fullscreen toggle (Dual-method with native API + full viewport fallback)
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      try {
        const elem = containerRef.current as any;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } catch (e) {
        console.warn("Native fullscreen not supported or blocked by sandbox/iframe, continuing with CSS fallback:", e);
      }
      setIsFullscreen(true);
    } else {
      try {
        const doc = document as any;
        if (doc.exitFullscreen) {
          doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      } catch (e) {
        console.warn("Native exit fullscreen failed, continuing with CSS fallback:", e);
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(activeFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Biomechanical angles and states
  const [leftKneeAngle, setLeftKneeAngle] = useState<number>(180);
  const [rightKneeAngle, setRightKneeAngle] = useState<number>(180);
  const [leftHipAngle, setLeftHipAngle] = useState<number>(180);
  const [rightHipAngle, setRightHipAngle] = useState<number>(180);
  const [squatState, setSquatState] = useState<SquatState>("STANDING");
  
  // Timer states
  const [countdown, setCountdown] = useState<number>(settings.pauseDuration);
  const [repCount, setRepCount] = useState<number>(0);

  // References for tracking variables across frames to avoid state delay
  const stateRef = useRef<SquatState>("STANDING");
  const pauseStartTimeRef = useRef<number | null>(null);
  const minKneeAngleRef = useRef<number>(180);
  const lastTickRef = useRef<number>(-1);
  const cameraInstanceRef = useRef<any>(null);
  const poseInstanceRef = useRef<any>(null);
  const hasPlayedReadyToneRef = useRef<boolean>(false);

  // References to bypass stale closures in MediaPipe callbacks
  const settingsRef = useRef<WorkoutSettings>(settings);
  const onRepCompletedRef = useRef<(rep: Repetition) => void>(onRepCompleted);

  // Sync refs on every render
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    onRepCompletedRef.current = onRepCompleted;
  }, [onRepCompleted]);

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
        console.log("Wake Lock prevent sleep active in CameraTracker!");
      }
      
      lock.addEventListener("release", () => {
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      });
    } catch (err) {
      if (!silent) {
        console.warn("Could not acquire screen wake lock in CameraTracker:", err);
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

  // Request Wake Lock on mount or when camera/detector starts
  useEffect(() => {
    if (cameraActive || detectorActive) {
      requestWakeLock(true);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && (cameraActive || detectorActive)) {
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
  }, [cameraActive, detectorActive]);

  // Simulation mode animation state
  const simAngleRef = useRef<number>(180);
  const simDirectionRef = useRef<"standing" | "descending" | "pausing" | "ascending">("standing");
  const [isSimulatingRep, setIsSimulatingRep] = useState(false);

  // Handle setting updates
  useEffect(() => {
    stateRef.current = "STANDING";
    setSquatState("STANDING");
    setCountdown(settings.pauseDuration);
    pauseStartTimeRef.current = null;
    minKneeAngleRef.current = 180;
    lastTickRef.current = -1;
  }, [settings.pauseDuration, settings.targetAngle]);

  // Sync rep count from parent session
  useEffect(() => {
    setRepCount(activeSessionReps.length);
  }, [activeSessionReps]);

  // Load MediaPipe scripts dynamically
  useEffect(() => {
    hasPlayedReadyToneRef.current = false;
    if (settings.isSimulationMode) {
      setModelLoading(false);
      setCameraActive(false);
      setDetectorActive(true);
      return;
    }

    let isMounted = true;

    async function initMediaPipe() {
      try {
        if (globalPoseInstance) {
          if (!isMounted) return;
          setLoadingStep("Conectando detector de pose...");
          globalPoseInstance.onResults(onPoseResults);
          poseInstanceRef.current = globalPoseInstance;
          
          setLoadingStep("Configurando cámara...");
          await startCamera(globalPoseInstance);
          
          if (isMounted) {
            setModelLoading(false);
            setDetectorActive(true);
          }
          return;
        }

        if (globalPosePromise) {
          setLoadingStep("Alineando detector de pose...");
          const pose = await globalPosePromise;
          if (!isMounted) return;
          pose.onResults(onPoseResults);
          poseInstanceRef.current = pose;
          
          setLoadingStep("Configurando cámara...");
          await startCamera(pose);
          
          if (isMounted) {
            setModelLoading(false);
            setDetectorActive(true);
          }
          return;
        }

        // Initialize for the first time
        globalPosePromise = (async () => {
          setLoadingStep("Descargando biblioteca de Pose...");
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
          await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");

          setLoadingStep("Inicializando modelo de Inteligencia Artificial...");
          const PoseClass = (window as any).Pose;
          if (!PoseClass) {
            throw new Error("No se pudo cargar MediaPipe Pose desde el servidor.");
          }

          const pose = new PoseClass({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          globalPoseInstance = pose;
          return pose;
        })();

        const pose = await globalPosePromise;
        if (!isMounted) return;
        pose.onResults(onPoseResults);
        poseInstanceRef.current = pose;

        setLoadingStep("Configurando cámara...");
        await startCamera(pose);

        if (isMounted) {
          setModelLoading(false);
          setDetectorActive(true);
        }
      } catch (err: any) {
        console.error("MediaPipe initialization error:", err);
        globalPosePromise = null;
        globalPoseInstance = null;
        if (isMounted) {
          setCameraError(err.message || "Error al acceder a la cámara o cargar la IA de detección.");
          setModelLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      stopCameraAndPose();
    };
  }, [settings.isSimulationMode]);

  // Helper to load external scripts
  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Error cargando script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Stop camera and cleanup instances
  function stopCameraAndPose() {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch (e) {
        console.log("Error stopping camera", e);
      }
      cameraInstanceRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  // Toggle front/rear camera facing mode
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    facingModeRef.current = nextMode;
    stopCameraAndPose();
    if (poseInstanceRef.current) {
      try {
        setLoadingStep("Cambiando lente de cámara...");
        setModelLoading(true);
        await startCamera(poseInstanceRef.current, nextMode);
        setModelLoading(false);
      } catch (e: any) {
        setCameraError(e.message || "Error al cambiar de cámara.");
        setModelLoading(false);
      }
    }
  };

  // Preparation Countdown (3, 2, 1... GO!)
  const startPrepCountdown = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    let count = 3;
    setPrepCountdown(count);
    playBeep(440, 0.15, settings.volume);

    prepTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setPrepCountdown(count);
        playBeep(440, 0.15, settings.volume);
      } else if (count === 0) {
        setPrepCountdown(0);
        playBeep(880, 0.35, settings.volume);
        if (settings.soundType === "VOICE") {
          speakText("¡Empieza!", settings.volume);
        }
      } else {
        clearInterval(prepTimerRef.current);
        prepTimerRef.current = null;
        setPrepCountdown(null);
      }
    }, 1000);
  };

  // Start the hardware camera and connect to MediaPipe Pose
  async function startCamera(poseInstance: any, targetFacing: "user" | "environment" = facingModeRef.current) {
    if (!videoRef.current) return;

    let stream: MediaStream;
    try {
      // First attempt: Preferred facingMode constraint
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { ideal: targetFacing },
        },
        audio: false,
      });
    } catch (err) {
      console.warn("First camera constraint failed, attempting fallback facingMode...", err);
      try {
        // Second attempt: Minimal facingMode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
          },
          audio: false,
        });
      } catch (err2) {
        console.warn("Second camera constraint failed, attempting absolute default video input...", err2);
        try {
          // Third attempt: Ultimate fallback, request any video stream available
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3) {
          console.error("All camera fallback constraints failed:", err3);
          throw new Error("No se pudo acceder a ninguna cámara en este dispositivo. Por favor, asegúrate de habilitar los permisos de cámara en tu navegador.");
        }
      }
    }

    try {
      videoRef.current.srcObject = stream;
      
      // Ensure element properties are explicitly enabled for mobile browsers
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("muted", "true");
      videoRef.current.setAttribute("autoplay", "true");
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Video play was interrupted or prevented by browser policy:", error);
        });
      }
      setCameraActive(true);

      const CameraUtils = (window as any).Camera;
      if (CameraUtils) {
        const camera = new CameraUtils(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && poseInstance) {
              await poseInstance.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
        cameraInstanceRef.current = camera;
      } else {
        // Fallback frame-loop if MediaPipe Camera utility isn't ideal
        let active = true;
        const processFrame = async () => {
          if (!active || !videoRef.current) return;
          try {
            await poseInstance.send({ image: videoRef.current });
          } catch (e) {
            console.warn(e);
          }
          requestAnimationFrame(processFrame);
        };
        processFrame();
      }
    } catch (err: any) {
      console.error("Camera source binding failed:", err);
      throw new Error("Error al reproducir el flujo de video en pantalla: " + (err.message || "Fallo interno."));
    }
  }

  // Angle calculations using vector dot product: cos(theta) = (A.B) / (|A|*|B|)
  function calculateAngle(p1: any, p2: any, p3: any): number {
    // p2 is the vertex (e.g. knee)
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return 180;

    const cosTheta = dotProduct / (mag1 * mag2);
    // Clamp to avoid float precision issues beyond [-1, 1]
    const clampedCos = Math.max(-1, Math.min(1, cosTheta));
    
    const angleRad = Math.acos(clampedCos);
    return (angleRad * 180) / Math.PI;
  }

  // Draw the skeleton and HUD on top of the canvas
  function onPoseResults(results: any) {
    if (!canvasRef.current || !results.poseLandmarks) {
      setPersonInFrame(false);
      return;
    }

    setPersonInFrame(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame onto canvas (mirroring it only for user-facing camera)
    const isMirrored = facingModeRef.current === "user";
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // Helper to calculate X and Y coordinates according to mirroring
    const getCanvasX = (pt: any) => (isMirrored ? (1 - pt.x) : pt.x) * canvas.width;
    const getCanvasY = (pt: any) => pt.y * canvas.height;

    // Analyze environment brightness every 15 frames (~0.5s) to dynamically boost UI contrast
    frameCountRef.current += 1;
    if (frameCountRef.current % 15 === 0) {
      try {
        const sampleData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sumLuminance = 0;
        let samples = 0;
        // Sample every 160 elements (every 40 pixels) for fast performance
        for (let i = 0; i < sampleData.length; i += 160) {
          sumLuminance += 0.299 * sampleData[i] + 0.587 * sampleData[i + 1] + 0.114 * sampleData[i + 2];
          samples++;
        }
        if (samples > 0) {
          const avgLum = Math.round(sumLuminance / samples);
          setFrameLuminance(avgLum);
          if (autoContrastMode) {
            // Bright environment threshold: >145 luminance (out of 255)
            setIsHighContrast(avgLum > 145);
          }
        }
      } catch (e) {
        // Ignore canvas CORS/context exceptions
      }
    }

    // Keypoints shorthand
    const lm = results.poseLandmarks;
    
    // Joint landmarks indices:
    // Shoulder: 11 (L), 12 (R)
    // Hip: 23 (L), 24 (R)
    // Knee: 25 (L), 26 (R)
    // Ankle: 27 (L), 28 (R)
    // Foot/Heel: 29 (L), 30 (R)
    const lShoulder = lm[11];
    const rShoulder = lm[12];
    const lHip = lm[23];
    const rHip = lm[24];
    const lKnee = lm[25];
    const rKnee = lm[26];
    const lAnkle = lm[27];
    const rAnkle = lm[28];

    // Determine biomechanical angles
    const leftKnee = calculateAngle(lHip, lKnee, lAnkle);
    const rightKnee = calculateAngle(rHip, rKnee, rAnkle);
    const leftHip = calculateAngle(lShoulder, lHip, lKnee);
    const rightHip = calculateAngle(rShoulder, rHip, rKnee);

    setLeftKneeAngle(Math.round(leftKnee));
    setRightKneeAngle(Math.round(rightKnee));
    setLeftHipAngle(Math.round(leftHip));
    setRightHipAngle(Math.round(rightHip));

    // Choose the tracked knee angle (the minimum is safest to enforce full depth, or average if one is hidden)
    let activeKneeAngle = Math.min(leftKnee, rightKnee);
    if (lKnee.visibility < 0.4) activeKneeAngle = rightKnee;
    if (rKnee.visibility < 0.4) activeKneeAngle = leftKnee;

    // Run the main squat tracking state machine
    processSquatTelemetry(activeKneeAngle);

    // DRAW CYBER ATHLETIC SKELETON
    // Choose neon color based on state
    const isPausing = stateRef.current === "HOLDING";
    const colorTheme = isPausing 
      ? "rgba(249, 115, 22, 0.95)" // Firing Orange during active bottom-pause
      : squatState === "COMPLETED_HOLD" 
        ? "rgba(226, 255, 49, 0.95)" // Bold Neon Yellow-Green (brand color) for UP! cue
        : "rgba(226, 255, 49, 0.95)"; // Highlight neon yellow-green when standing to indicate full alignment!
        
    const skeletonWidth = isPausing ? 6 : 4;

    // Connect joints helper
    const drawLine = (pt1: any, pt2: any) => {
      if (pt1.visibility > 0.4 && pt2.visibility > 0.4) {
        const x1 = getCanvasX(pt1);
        const y1 = getCanvasY(pt1);
        const x2 = getCanvasX(pt2);
        const y2 = getCanvasY(pt2);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = colorTheme;
        ctx.lineWidth = skeletonWidth;
        ctx.shadowColor = colorTheme;
        ctx.shadowBlur = isPausing ? 12 : 8; // Beautiful neon shadow glow when aligned
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }
    };

    // Draw major segments
    drawLine(lShoulder, rShoulder);
    drawLine(lShoulder, lHip);
    drawLine(rShoulder, rHip);
    drawLine(lHip, rHip);
    drawLine(lHip, lKnee);
    drawLine(rHipsJoint(lHip, rHip) ? lHip : rHip, rKnee); // backup if hip offset is weird
    drawLine(rHip, rKnee);
    drawLine(lKnee, lAnkle);
    drawLine(rKnee, rAnkle);

    // 2. Línea de Profundidad Virtual en Rodillas (Horizontal laser guide at knees)
    if (lKnee.visibility > 0.4 && rKnee.visibility > 0.4) {
      const kneeY = ((lKnee.y + rKnee.y) / 2) * canvas.height;
      const isDepthHit = activeKneeAngle <= settingsRef.current.targetAngle;

      ctx.beginPath();
      ctx.setLineDash([10, 5]);
      ctx.moveTo(0, kneeY);
      ctx.lineTo(canvas.width, kneeY);
      ctx.strokeStyle = isDepthHit ? "rgba(226, 255, 49, 0.95)" : "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = isDepthHit ? 3 : 1.5;
      ctx.shadowColor = isDepthHit ? "rgba(226, 255, 49, 0.8)" : "transparent";
      ctx.shadowBlur = isDepthHit ? 15 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      ctx.fillStyle = isDepthHit ? "#E2FF31" : "rgba(255, 255, 255, 0.6)";
      ctx.font = "bold 10px monospace";
      ctx.fillText(
        isDepthHit 
          ? `✓ PARALELA CUMPLIDA (${Math.round(activeKneeAngle)}°)` 
          : `PLANO DE PARALELA (${settingsRef.current.targetAngle}°)`, 
        16, 
        kneeY - 8
      );
    }

    // Draw Joint Circles with specific colors
    const drawJoint = (pt: any, label?: string, currentAngle?: number) => {
      if (pt.visibility > 0.4) {
        const x = getCanvasX(pt);
        const y = getCanvasY(pt);

        // Visual Highlight: Pulsing alignment halo when in standby and aligned!
        if (squatState === "STANDING") {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(226, 255, 49, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.shadowColor = "rgba(226, 255, 49, 0.8)";
          ctx.shadowBlur = 4;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // 1. Arco Biomecánico Dinámico (around knee joints)
        if (currentAngle !== undefined) {
          const progress = Math.max(0, Math.min(1, (170 - currentAngle) / (170 - settingsRef.current.targetAngle)));
          
          // Outer track
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.lineWidth = 4;
          ctx.stroke();

          // Outer progress fill (from top clockwise)
          ctx.beginPath();
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (2 * Math.PI * progress);
          ctx.arc(x, y, 22, startAngle, endAngle);
          ctx.strokeStyle = progress >= 1 ? "rgba(226, 255, 49, 1)" : "rgba(226, 255, 49, 0.75)";
          ctx.lineWidth = 4;
          ctx.shadowColor = "rgba(226, 255, 49, 0.5)";
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }

        ctx.beginPath();
        ctx.arc(x, y, isPausing ? 10 : 8, 0, 2 * Math.PI);
        ctx.fillStyle = isPausing ? "#ffedd5" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = colorTheme;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (label) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px monospace";
          ctx.shadowColor = "#000000";
          ctx.shadowBlur = 4;
          ctx.fillText(label, x + 12, y + 4);
          ctx.shadowBlur = 0;
        }
      }
    };

    drawJoint(lShoulder);
    drawJoint(rShoulder);
    drawJoint(lHip);
    drawJoint(rHip);
    drawJoint(lKnee, `${Math.round(leftKnee)}°`, leftKnee);
    drawJoint(rKnee, `${Math.round(rightKnee)}°`, rightKnee);
    drawJoint(lAnkle);
    drawJoint(rAnkle);
  }

  function rHipsJoint(lHip: any, rHip: any) {
    return lHip.visibility > 0.4 && rHip.visibility > 0.4;
  }

  // Telemetry loop to run the state machine transitions
  function processSquatTelemetry(kneeAngle: number) {
    const currentState = stateRef.current;
    const targetAngle = settingsRef.current.targetAngle;
    const targetPause = settingsRef.current.pauseDuration;

    // Track minimum depth achieved during the rep
    if (kneeAngle < minKneeAngleRef.current && currentState !== "STANDING") {
      minKneeAngleRef.current = kneeAngle;
    }

    switch (currentState) {
      case "STANDING":
        // Standing: Knee angle is extended (> 135°)
        if (kneeAngle < 135) {
          stateRef.current = "DESCENDING";
          setSquatState("DESCENDING");
          minKneeAngleRef.current = kneeAngle;
        }
        break;

      case "DESCENDING":
        // Going down: triggers pause mode if we go below target knee angle (e.g. 100°)
        if (kneeAngle <= targetAngle) {
          stateRef.current = "HOLDING";
          setSquatState("HOLDING");
          pauseStartTimeRef.current = Date.now();
          setCountdown(targetPause);
          playSoundCue("START_PAUSE", settingsRef.current.soundType, settingsRef.current.volume);
        } else if (kneeAngle > 140) {
          // Stood back up without reaching depth
          stateRef.current = "STANDING";
          setSquatState("STANDING");
        }
        break;

      case "HOLDING":
        if (pauseStartTimeRef.current !== null) {
          const elapsed = (Date.now() - pauseStartTimeRef.current) / 1000;
          const remaining = Math.max(0, targetPause - elapsed);
          setCountdown(Number(remaining.toFixed(1)));

          // Play second tick beeps or speak number countdown
          const wholeSec = Math.ceil(remaining);
          if (wholeSec > 0 && wholeSec !== lastTickRef.current) {
            lastTickRef.current = wholeSec;
            // Don't beep at the very first moment if it's the start sound
            if (elapsed > 0.2 && remaining > 0.1) {
              if (settingsRef.current.soundType === "VOICE") {
                speakText(String(wholeSec), settingsRef.current.volume);
              } else {
                playSoundCue("TICK", settingsRef.current.soundType, settingsRef.current.volume);
              }
            }
          }

          // EARLY ASCENT DETECTION (Hysteresis of +6 degrees to avoid jitter triggering)
          if (kneeAngle > targetAngle + 6) {
            // Check if they completed it or failed
            if (remaining > 0.1) {
              // Failed early ascent!
              playSoundCue("READY", settingsRef.current.soundType, settingsRef.current.volume); // plays warning beep
              if (settingsRef.current.soundType === "VOICE") {
                speakText("Muy rápido, mantén abajo", settingsRef.current.volume);
              }
              
              // Record failed/incomplete repetition
              const rep: Repetition = {
                id: Math.random().toString(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                targetPause: targetPause,
                actualPause: elapsed,
                minAngle: minKneeAngleRef.current,
                success: false,
                quality: "SHORT_PAUSE",
              };
              onRepCompletedRef.current(rep);

              stateRef.current = "STANDING";
              setSquatState("STANDING");
              setCountdown(targetPause);
              pauseStartTimeRef.current = null;
              lastTickRef.current = -1;
            }
          }

          // PAUSE COMPLETED SUCCESS
          if (remaining <= 0) {
            stateRef.current = "COMPLETED_HOLD";
            setSquatState("COMPLETED_HOLD");
            playSoundCue("UP_CUE", settingsRef.current.soundType, settingsRef.current.volume);
            lastTickRef.current = -1;
          }
        }
        break;

      case "COMPLETED_HOLD":
        // Awaiting user to rise fully above 135° to lock out the repetition
        if (kneeAngle >= 135) {
          // Repetition officially complete!
          const actualPause = pauseStartTimeRef.current 
            ? (Date.now() - pauseStartTimeRef.current) / 1000 
            : targetPause;

          const rep: Repetition = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            targetPause: targetPause,
            actualPause: Math.min(actualPause, targetPause + 1), // clamp excessive hold
            minAngle: minKneeAngleRef.current,
            success: true,
            quality: minKneeAngleRef.current < targetAngle - 10 ? "PERFECT" : "NORMAL",
          };

          onRepCompletedRef.current(rep);
          triggerRepCompletedVibration();

          stateRef.current = "STANDING";
          setSquatState("STANDING");
          setCountdown(targetPause);
          pauseStartTimeRef.current = null;
          minKneeAngleRef.current = 180;
        }
        break;
    }
  }

  // --- AUTOMATIC SIMULATION ENGINE ---
  // Animates the biomechanical sliders automatically to show exactly how the state machine and beeps work!
  function runSimulationLoop() {
    if (!settingsRef.current.isSimulationMode || !isSimulatingRep) return;

    let kneeVal = simAngleRef.current;
    const targetAngle = settingsRef.current.targetAngle;
    const targetPause = settingsRef.current.pauseDuration;

    if (simDirectionRef.current === "standing") {
      // Trigger go down
      simDirectionRef.current = "descending";
    }

    if (simDirectionRef.current === "descending") {
      // Decompressing knee angle (squatting down)
      kneeVal -= 3; // speed of descent
      if (kneeVal <= targetAngle) {
        kneeVal = targetAngle;
        simDirectionRef.current = "pausing";
        stateRef.current = "HOLDING";
        setSquatState("HOLDING");
        pauseStartTimeRef.current = Date.now();
        minKneeAngleRef.current = targetAngle - 4; // simulate deeper squat
        playSoundCue("START_PAUSE", settingsRef.current.soundType, settingsRef.current.volume);
      }
    } else if (simDirectionRef.current === "pausing") {
      const elapsed = (Date.now() - (pauseStartTimeRef.current || 0)) / 1000;
      const remaining = Math.max(0, targetPause - elapsed);
      setCountdown(Number(remaining.toFixed(1)));

      const wholeSec = Math.ceil(remaining);
      if (wholeSec > 0 && wholeSec !== lastTickRef.current) {
        lastTickRef.current = wholeSec;
        if (elapsed > 0.1 && remaining > 0.1) {
          if (settingsRef.current.soundType === "VOICE") {
            speakText(String(wholeSec), settingsRef.current.volume);
          } else {
            playSoundCue("TICK", settingsRef.current.soundType, settingsRef.current.volume);
          }
        }
      }

      if (remaining <= 0) {
        simDirectionRef.current = "ascending";
        stateRef.current = "COMPLETED_HOLD";
        setSquatState("COMPLETED_HOLD");
        playSoundCue("UP_CUE", settingsRef.current.soundType, settingsRef.current.volume);
        lastTickRef.current = -1;
      }
    } else if (simDirectionRef.current === "ascending") {
      // Rising up
      kneeVal += 3; // speed of ascent
      if (kneeVal >= 175) {
        kneeVal = 180;
        simDirectionRef.current = "standing";
        
        // Log rep
        const rep: Repetition = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          targetPause: targetPause,
          actualPause: targetPause,
          minAngle: minKneeAngleRef.current,
          success: true,
          quality: "PERFECT",
        };
        onRepCompletedRef.current(rep);
        triggerRepCompletedVibration();

        stateRef.current = "STANDING";
        setSquatState("STANDING");
        setCountdown(targetPause);
        pauseStartTimeRef.current = null;
        minKneeAngleRef.current = 180;
        setIsSimulatingRep(false);
      }
    }

    simAngleRef.current = kneeVal;
    setLeftKneeAngle(Math.round(kneeVal));
    setRightKneeAngle(Math.round(kneeVal + 2)); // slight asymmetry for realism
    setLeftHipAngle(Math.round(kneeVal * 0.9));
    setRightHipAngle(Math.round(kneeVal * 0.92));
  }

  // Simulation timer loop
  useEffect(() => {
    if (!settings.isSimulationMode || !isSimulatingRep) return;

    const interval = setInterval(() => {
      runSimulationLoop();
    }, 40); // 25 FPS simulation

    return () => clearInterval(interval);
  }, [settings.isSimulationMode, isSimulatingRep, settings.pauseDuration, settings.targetAngle]);

  const handleSimulateRepButton = () => {
    if (isSimulatingRep) return;
    simAngleRef.current = 180;
    simDirectionRef.current = "standing";
    stateRef.current = "STANDING";
    setSquatState("STANDING");
    setIsSimulatingRep(true);
  };

  return (
    <div 
      className={
        (isFullscreen
          ? "fixed inset-0 z-[9999] bg-black w-screen h-screen rounded-none flex flex-col overflow-hidden "
          : "relative w-full overflow-hidden rounded-3xl bg-black border transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.6)] ") +
        (squatState === "HOLDING"
          ? "border-orange-500 shadow-[inset_0_0_60px_rgba(249,115,22,0.5)]"
          : squatState === "COMPLETED_HOLD"
            ? "border-brand shadow-[inset_0_0_80px_rgba(226,255,49,0.7)]"
            : squatState === "DESCENDING"
              ? "border-sky-400 shadow-[inset_0_0_40px_rgba(56,189,248,0.4)]"
              : "border-white/10")
      }
      ref={containerRef} 
      id="tracker-container"
    >
      {/* 1. STATE INDICATOR STRIP (Athletic Dynamic Bar) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-black/90 border-b border-white/10 backdrop-blur-xl z-20 relative gap-2 flex-wrap sm:flex-nowrap">
        {/* Dynamic State Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 shadow-inner">
            <span className={`relative flex h-2.5 w-2.5 rounded-full ${
              squatState === "HOLDING" ? "bg-orange-500 animate-ping" :
              squatState === "COMPLETED_HOLD" ? "bg-brand animate-ping" :
              squatState === "DESCENDING" ? "bg-sky-400 animate-pulse" :
              "bg-zinc-600"
            }`} />
            <span className="text-[10px] font-mono font-black tracking-wider uppercase text-zinc-200">
              {squatState === "STANDING" && "DE PIE"}
              {squatState === "DESCENDING" && <span className="text-sky-400">BAJANDO</span>}
              {squatState === "HOLDING" && <span className="text-orange-400 animate-pulse">PAUSA {Math.ceil(countdown)}s</span>}
              {squatState === "COMPLETED_HOLD" && <span className="text-brand font-black animate-bounce">¡SUBE!</span>}
            </span>
          </div>

          <span className="hidden xl:inline text-[8px] font-mono tracking-widest text-zinc-500 uppercase">
            {settings.isSimulationMode ? "MODO VIRTUAL" : "IA EN TIEMPO REAL"}
          </span>
        </div>

        {/* Controls: Compact Touch Buttons Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Front / Rear Camera Lens Switcher */}
          {!settings.isSimulationMode && (
            <button
              onClick={toggleCameraFacing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
              title={`Alternar cámara (Actual: ${facingMode === "user" ? "Frontal" : "Trasera"})`}
            >
              <SwitchCamera className="h-3.5 w-3.5 text-brand" />
              <span className="hidden md:inline">{facingMode === "user" ? "FRONTAL" : "TRASERA"}</span>
            </button>
          )}

          {/* Prep 3-2-1 Countdown Trigger */}
          <button
            onClick={startPrepCountdown}
            disabled={prepCountdown !== null}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 transition-all cursor-pointer disabled:opacity-40 active:scale-95"
            title="Cuenta atrás de 3 segundos para posicionarte"
          >
            <Timer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PREP</span>
          </button>

          {/* Gym Focus Mode Toggle */}
          <button
            onClick={() => setIsGymFocusMode(!isGymFocusMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer border active:scale-95 ${
              isGymFocusMode
                ? "bg-brand/20 text-brand border-brand/40 shadow-[0_0_10px_rgba(226,255,49,0.2)]"
                : "bg-white/5 text-zinc-400 border-white/10 hover:text-white"
            }`}
            title="Modo Gym Focus para visión nítida a 2.5 metros"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GYM</span>
          </button>

          {/* Video Recording Action Button */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer transition-all active:scale-95"
              title="Iniciar grabación de vídeo de la serie"
            >
              <Video className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              <span className="hidden sm:inline">REC</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase bg-red-600 text-white border border-red-400 cursor-pointer transition-all shadow-[0_0_16px_rgba(239,68,68,0.5)] animate-pulse active:scale-95"
              title="Detener grabación"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>{formatRecTime(recordingTime)}</span>
              <Square className="h-3 w-3 fill-white ml-0.5" />
            </button>
          )}

          {recordedVideoUrl && !isRecording && (
            <button
              onClick={() => setShowVideoModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase bg-brand/15 text-brand border border-brand/40 hover:bg-brand/25 cursor-pointer transition-all active:scale-95"
              title="Ver vídeo grabado"
            >
              <Film className="h-3.5 w-3.5 text-brand" />
              <span className="hidden md:inline">VÍDEO</span>
            </button>
          )}

          {/* Fullscreen toggle button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center p-2 rounded-xl text-[10px] font-black bg-white/5 text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10 cursor-pointer transition-all active:scale-95"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN FEED SCREEN (Visualizes Video + Skeleton or Simulation Board) */}
      <div className={
        isFullscreen 
          ? "relative flex-1 w-full flex items-center justify-center bg-black overflow-hidden" 
          : "relative aspect-[4/3] w-full flex items-center justify-center bg-black overflow-hidden"
      }>

        {/* Floating Circular Biomechanical Depth Gauge */}
        {personInFrame && squatState !== "HOLDING" && squatState !== "COMPLETED_HOLD" && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-3 bg-black/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 shadow-2xl">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={leftKneeAngle <= settings.targetAngle ? "#E2FF31" : leftKneeAngle <= 120 ? "#f97316" : "#38bdf8"}
                  strokeWidth="3.5"
                  strokeDasharray="100, 100"
                  strokeDashoffset={100 - Math.min(100, Math.max(0, ((180 - leftKneeAngle) / (180 - settings.targetAngle)) * 100))}
                  strokeLinecap="round"
                  className="transition-all duration-75"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black font-mono text-white tracking-tighter">
                  {leftKneeAngle}°
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                PROFUNDIDAD
              </span>
              <span className={`text-[10px] font-black font-mono uppercase tracking-tight ${leftKneeAngle <= settings.targetAngle ? 'text-brand' : 'text-zinc-200'}`}>
                {leftKneeAngle <= settings.targetAngle ? "✓ PARALELA" : `${settings.targetAngle}° META`}
              </span>
            </div>
          </div>
        )}

        {/* Aesthetic Tech HUD Corner Brackets */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-brand z-20 pointer-events-none" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-brand z-20 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-brand z-20 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-brand z-20 pointer-events-none" />

        {/* Real camera elements */}
        {!settings.isSimulationMode && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : "scale-x-1"}`}
            />
          </>
        )}

        {/* Dynamic Prep Countdown Overlay */}
        <AnimatePresence>
          {prepCountdown !== null && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none select-none"
            >
              <span className="text-zinc-400 text-xs sm:text-sm font-mono uppercase tracking-widest font-black mb-2">
                {prepCountdown === 0 ? "¡SERIE EN MARCHA!" : "PREPÁRATE CON LA BARRA"}
              </span>
              <span className="text-8xl sm:text-9xl font-black text-brand font-mono tracking-tighter drop-shadow-[0_0_50px_rgba(226,255,49,0.8)]">
                {prepCountdown === 0 ? "¡YA!" : prepCountdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Massive Gym Focus Angle Display when standing or descending */}
        {isGymFocusMode && squatState !== "HOLDING" && squatState !== "COMPLETED_HOLD" && (
          <div className="absolute top-6 left-6 z-20 pointer-events-none flex flex-col bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
            <span className="text-[9px] font-mono font-black text-brand uppercase tracking-widest">
              ÁNGULO RODILLA
            </span>
            <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter leading-none mt-1">
              {leftKneeAngle}°
            </span>
            <span className="text-[8px] font-mono text-zinc-400 uppercase font-bold mt-1">
              OBJ: {settings.targetAngle}°
            </span>
          </div>
        )}

        {/* Dynamic Simulation Virtual Board */}
        {settings.isSimulationMode && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black p-6 relative">
            <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
            
            {/* Animated SVG Figure representing the squatting athlete */}
            <div className="w-full max-w-xs aspect-square flex items-center justify-center relative">
              <svg viewBox="0 0 200 200" className="w-56 h-56 drop-shadow-[0_0_20px_rgba(226,255,49,0.18)]">
                {/* Gym Floor line */}
                <line x1="20" y1="180" x2="180" y2="180" stroke="#27272a" strokeWidth="4" strokeLinecap="round" />
                
                {/* Interactive joint coordinate values based on angle */}
                {(() => {
                  const angleRad = (leftKneeAngle * Math.PI) / 180;
                  const ratio = (180 - leftKneeAngle) / (180 - settings.targetAngle); // 0 at standing, 1 at max squat
                  
                  const hipY = 100 + ratio * 40;
                  const hipX = 100 - ratio * 15;
                  const kneeY = 140 + ratio * 5;
                  const kneeX = 80 - ratio * 15; // knee pushes forward
                  const shoulderY = 55 + ratio * 45;
                  const shoulderX = hipX - 5;

                  const themeColor = stateRef.current === "HOLDING" 
                    ? "#f97316" // Orange
                    : squatState === "COMPLETED_HOLD" 
                      ? "#E2FF31" // Neon yellow
                      : "#ffffff"; // Standby white
                  
                  return (
                    <g>
                      {/* Barbell plates representation */}
                      <rect x={shoulderX - 35} y={shoulderY - 15} width="10" height="30" rx="2" fill="#52525b" />
                      <rect x={shoulderX + 35} y={shoulderY - 15} width="10" height="30" rx="2" fill="#52525b" />
                      {/* Barbell shaft */}
                      <line x1={shoulderX - 40} y1={shoulderY} x2={shoulderX + 40} y2={shoulderY} stroke="#a1a1aa" strokeWidth="4" />
                      
                      {/* Trunk / Torso */}
                      <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke={themeColor} strokeWidth="6" strokeLinecap="round" />
                      {/* Thigh (Hip to Knee) */}
                      <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke={themeColor} strokeWidth="6" strokeLinecap="round" />
                      {/* Shin (Knee to Ankle) */}
                      <line x1={kneeX} y1={kneeY} x2="90" y2="175" stroke={themeColor} strokeWidth="6" strokeLinecap="round" />
                      {/* Foot */}
                      <line x1="90" y1="175" x2="115" y2="175" stroke="#71717a" strokeWidth="4" strokeLinecap="round" />

                      {/* Barbell Center weights */}
                      <circle cx={shoulderX} cy={shoulderY} r="6" fill="#000000" />

                      {/* Joint Node points */}
                      <circle cx={shoulderX} cy={shoulderY} r="7" fill="#000000" stroke={themeColor} strokeWidth="3" />
                      <circle cx={hipX} cy={hipY} r="7" fill="#000000" stroke={themeColor} strokeWidth="3" />
                      <circle cx={kneeX} cy={kneeY} r="8" fill="#000000" stroke={themeColor} strokeWidth="3" />
                      <circle cx="90" cy="175" r="7" fill="#000000" stroke={themeColor} strokeWidth="3" />

                      {/* Real time angle tag inside simulated figure */}
                      <rect x={kneeX - 45} y={kneeY - 10} width="35" height="20" rx="4" fill="#000000" stroke={themeColor} strokeWidth="1.5" />
                      <text x={kneeX - 28} y={kneeY + 4} fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        {leftKneeAngle}°
                      </text>
                    </g>
                  );
                })()}
              </svg>

              {/* Angle scale bar overlay on bottom of simulation */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-4 py-2 rounded-full flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Flexión:</span>
                <span className="text-xs font-mono font-black text-white italic">{leftKneeAngle}°</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all duration-75"
                    style={{ width: `${Math.max(0, Math.min(100, ((180 - leftKneeAngle) / 100) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Run simulate trigger when in simulation mode */}
            {!isSimulatingRep && (
              <button
                onClick={handleSimulateRepButton}
                className="px-8 py-4 rounded-2xl bg-brand text-black font-black uppercase tracking-widest text-xs flex items-center gap-2 cursor-pointer shadow-[0_5px_25px_rgba(226,255,49,0.35)] hover:scale-[1.01] transition-all"
              >
                <Play className="h-4 w-4 fill-black" /> Simular Sentadilla con Pausa
              </button>
            )}
            
            {isSimulatingRep && (
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin text-brand" /> Simulando trayectoria de fuerza...
              </div>
            )}
          </div>
        )}

        {/* 3. DYNAMIC COUNTDOWN & BIG DIRECTION ARROW OVERLAYS (HIGH CONTRAST BRIGHT ENVIRONMENT READY) */}
        <AnimatePresence mode="wait">
          {squatState === "HOLDING" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none transition-colors duration-200 ${
                isHighContrast 
                  ? "bg-black/95 border-4 border-yellow-300 shadow-[inset_0_0_80px_rgba(255,255,0,0.5)]" 
                  : "bg-black/60 backdrop-blur-[2px]"
              }`}
            >
              {/* High Contrast Ambient Light Tag */}
              {isHighContrast && (
                <div className="absolute top-6 px-4 py-1.5 rounded-full bg-yellow-400 text-black border-2 border-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,0,0.8)]">
                  <Sun className="h-3.5 w-3.5 fill-black" /> ENTORNO BRILLANTE • ALTO CONTRASTE ACTIVO
                </div>
              )}

              {/* Giant countdown text - keying by whole integer second prevents 60fps re-mounting flicker */}
              <motion.div 
                key={Math.ceil(countdown)}
                initial={{ scale: 0.85, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={
                  isHighContrast
                    ? "text-[14rem] sm:text-[17rem] font-black leading-none text-yellow-300 font-mono tracking-tighter italic drop-shadow-[0_0_25px_#000] [text-shadow:_0_0_15px_#000,_0_0_30px_#000,_0_0_50px_#000]"
                    : "text-[12rem] sm:text-[14rem] font-black leading-none text-brand font-mono tracking-tighter italic drop-shadow-[0_10px_45px_rgba(226,255,49,0.6)]"
                }
              >
                {Math.ceil(countdown)}
              </motion.div>
              
              {/* Dynamic hold advice */}
              <div className={
                isHighContrast
                  ? "px-8 py-3.5 rounded-2xl bg-yellow-400 text-black border-4 border-black text-sm sm:text-base font-black uppercase tracking-widest flex items-center gap-2.5 mt-3 shadow-[0_0_35px_rgba(255,255,0,1)]"
                  : "px-5 py-2.5 rounded-full bg-brand-muted border border-brand/35 text-brand text-xs font-black uppercase tracking-widest flex items-center gap-2 mt-2 shadow-lg"
              }>
                <Activity className={`h-4 w-4 animate-pulse ${isHighContrast ? 'text-black' : 'text-brand'}`} /> MANTÉN EL FONDO / HOLD
              </div>
            </motion.div>
          )}

          {squatState === "COMPLETED_HOLD" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none transition-colors duration-200 ${
                isHighContrast 
                  ? "bg-black/95 border-4 border-yellow-300 shadow-[inset_0_0_80px_rgba(255,255,0,0.5)]" 
                  : "bg-black/60 backdrop-blur-[2px]"
              }`}
            >
              {/* Giant visual yellow-green UP arrow */}
              <motion.div
                animate={{ 
                  y: [12, -12, 12],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.8,
                  ease: "easeInOut"
                }}
                className="flex flex-col items-center justify-center"
              >
                <svg 
                  className={
                    isHighContrast
                      ? "w-56 h-56 text-yellow-300 drop-shadow-[0_0_30px_#000]"
                      : "w-48 h-48 sm:w-56 sm:h-56 text-brand drop-shadow-[0_0_35px_rgba(226,255,49,0.6)]"
                  } 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={isHighContrast ? "5" : "4"}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </motion.div>
              
              <div className={
                isHighContrast
                  ? "px-10 py-4 rounded-2xl bg-yellow-400 text-black border-4 border-black text-xl font-black uppercase tracking-widest flex items-center gap-3.5 shadow-[0_0_40px_rgba(255,255,0,1)]"
                  : "px-8 py-3.5 rounded-full bg-brand text-black border border-brand text-base sm:text-lg font-black uppercase tracking-widest flex items-center gap-3.5 shadow-[0_10px_35px_rgba(226,255,49,0.5)]"
              }>
                <Sparkles className="h-5 w-5 text-black animate-pulse" /> ¡EMPUJA! / UP!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay for Pose AI model */}
        {!settings.isSimulationMode && modelLoading && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 z-30">
            <RefreshCw className="h-10 w-10 text-brand animate-spin mb-4" />
            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tight italic">INICIALIZANDO DETECTOR AI</h3>
            <p className="text-[10px] text-zinc-500 font-mono text-center tracking-wider uppercase">{loadingStep}</p>
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-4 border border-white/10 relative">
              <div className="h-full bg-brand animate-loading-bar" style={{ width: '40%' }} />
            </div>
          </div>
        )}

        {/* User posture safety helper notifications */}
        {!settings.isSimulationMode && !modelLoading && !cameraError && !personInFrame && (
          <div className="absolute bottom-6 left-6 right-6 bg-black/90 border border-white/10 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-md z-10">
            <AlertCircle className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Alineación del Atleta</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal font-mono">Colócate a unos 2.5 metros para que la cámara capture todo tu cuerpo (hombros, caderas, rodillas y tobillos) de frente.</p>
            </div>
          </div>
        )}

        {/* Dynamic athlete-aligned feedback banner */}
        {!settings.isSimulationMode && !modelLoading && !cameraError && personInFrame && squatState === "STANDING" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-6 left-6 right-6 bg-black/95 border border-brand/55 p-4 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md z-10 shadow-[0_10px_35px_rgba(226,255,49,0.3)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand animate-pulse">
                <Check className="h-4 w-4 stroke-[3px]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-brand uppercase tracking-wider">✓ ATLETA ALINEADO Y DETECTADO</h4>
                <p className="text-[10px] text-zinc-300 mt-0.5 leading-normal font-mono">Estructura biomecánica detectada correctamente. Todo preparado para comenzar.</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-black text-[9px] font-mono font-black uppercase tracking-widest shadow-[0_0_15px_rgba(226,255,49,0.4)]">
              <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping"></span> SISTEMA LISTO
            </div>
          </motion.div>
        )}

        {/* Camera Permission/Access Errors */}
        {cameraError && (
          <div className="absolute inset-0 bg-zinc-950 border border-red-900/40 p-6 flex flex-col items-center justify-center text-center z-30 overflow-y-auto">
            <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-4 animate-pulse">
              <Camera className="h-10 w-10 text-red-500" />
            </div>
            
            <h3 className="text-base font-black text-white uppercase tracking-tight">Acceso a Cámara Bloqueado</h3>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 my-4 max-w-md">
              <p className="text-[11px] text-zinc-400 font-mono text-left leading-relaxed">
                <span className="text-red-400 font-bold block mb-1">Causa común:</span>
                Muchos navegadores bloquean la cámara cuando la aplicación se ejecuta dentro de un marco integrado (iframe) por motivos de seguridad.
              </p>
              <p className="text-[10px] text-zinc-500 font-mono text-left leading-relaxed mt-2 border-t border-white/5 pt-2">
                <strong className="text-zinc-400 font-bold">Detalle del error:</strong> {cameraError}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
              {/* Option 1: Open in a new tab */}
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 rounded-xl bg-brand text-black font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all shadow-[0_4px_14px_rgba(226,255,49,0.25)] cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-black" /> Abrir en Pestaña Nueva
              </a>

              {/* Option 2: Active Simulation Mode */}
              {onToggleSimulation && (
                <button
                  onClick={onToggleSimulation}
                  className="flex-1 px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Modo Simulación
                </button>
              )}
            </div>

            {/* Option 3: Retry loading */}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" /> Reintentar cámara
            </button>
          </div>
        )}
      </div>

      {/* 4. FOOTER TELEMETRY HUD (Biomechanical Pro Dashboard) */}
      <div className={`grid grid-cols-4 divide-x font-mono text-center transition-all ${
        isHighContrast
          ? "divide-yellow-400/50 border-t-2 border-yellow-400 bg-black text-yellow-300"
          : "divide-white/[0.07] border-t border-white/10 bg-gradient-to-t from-black via-zinc-950/90 to-black/70 backdrop-blur-xl"
      }`}>
        {/* Left Knee info */}
        <div className="py-3 px-1 sm:px-2 flex flex-col items-center justify-center">
          <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest block font-bold ${isHighContrast ? "text-yellow-200" : "text-zinc-500"}`}>
            RODILLA IZQ
          </span>
          <span className={`text-xl sm:text-2xl font-black mt-0.5 block tracking-tighter ${
            leftKneeAngle <= settings.targetAngle 
              ? 'text-brand neon-text-glow' 
              : isHighContrast 
                ? 'text-yellow-300' 
                : 'text-white'
          }`}>
            {leftKneeAngle}°
          </span>
          <div className="w-10 sm:w-14 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-75 ${leftKneeAngle <= settings.targetAngle ? 'bg-brand' : 'bg-sky-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, ((180 - leftKneeAngle) / 90) * 100))}%` }}
            />
          </div>
        </div>
        
        {/* Right Knee info */}
        <div className="py-3 px-1 sm:px-2 flex flex-col items-center justify-center">
          <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest block font-bold ${isHighContrast ? "text-yellow-200" : "text-zinc-500"}`}>
            RODILLA DER
          </span>
          <span className={`text-xl sm:text-2xl font-black mt-0.5 block tracking-tighter ${
            rightKneeAngle <= settings.targetAngle 
              ? 'text-brand neon-text-glow' 
              : isHighContrast 
                ? 'text-yellow-300' 
                : 'text-white'
          }`}>
            {rightKneeAngle}°
          </span>
          <div className="w-10 sm:w-14 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-75 ${rightKneeAngle <= settings.targetAngle ? 'bg-brand' : 'bg-sky-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, ((180 - rightKneeAngle) / 90) * 100))}%` }}
            />
          </div>
        </div>

        {/* Symmetry factor */}
        <div className="py-3 px-1 sm:px-2 flex flex-col items-center justify-center">
          <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest block font-bold ${isHighContrast ? "text-yellow-200" : "text-zinc-500"}`}>
            SIMETRÍA
          </span>
          {(() => {
            const dev = Math.abs(leftKneeAngle - rightKneeAngle);
            const isSym = dev <= 5;
            const symPercent = Math.max(0, 100 - Math.min(100, dev * 2));
            return (
              <>
                <span className={`text-lg sm:text-xl font-black mt-0.5 inline-flex items-center gap-1 leading-none tracking-tight ${
                  isSym 
                    ? isHighContrast ? 'text-yellow-300' : 'text-emerald-400' 
                    : 'text-amber-400'
                }`}>
                  {isSym ? <Check className="h-3 w-3 stroke-[3px]" /> : null} {symPercent}%
                </span>
                <span className={`text-[8px] block mt-1 uppercase font-mono ${isHighContrast ? "text-yellow-200" : "text-zinc-500"}`}>
                  DESV: ±{dev}°
                </span>
              </>
            );
          })()}
        </div>

        {/* Rep counter in HUD */}
        <div className={`py-3 px-1 sm:px-2 flex flex-col items-center justify-center ${
          isHighContrast ? 'bg-yellow-400 text-black font-extrabold' : 'bg-brand/[0.08] border-l border-brand/20'
        }`}>
          <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest block ${isHighContrast ? 'text-black' : 'text-brand'}`}>
            REPS SERIE
          </span>
          <span className={`text-2xl sm:text-3xl font-black italic mt-0.5 block leading-none tracking-tighter ${
            isHighContrast ? 'text-black' : 'text-brand'
          }`}>
            {repCount}
          </span>
          <span className={`text-[7px] sm:text-[8px] block uppercase font-mono mt-1 ${isHighContrast ? 'text-black/80 font-bold' : 'text-zinc-400'}`}>
            OBJ VÁLIDAS
          </span>
        </div>
      </div>

      {/* 5. RECORDED VIDEO REVIEW MODAL */}
      <AnimatePresence>
        {showVideoModal && recordedVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Grabación Biomecánica de Sentadilla</h3>
                    <p className="text-xs text-zinc-400">Vídeo procesado en tiempo real con líneas de fuerza y ángulos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative aspect-[4/3] w-full bg-black rounded-2xl overflow-hidden border border-white/10">
                <video
                  src={recordedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={downloadVideo}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-brand text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(226,255,49,0.3)] hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Descargar Vídeo (.webm)
                </button>
                
                <button
                  onClick={discardVideo}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </button>

                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
