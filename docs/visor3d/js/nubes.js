import * as THREE from 'three';

// Gestor de nubes de puntos LiDAR/fotogramétricas preprocesadas (public/datos/albali/nubes/)
// alProgreso({ zonas, leidos, total }): avisa mientras se descargan nubes (zonas = 0 cuando ya no queda ninguna)
export function crearGestorNubes({ escena, W, origen, alProgreso = null }) {
  const grupo = new THREE.Group();
  grupo.name = 'nubesPuntos';
  escena.add(grupo);

  const mat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    sizeAttenuation: true,
  });
  // Los puntos están sobre el suelo real y la malla del terreno (interpolada cada 2-10 m) queda a ras o por encima:
  // sin ayuda la nube sale tapada o moteada. Se acerca cada punto a la cámara a lo largo de su rayo de visión
  // (1,5 m + 1 % de la distancia), así se dibuja en el mismo píxel y en su posición real, pero gana al terreno en
  // profundidad. Y un tamaño mínimo en pantalla para que la nube se lea también de lejos (0,22 m a 400 m es < 1 px).
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <project_vertex>', `#include <project_vertex>
        float dNube = -mvPosition.z;
        if (dNube > 0.0) {
          float acercar = min(dNube * 0.5, 1.5 + dNube * 0.01);
          mvPosition.xyz *= (dNube - acercar) / dNube;
          gl_Position = projectionMatrix * mvPosition;
        }`)
      .replace('#include <logdepthbuf_vertex>', `gl_PointSize = max(gl_PointSize, 1.6);
        #include <logdepthbuf_vertex>`);
  };

  let zonas = [];
  let visible = true;
  const cargadas = new Map(); // id -> { zona, estado: 'cargando'|'lista', puntos }

  const pIndice = fetch('./datos/albali/nubes/indice.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      zonas = d?.zonas || [];
      return zonas;
    })
    .catch(() => []);

  // Progreso de las descargas en curso: id -> [bytes leídos, bytes totales]
  const progreso = new Map();
  function avisarProgreso() {
    if (!alProgreso) return;
    let leidos = 0, total = 0;
    for (const [l, t] of progreso.values()) { leidos += l; total += t; }
    alProgreso({ zonas: progreso.size, leidos, total });
  }

  // Lee el fichero por trozos para poder contar lo descargado. El total sale del índice (tamBytes o puntos × 15),
  // no de Content-Length: GitHub Pages sirve comprimido y esa cabecera da el tamaño comprimido.
  async function leerConProgreso(resp, z) {
    const total = z.tamBytes || z.puntos * 15;
    progreso.set(z.id, [0, total]);
    avisarProgreso();
    if (!resp.body?.getReader) return resp.arrayBuffer();
    const lector = resp.body.getReader();
    const bytes = new Uint8Array(total);
    let off = 0;
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      if (off + value.length > total) throw new Error(`nube ${z.id}: el fichero es mayor que lo indicado en el índice`);
      bytes.set(value, off);
      off += value.length;
      progreso.set(z.id, [off, total]);
      avisarProgreso();
    }
    if (off !== total) throw new Error(`nube ${z.id}: ${off} de ${total} bytes`);
    return bytes.buffer;
  }

  async function cargarZona(z) {
    if (cargadas.has(z.id)) return;
    const reg = { zona: z, estado: 'cargando', puntos: null };
    cargadas.set(z.id, reg);
    try {
      const resp = await fetch(`./datos/albali/nubes/${z.fichero}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = await leerConProgreso(resp, z);
      const n = z.puntos;
      const pos = new Float32Array(buf, 0, n * 3);
      const col = new Uint8Array(buf, n * 12, n * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
      geo.computeBoundingSphere();

      const pts = new THREE.Points(geo, mat);
      pts.name = `nube_${z.id}`;
      pts.frustumCulled = true;
      pts.position.copy(W(z.e0, z.n0, z.z0));
      reg.puntos = pts;
      reg.estado = 'lista';
      grupo.add(pts);
      actualizar(origen.E, origen.N);
    } catch (err) {
      // Sin esto actualizar() la volvería a pedir cada 0,18 s: se reintenta como pronto a los 30 s
      console.warn('No se pudo cargar la nube de puntos', z.id, err);
      reg.estado = 'error';
      reg.reintento = performance.now() + 30000;
    } finally {
      progreso.delete(z.id);
      avisarProgreso();
    }
  }

  function actualizar(camE = origen.E, camN = origen.N) {
    grupo.visible = visible;
    if (!visible || !zonas.length) return;
    for (const z of zonas) {
      const dist = Math.hypot(camE - z.e0, camN - z.n0);
      const reg = cargadas.get(z.id);
      if (dist < 3200 + (z.radio || 0)) {
        if (!reg) cargarZona(z);
        else if (reg.puntos) reg.puntos.visible = true;
        else if (reg.estado === 'error' && performance.now() > reg.reintento) { cargadas.delete(z.id); cargarZona(z); }
      } else if (reg?.puntos && dist > 4800 + (z.radio || 0)) {
        reg.puntos.visible = false;
      }
    }
  }

  function reubicar() {
    for (const reg of cargadas.values()) {
      if (reg.puntos) reg.puntos.position.copy(W(reg.zona.e0, reg.zona.n0, reg.zona.z0));
    }
  }

  function setVisible(v) {
    visible = Boolean(v);
    grupo.visible = visible;
    if (visible) actualizar(origen.E, origen.N);
  }

  function setTamPunto(tam) {
    mat.size = Math.max(0.05, Math.min(2.0, Number(tam) || 0.22));
  }

  return {
    grupo,
    pIndice,
    get zonas() { return zonas; },
    actualizar,
    reubicar,
    setVisible,
    setTamPunto,
  };
}
