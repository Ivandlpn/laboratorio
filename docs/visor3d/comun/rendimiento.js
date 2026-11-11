/* Rendimiento común de los visores 3D (sin dependencias propias). Criterios tomados de guías públicas de buenas prácticas de three.js:
   - fusionar en una sola malla las piezas estáticas que comparten material (menos llamadas de dibujo por fotograma),
   - congelar la matriz de lo que no se mueve (menos trabajo por fotograma),
   - limitar la resolución de píxel y quitar el antialiasing nativo en móvil,
   - reducir el mapa de sombras en móvil.
   Cada visor llama a Rend3D.init(THREE, mergeGeometries) al cargar y, antes de arrancar el bucle,
   a Rend3D.fusionarEstaticos(escena, dinamicos) y Rend3D.congelar(escena, dinamicos). */
(function () {
  let THREE_ = null, merge = null;
  const movil = () => matchMedia('(max-width: 640px)').matches || matchMedia('(pointer: coarse)').matches;

  function normalizar(g) {
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE_.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    return g;
  }

  window.Rend3D = {
    movil,
    init(THREE, mergeGeometries) { THREE_ = THREE; merge = mergeGeometries; },
    /** Resolución de píxel: 2 como máximo en escritorio, 1,5 en móvil. */
    pixelRatio() { return Math.min(window.devicePixelRatio || 1, movil() ? 1.5 : 2); },
    /** Sin antialiasing nativo en móvil (cuesta mucho y apenas se nota). */
    antialias() { return !movil(); },
    /** Tamaño del mapa de sombras según el dispositivo. */
    sombra(max) { return movil() ? Math.min(max, 2048) : max; },

    /** Junta en una sola malla las piezas de un grupo que comparten material y sombras. Respeta la ficha del grupo. */
    fusionar(raiz) {
      if (!THREE_ || !merge || !raiz) return 0;
      raiz.updateMatrixWorld(true);
      const inv = new THREE_.Matrix4().copy(raiz.matrixWorld).invert();
      const piezas = [];
      raiz.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && !o.geometry.attributes.color && !o.userData.noFusionar) piezas.push(o); });
      if (piezas.length < 4) return 0;
      const grupos = new Map();
      for (const m of piezas) {
        const k = m.material.uuid + (m.castShadow ? 'c' : '') + (m.receiveShadow ? 'r' : '') + '|' + (m.renderOrder || 0) + '|' + m.visible;
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(m);
      }
      let quitadas = 0;
      for (const lista of grupos.values()) {
        if (lista.length < 2) continue;
        const geos = [];
        for (const m of lista) {
          const g = normalizar(m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone());
          g.applyMatrix4(new THREE_.Matrix4().multiplyMatrices(inv, m.matrixWorld));
          geos.push(g);
        }
        const unida = merge(geos, false);
        geos.forEach((g) => g.dispose());
        if (!unida) continue;
        const nm = new THREE_.Mesh(unida, lista[0].material);
        nm.castShadow = lista[0].castShadow; nm.receiveShadow = lista[0].receiveShadow; nm.renderOrder = lista[0].renderOrder; nm.visible = lista[0].visible;
        raiz.add(nm);
        for (const m of lista) { if (m.parent) m.parent.remove(m); quitadas++; }
      }
      return quitadas;
    },

    /** Fusiona cada grupo con ficha (un elemento del modelo) que no contenga nada dinámico. */
    fusionarEstaticos(raiz, dinamicos) {
      if (!THREE_ || !merge) return 0;
      const dyn = new Set(dinamicos || []);
      const toca = (o) => { let hay = false; o.traverse((c) => { if (dyn.has(c)) hay = true; }); return hay; };
      const dentro = (o) => { for (let p = o; p; p = p.parent) if (dyn.has(p)) return true; return false; };
      const candidatos = [];
      raiz.traverse((o) => { if (o.isGroup && o !== raiz && o.userData && o.userData.nombre && !dentro(o) && !toca(o)) candidatos.push(o); });
      let n = 0;
      for (const g of candidatos) n += this.fusionar(g);
      return n;
    },

    /** Fija la matriz de todo lo que no está dentro de `dinamicos` (trenes, puertas, barreras que se abaten, partículas...). */
    congelar(raiz, dinamicos) {
      const dyn = new Set(dinamicos || []);
      const dentro = (o) => { for (let p = o; p; p = p.parent) if (dyn.has(p)) return true; return false; };
      raiz.updateMatrixWorld(true);
      let n = 0;
      raiz.traverse((o) => { if (o === raiz || o.isCamera || o.isLight || dentro(o)) return; o.matrixAutoUpdate = false; n++; });
      return n;
    }
  };
})();
