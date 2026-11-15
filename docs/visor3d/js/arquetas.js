import * as THREE from 'three';
import { lonlatAUTM } from './proyeccion.js';

/*
 * Arquetas de fibra óptica del listado «Tramos Arquetas ALBALI v1» (datos/albali/arquetas.json, generado por
 * scripts/importar-arquetas.py). Son las únicas arquetas que se dibujan: cámara de hormigón, tapa galvanizada y un hito
 * de balizamiento con el color de su función (verde empalme, ámbar segregación, violeta empalme y segregación).
 * Las que comparten PK y vía van adosadas. Al pulsar una se muestra su PK, lado de vía, función y cable.
 */
const COLOR = { 'Empalme': '#16a34a', 'Segregación': '#f59e0b', 'Empalme y segregación': '#8b5cf6' };

export function crearArquetas({ escena, Eje3D, W, cotaTerrenoUTM, datos }) {
  const grupo = new THREE.Group();
  grupo.name = 'Arquetas de fibra óptica';
  escena.add(grupo);
  const lista = (datos?.arquetas || []).map((a) => {
    let E, N;
    if (a.lon != null) [E, N] = lonlatAUTM(a.lon, a.lat);
    else { const m = Eje3D.enPk(a.pkReal); E = m.E - m.ty * a.of; N = m.N + m.tx * a.of; }
    // Adosadas: una junto a otra a lo largo de la vía
    const m = Eje3D.enPk(a.pkReal);
    const desp = (a.adosada - (a.nAdosadas - 1) / 2) * 0.95;
    E += m.tx * desp; N += m.ty * desp;
    // A ras de la superficie que dibuja el visor (junto a la vía la plataforma queda por encima de la cota de la cartografía)
    const zSup = cotaTerrenoUTM(E, N);
    const z = Number.isFinite(a.z) && a.z > 5 ? Math.max(a.z, zSup) : zSup;
    return { ...a, E, N, Z: z, giro: Math.atan2(m.ty, m.tx) };
  });
  if (!lista.length) return { grupo, actualizar() {} };

  const ancla = { E: lista[0].E, N: lista[0].N, Z: lista[0].Z };
  // Cámara a ras de la canaleta de cables (su tapa asoma 0,3 m sobre el terreno, como el borde de la canaleta)
  const gCamara = new THREE.BoxGeometry(1.2, 0.55, 0.9).translate(0, 0.02, 0);
  const gTapa = new THREE.BoxGeometry(1.0, 0.04, 0.7).translate(0, 0.31, 0);
  const gHito = new THREE.CylinderGeometry(0.05, 0.05, 0.75, 10).translate(0.7, 0.62, 0.5);
  const mCamara = new THREE.MeshStandardMaterial({ color: '#a7a9a5', roughness: 0.9 });
  const mTapa = new THREE.MeshStandardMaterial({ color: '#6b7178', roughness: 0.45, metalness: 0.7 });
  const mHito = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, emissive: '#ffffff', emissiveIntensity: 0.25 });
  const iCamara = new THREE.InstancedMesh(gCamara, mCamara, lista.length);
  const iTapa = new THREE.InstancedMesh(gTapa, mTapa, lista.length);
  const iHito = new THREE.InstancedMesh(gHito, mHito, lista.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), uno = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), col = new THREE.Color();
  lista.forEach((a, i) => {
    q.setFromEuler(e.set(0, a.giro, 0));
    mtx.compose(p.set(a.E - ancla.E, a.Z - ancla.Z, -(a.N - ancla.N)), q, uno);
    iCamara.setMatrixAt(i, mtx); iTapa.setMatrixAt(i, mtx); iHito.setMatrixAt(i, mtx);
    iHito.setColorAt(i, col.set(COLOR[a.funcion] || '#94a3b8'));
  });
  for (const im of [iCamara, iTapa, iHito]) {
    im.userData = { arquetas: lista };
    im.computeBoundingSphere();
    grupo.add(im);
  }

  function actualizar() { grupo.position.copy(W(ancla.E, ancla.N, ancla.Z)); }
  actualizar();
  return { grupo, lista, actualizar };
}

/** Texto de la ficha de una arqueta del listado. */
export function fichaArqueta(a, fmtPk) {
  const pkListado = `${Math.floor(a.pk / 1000)},${Math.round((a.pk % 1000) / 100)}`;
  const ados = a.nAdosadas > 1 ? ` Adosada a otra arqueta en el mismo PK (${a.adosada + 1} de ${a.nAdosadas}).` : '';
  const encaje = a.encaje === 'cartografia'
    ? 'Situada en la arqueta de canaleta de la cartografía de Adif más próxima a su PK.'
    : 'Sin arqueta en la cartografía en esa centena: posición supuesta en su PK teórico.';
  return {
    capa: 'Arqueta de fibra óptica',
    nombre: `${a.codigo} · ${a.funcion}`,
    info: `PK ${fmtPk(a.pkReal)} (listado: PK ${pkListado}) · Vía ${a.via}, lado ${a.lado} (supuesto: vía 1 a la derecha en sentido de PK creciente) · `
      + `${a.funcion} · Cable de ${a.fibras} fibras.${ados} ${encaje}`,
  };
}
