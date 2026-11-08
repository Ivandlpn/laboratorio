/* Comportamiento común del panel de los visores 3D (sin dependencias):
   secciones y grupos de capas plegables, contador de capas activas, «Mostrar todas / Ocultar todas» y leyenda flotante contextual.
   Los visores solo llaman a window.Leyenda3D.mostrar(titulo, [{ color, texto, detalle?, punto? }]) y .ocultar(). */
(function () {
  const clave = (t) => 'visormdc.3d.' + location.pathname + '.' + t;
  const leer = (k) => { try { return sessionStorage.getItem(clave(k)); } catch (e) { return null; } };
  const guardar = (k, v) => { try { sessionStorage.setItem(clave(k), v); } catch (e) { /* sin almacenamiento */ } };

  function activarSecciones() {
    document.querySelectorAll('#panel section').forEach((sec) => {
      const h2 = sec.querySelector(':scope > h2');
      if (!h2 || h2.dataset.listo) return;
      h2.dataset.listo = '1';
      h2.tabIndex = 0; h2.setAttribute('role', 'button');
      const nombre = h2.textContent.trim();
      const previo = leer('sec.' + nombre), plegada = previo === null ? nombre.startsWith('Capas') : previo === '1';   // «Capas» nace plegada
      sec.classList.toggle('plegada', plegada);
      h2.setAttribute('aria-expanded', String(!plegada));
      const alternar = () => {
        const p = sec.classList.toggle('plegada');
        h2.setAttribute('aria-expanded', String(!p)); guardar('sec.' + nombre, p ? '1' : '0');
      };
      h2.addEventListener('click', alternar);
      h2.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
    });
  }

  // Cartel de alarma: en pantallas estrechas nace plegado y se despliega al pulsar la cabecera
  function activarAlarma() {
    const a = document.getElementById('alarma'); if (!a || a.dataset.listo) return;
    a.dataset.listo = '1';
    if (window.innerWidth <= 640) a.classList.add('compacta');
    const cab = a.querySelector('.al-cab'); if (!cab) return;
    cab.setAttribute('role', 'button'); cab.tabIndex = 0;
    const alternar = () => { if (window.innerWidth <= 640) a.classList.toggle('compacta'); };
    cab.addEventListener('click', alternar);
    cab.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
  }

  function contar() {
    const cont = document.getElementById('capas'); if (!cont) return;
    const c = cont.closest('section').querySelector('.cuenta'); if (!c) return;
    const todas = cont.querySelectorAll('input[type=checkbox]');
    c.textContent = [...todas].filter((i) => i.checked).length + '/' + todas.length;
    // Contador por grupo («3/5») en su cabecera
    cont.querySelectorAll('.grupo-capas').forEach((g) => {
      let on = 0, tot = 0;
      for (let n = g.nextElementSibling; n && !n.classList.contains('grupo-capas'); n = n.nextElementSibling) { const i = n.querySelector && n.querySelector('input[type=checkbox]'); if (i) { tot++; if (i.checked) on++; } }
      let k = g.querySelector('.cuenta-grp'); if (!k) { k = document.createElement('span'); k.className = 'cuenta-grp'; g.insertBefore(k, g.querySelector('.plegar')); }
      k.textContent = on + '/' + tot;
    });
  }

  // Buscador de capas (solo si hay muchas): filtra por nombre y oculta los grupos sin coincidencias
  function buscador(cont) {
    const filas = [...cont.querySelectorAll('label')];
    if (filas.length < 8 || cont.parentElement.querySelector('.buscar-capas')) return;
    const caja = document.createElement('div'); caja.className = 'buscar-capas';
    const inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = 'Buscar capa…'; inp.setAttribute('aria-label', 'Buscar capa'); inp.autocomplete = 'off';
    caja.appendChild(inp);
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      let grupo = null, hay = 0;
      const cerrar = () => { if (grupo) grupo.classList.toggle('filtrada', !!q && !hay); };
      for (const n of cont.children) {
        if (n.classList.contains('grupo-capas')) { cerrar(); grupo = n; hay = 0; continue; }
        const ok = !q || n.textContent.toLowerCase().includes(q);
        n.classList.toggle('filtrada', !ok); if (ok) hay++;
      }
      cerrar();
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') { inp.value = ''; inp.dispatchEvent(new Event('input')); } });
    const barra = cont.parentElement.querySelector('.acciones-capas'); (barra || cont).before(caja);
  }

  function activarCapas() {
    const cont = document.getElementById('capas');
    if (!cont || !cont.children.length) return;
    const sec = cont.closest('section');
    const h2 = sec.querySelector(':scope > h2');
    if (h2 && !h2.querySelector('.cuenta')) { const c = document.createElement('span'); c.className = 'cuenta'; h2.appendChild(c); }
    if (!sec.querySelector('.acciones-capas')) {
      const barra = document.createElement('div'); barra.className = 'acciones-capas';
      for (const [texto, on] of [['Mostrar todas', true], ['Ocultar todas', false]]) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = texto;
        b.addEventListener('click', () => cont.querySelectorAll('input[type=checkbox]').forEach((i) => { if (i.checked !== on) { i.checked = on; i.dispatchEvent(new Event('change', { bubbles: true })); } }));
        barra.appendChild(b);
      }
      cont.before(barra);
    }
    buscador(cont);
    cont.querySelectorAll('.grupo-capas').forEach((g) => {
      if (g.dataset.listo) return; g.dataset.listo = '1';
      const k = 'grp.' + g.textContent.trim();
      const flecha = document.createElement('span'); flecha.className = 'plegar'; g.appendChild(flecha);
      let p = leer(k) === '1';
      const dibujar = () => {
        flecha.textContent = p ? '▸' : '▾'; g.setAttribute('aria-expanded', String(!p));
        for (let n = g.nextElementSibling; n && !n.classList.contains('grupo-capas'); n = n.nextElementSibling) n.classList.toggle('oculta', p);
      };
      g.tabIndex = 0; g.setAttribute('role', 'button');
      g.addEventListener('click', () => { p = !p; guardar(k, p ? '1' : '0'); dibujar(); });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.click(); } });
      dibujar();
    });
    contar();
  }

  function iniciar() {
    activarSecciones(); activarCapas(); activarAlarma();
    const cont = document.getElementById('capas');
    if (cont && !cont.dataset.obs) {
      cont.dataset.obs = '1';
      cont.addEventListener('change', contar);
      new MutationObserver(activarCapas).observe(cont, { childList: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.addEventListener('load', () => { setTimeout(iniciar, 0); setInterval(contar, 800); });

  let caja = null;
  function crear() {
    caja = document.createElement('div'); caja.id = 'leyenda3d'; caja.hidden = true;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-expanded', 'true');
    const ul = document.createElement('ul');
    b.addEventListener('click', () => { const p = caja.classList.toggle('plegada'); b.setAttribute('aria-expanded', String(!p)); });
    // En pantallas estrechas la leyenda nace plegada para no tapar la escena
    if (window.innerWidth < 700) { caja.classList.add('plegada'); b.setAttribute('aria-expanded', 'false'); }
    caja.append(b, ul); document.body.appendChild(caja);
  }
  window.Leyenda3D = {
    mostrar(titulo, items) {
      if (!caja) crear();
      caja.querySelector('button').textContent = titulo;
      const ul = caja.querySelector('ul'); ul.textContent = '';
      for (const it of items) {
        const li = document.createElement('li'); const i = document.createElement('i');
        i.style.background = it.color; if (it.punto) i.className = 'punto';
        const t = document.createElement('span'); t.textContent = it.texto;
        if (it.detalle) { const s = document.createElement('small'); s.textContent = it.detalle; t.appendChild(s); }
        li.append(i, t); ul.appendChild(li);
      }
      caja.hidden = !items.length;
    },
    ocultar() { if (caja) caja.hidden = true; }
  };
})();
