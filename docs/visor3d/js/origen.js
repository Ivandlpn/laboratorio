/*
 * Origen de cada dato que se enseña en la ficha. Regla rectora de VISOR3D: lo que no sale de la cartografía de Adif se dice.
 *
 * Cada elemento con ficha lleva en su `userData.origen` una declaración { clase, fuente, supuesto? }, escrita donde se crea:
 *   clase    una de CLASES (ver abajo)
 *   fuente   de dónde sale la posición y la forma (texto corto)
 *   supuesto lo que se ha puesto por defecto dentro de un elemento por lo demás medido (opcional)
 * Nunca se deduce del texto de la ficha. Un elemento sin declarar sale como «Sin declarar», no como cartografía de Adif.
 * La tabla POR_CAPA solo cubre las capas que son enteras de una clase (simulaciones, trenes, trabajos).
 */

export const CLASES = {
  adif: { etiqueta: 'Cartografía Adif', ayuda: 'Posición y forma medidas en la cartografía 3D de Adif.', icono: '◆' },
  fuente: { etiqueta: 'Otra fuente', ayuda: 'Datos de otra fuente documentada (IGN, Catastro, Renfe, proyecto…).', icono: '●' },
  deducido: { etiqueta: 'Deducido', ayuda: 'Calculado a partir de otros datos (el eje, los postes…), sin medida propia.', icono: '▲' },
  supuesto: { etiqueta: 'Supuesto', ayuda: 'Valor tipo: no hay medida de este elemento.', icono: '◇' },
  simulado: { etiqueta: 'Simulado', ayuda: 'Escena inventada para la demostración: no existe en la línea.', icono: '▶' },
  sin: { etiqueta: 'Sin declarar', ayuda: 'Este elemento aún no declara de dónde sale.', icono: '?' },
};

/** Atajo para declarar: origen('adif', 'Cartografía 3D de Adif · capa 050117'). */
export function origen(clase, fuente, supuesto) {
  return supuesto ? { clase, fuente, supuesto } : { clase, fuente };
}

const SIMULADO = (fuente) => origen('simulado', fuente);
const POR_CAPA = {
  'Trabajos de mantenimiento': SIMULADO('Escena de mantenimiento simulada; tajo, máquinas y ritmos supuestos'),
  'Mantenimiento de energía': SIMULADO('Escena de mantenimiento simulada; dresina y ciclo de trabajo supuestos'),
  'Inspección de superestructura': SIMULADO('Escena de inspección simulada; patrulla y camino de servicio supuestos'),
  'Mantenimiento ferroviario': SIMULADO('Vehículos y personal de mantenimiento simulados'),
  'Tráfico (supuesto)': SIMULADO('Tráfico de carretera simulado sobre los pasos medidos'),
  'Interior del tren': SIMULADO('Interior modelado con fotos de Renfe; disposición y medidas supuestas'),
  'Circulación Alta Velocidad': SIMULADO('Tren simulado con modelo tipo: no es un tren real'),
  'Tren en circulación (Renfe, tiempo real)': origen('fuente', 'Renfe · GTFS en tiempo real; posición GPS proyectada sobre la traza', 'Horario y paradas según el GTFS estático'),
  'Edificios reales (OSM)': origen('fuente', 'OpenStreetMap: huella y altura'),
};

/** Origen declarado de un `userData` de la escena. */
export function origenDe(ud) {
  if (ud?.origen?.clase && CLASES[ud.origen.clase]) return ud.origen;
  return POR_CAPA[ud?.capa] || origen('sin', 'Sin declarar');
}
