import * as THREE from 'three';

const MAX_HUECOS = 24;
const U_HUECOS = { value: Array.from({ length: MAX_HUECOS }, () => new THREE.Matrix4()) };
const U_N_HUECOS = { value: 0 };

/**
 * Inyecta recorte de cajas de hueco en el shader de un material de terreno
 * (necesario para pasos inferiores y bocas de túnel).
 */
export function conHuecos(material) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uHuecos = U_HUECOS;
    sh.uniforms.uNHuecos = U_N_HUECOS;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosHueco;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvPosHueco = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vPosHueco;
uniform mat4 uHuecos[${MAX_HUECOS}];
uniform int uNHuecos;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
for (int i = 0; i < ${MAX_HUECOS}; i++) {
  if (i >= uNHuecos) break;
  vec3 q = (uHuecos[i] * vec4(vPosHueco, 1.0)).xyz;
  if (abs(q.x) < 0.5 && abs(q.y) < 0.5 && abs(q.z) < 0.5) discard;
}`);
  };
  material.customProgramCacheKey = () => 'huecos-terreno';
  return material;
}

export const TAM_BLOQUE = 480;
const PASO_BLOQUE = 10;

const tonosTierra = ['#b79b70', '#aa8d63', '#c1a77e', '#9c8a5c', '#8b8f61'].map((c) => new THREE.Color(c));
const colRoca = new THREE.Color('#978c7a'), colMonte = new THREE.Color('#747b52'), colPinar = new THREE.Color('#556640');
const tmpCol = new THREE.Color();
export const hash2 = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };

export function crearTerreno({
  escena, Eje3D, MdtCorredor, HashCotas, Ortofoto3D,
  W, UTMdeMundo, camara,
  matTerrenoTopo, matTerrenoRegional,
  PK_TERMINAL, VIADUCTOS_REALES,
  esGpuSoftware, getOrtofotoActiva, programarRepintadoPausa,
}) {
  const grupoTerrenoMalla = new THREE.Group();
  escena.add(grupoTerrenoMalla);
  const bloquesTerreno = new Map();
  const colaBloques = new Set();

  let pasosInfTerreno = [];
  const HUECOS = [];
  let rayosXActivo = false;
  let mallaRegional = null, bxRegPrev = -1e9, byRegPrev = -1e9;
  let bxObsActual = 0, byObsActual = 0;
  let genOrto = 0; // generación de la fuente de ortofoto; sube en cada reiniciarOrtofoto()

  function setPasosInfTerreno(pasos) { pasosInfTerreno = pasos; }
  function registrarHuecos(lista) { for (const h of lista) HUECOS.push(h); }

  function fondoPasoInferior(E, N, q) {
    for (const pi of pasosInfTerreno) {
      if (Math.abs(q.pk - pi.pk) > pi.ancho / 2 + 12) continue;
      const dE = E - pi.E, dN = N - pi.N;
      const sEje = dE * pi.ax + dN * pi.ay, lat = dE * pi.tx + dN * pi.ty;
      const hw = pi.ancho / 2;
      if (sEje >= -pi.finIzq - 2.0 && sEje <= pi.finDer + 2.0) {
        if (Math.abs(lat) <= hw + 0.35) return pi.suelo - 0.08;
      }
    }
    return null;
  }

  function bloqueTieneObraFina(E0, N0) {
    const E1 = E0 + TAM_BLOQUE, N1 = N0 + TAM_BLOQUE, pad = 28;
    for (const pi of pasosInfTerreno) {
      if (pi.E >= E0 - pad && pi.E <= E1 + pad && pi.N >= N0 - pad && pi.N <= N1 + pad) return true;
    }
    for (const t of Eje3D.tuneles) {
      for (const pkB of [t.pkIni, t.pkFin]) {
        const m = Eje3D.enPk(pkB);
        if (m.E >= E0 - pad && m.E <= E1 + pad && m.N >= N0 - pad && m.N <= N1 + pad) return true;
      }
    }
    return false;
  }

  function cotaTerrenoUTM(E, N) {
    const q = Eje3D.proyUTM(E, N);
    if (pasosInfTerreno.length) { const zF = fondoPasoInferior(E, N, q); if (zF !== null) return zF; }
    if (q.pk > PK_TERMINAL && q.pk < Eje3D.pkFin - 190 && q.of > -82 && q.of < 86) {
      const zM = MdtCorredor.cota(E, N);
      return Math.min(zM !== null ? zM : q.Z, q.Z - 0.5);
    }
    const mDxf = q.d < 210 ? HashCotas.interpolar(E, N) : null;
    const zMdt = MdtCorredor.cota(E, N);
    const zBasePaisaje = zMdt !== null ? zMdt : (q.Z - 0.56);
    const zNat = mDxf ? mDxf.z * mDxf.confianza + zBasePaisaje * (1 - mDxf.confianza) : zBasePaisaje;

    if (q.enTunel) {
      const { pkIni, pkFin } = q.enTunel;
      const dBoca = Math.min(q.pk - pkIni, pkFin - q.pk);
      const cobMin = 9.65 + 16 * Math.min(1, Math.max(0, dBoca / 95));
      if (q.d <= 13.5) return Math.max(zNat, q.Z + cobMin);
      if (q.d < 40) {
        const k = (q.d - 13.5) / 26.5, s = k * k * (3 - 2 * k);
        return Math.max(zNat, q.Z + cobMin) * (1 - s) + zNat * s;
      }
      return zNat;
    }
    for (const t of Eje3D.tuneles) {
      const dFuera = q.pk < t.pkIni ? t.pkIni - q.pk : q.pk > t.pkFin ? q.pk - t.pkFin : 999;
      if (dFuera <= 48 && q.d < 11.5) {
        const k = Math.min(1, Math.max(0, (q.d - 7.8) / 3.7));
        const s = k * k * (3 - 2 * k);
        return (q.Z - 0.56) * (1 - s) + Math.max(zNat, q.Z + 2.6) * s;
      }
    }
    if (q.enViaducto) {
      const [va, vb] = q.enViaducto;
      const vr = VIADUCTOS_REALES.get(va);
      if (vr || MdtCorredor.tieneFina(Math.floor(E / TAM_BLOQUE), Math.floor(N / TAM_BLOQUE))) {
        const fondo = vr ? vr.cotaFondo : 3.10;
        return q.d < 9 ? Math.min(zNat, q.Z - fondo - 0.6) : zNat;
      }
      const dEst = Math.min(q.pk - va, vb - q.pk);
      if (dEst > 8) {
        const profMin = Math.min(15, 3.8 + dEst * 0.16);
        return Math.min(zNat, q.Z - profMin);
      }
    }
    if (q.d <= 7.4) return q.Z - 0.56;
    if (q.d < 24.4) {
      const u = (q.d - 7.4) / 17.0, s = u * u * (3 - 2 * u);
      return (q.Z - 0.56) * (1 - s) + zNat * s;
    }
    return zNat;
  }

  function actualizarMaterialBloque(entry) {
    if (!entry) return;
    if (getOrtofotoActiva() && entry.texOrto) {
      if (!entry.matOrto) {
        entry.matOrto = conHuecos(new THREE.MeshStandardMaterial({
          map: entry.texOrto,
          roughness: 0.96,
          metalness: 0.0,
          side: THREE.DoubleSide,
        }));
      }
      entry.matOrto.transparent = rayosXActivo;
      entry.matOrto.opacity = rayosXActivo ? 0.42 : 1;
      entry.matOrto.depthWrite = !rayosXActivo;
      entry.matOrto.needsUpdate = true;
      entry.mesh.material = entry.matOrto;
    } else {
      entry.mesh.material = matTerrenoTopo;
    }
  }

  function construirBloqueTerreno(bx, by, esCentral = true) {
    const clave = `${bx}|${by}`;
    const viejo = bloquesTerreno.get(clave);
    const texOrtoPrevia = viejo?.texOrto || null;
    const matOrtoPrevia = viejo?.matOrto || null;
    if (viejo) {
      grupoTerrenoMalla.remove(viejo.mesh);
      viejo.mesh.geometry.dispose();
    }

    const E0 = bx * TAM_BLOQUE, N0 = by * TAM_BLOQUE;
    const fino = MdtCorredor.tieneFina(bx, by) && Boolean(esCentral);
    const obraFina = Boolean(esCentral) && bloqueTieneObraFina(E0, N0);
    const PASO = obraFina ? 2 : fino ? 5 : PASO_BLOQUE;
    const nx = TAM_BLOQUE / PASO + 1, ny = nx;
    const Z = new Float32Array(nx * ny);
    let zSuma = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const zv = cotaTerrenoUTM(E0 + i * PASO, N0 + j * PASO);
      Z[j * nx + i] = zv; zSuma += zv;
    }
    const anclaE = E0 + TAM_BLOQUE * 0.5, anclaN = N0 + TAM_BLOQUE * 0.5, anclaZ = zSuma / (nx * ny);
    const pos = new Float32Array(nx * ny * 3), uv = new Float32Array(nx * ny * 2), col = new Float32Array(nx * ny * 3);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, E = E0 + i * PASO, N = N0 + j * PASO, z = Z[k];
      pos[k * 3] = E - anclaE; pos[k * 3 + 1] = z - anclaZ; pos[k * 3 + 2] = -(N - anclaN);
      uv[k * 2] = i / (nx - 1);
      uv[k * 2 + 1] = j / (ny - 1);
      const gx = (Z[j * nx + Math.min(nx - 1, i + 1)] - Z[j * nx + Math.max(0, i - 1)]) / (2 * PASO);
      const gy = (Z[Math.min(ny - 1, j + 1) * nx + i] - Z[Math.max(0, j - 1) * nx + i]) / (2 * PASO);
      const pend = Math.hypot(gx, gy);
      const r = (Math.sin(E * 0.025) + Math.sin(N * 0.031 + 1) + Math.sin((E + N) * 0.017 + 2)) / 6 + 0.5;
      const parc = hash2(Math.floor((E + 0.4 * N) / 85), Math.floor((N - 0.3 * E) / 70));
      tmpCol.copy(tonosTierra[Math.min(4, Math.floor((r * 0.5 + parc * 0.5) * 5))]);
      if (pend > 0.28) tmpCol.lerp(colRoca, Math.min(1, (pend - 0.28) / 0.42));
      else if (r > 0.56) tmpCol.lerp(colMonte, 0.34);
      if (z > 520 && pend > 0.1 && pend < 0.48) tmpCol.lerp(colPinar, 0.32);
      tmpCol.multiplyScalar(1 - Math.min(0.28, pend * 0.35));
      col[k * 3] = tmpCol.r; col[k * 3 + 1] = tmpCol.g; col[k * 3 + 2] = tmpCol.b;
    }
    const idx = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, matTerrenoTopo);
    mesh.receiveShadow = true;
    mesh.position.copy(W(anclaE, anclaN, anclaZ));
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.userData = {
      capa: 'Terreno',
      nombre: fino ? 'Terreno real PNOA-LiDAR 5 m + Adif' : 'Terreno real PNOA-LiDAR + Adif',
      info: fino
        ? 'Superficie combinada de la cartografía 3D de Adif junto a la vía y el MDT05 LiDAR (malla de 5 m) + ortofoto PNOA del Instituto Geográfico Nacional (CC BY 4.0).'
        : 'Superficie combinada de la cartografía 3D de Adif junto a la vía y el MDT25 LiDAR + ortofoto PNOA del Instituto Geográfico Nacional (CC BY 4.0).',
    };
    grupoTerrenoMalla.add(mesh);

    const zoomBase = esCentral === 2 && !esGpuSoftware ? 18 : esCentral ? 17 : 16;
    const zoomDeseado = fino && esCentral && !esGpuSoftware ? zoomBase + 1 : zoomBase;

    // La entrada nueva hereda la descarga en vuelo del bloque viejo (su .then la resuelve
    // sobre bloquesTerreno.get(clave)), para no pedir dos veces la misma ortofoto.
    const entry = {
      bx, by, anclaE, anclaN, anclaZ, mesh, fino, texOrto: texOrtoPrevia, matOrto: matOrtoPrevia,
      zoomOrto: viejo?.zoomOrto || 0, cargandoOrto: viejo?.cargandoOrto || false, zoomOrtoDeseado: zoomDeseado,
    };
    bloquesTerreno.set(clave, entry);
    actualizarMaterialBloque(entry);

    if (getOrtofotoActiva() && entry.zoomOrto < zoomDeseado && !entry.cargandoOrto) {
      entry.cargandoOrto = true;
      const gen = genOrto;
      // Respuesta de una fuente anterior (reiniciarOrtofoto la saltó): se vuelve a pedir.
      const reencolarSiObsoleta = () => {
        if (gen === genOrto) return false;
        if (getOrtofotoActiva()) colaBloques.add(clave);
        return true;
      };
      Ortofoto3D.generarTexturaBloque(E0, N0, TAM_BLOQUE, zoomDeseado).then((tex) => {
        const act = bloquesTerreno.get(clave);
        if (!act) { if (tex) tex.dispose(); return; }
        act.cargandoOrto = false;
        if (reencolarSiObsoleta()) { if (tex) tex.dispose(); return; }
        if (!tex) return;
        if (act.texOrto) act.texOrto.dispose();
        act.texOrto = tex;
        act.zoomOrto = zoomDeseado;
        if (act.matOrto) { act.matOrto.map = tex; act.matOrto.needsUpdate = true; }
        actualizarMaterialBloque(act);
        programarRepintadoPausa();
        // Si mientras volaba el bloque pasó a querer más zoom (se reconstruyó más cerca), se vuelve a pedir.
        if (act.zoomOrtoDeseado > act.zoomOrto && getOrtofotoActiva()) colaBloques.add(clave);
      }).catch((err) => {
        console.warn('Ortofoto del bloque', clave, err);
        const act = bloquesTerreno.get(clave);
        if (!act) return;
        act.cargandoOrto = false;
        reencolarSiObsoleta();
      });
    }
  }

  function actualizarMallaRegional(bx0, by0) {
    if (bx0 === bxRegPrev && by0 === byRegPrev && mallaRegional) return;
    bxRegPrev = bx0; byRegPrev = by0;
    const PASO_P = 300, R_N = 34;
    const covMinE = (bx0 - 2) * TAM_BLOQUE, covMaxE = (bx0 + 3) * TAM_BLOQUE;
    const covMinN = (by0 - 2) * TAM_BLOQUE, covMaxN = (by0 + 3) * TAM_BLOQUE;
    const eBase = Math.round(((covMinE + covMaxE) * 0.5) / PASO_P) * PASO_P;
    const nBase = Math.round(((covMinN + covMaxN) * 0.5) / PASO_P) * PASO_P;
    const nx = R_N * 2 + 1, ny = nx;
    const Z = new Float32Array(nx * ny);
    let zSum = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const E = eBase + (i - R_N) * PASO_P, N = nBase + (j - R_N) * PASO_P;
      let z = MdtCorredor.cota(E, N);
      if (z === null) z = Eje3D.proyUTM(E, N).Z - 8;
      const penE = Math.min(E - (covMinE - 40), (covMaxE + 40) - E);
      const penN = Math.min(N - (covMinN - 40), (covMaxN + 40) - N);
      const pen = Math.min(penE, penN);
      if (pen > 0) {
        const t = Math.min(1, pen / 480);
        z -= 12 * t * t;
      }
      Z[j * nx + i] = z; zSum += z;
    }
    const anclaZ = zSum / (nx * ny);
    const pos = new Float32Array(nx * ny * 3), col = new Float32Array(nx * ny * 3);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, E = eBase + (i - R_N) * PASO_P, N = nBase + (j - R_N) * PASO_P, z = Z[k];
      pos[k * 3] = E - eBase; pos[k * 3 + 1] = z - anclaZ; pos[k * 3 + 2] = -(N - nBase);
      const gx = (Z[j * nx + Math.min(nx - 1, i + 1)] - Z[j * nx + Math.max(0, i - 1)]) / (2 * PASO_P);
      const gy = (Z[Math.min(ny - 1, j + 1) * nx + i] - Z[Math.max(0, j - 1) * nx + i]) / (2 * PASO_P);
      const pend = Math.hypot(gx, gy);
      tmpCol.set('#a89371');
      if (pend > 0.16) tmpCol.lerp(colMonte, Math.min(0.68, (pend - 0.16) * 2.1));
      if (pend > 0.34) tmpCol.lerp(colRoca, Math.min(0.75, (pend - 0.34) * 2.2));
      if (z > 760) tmpCol.lerp(colPinar, Math.min(0.45, (z - 760) / 500));
      col[k * 3] = tmpCol.r; col[k * 3 + 1] = tmpCol.g; col[k * 3 + 2] = tmpCol.b;
    }
    const idx = [];
    const hMinE = covMinE + 560, hMaxE = covMaxE - 560;
    const hMinN = covMinN + 560, hMaxN = covMaxN - 560;
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const Em = eBase + (i + 0.5 - R_N) * PASO_P, Nm = nBase + (j + 0.5 - R_N) * PASO_P;
      if (Em > hMinE && Em < hMaxE && Nm > hMinN && Nm < hMaxN) continue;
      const a = j * nx + i;
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    if (mallaRegional) { escena.remove(mallaRegional.mesh); mallaRegional.mesh.geometry.dispose(); }
    const mesh = new THREE.Mesh(g, matTerrenoRegional);
    mesh.position.copy(W(eBase, nBase, anclaZ));
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.visible = !rayosXActivo;
    escena.add(mesh);
    mallaRegional = { anclaE: eBase, anclaN: nBase, anclaZ, mesh };
  }

  function invalidarTerrenoEnCaja(minE, minN, maxE, maxN) {
    const bxA = Math.floor((minE - 120) / TAM_BLOQUE), bxB = Math.floor((maxE + 120) / TAM_BLOQUE);
    const byA = Math.floor((minN - 120) / TAM_BLOQUE), byB = Math.floor((maxN + 120) / TAM_BLOQUE);
    for (let bx = bxA; bx <= bxB; bx++) for (let by = byA; by <= byB; by++) {
      const k = `${bx}|${by}`;
      if (bloquesTerreno.has(k)) colaBloques.add(k);
    }
  }

  function actualizarVentanaTerreno(centroE, centroN) {
    const bx0 = Math.floor(centroE / TAM_BLOQUE), by0 = Math.floor(centroN / TAM_BLOQUE);
    bxObsActual = bx0; byObsActual = by0;
    const R = 2;
    const orto = getOrtofotoActiva();
    for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) {
      const k = `${bx0 + dx}|${by0 + dy}`;
      const b = bloquesTerreno.get(k);
      if (!b) colaBloques.add(k);
      else if (orto && Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && b.zoomOrto < 17 && !b.cargandoOrto) {
        colaBloques.add(k);
      } else if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && !b.fino && MdtCorredor.tieneFina(b.bx, b.by)) {
        colaBloques.add(k);
      }
    }
    for (const [k, b] of bloquesTerreno) {
      if (Math.abs(b.bx - bx0) > R + 1 || Math.abs(b.by - by0) > R + 1) {
        grupoTerrenoMalla.remove(b.mesh);
        b.mesh.geometry.dispose();
        if (b.texOrto) b.texOrto.dispose();
        if (b.matOrto) b.matOrto.dispose();
        bloquesTerreno.delete(k);
        colaBloques.delete(k);
      }
    }
    MdtCorredor.asegurarEntorno(centroE, centroN, (minE, minN, maxE, maxN) => invalidarTerrenoEnCaja(minE, minN, maxE, maxN));
    actualizarMallaRegional(bx0, by0);
  }

  const mTmpHueco = new THREE.Matrix4(), vXH = new THREE.Vector3(), vYH = new THREE.Vector3(0, 1, 0), vZH = new THREE.Vector3();
  const vXHs = new THREE.Vector3(), vYHs = new THREE.Vector3(), vZHs = new THREE.Vector3();
  function actualizarHuecos() {
    const camU = UTMdeMundo(camara.position);
    const cerca = HUECOS
      .map((h) => ({ h, d: Math.hypot(h.E - camU.E, h.N - camU.N) }))
      .filter((x) => x.d < 2500)
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_HUECOS);
    cerca.forEach(({ h }, i) => {
      vXH.set(h.ax, 0, -h.ay).normalize();
      vZH.crossVectors(vXH, vYH).normalize();
      const c = W(h.E, h.N, (h.z0 + h.z1) / 2);
      vXHs.copy(vXH).multiplyScalar(h.largo);
      vYHs.copy(vYH).multiplyScalar(h.z1 - h.z0);
      vZHs.copy(vZH).multiplyScalar(h.ancho);
      mTmpHueco.makeBasis(vXHs, vYHs, vZHs);
      mTmpHueco.setPosition(c);
      U_HUECOS.value[i].copy(mTmpHueco).invert();
    });
    U_N_HUECOS.value = cerca.length;
  }

  function procesarColaTerreno(soloCercanos = false) {
    if (!colaBloques.size) return;
    for (const k of [...colaBloques]) {
      const [bx, by] = k.split('|').map(Number);
      const dMax = Math.max(Math.abs(bx - bxObsActual), Math.abs(by - byObsActual));
      if (soloCercanos && dMax > 1) continue;
      colaBloques.delete(k);
      construirBloqueTerreno(bx, by, dMax === 0 ? 2 : dMax <= 1 ? 1 : 0);
    }
  }

  function procesarUnBloque() {
    if (!colaBloques.size) return;
    const k = colaBloques.values().next().value;
    colaBloques.delete(k);
    const [bx, by] = k.split('|').map(Number);
    const dMax = Math.max(Math.abs(bx - bxObsActual), Math.abs(by - byObsActual));
    construirBloqueTerreno(bx, by, dMax === 0 ? 2 : dMax <= 1 ? 1 : 0);
  }

  function reubicarTerreno() {
    for (const b of bloquesTerreno.values()) {
      b.mesh.position.copy(W(b.anclaE, b.anclaN, b.anclaZ));
      b.mesh.updateMatrix();
    }
    if (mallaRegional) {
      mallaRegional.mesh.position.copy(W(mallaRegional.anclaE, mallaRegional.anclaN, mallaRegional.anclaZ));
      mallaRegional.mesh.updateMatrix();
    }
  }

  function setRayosX(activo) {
    rayosXActivo = activo;
    matTerrenoTopo.transparent = rayosXActivo;
    matTerrenoTopo.opacity = rayosXActivo ? 0.34 : 1;
    matTerrenoTopo.depthWrite = !rayosXActivo;
    matTerrenoTopo.needsUpdate = true;
    if (mallaRegional) mallaRegional.mesh.visible = !rayosXActivo;
    for (const b of bloquesTerreno.values()) actualizarMaterialBloque(b);
  }

  function reiniciarOrtofoto() {
    const orto = getOrtofotoActiva();
    genOrto++;
    // Los bloques con descarga en vuelo no se encolan aquí: al llegar, su respuesta (ya obsoleta)
    // se descarta y el propio bloque se vuelve a encolar, sin duplicar descargas.
    for (const [k, b] of bloquesTerreno) {
      if (b.texOrto) { b.texOrto.dispose(); b.texOrto = null; }
      if (b.matOrto) { b.matOrto.dispose(); b.matOrto = null; }
      b.zoomOrto = 0;
      actualizarMaterialBloque(b);
      if (orto && !b.cargandoOrto) colaBloques.add(k);
    }
  }

  return {
    grupoTerrenoMalla,
    bloquesTerreno,
    setPasosInfTerreno,
    registrarHuecos,
    cotaTerrenoUTM,
    actualizarVentanaTerreno,
    invalidarTerrenoEnCaja,
    actualizarHuecos,
    procesarColaTerreno,
    procesarUnBloque,
    reubicarTerreno,
    setRayosX,
    reiniciarOrtofoto,
  };
}
