# PauseBox Pro • Entrenador Biomecánico de Sentadilla con Pausa

Aplicación deportiva y biomecánica en tiempo real con Inteligencia Artificial que detecta la profundidad de la sentadilla, guía al atleta durante la fase isométrica de pausa con señales auditivas/visuales y analiza el rendimiento con **Google Gemini 3.5**.

---

## 🚀 Mejoras Implementadas

1. **Coach AI Gemini**: Análisis biomecánico de las series completadas con consejos de Powerlifting y halterofilia, detección de fallos y recomendaciones para la siguiente serie.
2. **Selector de Cámara Frontal / Trasera (`CAM TRASERA`)**: Permite colocar el móvil en el suelo o en un soporte enfocando de perfil sin distorsión de espejo.
3. **Guía Láser de Paralela en Tiempo Real**: Proyección en el canvas de la línea de paralela en rodillas que se ilumina en verde neón brillante (`#E2FF31`) al romper la profundidad deseada.
4. **Modo Gym Focus (Ultra Distancia)**: Dígitos de ángulo y bordes perimetrales de color de alta visibilidad a más de 2.5 metros de distancia.
5. **Cuenta Atrás de Preparación (`PREP 3s`)**: 3 segundos con señales sonoras antes de la primera repetición para colocarse bajo la barra con seguridad.
6. **Historial Completo y Métricas**: Registro persistente de todas las series, tasas de éxito, pausas medias y exportación en formato JSON.
7. **Soporte PWA para Móvil**: Manifiesto web, metatags para pantalla completa nativa sin marcos y ergonomía táctil con botones amplios de 44px.

---

## 📱 Cómo Ejecutarlo en el Móvil

### Opción 1: Enlace en Google AI Studio
Abre la aplicación directamente en la nube desde el navegador de tu móvil:
👉 **[https://ai.studio/apps/d202047b-eba0-4495-9b28-26d9f953b807](https://ai.studio/apps/d202047b-eba0-4495-9b28-26d9f953b807)**

### Opción 2: Ejecución Local con HTTPS (Cámara activa en tu móvil)
Dado que los navegadores móviles (Safari en iOS y Chrome en Android) exigen **HTTPS** para habilitar la cámara:

1. Inicia el servidor en tu ordenador:
   ```bash
   npm run dev
   ```
2. En otra terminal, genera un túnel HTTPS gratuito:
   ```bash
   npx localtunnel --port 3000
   ```
3. Abre el enlace `https://...` generado en el navegador de tu móvil.
4. *(Opcional)* En Safari o Chrome, toca en **"Compartir" -> "Añadir a pantalla de inicio"** para usar PauseBox como una app nativa a pantalla completa.

### Opción 3: Subir a tu propio repositorio de GitHub
El repositorio Git local ya está inicializado con todas las mejoras en el commit `master`. Para subirlo a tu cuenta:
```bash
git remote add origin https://github.com/<tu-usuario>/pausebox.git
git branch -M main
git push -u origin main
```
Luego puedes desplegarlo con un clic en **Vercel**, **Netlify** o **Render**.
