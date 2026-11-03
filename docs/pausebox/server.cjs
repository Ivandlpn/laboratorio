var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.post("/api/coach-feedback", async (req, res) => {
  try {
    const { reps, settings, message } = req.body;
    if (!reps || !settings) {
      return res.status(400).json({ error: "Faltan datos de la sesi\xF3n (reps o settings)." });
    }
    let prompt = "";
    if (message) {
      prompt = `Act\xFAa como un entrenador experto de Powerlifting y halterofilia en espa\xF1ol. El usuario te est\xE1 haciendo una pregunta sobre su entrenamiento de sentadillas con pausa.
      
Ajustes de su entrenamiento actual:
- Tiempo de pausa objetivo: ${settings.pauseDuration}s
- \xC1ngulo de rodilla objetivo: ${settings.targetAngle}\xB0 (menor \xE1ngulo = sentadilla m\xE1s profunda)

Rendimiento de la serie actual:
${reps.length === 0 ? "No hay repeticiones completadas a\xFAn." : reps.map((rep, i) => `- Rep ${i + 1}: Pausa real ${rep.actualPause.toFixed(1)}s (obj ${settings.pauseDuration}s), \xC1ngulo rodilla m\xEDnimo ${rep.minAngle.toFixed(1)}\xB0 (obj ${settings.targetAngle}\xB0). ${rep.success ? "Completada con \xC9xito" : "Incompleta/Fallo"}`).join("\n")}

Pregunta del usuario: "${message}"

Responde de forma concisa, muy t\xE9cnica y directa en espa\xF1ol, aportando consejos biomec\xE1nicos reales y motivadores.`;
    } else {
      prompt = `Act\xFAa como un entrenador experto de Powerlifting y halterofilia en espa\xF1ol. 
Analiza los datos de la \xFAltima sesi\xF3n de entrenamiento de sentadillas con pausa (Pause Back Squats) del usuario y dale feedback biomec\xE1nico y motivador de alt\xEDsima calidad.

Ajustes de su entrenamiento:
- Tiempo de pausa objetivo en el fondo: ${settings.pauseDuration} segundos
- \xC1ngulo de profundidad objetivo (flexi\xF3n de rodilla): ${settings.targetAngle}\xB0 (un \xE1ngulo menor indica m\xE1s profundidad, por ejemplo <90\xB0 es profunda, 100\xB0 es paralela, >110\xB0 es alta)

Datos de las repeticiones realizadas en la serie:
${reps.length === 0 ? "El usuario no ha realizado repeticiones a\xFAn en esta serie. Dale consejos clave sobre c\xF3mo prepararse para una serie perfecta de sentadilla con pausa (calentamiento, setup, bloqueo y braceo)." : reps.map((rep, index) => `- Repetici\xF3n ${index + 1}: Pausa real de ${rep.actualPause.toFixed(1)}s (objetivo ${settings.pauseDuration}s), \xC1ngulo de rodilla m\xEDnimo alcanzado de ${rep.minAngle.toFixed(1)}\xB0 (objetivo ${settings.targetAngle}\xB0). Estado: ${rep.success ? "COMPLETADA" : "INCOMPLETA (subi\xF3 antes de tiempo o profundidad insuficiente)"}`).join("\n")}

Por favor, proporciona el feedback estructurado exactamente en los siguientes apartados:
1. **An\xE1lisis T\xE9cnico de la Serie**: Resumen del rendimiento (reps v\xE1lidas, consistencia de la pausa, uniformidad de profundidad).
2. **Consejos Biomec\xE1nicos Personalizados**: Tips de t\xE9cnica espec\xEDficos (por ejemplo: estabilidad del core, mantener tensi\xF3n constante en el fondo sin rebotar, abducci\xF3n de rodillas, empuje plantar "tri-pod").
3. **Recomendaci\xF3n para la Siguiente Serie**: Si deber\xEDa mantener el peso, ajustar el tiempo de pausa o buscar m\xE1s profundidad de forma segura.
4. **Fuego del Entrenador**: Una frase de fuerza muy corta y motivadora al estilo powerlifter/halter\xF3filo serio para ir por la siguiente serie.

Mant\xE9n el tono directo, profesional, de gimnasio serio ("hardcore but scientific"). Usa negritas para destacar conceptos clave.`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    res.json({ feedback: response.text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Error al generar el feedback del entrenador AI. Por favor, aseg\xFArate de que la API Key de Gemini est\xE9 configurada." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
