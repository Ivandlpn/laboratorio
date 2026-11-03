import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for coach feedback
app.post("/api/coach-feedback", async (req, res) => {
  try {
    const { reps, settings, message } = req.body;
    
    if (!reps || !settings) {
      return res.status(400).json({ error: "Faltan datos de la sesión (reps o settings)." });
    }

    let prompt = "";
    if (message) {
      // User is chatting with the coach in the context of the session
      prompt = `Actúa como un entrenador experto de Powerlifting y halterofilia en español. El usuario te está haciendo una pregunta sobre su entrenamiento de sentadillas con pausa.
      
Ajustes de su entrenamiento actual:
- Tiempo de pausa objetivo: ${settings.pauseDuration}s
- Ángulo de rodilla objetivo: ${settings.targetAngle}° (menor ángulo = sentadilla más profunda)

Rendimiento de la serie actual:
${reps.length === 0 ? "No hay repeticiones completadas aún." : reps.map((rep: any, i: number) => `- Rep ${i + 1}: Pausa real ${rep.actualPause.toFixed(1)}s (obj ${settings.pauseDuration}s), Ángulo rodilla mínimo ${rep.minAngle.toFixed(1)}° (obj ${settings.targetAngle}°). ${rep.success ? 'Completada con Éxito' : 'Incompleta/Fallo'}`).join('\n')}

Pregunta del usuario: "${message}"

Responde de forma concisa, muy técnica y directa en español, aportando consejos biomecánicos reales y motivadores.`;
    } else {
      // Direct session analysis feedback
      prompt = `Actúa como un entrenador experto de Powerlifting y halterofilia en español. 
Analiza los datos de la última sesión de entrenamiento de sentadillas con pausa (Pause Back Squats) del usuario y dale feedback biomecánico y motivador de altísima calidad.

Ajustes de su entrenamiento:
- Tiempo de pausa objetivo en el fondo: ${settings.pauseDuration} segundos
- Ángulo de profundidad objetivo (flexión de rodilla): ${settings.targetAngle}° (un ángulo menor indica más profundidad, por ejemplo <90° es profunda, 100° es paralela, >110° es alta)

Datos de las repeticiones realizadas en la serie:
${reps.length === 0 ? "El usuario no ha realizado repeticiones aún en esta serie. Dale consejos clave sobre cómo prepararse para una serie perfecta de sentadilla con pausa (calentamiento, setup, bloqueo y braceo)." : reps.map((rep: any, index: number) => `- Repetición ${index + 1}: Pausa real de ${rep.actualPause.toFixed(1)}s (objetivo ${settings.pauseDuration}s), Ángulo de rodilla mínimo alcanzado de ${rep.minAngle.toFixed(1)}° (objetivo ${settings.targetAngle}°). Estado: ${rep.success ? 'COMPLETADA' : 'INCOMPLETA (subió antes de tiempo o profundidad insuficiente)'}`).join('\n')}

Por favor, proporciona el feedback estructurado exactamente en los siguientes apartados:
1. **Análisis Técnico de la Serie**: Resumen del rendimiento (reps válidas, consistencia de la pausa, uniformidad de profundidad).
2. **Consejos Biomecánicos Personalizados**: Tips de técnica específicos (por ejemplo: estabilidad del core, mantener tensión constante en el fondo sin rebotar, abducción de rodillas, empuje plantar "tri-pod").
3. **Recomendación para la Siguiente Serie**: Si debería mantener el peso, ajustar el tiempo de pausa o buscar más profundidad de forma segura.
4. **Fuego del Entrenador**: Una frase de fuerza muy corta y motivadora al estilo powerlifter/halterófilo serio para ir por la siguiente serie.

Mantén el tono directo, profesional, de gimnasio serio ("hardcore but scientific"). Usa negritas para destacar conceptos clave.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ feedback: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Error al generar el feedback del entrenador AI. Por favor, asegúrate de que la API Key de Gemini esté configurada." });
  }
});

// Serve frontend assets and integrate Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
