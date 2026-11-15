import * as THREE from 'three';

/*
 * Laguna del Salobrejo (Higueruela), a la derecha de la vía entre el PK 360+400 y el 361+700.
 * El MDT del IGN aplana la lámina de agua a 915,0 m; la cartografía de Adif solo trae trozos de orilla dentro de su franja.
 * Se dibuja como una lámina de agua a esa cota que el propio relieve recorta, con:
 *   - color según la profundidad (calculada una vez muestreando el terreno): orilla de barro y costra salina blanca,
 *     agua somera turquesa y agua más honda azul verdosa;
 *   - oleaje animado (mapa de normales procedural que se desplaza) y reflejos del cielo;
 *   - carrizo en la orilla.
 * Se construye perezosamente cuando la cámara se acerca (menos de 4 km).
 */

const NIVEL = 915.0;            // cota de la lámina en el MDT
const SOBRE = 0.32;             // la malla va un poco por encima del agua para pintar también la orilla
const PASO = 3;                 // m de la rejilla de profundidades

function texturaNormales() {
  // Ruido de ondas suave (suma de senos con fases pseudoaleatorias), en bucle para repetir sin costuras
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d'), img = x.createImageData(N, N);
  const ondas = Array.from({ length: 9 }, (_, i) => ({
    kx: Math.round(Math.cos(i * 2.4) * (2 + i)), ky: Math.round(Math.sin(i * 2.4) * (2 + i)), f: i * 1.7, a: 1 / (1 + i * 0.6),
  }));
  const h = (u, v) => ondas.reduce((s, o) => s + o.a * Math.sin(2 * Math.PI * (o.kx * u + o.ky * v) + o.f), 0);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N, e = 1 / N;
    const dx = (h(u + e, v) - h(u - e, v)) * 0.9, dy = (h(u, v + e) - h(u, v - e)) * 0.9;
    const l = Math.hypot(dx, dy, 1), k = (j * N + i) * 4;
    img.data[k] = (-dx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function crearLaguna({ escena, Eje3D, W, cotaTerrenoUTM }) {
  // Caja de la laguna en el marco de la vía: PK y desplazamiento a la derecha (+)
  const PK0 = 360400, PK1 = 361700, OF0 = 30, OF1 = 760;
  const centro = Eje3D.enPk((PK0 + PK1) / 2);
  const cE = centro.E + -centro.ty * 330, cN = centro.N + centro.tx * 330;
  let mesh = null, carrizo = null, normales = null, construyendo = false;

  function construir() {
    construyendo = true;
    // Rectángulo en UTM que abarca la caja de la laguna
    let E0 = Infinity, E1 = -Infinity, N0 = Infinity, N1 = -Infinity;
    for (const pk of [PK0, PK1]) for (const of of [OF0, OF1]) {
      const p = Eje3D.enPk(pk), E = p.E - p.ty * of, N = p.N + p.tx * of;
      E0 = Math.min(E0, E); E1 = Math.max(E1, E); N0 = Math.min(N0, N); N1 = Math.max(N1, N);
    }
    const nx = Math.ceil((E1 - E0) / PASO) + 1, ny = Math.ceil((N1 - N0) / PASO) + 1;
    // Profundidad bajo la lámina en cada nodo: positiva = agua, negativa = orilla seca
    const prof = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const E = E0 + i * PASO, N = N0 + j * PASO, q = Eje3D.proyUTM(E, N), m = Eje3D.enPk(q.pk);
      const lado = (E - m.E) * -m.ty + (N - m.N) * m.tx;   // > 0 a la derecha, el lado de la laguna
      const z = (lado > 8 && q.d > 8) ? cotaTerrenoUTM(E, N) : NIVEL + 50; // nunca sobre la plataforma de la vía
      prof[j * nx + i] = NIVEL - z;
    }
    // El MDT deja la lámina plana justo a la cota del agua: es agua todo lo que está a esa cota o por debajo.
    // La «profundidad» (para el color) se estima por la distancia a la orilla, con una transformada de distancia en 2 pasadas.
    const agua = new Uint8Array(nx * ny);
    for (let k = 0; k < agua.length; k++) agua[k] = prof[k] >= -0.06 ? 1 : 0;
    const dist = new Float32Array(nx * ny);       // dentro: distancia a la orilla; fuera: distancia al agua (m)
    const INF = 1e9, D1 = PASO, D2 = PASO * Math.SQRT2;
    for (let k = 0; k < dist.length; k++) dist[k] = INF;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      // Borde: nodo cuyo vecino es del otro tipo
      const v = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
        const ii = i + a, jj = j + b; return ii >= 0 && jj >= 0 && ii < nx && jj < ny && agua[jj * nx + ii] !== agua[k];
      });
      if (v) dist[k] = 0;
    }
    const pasada = (adelante) => {
      const js = adelante ? [0, ny, 1] : [ny - 1, -1, -1], is = adelante ? [0, nx, 1] : [nx - 1, -1, -1];
      const vec = adelante ? [[-1, 0, D1], [0, -1, D1], [-1, -1, D2], [1, -1, D2]] : [[1, 0, D1], [0, 1, D1], [1, 1, D2], [-1, 1, D2]];
      for (let j = js[0]; j !== js[1]; j += js[2]) for (let i = is[0]; i !== is[1]; i += is[2]) {
        const k = j * nx + i;
        for (const [a, b, c] of vec) {
          const ii = i + a, jj = j + b;
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
          const kk = jj * nx + ii;
          if (agua[kk] === agua[k] && dist[kk] + c < dist[k]) dist[k] = dist[kk] + c;
        }
      }
    };
    pasada(true); pasada(false);

    // Textura de color y alfa (una texel por nodo)
    const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
    const cx = cv.getContext('2d'), img = cx.createImageData(nx, ny);
    const mezcla = (a, b, t) => a.map((v, k) => v + (b[k] - v) * Math.min(1, Math.max(0, t)));
    const SAL = [226, 222, 206], BARRO = [118, 106, 84], ORILLA_AGUA = [92, 140, 128], SOMERA = [52, 112, 118], HONDA = [22, 62, 78];
    const orilla = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const kk = j * nx + i, d = prof[kk], r = dist[kk], k = ((ny - 1 - j) * nx + i) * 4;
      let c, a;
      if (agua[kk]) {
        // Agua: lámina somera y verdosa junto a la orilla, más honda y azul hacia el centro
        c = r < 6 ? mezcla(ORILLA_AGUA, SOMERA, r / 6) : mezcla(SOMERA, HONDA, (r - 6) / 70);
        a = 0.9 + 0.08 * Math.min(1, r / 30);
      } else if (r < 10 && d > -SOBRE) {
        // Orilla seca: costra salina blanca pegada al agua que pasa a barro
        c = mezcla(SAL, BARRO, r / 10); a = 0.92 * (1 - r / 10);
      } else { c = BARRO; a = 0; }
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = a * 255;
      // Carrizo a lo largo de la orilla (por fuera, a 2-9 m del agua), uno de cada pocos nodos
      if (!agua[kk] && r > 2 && r < 9 && d > -1.2 && ((i * 7 + j * 13) % 4 === 0)) orilla.push([E0 + i * PASO, N0 + j * PASO, NIVEL - d]);
    }
    cx.putImageData(img, 0, 0);
    const mapa = new THREE.CanvasTexture(cv); mapa.colorSpace = THREE.SRGBColorSpace;
    normales = texturaNormales();
    normales.repeat.set((E1 - E0) / 22, (N1 - N0) / 22);
    const mat = new THREE.MeshStandardMaterial({
      map: mapa, transparent: true, depthWrite: false, roughness: 0.14, metalness: 0.05,
      normalMap: normales, normalScale: new THREE.Vector2(0.3, 0.3), envMapIntensity: 0.7,
      polygonOffset: true, polygonOffsetFactor: -1,
    });
    const geo = new THREE.PlaneGeometry(E1 - E0, N1 - N0, 1, 1).rotateX(-Math.PI / 2);
    mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    mesh.userData = {
      capa: 'Entorno', nombre: 'Laguna del Salobrejo',
      info: 'Laguna salada endorreica de Higueruela. Lámina a 915,0 m (cota del MDT del IGN, que la aplana), recortada por el relieve. Supuesto: profundidad según el terreno, orilla de costra salina y carrizo.',
    };
    mesh.userData.anclaE = (E0 + E1) / 2; mesh.userData.anclaN = (N0 + N1) / 2;
    escena.add(mesh);

    // Carrizo: matas de cañas (conos finos) con altura y color variados
    if (orilla.length) {
      const gCana = new THREE.ConeGeometry(0.22, 1, 5, 1, true).translate(0, 0.5, 0);
      const mCana = new THREE.MeshStandardMaterial({ color: '#8a8f55', roughness: 0.9, side: THREE.DoubleSide });
      const n = Math.min(orilla.length * 3, 6000);
      carrizo = new THREE.InstancedMesh(gCana, mCana, n);
      carrizo.userData = { capa: 'Entorno', nombre: 'Carrizal de la orilla', info: 'Carrizo (Phragmites) en la orilla de la laguna. Supuesto.', origenes: [] };
      let s = 97; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const col = new THREE.Color(), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let k = 0; k < n; k++) {
        const o = orilla[k % orilla.length];
        const E = o[0] + (rnd() - 0.5) * PASO * 1.4, N = o[1] + (rnd() - 0.5) * PASO * 1.4, alto = 1.2 + rnd() * 1.4;
        carrizo.userData.origenes.push([E, N, o[2] - 0.1, alto, rnd() * 6.28, (rnd() - 0.5) * 0.25]);
        col.setHSL(0.15 + rnd() * 0.05, 0.35 + rnd() * 0.15, 0.32 + rnd() * 0.14);
        carrizo.setColorAt(k, col);
        e.set(carrizo.userData.origenes[k][5], carrizo.userData.origenes[k][4], 0); q.setFromEuler(e);
        mtx.compose(new THREE.Vector3(), q, new THREE.Vector3(1, alto, 1));
        carrizo.setMatrixAt(k, mtx);
      }
      escena.add(carrizo);
    }
    colocar();
    construyendo = false;
  }

  const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
  let origenPrevio = null;
  function colocar() {
    if (!mesh) return;
    mesh.position.copy(W(mesh.userData.anclaE, mesh.userData.anclaN, NIVEL + SOBRE));
    if (carrizo) {
      // Las matas van en coordenadas de mundo: se recolocan si el origen flotante ha cambiado
      const o0 = W(0, 0, 0);
      if (origenPrevio && origenPrevio.equals(o0)) return;
      origenPrevio = o0.clone();
      carrizo.userData.origenes.forEach((o, k) => {
        _v.copy(W(o[0], o[1], o[2])); _e.set(o[5], o[4], 0); _q.setFromEuler(_e); _s.set(1, o[3], 1);
        _m.compose(_v, _q, _s); carrizo.setMatrixAt(k, _m);
      });
      carrizo.instanceMatrix.needsUpdate = true;
      carrizo.computeBoundingSphere();
    }
  }

  function actualizar(dt, utmCamara) {
    if (!mesh) {
      if (!construyendo && utmCamara && Math.hypot(utmCamara.E - cE, utmCamara.N - cN) < 4000) {
        construyendo = true;
        (window.requestIdleCallback || ((f) => setTimeout(f, 60)))(construir);
      }
      return;
    }
    colocar();
    // Oleaje: el mapa de normales se desplaza despacio con el viento
    normales.offset.x += dt * 0.012; normales.offset.y += dt * 0.007;
  }

  return { actualizar };
}
