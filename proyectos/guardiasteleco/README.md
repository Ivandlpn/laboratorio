# 📞 Guardias Teleco LAV ESTE - INECO

Calendario y gestor interactivo de turnos de guardia semanal para el equipo de Telecomunicaciones de la Línea de Alta Velocidad **LAV ESTE** (INECO).

---

## 🌟 Características Principales

1. **Gestión Anual Completa**:
   - Selector dinámico de año para consultar y planificar guardias presentes y futuras.
   - Vista por bloques mensuales con cómputo de semanas ISO y días del mes.

2. **Equipo y Asignación de Turnos**:
   - Asignación rápida de semanas por técnico mediante ventana modal interactiva.
   - Técnicos configurados con código cromático identificativo:
     - 🟢 Raúl
     - 🔵 Iván
     - 🟡 Carlos
   - Opción para desasignar o limpiar semanas en un solo clic.

3. **Sincronización en Tiempo Real**:
   - Conectado a **Firebase Firestore** (`guardias-teleco-ineco`).
   - Escucha reactiva (`onSnapshot`) para reflejar los cambios al instante en cualquier dispositivo.
   - Indicador de guardado y confirmación visual de cambios pendientes.

4. **Ayudas Visuales y Usabilidad**:
   - Resaltado automático de la **semana en curso** y del día de hoy.
   - Efecto hover sobre las tarjetas de técnico para destacar instantáneamente todas sus semanas asignadas a lo largo del año.
   - Diseño adaptable (responsive) para escritorio, tablets y móviles.
