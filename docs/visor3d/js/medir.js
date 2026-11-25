import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/*
 * Medición sobre el modelo 3D: se pulsan dos puntos de la escena y la tarjeta da la distancia en el espacio, la horizontal, el
 * desnivel (si un punto está sobre el otro, es el gálibo vertical) y la diferencia de PK. Cada extremo dice de qué fuente sale
 * (js/origen.js): una medida sobre terreno LiDAR, sobre un elemento supuesto o simulado no vale como medida de obra y se marca.
 *
 * Los extremos se guardan en UTM y se recolocan cada fotograma, porque la escena se recentra mientras se vuela por la línea.
 */
const COLOR = 0x22d3ee;
const fmtM = (v, d = 2) => `${v.toFixed(d).replace('.', ',')} m`;
const FIABLES = new Set(['adif', 'fuente']);

export function crearMedidor({ camara, escena, W, UTMdeMundo, Eje3D, fmtPk, origenDe, CLASES, panelAnuncios }) {
  const puntos = [];            // { E, N, Z, pk, cota, clase, fuente }
  let activa = false;
  const grupo = new THREE.Group();
  grupo.visible = false;
  escena.add(grupo);

  const mat = new THREE.MeshBasicMaterial({ color: COLOR, depthTest: false, transparent: true });
  const matLinea = new THREE.LineBasicMaterial({ color: COLOR, depthTest: false, transparent: true });
  const bolas = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), mat);
    m.renderOrder = 998; m.frustumCulled = false; m.visible = false; m.raycast = () => {};
    grupo.add(m);
    return m;
  });
  const geoLinea = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const linea = new THREE.Line(geoLinea, matLinea);
  linea.renderOrder = 998; linea.frustumCulled = false; linea.visible = false; linea.raycast = () => {};
  grupo.add(linea);
  const etqEl = document.createElement('div');
  etqEl.className = 'etq-medida';
  const etq = new CSS2DObject(etqEl);
  etq.visible = false;
  grupo.add(etq);

  // Tarjeta de resultados
  const tarjeta = document.createElement('aside');
  tarjeta.id = 'medidor';
  tarjeta.hidden = true;
  tarjeta.setAttribute('aria-label', 'Medición');
  tarjeta.innerHTML = `
    <div class="f-cab"><strong>Medir</strong>
      <button type="button" class="f-btn" data-m="salir" aria-label="Salir de la medición (Esc)" title="Salir (Esc)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
    <p class="m-guia"></p>
    <dl class="m-res" hidden></dl>
    <ul class="m-pts"></ul>
    <p class="m-aviso" hidden></p>
    <div class="acciones"><button type="button" data-m="copiar" disabled>Copiar</button><button type="button" data-m="borrar" disabled>Borrar</button></div>`;
  document.body.appendChild(tarjeta);
  const q = (s) => tarjeta.querySelector(s);

  function anunciar(t) { if (panelAnuncios) panelAnuncios.textContent = t; }

  function medidas() {
    const [a, b] = puntos;
    const dx = b.E - a.E, dy = b.N - a.N, dz = b.Z - a.Z;
    const hor = Math.hypot(dx, dy);
    return { d3: Math.hypot(hor, dz), hor, dz, dpk: Math.abs(b.pk - a.pk), a, b };
  }
  const texto = () => {
    if (puntos.length < 2) return '';
    const m = medidas();
    const sig = (v) => `${v >= 0 ? '+' : '−'}${fmtM(Math.abs(v))}`;
    return `Distancia ${fmtM(m.d3)} · horizontal ${fmtM(m.hor)} · desnivel ${sig(m.dz)} · diferencia de PK ${fmtM(m.dpk, 1)} (PK ${fmtPk(m.a.pk)} → ${fmtPk(m.b.pk)})`;
  };

  function pintar() {
    const guia = q('.m-guia'), res = q('.m-res'), lista = q('.m-pts'), aviso = q('.m-aviso');
    guia.textContent = puntos.length === 0 ? 'Pulsa el primer punto en la escena.' : puntos.length === 1 ? 'Pulsa el segundo punto.' : 'Pulsa otro punto para medir de nuevo.';
    res.replaceChildren();
    res.hidden = puntos.length < 2;
    if (puntos.length === 2) {
      const m = medidas();
      for (const [k, v] of [['Distancia', fmtM(m.d3)], ['Horizontal', fmtM(m.hor)], ['Desnivel', `${m.dz >= 0 ? '+' : '−'}${fmtM(Math.abs(m.dz))}`], ['Dif. de PK', fmtM(m.dpk, 1)]]) {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        res.append(dt, dd);
      }
    }
    lista.replaceChildren(...puntos.map((p, i) => {
      const li = document.createElement('li');
      const cl = CLASES[p.clase] || CLASES.sin;
      li.innerHTML = '<b></b><span></span>';
      li.children[0].textContent = i ? 'B' : 'A';
      li.children[1].textContent = `PK ${fmtPk(p.pk)} · cota ${fmtM(p.Z, 1)} (${fmtM(p.Z - p.cota, 1)} sobre el carril) · ${cl.etiqueta}: ${p.fuente}`;
      return li;
    }));
    const dudosos = puntos.filter((p) => !FIABLES.has(p.clase));
    aviso.hidden = puntos.length < 2;
    if (puntos.length === 2) {
      aviso.textContent = dudosos.length
        ? `Medida orientativa: ${dudosos.length === 2 ? 'los dos puntos están' : 'un punto está'} sobre un elemento deducido, supuesto, simulado o sin declarar.`
        : 'Medida sobre el modelo 3D: su exactitud es la de la fuente de cada punto (cartografía de Adif u otra fuente documentada), no la de un levantamiento.';
      aviso.classList.toggle('m-dudosa', dudosos.length > 0);
    }
    q('[data-m="copiar"]').disabled = puntos.length < 2;
    q('[data-m="borrar"]').disabled = puntos.length === 0;
  }

  function colocar() {
    for (let i = 0; i < 2; i++) {
      const p = puntos[i];
      bolas[i].visible = Boolean(p);
      if (p) {
        bolas[i].position.copy(W(p.E, p.N, p.Z));
        // Tamaño constante en pantalla: se escala con la distancia a la cámara
        bolas[i].scale.setScalar(THREE.MathUtils.clamp(bolas[i].position.distanceTo(camara.position) * 0.012, 0.2, 8) / 0.25 * 0.25);
      }
    }
    const hay = puntos.length === 2;
    linea.visible = hay; etq.visible = hay;
    if (hay) {
      const a = W(puntos[0].E, puntos[0].N, puntos[0].Z), b = W(puntos[1].E, puntos[1].N, puntos[1].Z);
      const pos = geoLinea.attributes.position;
      pos.setXYZ(0, a.x, a.y, a.z); pos.setXYZ(1, b.x, b.y, b.z); pos.needsUpdate = true;
      etq.position.copy(a).add(b).multiplyScalar(0.5);
      etqEl.textContent = fmtM(medidas().d3);
    }
  }

  function agregarHit(hit) {
    if (!hit) return;
    const u = UTMdeMundo(hit.point);
    const e = Eje3D.proyUTM(u.E, u.N);
    const og = hit.object?.userData?.nombre || hit.object?.userData?.capa ? origenDe(hit.object.userData) : { clase: 'sin', fuente: 'Punto sin ficha' };
    if (puntos.length >= 2) puntos.length = 0;
    puntos.push({ E: u.E, N: u.N, Z: u.Z, pk: e.pk, cota: e.Z, clase: og.clase, fuente: og.fuente });
    pintar(); colocar();
    if (puntos.length === 2) anunciar(texto());
  }

  function activar(on) {
    activa = typeof on === 'boolean' ? on : !activa;
    tarjeta.hidden = !activa;
    grupo.visible = activa;
    document.body.classList.toggle('midiendo', activa);
    if (activa) { puntos.length = 0; pintar(); colocar(); anunciar('Medición activada: pulsa dos puntos de la escena.'); } else anunciar('Medición desactivada.');
    return activa;
  }

  tarjeta.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    if (b.dataset.m === 'salir') activar(false);
    else if (b.dataset.m === 'borrar') { puntos.length = 0; pintar(); colocar(); }
    else if (b.dataset.m === 'copiar') {
      try { await navigator.clipboard.writeText(texto()); b.textContent = 'Copiado'; } catch { b.textContent = 'No se pudo copiar'; }
      setTimeout(() => { b.textContent = 'Copiar'; }, 1400);
    }
  });

  return {
    get activa() { return activa; },
    activar,
    agregarHit,
    /** Se llama cada fotograma: recoloca los extremos tras un recentrado del origen. */
    actualizar() { if (activa && puntos.length) colocar(); },
  };
}
