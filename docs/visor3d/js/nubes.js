import * as THREE from 'three';

// Gestor de nubes de puntos LiDAR/fotogramétricas preprocesadas (public/datos/albali/nubes/)
export function crearGestorNubes({ escena, W, origen }) {
  const grupo = new THREE.Group();
  grupo.name = 'nubesPuntos';
  escena.add(grupo);

  const mat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    sizeAttenuation: true,
  });

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

  async function cargarZona(z) {
    if (cargadas.has(z.id)) return;
    const reg = { zona: z, estado: 'cargando', puntos: null };
    cargadas.set(z.id, reg);
    try {
      const resp = await fetch(`./datos/albali/nubes/${z.fichero}`);
      if (!resp.ok) { cargadas.delete(z.id); return; }
      const buf = await resp.arrayBuffer();
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
    } catch {
      cargadas.delete(z.id);
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
