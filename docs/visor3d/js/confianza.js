import * as THREE from 'three';

/*
 * Capa de confianza: pinta cada elemento de la escena por la clase de su origen (js/origen.js) en lugar de por su material.
 * El color nunca va solo: cada clase lleva además una trama (liso, rayas, puntos, malla, cuadros), que se ve igual con daltonismo.
 * El terreno, el cielo y las etiquetas no se tocan. Los materiales originales se guardan aparte y se devuelven al apagarla.
 *
 * Los elementos nuevos que llegan al avanzar por la línea se pintan en el barrido que se repite mientras está encendida.
 */
const CLASES_TRAMA = { adif: 0, fuente: 1, deducido: 2, supuesto: 3, simulado: 4, sin: 0 };
const COLORES = { adif: '#2563eb', fuente: '#0d9488', deducido: '#7c3aed', supuesto: '#d97706', simulado: '#be185d', sin: '#64748b' };
// Muestra de cada trama para la leyenda (misma idea que el shader)
const MUESTRA = {
  adif: (c) => c,
  fuente: (c) => `repeating-linear-gradient(135deg, ${c} 0 4px, rgba(0,0,0,.45) 4px 8px)`,
  deducido: (c) => `radial-gradient(circle, rgba(0,0,0,.5) 0 1.6px, ${c} 1.8px)  0 0 / 6px 6px`,
  supuesto: (c) => `repeating-linear-gradient(45deg, ${c} 0 3px, rgba(0,0,0,.45) 3px 4px), repeating-linear-gradient(-45deg, transparent 0 3px, rgba(0,0,0,.45) 3px 4px)`,
  simulado: (c) => `conic-gradient(${c} 25%, rgba(0,0,0,.45) 0 50%, ${c} 0 75%, rgba(0,0,0,.45) 0) 0 0 / 8px 8px`,
  sin: (c) => c,
};

const VERT = `
varying vec3 vWorld;
varying vec3 vN;
#include <common>
void main() {
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <project_vertex>
  vec4 wp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp;
  #endif
  wp = modelMatrix * wp;
  vWorld = wp.xyz;
  vN = normalize(transformedNormal);
}`;
const FRAG = `
uniform vec3 uColor;
uniform int uTrama;
varying vec3 vWorld;
varying vec3 vN;
void main() {
  float luz = 0.58 + 0.42 * abs(normalize(vN).z);
  float u = vWorld.x + vWorld.z, v = vWorld.y;
  float m = 1.0;
  if (uTrama == 1) m = step(0.5, fract((u + v) * 1.4));
  else if (uTrama == 2) m = step(0.22, length(fract(vec2(u, v) * 2.0) - 0.5));
  else if (uTrama == 3) m = min(step(0.28, fract((u + v) * 2.0)), step(0.28, fract((u - v) * 2.0)));
  else if (uTrama == 4) m = mod(floor(u * 2.0) + floor(v * 2.0), 2.0);
  vec3 c = mix(uColor * 0.32, uColor, m) * luz;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export function crearConfianza({ raices, origenDe, CLASES }) {
  const materiales = {};
  for (const [clase, hex] of Object.entries(COLORES)) {
    materiales[clase] = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uColor: { value: new THREE.Color(hex) }, uTrama: { value: CLASES_TRAMA[clase] } },
    });
    materiales[clase].userData.compartida = true;   // la liberación de trenes y teselas no debe destruir el material compartido
  }
  const originales = new WeakMap();   // malla → material (o lista) que tenía
  let activa = false, reloj = 0;

  function claseDe(o) {
    for (let p = o, n = 0; p && n < 4; p = p.parent, n++) if (p.userData?.origen || p.userData?.capa) return origenDe(p.userData).clase;
    return 'sin';
  }
  function barrer() {
    for (const raiz of raices()) {
      raiz.traverse((o) => {
        if (!o.isMesh || o.renderOrder >= 900 || originales.has(o)) return;
        const m = materiales[claseDe(o)] || materiales.sin;
        originales.set(o, o.material);
        o.material = Array.isArray(o.material) ? o.material.map(() => m) : m;
      });
    }
  }
  function devolver() {
    for (const raiz of raices()) {
      raiz.traverse((o) => {
        if (!o.isMesh || !originales.has(o)) return;
        o.material = originales.get(o);
        originales.delete(o);
      });
    }
  }

  // Leyenda propia (la del panel se oculta con él abierto)
  const leyenda = document.createElement('aside');
  leyenda.id = 'leyendaConfianza';
  leyenda.hidden = true;
  leyenda.setAttribute('aria-label', 'Leyenda de la capa de confianza');
  leyenda.innerHTML = '<div class="f-cab"><strong>Origen del dato</strong><button type="button" class="f-btn" aria-label="Apagar la capa de confianza" title="Apagar"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div><ul></ul><p>El terreno y el cielo no se pintan.</p>';
  const ul = leyenda.querySelector('ul');
  for (const [clase, hex] of Object.entries(COLORES)) {
    const li = document.createElement('li');
    li.title = CLASES[clase].ayuda;
    li.innerHTML = '<i aria-hidden="true"></i><span></span>';
    li.firstChild.style.background = MUESTRA[clase](hex);
    li.lastChild.textContent = CLASES[clase].etiqueta;
    ul.appendChild(li);
  }
  document.body.appendChild(leyenda);

  function activar(on) {
    activa = typeof on === 'boolean' ? on : !activa;
    leyenda.hidden = !activa;
    document.body.classList.toggle('con-confianza', activa);
    clearInterval(reloj);
    if (activa) { barrer(); reloj = setInterval(barrer, 1500); } else devolver();
    return activa;
  }
  leyenda.querySelector('button').addEventListener('click', () => leyenda.dispatchEvent(new CustomEvent('apagar')));
  return { get activa() { return activa; }, activar, alApagar: (f) => leyenda.addEventListener('apagar', f) };
}
