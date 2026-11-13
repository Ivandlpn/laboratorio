import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Catálogo de modelos hechos en Blender (scripts/blender/*.py -> public/comun/modelos/*.glb)
export function cargarCatalogoModelos(sinModelos = false) {
  const MODELOS = { poste: null, aislador: null, baculoCamara: null, casetaVia: null };

  async function cargarModelo(url) {
    try {
      const gltf = await new GLTFLoader().loadAsync(url);
      gltf.scene.updateMatrixWorld(true);
      const porMaterial = new Map();
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        const m = o.material;
        if (!porMaterial.has(m.name)) porMaterial.set(m.name, { mat: m, geos: [] });
        porMaterial.get(m.name).geos.push(g.index ? g.toNonIndexed() : g);
      });
      return [...porMaterial.values()].map(({ mat, geos }) => {
        const geo = mergeGeometries(geos, false);
        geos.forEach((g) => g.dispose());
        geo.userData.compartida = true;
        mat.side = THREE.FrontSide;
        return { geo, mat, nombre: mat.name };
      });
    } catch (err) {
      console.warn('Modelo no disponible, se usa el procedural:', url, err?.message || err);
      return null;
    }
  }

  const pModelos = sinModelos ? Promise.resolve() : Promise.all([
    cargarModelo('./comun/modelos/poste-catenaria.glb').then((m) => { MODELOS.poste = m; }),
    cargarModelo('./comun/modelos/aislador.glb').then((m) => { MODELOS.aislador = m; }),
    cargarModelo('./comun/modelos/baculo-camara.glb').then((m) => { MODELOS.baculoCamara = m; }),
    cargarModelo('./comun/modelos/caseta-via.glb').then((m) => { MODELOS.casetaVia = m; }),
  ]);

  return { MODELOS, pModelos };
}
