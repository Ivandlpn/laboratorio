import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { crearZip, aBytes } from './zip.js';

/*
 * Incidencias: se pulsa un punto de la escena, se escribe qué pasa y queda guardada EN ESTE NAVEGADOR (localStorage), con su PK,
 * el elemento señalado (y de qué fuente sale), la vista de la cámara y una foto. No se envía nada a ningún servidor.
 * Se exportan en BCF 2.1 (.bcfzip, lo abren BIMcollab, Solibri, Navisworks, usBIM…) o en JSON.
 *
 * BCF no lleva sistema de coordenadas: los puntos y la cámara van en UTM 30N ETRS89 (E, N, cota) y así se indica en cada tema.
 */
const CLAVE = 'visor3d.incidencias';
const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Crítica'];
const ESTADOS = ['Abierta', 'En curso', 'Cerrada'];
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
const esc = (t) => String(t ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

export function crearIncidencias({ camara, controles, render, escena, W, UTMdeMundo, Eje3D, fmtPk, panelAnuncios, enlaceActual, irAVista }) {
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(CLAVE) || '[]') || []; } catch { lista = []; }
  let activa = false, borrador = null;
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(lista)); return true; } catch { return false; } };
  const anunciar = (t) => { if (panelAnuncios) panelAnuncios.textContent = t; };

  // Marcas en la escena (pines), recolocadas cada fotograma por el recentrado del origen
  const grupo = new THREE.Group();
  escena.add(grupo);
  const matPin = new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false, transparent: true });
  const pines = new Map();   // id → { malla, etq }
  function pin(it) {
    if (pines.has(it.id)) return;
    const malla = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), matPin);
    malla.renderOrder = 997; malla.frustumCulled = false; malla.raycast = () => {};
    const el = document.createElement('div'); el.className = 'etq-incidencia';
    const etq = new CSS2DObject(el);
    malla.add(etq); etq.position.set(0, 1.2, 0);
    grupo.add(malla);
    pines.set(it.id, { malla, el });
  }

  const tarjeta = document.createElement('aside');
  tarjeta.id = 'incidencias';
  tarjeta.hidden = true;
  tarjeta.setAttribute('aria-label', 'Incidencias');
  document.body.appendChild(tarjeta);

  function pintar() {
    const cab = `<div class="f-cab"><strong>Incidencias <span class="i-n">${lista.length}</span></strong><button type="button" class="f-btn" data-i="cerrar" aria-label="Cerrar (Esc)" title="Cerrar (Esc)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>`;
    if (borrador) {
      tarjeta.innerHTML = `${cab}
        <p class="i-pk">PK ${fmtPk(borrador.pk)} · ${esc(borrador.elemento.nombre)} <small>(${esc(borrador.elemento.origen)})</small></p>
        <img class="i-foto" alt="Vista de la incidencia" src="${borrador.foto}">
        <label>Título<input type="text" data-i="titulo" maxlength="120" placeholder="Qué ocurre" autocomplete="off"></label>
        <label>Descripción<textarea data-i="desc" rows="3" maxlength="1000" placeholder="Detalles, qué hay que hacer…"></textarea></label>
        <label>Prioridad<select data-i="prio">${PRIORIDADES.map((p) => `<option ${p === 'Normal' ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
        <div class="acciones"><button type="button" data-i="guardar">Guardar</button><button type="button" data-i="cancelar">Cancelar</button></div>`;
      tarjeta.querySelector('[data-i=titulo]').focus({ preventScroll: true });
      return;
    }
    tarjeta.innerHTML = `${cab}
      <p class="i-guia">${activa ? 'Pulsa un punto de la escena para anotar una incidencia.' : ''}</p>
      <ul class="i-lista">${lista.length ? lista.map((it) => `<li data-id="${it.id}">
        <div><b>${esc(it.titulo || 'Sin título')}</b><small>PK ${fmtPk(it.pk)} · ${esc(it.prioridad)} · ${new Date(it.fecha).toLocaleDateString('es-ES')}</small></div>
        <select data-i="estado" aria-label="Estado">${ESTADOS.map((e) => `<option ${e === it.estado ? 'selected' : ''}>${e}</option>`).join('')}</select>
        <button type="button" data-i="ir" aria-label="Ir a la incidencia">Ir</button><button type="button" data-i="borrar" aria-label="Borrar la incidencia">Borrar</button></li>`).join('') : '<li class="i-vacia">Aún no hay incidencias.</li>'}</ul>
      <div class="acciones"><button type="button" data-i="bcf" ${lista.length ? '' : 'disabled'}>Exportar BCF</button><button type="button" data-i="json" ${lista.length ? '' : 'disabled'}>Exportar JSON</button></div>
      <p class="i-nota">Se guardan solo en este navegador. BCF lleva las coordenadas en UTM 30N ETRS89.</p>`;
  }

  function foto() {
    // Miniatura JPEG de la vista actual (pequeña, para no llenar el almacenamiento del navegador)
    render.render(escena, camara);
    const c = document.createElement('canvas');
    const k = 560 / render.domElement.width;
    c.width = 560; c.height = Math.round(render.domElement.height * k);
    c.getContext('2d').drawImage(render.domElement, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }

  function nuevaEn(hit) {
    if (!hit) return;
    const u = UTMdeMundo(hit.point), e = Eje3D.proyUTM(u.E, u.N);
    const ud = hit.object?.userData || {};
    const c = UTMdeMundo(camara.position), t = UTMdeMundo(controles.target);
    borrador = {
      id: uuid(), fecha: new Date().toISOString(), pk: e.pk, E: u.E, N: u.N, Z: u.Z, titulo: '', descripcion: '', prioridad: 'Normal', estado: 'Abierta',
      elemento: { nombre: ud.nombre || 'Punto del terreno', capa: ud.capa || '', origen: ud.origen?.clase || '' },
      cam: { pos: [c.E, c.N, c.Z], obj: [t.E, t.N, t.Z], fov: camara.fov },
      enlace: enlaceActual(), foto: foto(),
    };
    if (!borrador.elemento.origen) borrador.elemento.origen = 'sin declarar';
    pintar();
  }

  function colocar() {
    for (const it of lista) {
      pin(it);
      const p = pines.get(it.id);
      p.malla.visible = activa;
      p.malla.position.copy(W(it.E, it.N, it.Z));
      p.malla.scale.setScalar(THREE.MathUtils.clamp(p.malla.position.distanceTo(camara.position) * 0.012, 0.35, 8) / 0.35 * 0.35);
      p.el.textContent = it.titulo || 'Incidencia';
      p.el.style.display = activa ? '' : 'none';
    }
  }

  // ---- BCF 2.1 ----
  const xml = (t) => `<?xml version="1.0" encoding="UTF-8"?>\n${t}`;
  function bytesDeDataUrl(url) {
    const bin = atob(url.split(',')[1]);
    const b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }
  function viewpoint(it) {
    const [pe, pn, pz] = it.cam.pos, [oe, on, oz] = it.cam.obj;
    const d = [oe - pe, on - pn, oz - pz], l = Math.hypot(...d) || 1;
    return xml(`<VisualizationInfo Guid="${it.vpId}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <PerspectiveCamera>
    <CameraViewPoint><X>${pe.toFixed(3)}</X><Y>${pn.toFixed(3)}</Y><Z>${pz.toFixed(3)}</Z></CameraViewPoint>
    <CameraDirection><X>${(d[0] / l).toFixed(6)}</X><Y>${(d[1] / l).toFixed(6)}</Y><Z>${(d[2] / l).toFixed(6)}</Z></CameraDirection>
    <CameraUpVector><X>0</X><Y>0</Y><Z>1</Z></CameraUpVector>
    <FieldOfView>${(it.cam.fov || 50).toFixed(1)}</FieldOfView>
  </PerspectiveCamera>
</VisualizationInfo>`);
  }
  function markup(it) {
    const desc = `${it.descripcion || ''}\n\nPK ${fmtPk(it.pk)} · elemento: ${it.elemento.nombre} (${it.elemento.capa || 'sin capa'}; origen del dato: ${it.elemento.origen}).\n`
      + `Punto: UTM 30N ETRS89 E ${it.E.toFixed(2)} N ${it.N.toFixed(2)} cota ${it.Z.toFixed(2)} m.\nEnlace: ${it.enlace}`;
    const estado = { Abierta: 'Open', 'En curso': 'InProgress', Cerrada: 'Closed' }[it.estado] || 'Open';
    return xml(`<Markup xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Header/>
  <Topic Guid="${it.id}" TopicType="Issue" TopicStatus="${estado}">
    <Title>${esc(it.titulo || 'Incidencia')}</Title>
    <Priority>${esc(it.prioridad)}</Priority>
    <CreationDate>${it.fecha}</CreationDate>
    <CreationAuthor>VISOR3D</CreationAuthor>
    <Description>${esc(desc)}</Description>
  </Topic>
  <Viewpoints Guid="${it.vpId}"><Viewpoint>viewpoint.bcfv</Viewpoint><Snapshot>snapshot.jpg</Snapshot></Viewpoints>
</Markup>`);
  }
  function descargar(bytesOTexto, nombre, tipo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytesOTexto], { type: tipo }));
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function exportarBcf() {
    const ficheros = [{ nombre: 'bcf.version', datos: aBytes(xml('<Version VersionId="2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><DetailedVersion>2.1</DetailedVersion></Version>')) }];
    for (const it of lista) {
      it.vpId = it.vpId || uuid();
      ficheros.push({ nombre: `${it.id}/markup.bcf`, datos: aBytes(markup(it)) }, { nombre: `${it.id}/viewpoint.bcfv`, datos: aBytes(viewpoint(it)) });
      if (it.foto) ficheros.push({ nombre: `${it.id}/snapshot.jpg`, datos: bytesDeDataUrl(it.foto) });
    }
    guardar();
    descargar(crearZip(ficheros), `visor3d-incidencias-${new Date().toISOString().slice(0, 10)}.bcfzip`, 'application/octet-stream');
  }

  tarjeta.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const id = b.closest('li')?.dataset.id, it = lista.find((x) => x.id === id);
    switch (b.dataset.i) {
      case 'cerrar': activar(false); break;
      case 'cancelar': borrador = null; pintar(); break;
      case 'guardar': {
        borrador.titulo = tarjeta.querySelector('[data-i=titulo]').value.trim() || 'Incidencia';
        borrador.descripcion = tarjeta.querySelector('[data-i=desc]').value.trim();
        borrador.prioridad = tarjeta.querySelector('[data-i=prio]').value;
        lista.push(borrador); borrador = null;
        if (!guardar()) anunciar('No cabe en el almacenamiento del navegador: exporta y borra incidencias.');
        else anunciar('Incidencia guardada.');
        pintar(); colocar(); break;
      }
      case 'ir': if (it) irAVista(it); break;
      case 'borrar': if (it) { lista = lista.filter((x) => x !== it); const p = pines.get(it.id); if (p) { grupo.remove(p.malla); pines.delete(it.id); } guardar(); pintar(); } break;
      case 'bcf': exportarBcf(); break;
      case 'json': descargar(JSON.stringify(lista.map(({ foto: _f, ...r }) => r), null, 2), `visor3d-incidencias-${new Date().toISOString().slice(0, 10)}.json`, 'application/json'); break;
      default:
    }
  });
  tarjeta.addEventListener('change', (e) => {
    if (e.target.dataset.i !== 'estado') return;
    const it = lista.find((x) => x.id === e.target.closest('li')?.dataset.id);
    if (it) { it.estado = e.target.value; guardar(); }
  });
  tarjeta.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (borrador) { borrador = null; pintar(); } else activar(false); } });

  function activar(on) {
    activa = typeof on === 'boolean' ? on : !activa;
    tarjeta.hidden = !activa;
    document.body.classList.toggle('anotando', activa);
    borrador = null;
    if (activa) { pintar(); anunciar('Incidencias: pulsa un punto de la escena.'); }
    colocar();
    return activa;
  }
  return {
    get activa() { return activa; },
    get anotando() { return activa && !borrador; },
    activar, nuevaEn,
    actualizar() { if (activa && lista.length) colocar(); },
    get total() { return lista.length; },
  };
}
