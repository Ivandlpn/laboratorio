import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { fmtPk, lonlatAUTM, utmALonlat } from './proyeccion.js';
import { Malla, cinta, extruirSeccion, cajaOrientada, prisma, lamina, rectMinimo, cubiertaInclinada } from './geometria.js';
import { decodificarArboles } from './arboles.js';
import { hash2 } from './terreno.js';
import { cargarEdificiosOsmKm } from './entorno-osm.js';

export function crearGestorTeselas(ctx) {
  const {
    RUTA, meta, capasMeta, gruposVisibles, entornoKms, escena, Eje3D, MdtCorredor, HashCotas, W, cotaTerrenoUTM, actualizarVentanaTerreno, invalidarTerrenoEnCaja, MODELOS, ARB, matTejaArabe, PK_TERMINAL, VIADUCTOS_REALES, viaductoReal, PERFIL_VIADUCTO, PERFIL_CAJON_VIAD, ESTACION_VILLENA, enZonaEstacion, PASOS_INF, PASOS_SUP, enPasoSuperior, RAMALES, CENTROS_TRACCION_CORREDOR, edificiosPorKm, COLOR_CAT_EDIF, fichaElemento, datosDePunto, abrirFicha, irAPk, ALTO_VALLA, mat, MAT_ALI, GEO_ROTULO, MAT_EST, valla, vallaRecinto, MAT_MALLA_VALLA, MAT_PUERTA_VALLA, matFoco, matPilotoRojo, matBalizaRoja, matLumTunel, matSalidaEmerg, matCobreContacto, matBalasto, matSubbalasto, matCanaleta, matHormigonViad, matEdifCivil, matEdifTecnico, matCubiertaPlana, matAndenGranito, matCarrilAlma, matCarrilCabeza, MAT_GRAPA, MAT_PLACA_GUIA, MAT_TIRAFONDO, carrilUIC60, matTraviesa, matTerrenoTopo, matTerrenoRegional, GEO,
  } = ctx;

  const teselasDisponibles = new Set();
  for (let k = Math.floor(Eje3D.pkIni / 1000); k <= Math.floor(Eje3D.pkFin / 1000); k++) teselasDisponibles.add(k);
  const teselasCargadas = new Map();
  const teselasEnVuelo = new Set();
  const grupoTeselas = new THREE.Group();
  escena.add(grupoTeselas);
  const MAX_TESELAS_CACHE = 12;
  const RADIO_TESELAS = 2;
  let ultimoKmCentral = -1;

  // ---- Niveles de detalle del entorno real (distancias en m desde la cámara al centro de cada celda de 300 m) ----
  const CELDA_LOD = 300;
  const LOD_EDIF_MEDIO = 400, LOD_EDIF_FUERA = 1700;
  const LOD_ARB_MEDIO = 300, LOD_ARB_FUERA = 1300;
  // Copa lejana: icosaedro de 20 triángulos en la unidad de copa (x, z en [-1, 1], y en [0, 1]) con color de vértice
  const COPA_LEJANA = (() => {
    const g = new THREE.IcosahedronGeometry(1, 0).scale(0.9, 0.5, 0.9).translate(0, 0.5, 0);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const t = 0.62 + 0.38 * g.attributes.position.getY(i); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = t; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // Normales esféricas desde el centro de la copa: sin ellas las caras de espaldas al sol salían casi negras
    const p = g.attributes.position, nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = p.getX(i) / 0.9, y = (p.getY(i) - 0.5) / 0.5, z = p.getZ(i) / 0.9, l = Math.hypot(x, y, z) || 1;
      nor[i * 3] = x / l; nor[i * 3 + 1] = y / l; nor[i * 3 + 2] = z / l;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.userData.compartida = true;
    return g;
  })();

  async function cargarTeselaKm(km) {
    if (!teselasDisponibles.has(km) || teselasCargadas.has(km) || teselasEnVuelo.has(km)) return;
    teselasEnVuelo.add(km);
    try {
      const [rGeo, rTer, rEnt] = await Promise.all([
        fetch(`${RUTA}/km/${km}.geojson`).then((r) => (r.ok ? r.json() : { features: [] })),
        fetch(`${RUTA}/km/${km}-terreno.geojson`).then((r) => (r.ok ? r.json() : { features: [] })).catch(() => ({ features: [] })),
        entornoKms.has(km) ? fetch(`${RUTA}/entorno/${km}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null,
      ]);
      // Con entorno real (Catastro + LiDAR) no se siembran los árboles genéricos de la cartografía
      const entornoReal = !!rEnt;
      const arbolesReal = entornoReal ? decodificarArboles(rEnt) : null;
      if (arbolesReal) await MdtCorredor.asegurarCaja(arbolesReal.minE, arbolesReal.minN, arbolesReal.maxE, arbolesReal.maxN);

      const pkCentro = km * 1000 + 500;
      const pAncla = Eje3D.enPk(Math.max(Eje3D.pkIni, Math.min(Eje3D.pkFin, pkCentro)));
      const anclaE = pAncla.E, anclaN = pAncla.N, anclaZ = pAncla.Z;
      const L = (E, N, Z) => [E - anclaE, Z - anclaZ, -(N - anclaN)];

      // 1. Cotas topográficas de precisión del levantamiento DXF de Adif
      const ptsCota = [];
      let minE = 1e15, maxE = -1e15, minN = 1e15, maxN = -1e15;
      for (const f of rTer.features || []) {
        const g = f.geometry; if (!g) continue;
        if (g.type === 'Point') {
          const [lon, lat, z] = g.coordinates;
          if (!Number.isFinite(z) || z <= 5) continue;
          const [E, N] = lonlatAUTM(lon, lat);
          ptsCota.push([E, N, z, km]);
          if (E < minE) minE = E; if (E > maxE) maxE = E;
          if (N < minN) minN = N; if (N > maxN) maxN = N;
        } else if (g.type === 'LineString') {
          const cs = g.coordinates;
          for (let i = 0; i < cs.length; i += 3) {
            const [lon, lat, z] = cs[i];
            if (!Number.isFinite(z) || z <= 5) continue;
            const [E, N] = lonlatAUTM(lon, lat);
            ptsCota.push([E, N, z, km]);
            if (E < minE) minE = E; if (E > maxE) maxE = E;
            if (N < minN) minN = N; if (N > maxN) maxN = N;
          }
        }
      }
      if (ptsCota.length) {
        HashCotas.insertarKm(km, ptsCota);
        invalidarTerrenoEnCaja(minE, minN, maxE, maxN);
      }

      const raiz = new THREE.Group();
      raiz.position.copy(W(anclaE, anclaN, anclaZ));
      const grupos = {};
      for (const g of meta.grupos) {
        const grp = new THREE.Group();
        grp.visible = gruposVisibles[g.id];
        grupos[g.id] = grp;
        raiz.add(grp);
      }
      const etiquetas = [], etiquetasEdif = [], centrosPoligEdif = [], btsConstruidas = new Set(), centrosTraccionConstruidos = new Set();
      // BTS de la cartografía en este km: punto BTS (la torre) y los contornos cerrados de sus casetas a menos de 25 m
      const btsCartoKm = [];
      {
        const contornosBts = [];
        for (const f of rGeo.features || []) {
          if (f.properties?.c !== '050075' || !f.geometry) continue;
          const g = f.geometry;
          if (g.type === 'Point') {
            const [E, N] = lonlatAUTM(g.coordinates[0], g.coordinates[1]);
            btsCartoKm.push({ E, N, contornos: [] });
          } else {
            const cs = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates;
            if (cs?.length >= 4) contornosBts.push(cs);
          }
        }
        for (const cs of contornosBts) {
          const [E, N] = lonlatAUTM(cs[0][0], cs[0][1]);
          let mejor = null, dMin = 25;
          for (const b of btsCartoKm) { const d = Math.hypot(b.E - E, b.N - N); if (d < dMin) { dMin = d; mejor = b; } }
          if (mejor) mejor.contornos.push(cs);
        }
        // Las BTS del eje (btsInfo) que ya trae la cartografía no se vuelven a construir con el modelo tipo
        for (const b of btsCartoKm) {
          for (const bi of Eje3D.btsInfo || []) if (Math.hypot(bi.e - b.E, bi.n - b.N) < 80) btsConstruidas.add(bi);
        }
      }

      const mSubbal = new Malla(), mBal = new Malla(), mCarAlma = new Malla(), mCarCab = new Malla();
      const mHiloContacto = new Malla(), mApoyoViad = new Malla();
      const mViadTablero = new Malla(), mPretil = new Malla(), mAceroGalv = new Malla();
      const mTunelBoveda = new Malla(), mTunelAcera = new Malla(), mBarandillaTunel = new Malla();
      const mHormigonObra = new Malla(), mCanaleta = new Malla(), mCuneta = new Malla();
      const mAsfalto = new Malla(), mMarcaVial = new Malla(), mMallaAntivand = new Malla(), mBionda = new Malla(), mZahorraPI = new Malla();
      const mPantalla = new Malla(), mValla = new Malla(), mPuerta = new Malla(), mAlambreValla = new Malla();
      const mEdif = new Malla(), mEdifTec = new Malla(), mCubierta = new Malla(), mTejaAdif = new Malla(), mMarquesina = new Malla(), mAnden = new Malla();
      const mArmarioVia = new Malla(), mSubest = new Malla(), mTrafo = new Malla(), mAisladorAT = new Malla(), mCajaControl = new Malla(), mAgua = new Malla();
      const mConoCamara = new Malla();
      const agregarConoCamara = (ox, oy, oz, tx, ty, tz) => {
        const dx = tx - ox, dy = ty - oy, dz = tz - oz;
        const d = Math.hypot(dx, dy, dz) || 1;
        const fx = dx / d, fy = dy / d, fz = dz / d;
        let rx = -fz, rz = fx;
        const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
        const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
        const dist = Math.min(d, 75), hw = dist * Math.tan(24 * Math.PI / 180), hh = hw * 9 / 16;
        const cx = ox + fx * dist, cy = oy + fy * dist, cz = oz + fz * dist;
        const vo = mConoCamara.v(ox, oy, oz);
        const esq = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) =>
          mConoCamara.v(cx + rx * sx * hw + ux * sy * hh, cy + uy * sy * hh, cz + rz * sx * hw + uz * sy * hh)
        );
        mConoCamara.tri(vo, esq[0], esq[1]);
        mConoCamara.tri(vo, esq[1], esq[2]);
        mConoCamara.tri(vo, esq[2], esq[3]);
        mConoCamara.tri(vo, esq[3], esq[0]);
      };

      // Acumuladores de hilos 3D (LineSegments en coordenadas locales)
      const segContacto = [], segSustent = [], segPendolas = [], segFeeder = [];
      const linSeg = (arr, a, b) => { arr.push(a[0], a[1], a[2], b[0], b[1], b[2]); };

      const inst = {
        traviesa: [], placaAsiento: [], poste: [], cimientoPoste: [], placaPoste: [], contrapeso: [], mensula: [], aislador: [],
        senalPoste: [], senalFoco: [], baculoCamara: [], casetaVia: [], baliza: [], armario: [], arqueta: [], hitoPk: [],
        tronco: [], copa: [], copaOlivo: [], farola: [], foco: [], posteValla: [], lumTunel: [], cartelTunel: [], sujecion: new Map(),
      };
      const baculosCarto = [];
      const baculosCctvMeta = [];
      const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
      const EJE_Y = new THREE.Vector3(0, 1, 0);
      const matInst = (pos, yaw, sx = 1, sy = 1, sz = 1) => M4.compose(V3.set(pos[0], pos[1], pos[2]), Q4.setFromAxisAngle(EJE_Y, yaw), S3.set(sx, sy, sz)).clone();

      // 2. Superestructura continua de doble vía AV (entreeje 4,70 m, paso Hermite 5 m) + viaductos + túneles + catenaria tensa EAC-350
      const pk0 = Math.max(Eje3D.pkIni, km * 1000);
      const pk1 = Math.min(Eje3D.pkFin, (km + 1) * 1000);
      if (pk1 > pk0) {
        const PASO_M = 5;
        const muestras = [];
        for (let pk = Math.max(Eje3D.pkIni, pk0 - PASO_M); pk <= Math.min(Eje3D.pkFin, pk1 + PASO_M); pk += PASO_M) {
          muestras.push(Eje3D.enPk(pk));
        }
        const muestrasVia = muestras.filter((m) => m.pk <= PK_TERMINAL);

        // 2a. Subbalasto de coronación (13,8 m), canaletas longitudinales ADIF (±5,92 m), balasto y carriles UIC 60
        let trSub = [], trCanI = [], trCanD = [];
        const flushSub = () => { if (trSub.length >= 2) cinta(mSubbal, trSub, 13.8, -0.56, -0.43, 0.75, 0.14); trSub = []; };
        const flushCan = () => {
          if (trCanI.length >= 2) cinta(mCanaleta, trCanI, 0.52, -0.54, -0.25, 0.02, 2.0);
          if (trCanD.length >= 2) cinta(mCanaleta, trCanD, 0.52, -0.54, -0.25, 0.02, 2.0);
          trCanI = []; trCanD = [];
        };
        for (const m of muestrasVia) {
          if (!m.enViaducto && !m.enTunel) trSub.push(L(m.E, m.N, m.Z));
          else flushSub();
          if (!m.enTunel) {
            const nx = -m.ty, ny = m.tx, offC = m.sep * 0.5 + 3.57, zC = m.enViaducto ? m.Z + 0.12 : m.Z;
            trCanI.push(L(m.E - nx * offC, m.N - ny * offC, zC));
            trCanD.push(L(m.E + nx * offC, m.N + ny * offC, zC));
          } else flushCan();
        }
        flushSub();
        flushCan();

        for (const signo of [-1, 1]) {
          const ptsVia = muestrasVia.map((m) => {
            const nx = -m.ty, ny = m.tx, off = signo * (m.sep * 0.5);
            return L(m.E + nx * off, m.N + ny * off, m.Z);
          });
          cinta(mBal, ptsVia, 3.45, -0.44, -0.23, 0.85, 0.25);
          for (const rOff of [-0.7175, 0.7175]) {
            const ptsR = muestrasVia.map((m) => {
              const nx = -m.ty, ny = m.tx, off = signo * (m.sep * 0.5) + rOff;
              return L(m.E + nx * off, m.N + ny * off, m.Z);
            });
            carrilUIC60(mCarAlma, mCarCab, ptsR);
          }
          // Cinta 3D continua de cobre-plata para el hilo de contacto a Z + 5,300 m (fuera de túneles; interior de túnel con carril rígido/hilo tenso)
          let trContacto = [];
          const flushContacto = () => {
            if (trContacto.length >= 2) cinta(mHiloContacto, trContacto, 0.024, 5.292, 5.312, 0, 0.5);
            trContacto = [];
          };
          for (const m of muestrasVia) {
            const nx = -m.ty, ny = m.tx, off = signo * (m.sep * 0.5);
            if (!m.enTunel) trContacto.push(L(m.E + nx * off, m.N + ny * off, m.Z));
            else flushContacto();
          }
          flushContacto();
        }

        // 2b. Traviesas AI-04 + sujeciones Vossloh SKL-14 cada 1,25 m + arquetas cada 50 m + hitos PK
        for (let pk = pk0; pk < Math.min(pk1, PK_TERMINAL); pk += 1.25) {
          const m = Eje3D.enPk(pk);
          const yaw = Math.atan2(m.ty, m.tx), nx = -m.ty, ny = m.tx;
          for (const signo of [-1, 1]) {
            const off = signo * (m.sep * 0.5);
            // Cara superior de la traviesa = cabeza de carril (Z + 0,022) - 172 mm de carril - 10 mm de placa
            const p = L(m.E + nx * off, m.N + ny * off, m.Z - 0.16);
            const mt = matInst(p, yaw);
            inst.traviesa.push(mt);
            const tramo = Math.floor(pk / 100);
            if (!inst.sujecion.has(tramo)) inst.sujecion.set(tramo, { mats: [], p });
            inst.sujecion.get(tramo).mats.push(mt);
          }
        }
        for (let pkArq = Math.ceil(pk0 / 55) * 55 + 27.5; pkArq < Math.min(pk1, PK_TERMINAL); pkArq += 55) {
          const m = Eje3D.enPk(pkArq);
          if (m.enTunel) continue;
          const yaw = Math.atan2(m.ty, m.tx), nx = -m.ty, ny = m.tx, offC = m.sep * 0.5 + 3.57;
          const zArq = (m.enViaducto ? m.Z - 0.16 : m.Z - 0.34);
          for (const s of [-1, 1]) inst.arqueta.push(matInst(L(m.E + nx * s * offC, m.N + ny * s * offC, zArq), yaw));
        }
        for (let pkH = Math.ceil(pk0 / 200) * 200; pkH < Math.min(pk1, PK_TERMINAL); pkH += 200) {
          const m = Eje3D.enPk(pkH);
          const yaw = Math.atan2(m.ty, m.tx), nx = -m.ty, ny = m.tx;
          const pH = L(m.E + nx * (m.sep * 0.5 + 3.12), m.N + ny * (m.sep * 0.5 + 3.12), m.Z - 0.35);
          inst.hitoPk.push(matInst(pH, yaw));
          if (pkH % 500 === 0) {
            const el = document.createElement('div');
            el.className = 'etq';
            el.textContent = 'PK ' + fmtPk(pkH);
            const obj = new CSS2DObject(el);
            obj.position.set(pH[0], pH[1] + 2.35, pH[2]);
            obj.userData = { pk: pkH, enTunel: Boolean(m.enTunel) };
            raiz.add(obj);
            etiquetas.push(obj);
          }
        }

        // 2c. Viaductos de cajón pretensado con impostas, pantallas, apoyos pot, juntas de dilatación, estribos y pilas
        let tramoV = [];
        const cerrarViad = () => {
          if (tramoV.length < 2) { tramoV = []; return; }
          const ptsV = tramoV.map((m) => L(m.E, m.N, m.Z));
          const vReal = viaductoReal(tramoV[0].enViaducto);
          extruirSeccion(mViadTablero, ptsV, vReal ? vReal.perfil : PERFIL_CAJON_VIAD, true, 0.08);
          extruirSeccion(mViadTablero, ptsV, PERFIL_VIADUCTO, true, 0.08);
          for (const s of [-1, 1]) {
            const ptsP = tramoV.map((m) => L(m.E + (-m.ty) * s * 6.98, m.N + m.tx * s * 6.98, m.Z));
            cinta(mPretil, ptsP, 0.10, -0.08, 1.54, 0, 0.25);
            // Acera de mantenimiento e imposta de borde + pasamanos metálico doble
            const ptsAc = tramoV.map((m) => L(m.E + (-m.ty) * s * 6.55, m.N + m.tx * s * 6.55, m.Z));
            cinta(mHormigonObra, ptsAc, 0.72, -0.14, 0.04, 0, 0.2);
            cinta(mAceroGalv, ptsP, 0.05, 1.52, 1.58, 0, 0.3);
            cinta(mAceroGalv, ptsP, 0.04, 0.92, 0.96, 0, 0.3);
          }
          for (let i = 0; i < tramoV.length; i += 2) {
            const m = tramoV[i], ux = m.tx, uz = -m.ty;
            for (const s of [-1, 1]) {
              const pm = L(m.E + (-m.ty) * s * 6.98, m.N + m.tx * s * 6.98, m.Z);
              cajaOrientada(mAceroGalv, pm[0], pm[2], pm[1] - 0.12, pm[1] + 1.58, ux, uz, 0.14, 0.16);
            }
          }
          tramoV = [];
        };
        for (const m of muestras) { if (m.enViaducto) tramoV.push(m); else cerrarViad(); }
        cerrarViad();

        // Estribos con juntas de dilatación en extremos de viaducto y pilas intermedias cada 42 m con aparatos de apoyo pot
        for (const [va, vb] of Eje3D.viaductos) {
          if (vb < pk0 || va > pk1) continue;
          const vr = VIADUCTOS_REALES.get(va);
          if (vr) {
            // Viaducto medido: estribos cerrados entre el borde del tablero y el eje de apoyos, y pilas en su PK real
            for (const [pkApoyo, pkBorde] of [[vr.pkEstribo1, va], [vr.pkEstribo2, vb]]) {
              const pkMed = (pkApoyo + pkBorde) / 2;
              if (pkMed < pk0 || pkMed >= pk1) continue;
              const me = Eje3D.enPk(pkMed), pE = L(me.E, me.N, me.Z);
              const ux = me.tx, uz = -me.ty, nx = -uz, nz = ux, largo = Math.abs(pkApoyo - pkBorde) + 1.2;
              const zTer = cotaTerrenoUTM(me.E, me.N) - anclaZ;
              // Cuerpo del estribo bajo la losa de transición
              cajaOrientada(mViadTablero, pE[0], pE[2], Math.min(zTer - 1.5, pE[1] - 4), pE[1] - 0.45, ux, uz, largo, 14.4);
              // Aletas laterales que contienen el terraplén de acceso
              for (const s of [-1, 1]) {
                cajaOrientada(mViadTablero, pE[0] + nx * s * 7.05, pE[2] + nz * s * 7.05, Math.min(zTer - 1, pE[1] - 3.5), pE[1] - 0.2, ux, uz, largo, 0.6);
              }
              // Aparatos de apoyo y junta con aparato de dilatación de vía en el eje de apoyos
              const ma = Eje3D.enPk(pkApoyo), pA = L(ma.E, ma.N, ma.Z);
              for (const s of [-2.4, 0, 2.4]) {
                cajaOrientada(mApoyoViad, pA[0] + nx * s, pA[2] + nz * s, pA[1] - vr.cotaFondo - 0.32, pA[1] - vr.cotaFondo + 0.02, ma.tx, -ma.ty, 0.8, 0.8);
              }
            }
            vr.pilasPk.forEach((pkP, iP) => {
              if (pkP < pk0 || pkP >= pk1) return;
              const vp = Eje3D.enPk(pkP), pC = L(vp.E, vp.N, vp.Z);
              const ux = vp.tx, uz = -vp.ty, nx = -uz, nz = ux;
              const ySuelo = cotaTerrenoUTM(vp.E, vp.N) - anclaZ;
              const yFondo = pC[1] - vr.cotaFondo, yCoron = yFondo - 0.35;
              // Dos apoyos bajo la losa; en las tres pilas centrales, puntos fijos (apoyo fijo más grande)
              const fijo = vr.pilas.puntosFijos?.includes(iP + 1);
              for (const s of [-1, 1]) {
                cajaOrientada(mApoyoViad, pC[0] + nx * s * 1.6, pC[2] + nz * s * 1.6, yCoron, yFondo + 0.02, ux, uz, fijo ? 1.2 : 0.85, fijo ? 1.2 : 0.85);
              }
              // Fuste de pila de 5,2 m de ancho con aristas achaflanadas (dos cajas cruzadas) hasta 1 m bajo el terreno
              const yPie = ySuelo - 1.0;
              cajaOrientada(mViadTablero, pC[0], pC[2], yPie, yCoron, ux, uz, vr.pilas.grueso, vr.pilas.ancho - 0.5);
              cajaOrientada(mViadTablero, pC[0], pC[2], yPie, yCoron, ux, uz, vr.pilas.grueso - 0.5, vr.pilas.ancho);
              // Encepado enterrado (solo se ve en modo Rayos X)
              cajaOrientada(mHormigonObra, pC[0], pC[2], yPie - 1.6, yPie, ux, uz, 4.2, 7.6);
            });
            continue;
          }
          for (const [pkEst, dirAleta] of [[va, -1], [vb, 1]]) {
            if (pkEst >= pk0 && pkEst < pk1) {
              const me = Eje3D.enPk(pkEst), pE = L(me.E, me.N, me.Z), zTer = cotaTerrenoUTM(me.E, me.N) - anclaZ;
              const ux = me.tx, uz = -me.ty, nx = -uz, nz = ux;
              cajaOrientada(mViadTablero, pE[0] + ux * dirAleta * 2.3, pE[2] + uz * dirAleta * 2.3, Math.min(zTer - 1.5, pE[1] - 6.5), pE[1] - 0.42, ux, uz, 4.8, 14.6);
              cajaOrientada(mApoyoViad, pE[0], pE[2], pE[1] - 0.44, pE[1] - 0.06, ux, uz, 0.34, 14.1);
              for (const s of [-1, 1]) {
                cajaOrientada(mViadTablero, pE[0] + ux * dirAleta * 6.4 + nx * s * 6.95, pE[2] + uz * dirAleta * 6.4 + nz * s * 6.95, Math.min(zTer - 1.0, pE[1] - 4.5), pE[1] - 0.22, ux, uz, 7.8, 0.68);
              }
            }
          }
          const pIniPila = Math.ceil((Math.max(pk0, va + 18)) / 42) * 42;
          for (let pkP = pIniPila; pkP <= Math.min(pk1 - 0.01, vb - 18); pkP += 42) {
            const vp = Eje3D.enPk(pkP), pC = L(vp.E, vp.N, vp.Z);
            const zMinPier = Math.min(
              cotaTerrenoUTM(vp.E, vp.N),
              cotaTerrenoUTM(vp.E - vp.ty * 4.2, vp.N + vp.tx * 4.2),
              cotaTerrenoUTM(vp.E + vp.ty * 4.2, vp.N - vp.tx * 4.2),
            );
            const yTer = (zMinPier - 1.4) - anclaZ;
            const yCajon = pC[1] - 3.10;
            if (yCajon - yTer < 1.2) continue;
            const ux = vp.tx, uz = -vp.ty, nx = -uz, nz = ux;
            // Aparatos de apoyo elastoméricos / pot entre capitel y cajón
            const yTopCap = yCajon - 0.22;
            for (const s of [-1, 1]) {
              cajaOrientada(mApoyoViad, pC[0] + nx * s * 2.15, pC[2] + nz * s * 2.15, yTopCap, yCajon + 0.03, ux, uz, 0.96, 0.96);
            }
            // Capitel abocinado superior
            const yBaseCap = Math.max(yTer + 0.6, yTopCap - 1.95);
            cajaOrientada(mViadTablero, pC[0], pC[2], yBaseCap, yTopCap + 0.02, ux, uz, 2.6, 4.8, 3.5, 8.8);
            // Fuste troncopiramidal esbelto
            if (yBaseCap > yTer + 0.9) {
              cajaOrientada(mViadTablero, pC[0], pC[2], yTer + 0.9, yBaseCap + 0.04, ux, uz, 2.9, 5.4, 2.45, 4.6);
            }
            // Zapata de cimentación enterrada en ladera
            cajaOrientada(mHormigonObra, pC[0], pC[2], yTer - 0.8, yTer + 0.92, ux, uz, 5.4, 8.2);
          }
        }

        // 2c bis. Viaductos de ramal de las bifurcaciones (vía única), dibujados enteros en la tesela de su primer km
        for (const r of RAMALES.lista) {
          if (r.km[0] !== km) continue;
          const pts = r.p.map((q) => L(q[0], q[1], q[2] + 0.3)); // a cota de carril
          const wMed = r.p.reduce((s, q) => s + q[3], 0) / r.p.length, a = wMed / 2;
          // Sección de losa de vía única (canto 1,8 m supuesto) escalada al ancho medido entre impostas
          const perfil = [[-a, -0.45], [a, -0.45], [a - 0.05, -0.7], [a * 0.55, -0.95], [a * 0.42, -2.25], [-a * 0.42, -2.25], [-a * 0.55, -0.95], [-a + 0.05, -0.7]];
          extruirSeccion(mViadTablero, pts, perfil, true, 0.08);
          cinta(mBal, pts, 3.4, -0.45, -0.18, 0.5, 0.25);
          for (let i = 0; i < r.p.length; i++) {
            const q = r.p[i], qn = r.p[Math.min(i + 1, r.p.length - 1)], qp = r.p[Math.max(i - 1, 0)];
            const tx = qn[0] - qp[0], ty = qn[1] - qp[1], lt = Math.hypot(tx, ty) || 1, nx = -ty / lt, ny = tx / lt;
            for (const s of [-1, 1]) {
              const pm = L(q[0] + nx * s * (q[3] / 2 - 0.1), q[1] + ny * s * (q[3] / 2 - 0.1), q[2] + 0.3);
              if (i % 2 === 0) cajaOrientada(mAceroGalv, pm[0], pm[2], pm[1] - 0.45, pm[1] + 1.1, tx / lt, -ty / lt, 0.12, 0.14);
            }
            // Pilas cada 32 m (separación supuesta; la cartografía no trae pilas): fuste ovalado con capitel y zapata
            if (i % 8 === 4 && i > 4 && i < r.p.length - 5) {
              const zSuelo = Math.min(cotaTerrenoUTM(q[0], q[1]), cotaTerrenoUTM(q[0] - ny * 2.5, q[1] + nx * 2.5), cotaTerrenoUTM(q[0] + ny * 2.5, q[1] - nx * 2.5));
              const yFondo = q[2] + 0.3 - 2.25;
              if (yFondo - zSuelo < 1.5) continue;
              const pC = L(q[0], q[1], 0), ux = tx / lt, uz = -ty / lt;
              const yZap = zSuelo - 1.4 - anclaZ;
              cajaOrientada(mHormigonObra, pC[0], pC[2], yZap, zSuelo + 0.45 - anclaZ, ux, uz, 3.6, 4.6);
              cajaOrientada(mViadTablero, pC[0], pC[2], zSuelo + 0.4 - anclaZ, yFondo - 1.2 - anclaZ, ux, uz, 2.0, 3.2);
              cajaOrientada(mViadTablero, pC[0], pC[2], Math.max(zSuelo + 0.4 - anclaZ, yFondo - 1.25 - anclaZ), yFondo - 0.28 - anclaZ, ux, uz, 2.0, 3.2, 2.6, 4.0);
              const nx2 = -uz, nz2 = ux;
              for (const s of [-1, 1]) cajaOrientada(mApoyoViad, pC[0] + nx2 * s * 0.9, pC[2] + nz2 * s * 0.9, yFondo - 0.3 - anclaZ, yFondo + 0.02 - anclaZ, ux, uz, 0.7, 0.7);
            }
          }
        }

        // 2c ter. Pasos superiores reconstruidos: tablero, calzada, pretiles, malla antivandálica, pilas y estribos
        for (const ps of PASOS_SUP) {
          if (ps.km !== km) continue;
          const mTab = new Malla(), mFirme = new Malla(), mPret = new Malla(), mMarcas = new Malla();
          // Detector de caída de objetos (DCO), como en el entorno 3D «paso-superior»: panel de lamas, malla, panel superior
          // inclinado hacia la vía, montantes verdes, dos tubos con fibra óptica y cajas terminales
          const mDcoLamas = new Malla(), mDcoMalla = new Malla(), mDcoVerde = new Malla(), mFibraA = new Malla(), mFibraB = new Malla(), mCajaDco = new Malla(), mFarola = new Malla(), mLed = new Malla();
          const P = ps.p; // [E, N, z, ancho, distancia firmada al eje], ordenados de un estribo al otro
          const zTab = (q) => q[2] - 0.12;
          const pts = P.map((q) => L(q[0], q[1], zTab(q)));
          const a = ps.ancho / 2;
          // Canto supuesto de losa o vigas: luz/20 con el vano mayor (3 vanos ≈ 0,45 L; 2 ≈ 0,5 L; 1 = L)
          const luz = ps.vanos === 1 ? ps.longitud : ps.vanos === 2 ? ps.longitud * 0.5 : ps.longitud * 0.45;
          const canto = Math.min(2.2, Math.max(0.9, luz / 20));
          const perfil = [[-a, 0], [a, 0], [a, -0.32], [a - 0.9, -canto], [-(a - 0.9), -canto], [-a, -0.32]];
          extruirSeccion(mTab, pts, perfil, true, 0.08);
          cinta(mFirme, pts, ps.ancho - 1.3, 0.0, 0.07, 0, 0.12);
          const tangente = (i) => {
            const q1 = P[Math.min(i + 1, P.length - 1)], q0 = P[Math.max(i - 1, 0)];
            const tx = q1[0] - q0[0], ty = q1[1] - q0[1], l = Math.hypot(tx, ty) || 1;
            return [tx / l, ty / l];
          };
          // Zona protegida por el DCO: proyección de la plataforma (±7,4 m) más 8 m a cada lado
          const ZONA_DCO = 15.4;
          const enZona = P.map((q) => Math.abs(q[4]) < ZONA_DCO);
          const tramos = (cond) => { // índices consecutivos que cumplen cond
            const out = []; let cur = null;
            P.forEach((_, i) => { if (cond(i)) { if (!cur) out.push(cur = []); cur.push(i); } else cur = null; });
            return out.filter((t) => t.length >= 2);
          };
          // Línea discontinua del eje de la calzada (3 m de trazo cada 6 m)
          {
            let dist = 0;
            const marcas = [];
            P.forEach((q, i) => { if (i) dist += Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]); marcas.push(dist % 6 < 3); });
            for (const t of tramos((i) => marcas[i])) cinta(mMarcas, t.map((i) => L(P[i][0], P[i][1], zTab(P[i]) + 0.075)), 0.15, 0.0, 0.01, 0, 0.2);
          }
          for (const s of [-1, 1]) {
            const pt = (i, off, dz = 0) => { const q = P[i], [tx, ty] = tangente(i); return L(q[0] - ty * s * off, q[1] + tx * s * off, zTab(q) + dz); };
            const borde = (off, dz = 0) => P.map((_, i) => pt(i, off, dz));
            const off = a - 0.25;
            cinta(mMarcas, borde(a - 0.95, 0.075), 0.15, 0.0, 0.01, 0, 0.2);
            // Pretil de hormigón y bionda metálica de contención fuera de la zona del DCO
            for (const t of tramos((i) => !enZona[i])) {
              cinta(mPret, t.map((i) => pt(i, off)), 0.42, 0.0, 1.05, 0, 0.2);
              cinta(mBionda, t.map((i) => pt(i, off - 0.38, 0)), 0.08, 0.52, 0.78, 0, 0.2);
              for (let k = 0; k < t.length; k += 2) {
                const i = t[k], [tx, ty] = tangente(i), pb = pt(i, off - 0.38, 0);
                cajaOrientada(mBionda, pb[0], pb[2], pb[1], pb[1] + 0.80, tx, -ty, 0.08, 0.12);
              }
            }
            for (const t of tramos((i) => enZona[i])) {
              const base = t.map((i) => pt(i, off));
              cinta(mDcoLamas, base, 0.06, 0.0, 1.22, 0, 0.5);          // panel antivandálico de lamas
              cinta(mDcoMalla, base, 0.02, 1.22, 2.52, 0, 0.5);          // malla de protección intermedia
              // Panel superior de malla de 1,35 m inclinado 38° hacia la vía (vuela hacia fuera del tablero)
              const vuelo = 1.35 * Math.sin(38 * Math.PI / 180), sube = 1.35 * Math.cos(38 * Math.PI / 180);
              let prev = null;
              for (const i of t) {
                const b0 = pt(i, off, 2.52), b1 = pt(i, off + vuelo, 2.52 + sube);
                const v0 = mDcoMalla.v(b0[0], b0[1], b0[2]), v1 = mDcoMalla.v(b1[0], b1[1], b1[2]);
                if (prev) mDcoMalla.quad(prev[0], v0, v1, prev[1]);
                prev = [v0, v1];
              }
              for (const [o, z] of [[off, 1.22], [off, 2.52], [off + vuelo, 2.52 + sube]]) cinta(mDcoVerde, t.map((i) => pt(i, o, z)), 0.05, -0.025, 0.025, 0, 0.5); // marcos
              cinta(mFibraA, t.map((i) => pt(i, off + 0.07, 1.65)), 0.05, -0.025, 0.025, 0, 0.5);  // fibra óptica (circuito amarillo)
              cinta(mFibraB, t.map((i) => pt(i, off + 0.07, 2.5)), 0.05, -0.025, 0.025, 0, 0.5);   // fibra óptica (circuito azul)
              // Montantes verdes cada ~2,3 m con brazo hasta el panel superior
              let acum = 2.3;
              t.forEach((i, k) => {
                if (k) acum += Math.hypot(P[i][0] - P[t[k - 1]][0], P[i][1] - P[t[k - 1]][1]);
                if (acum < 2.3 && k !== t.length - 1) return;
                acum = 0;
                const [tx, ty] = tangente(i), p0 = pt(i, off, 0), pb = pt(i, off + vuelo * 0.9, 2.52 + sube * 0.9);
                cajaOrientada(mDcoVerde, p0[0], p0[2], p0[1], p0[1] + 2.7, tx, -ty, 0.09, 0.09);
                cajaOrientada(mDcoVerde, (p0[0] + pb[0]) / 2, (p0[2] + pb[2]) / 2, p0[1] + 2.45, pb[1], tx, -ty, 0.05, 0.05);
              });
              // Cajas terminales de la fibra en los dos extremos de la barrera
              for (const i of [t[0], t[t.length - 1]]) {
                const [tx, ty] = tangente(i), c = pt(i, off - 0.2, 0);
                cajaOrientada(mCajaDco, c[0], c[2], c[1] + 0.92, c[1] + 1.32, tx, -ty, 0.24, 0.32);
              }
            }
          }
          // Farolas de 7 m en los extremos del tablero, una a cada lado, con su brazo y luminaria LED
          for (const [i, s] of [[1, -1], [P.length - 2, 1]]) {
            const q = P[i], [tx, ty] = tangente(i), nx = -ty * s, ny = tx * s;
            const pie = L(q[0] + nx * (a - 0.55), q[1] + ny * (a - 0.55), zTab(q));
            cajaOrientada(mFarola, pie[0], pie[2], pie[1], pie[1] + 7.0, tx, -ty, 0.14, 0.14, 0.09, 0.09);
            const brazo = L(q[0] + nx * (a - 1.35), q[1] + ny * (a - 1.35), zTab(q));
            cajaOrientada(mFarola, brazo[0], brazo[2], pie[1] + 6.95, pie[1] + 7.07, nx, -ny, 1.6, 0.07);
            const led = L(q[0] + nx * (a - 2.0), q[1] + ny * (a - 2.0), zTab(q));
            cajaOrientada(mLed, led[0], led[2], pie[1] + 6.85, pie[1] + 6.97, nx, -ny, 0.6, 0.3);
          }
          // Pilas fuera de la plataforma (a ±11 m del eje) y estribos en los extremos, hasta el terreno real
          const suelo = (q) => cotaTerrenoUTM(q[0], q[1]);
          const pila = (q, i) => {
            if (Math.abs(q[4]) < 9.8) return; // nunca invadir el gálibo ferroviario (±9,8 m)
            const zs = suelo(q), yFondo = zTab(q) - canto;
            if (yFondo - zs < 1.2) return;
            const [tx, ty] = tangente(i), c = L(q[0], q[1], 0);
            // Fuste + zapata de cimentación enterrada 1,8 m + apoyos de neopreno bajo tablero
            cajaOrientada(mTab, c[0], c[2], zs - 1.8 - anclaZ, zs + 0.35 - anclaZ, tx, -ty, 2.2, ps.ancho - 0.8);
            cajaOrientada(mTab, c[0], c[2], zs - 0.2 - anclaZ, yFondo - 0.14 - anclaZ, tx, -ty, 1.1, ps.ancho - 2.0, 1.1, ps.ancho - 1.6);
            for (const sb of [-0.32, 0.32]) {
              const ca = L(q[0] - ty * sb * (ps.ancho - 2.2), q[1] + tx * sb * (ps.ancho - 2.2), 0);
              cajaOrientada(mApoyoViad, ca[0], ca[2], yFondo - 0.14 - anclaZ, yFondo + 0.02 - anclaZ, tx, -ty, 0.65, 0.65);
            }
          };
          if (ps.vanos >= 2) {
            for (const lado of (ps.vanos === 3 ? [-1, 1] : [P[0][4] < -P[P.length - 1][4] ? -1 : 1])) {
              let iMej = -1, dMej = Infinity;
              P.forEach((q, i) => {
                if (Math.abs(q[4]) < 9.8) return;
                const d = Math.abs(q[4] - lado * 11.2);
                if (d < dMej) { dMej = d; iMej = i; }
              });
              if (iMej >= 0 && dMej < 4.5) pila(P[iMej], iMej);
            }
          }
          for (const i of [0, P.length - 1]) {
            const q = P[i];
            if (Math.abs(q[4]) < 10.5) continue; // nunca colocar un estribo sobre las vías
            const zs = suelo(q), yFondo = zTab(q) - canto;
            const [tx, ty] = tangente(i), dir = i === 0 ? -1 : 1, c = L(q[0] + tx * dir * 1.2, q[1] + ty * dir * 1.2, 0);
            const yBaseEst = Math.min(zs, yFondo) - 1.8 - anclaZ;
            // Estribo cerrado (hasta el terreno del terraplén de acceso) y aletas laterales abocinadas 25°
            cajaOrientada(mTab, c[0], c[2], yBaseEst, zTab(q) - 0.05 - anclaZ, tx, -ty, 2.8, ps.ancho + 0.5);
            for (const s of [-1, 1]) {
              const ang = s * 0.436 * dir;
              const ax = tx * Math.cos(ang) - ty * Math.sin(ang);
              const ay = tx * Math.sin(ang) + ty * Math.cos(ang);
              const ca = L(q[0] + tx * dir * 2.2 + ax * dir * 2.8 - ty * s * (a + 0.15), q[1] + ty * dir * 2.2 + ay * dir * 2.8 + tx * s * (a + 0.15), 0);
              cajaOrientada(mTab, ca[0], ca[2], yBaseEst, zTab(q) + 0.6 - anclaZ, ax, -ay, 6.2, 0.48, 6.2, 0.48);
            }
          }
          const ficha = {
            capa: 'Estructuras',
            nombre: `Paso superior PK ${fmtPk(ps.pk)}`,
            info: `Medido en la cartografía 3D de Adif: ${ps.longitud.toFixed(0)} m de largo, ${ps.ancho.toFixed(1)} m de ancho, gálibo ${ps.galibo.toFixed(1)} m sobre el carril y esviaje de ${ps.esviaje.toFixed(0)}°. `
              + `Supuesto: ${ps.vanos} vano(s), canto de ${canto.toFixed(1)} m, pilas a ±11 m del eje, estribos y pretiles tipo. `
              + `Sobre las vías (proyección de la plataforma más 8 m a cada lado), detector de caída de objetos (DCO): panel de lamas, malla, panel superior inclinado hacia la vía y dos circuitos de fibra óptica que se cortan si un objeto abate la barrera.`,
          };
          for (const [m, material, sombra] of [
            [mTab, matHormigonViad, true], [mFirme, mat('#3b4048', 1, { roughness: 0.9 }), false], [mPret, matHormigonViad, true],
            [mMarcas, mat('#f1f5f9', 1, { roughness: 0.5 }), false],
            [mDcoLamas, mat('#2f4d3b', 1, { roughness: 0.6, metalness: 0.3 }), true],
            [mDcoMalla, mat('#cfd6d8', 0.32, { roughness: 0.6, depthWrite: false }), false],
            [mDcoVerde, mat('#2d4a3a', 1, { metalness: 0.3, roughness: 0.6 }), true],
            [mFibraA, mat('#ffd23a', 1, { emissive: '#ffb000', emissiveIntensity: 0.35 }), false],
            [mFibraB, mat('#35c8ff', 1, { emissive: '#1da8e0', emissiveIntensity: 0.35 }), false],
            [mCajaDco, mat('#dfe2e4', 1, { roughness: 0.5 }), true],
            [mFarola, mat('#3b4148', 1, { metalness: 0.5, roughness: 0.45 }), true],
            [mLed, mat('#fff1c4', 1, { emissive: '#fff1c4', emissiveIntensity: 0.9 }), false],
          ]) {
            if (m.vacia || !grupos.estructuras) continue;
            const mesh = new THREE.Mesh(m.construir(true), material);
            mesh.castShadow = sombra; mesh.receiveShadow = true;
            mesh.userData = ficha;
            grupos.estructuras.add(mesh);
          }
        }

        // 2d. Túneles de sección doble vía ADIF AV (85–100 m²): boquillas monumentales + bóveda dovelada + aceras + barandilla amarilla
        for (const tun of Eje3D.tuneles) {
          for (const [pkBoca, sFuera] of [[tun.pkIni, -1], [tun.pkFin, 1]]) {
            if (pkBoca >= pk0 && pkBoca < pk1) {
              const mb = Eje3D.enPk(pkBoca), pb = L(mb.E, mb.N, mb.Z);
              const ux = mb.tx, uz = -mb.ty, nx = -uz, nz = ux;
              for (const s of [-1, 1]) {
                cajaOrientada(mHormigonObra, pb[0] + nx * s * 7.45, pb[2] + nz * s * 7.45, pb[1] - 0.65, pb[1] + 8.75, ux, uz, 3.8, 1.65);
                cajaOrientada(mHormigonObra, pb[0] + ux * sFuera * 8.4 + nx * s * 7.95, pb[2] + uz * sFuera * 8.4 + nz * s * 7.95, pb[1] - 0.65, pb[1] + 5.4, ux, uz, 15.0, 0.88, 15.0, 0.58);
                // Albardilla metálica sobre aleta y baliza de gálibo en jamba
                cajaOrientada(mApoyoViad, pb[0] + ux * sFuera * 8.4 + nx * s * 7.95, pb[2] + uz * sFuera * 8.4 + nz * s * 7.95, pb[1] + 5.38, pb[1] + 5.52, ux, uz, 15.1, 0.68);
                cajaOrientada(mMarcaVial, pb[0] + ux * sFuera * 1.95 + nx * s * 6.58, pb[2] + uz * sFuera * 1.95 + nz * s * 6.58, pb[1] + 0.4, pb[1] + 2.6, ux, uz, 0.08, 0.24);
              }
              cajaOrientada(mHormigonObra, pb[0], pb[2], pb[1] + 7.45, pb[1] + 9.15, ux, uz, 4.0, 16.8);
              cajaOrientada(mHormigonObra, pb[0] + ux * sFuera * 0.25, pb[2] + uz * sFuera * 0.25, pb[1] + 9.05, pb[1] + 9.65, ux, uz, 4.6, 17.8, 4.2, 17.4);
              cajaOrientada(mApoyoViad, pb[0] + ux * sFuera * 0.25, pb[2] + uz * sFuera * 0.25, pb[1] + 9.63, pb[1] + 9.77, ux, uz, 4.3, 17.6);
            }
          }
        }

        // 2e. Pasos inferiores: marco de hormigón (solera, hastiales, losa y tímpanos) y aletas que siguen la ladera
        for (const pi of PASOS_INF) {
          if (pi.pk < pk0 || pi.pk >= pk1) continue;
          const ux = pi.ax, uz = -pi.ay;             // eje del paso en coordenadas locales (x = E, z = -N)
          const vx = pi.tx, vz = -pi.ty;             // dirección de la vía
          const punto = (sOff, lat) => L(pi.E + pi.ax * sOff + pi.tx * lat, pi.N + pi.ay * sOff + pi.ty * lat, pi.suelo);
          const y0 = pi.suelo - 0.5 - anclaZ + anclaZ; // cotas absolutas pasadas por L()
          const sIzq = -pi.bocaIzq, sDer = pi.bocaDer, hw = pi.ancho / 2;
          const yS = punto(0, 0)[1];                 // cota local del fondo
          const yLosa = yS + pi.galibo;
          // Solera y camino a lo largo de todo el paso
          const sc = (-pi.finIzq - 1 + pi.finDer + 1) / 2, largoTot = pi.finIzq + pi.finDer + 2;
          const pc = punto(sc, 0);
          cajaOrientada(mHormigonObra, pc[0], pc[2], yS - 0.45, yS + 0.02, ux, uz, largoTot, pi.ancho + 1.0);
          cajaOrientada(mZahorraPI, pc[0], pc[2], yS + 0.02, yS + 0.07, ux, uz, largoTot, Math.max(2.5, pi.ancho - 1.2));
          // Marco bajo la plataforma
          const pm = punto((sIzq + sDer) / 2, 0), largoM = sDer - sIzq;
          for (const s of [-1, 1]) {
            const ph = punto((sIzq + sDer) / 2, s * (hw + 0.25));
            cajaOrientada(mHormigonObra, ph[0], ph[2], yS, yLosa, ux, uz, largoM, 0.5);
            // Cartela estructural interior en la unión hastial–losa superior
            const pcrt = punto((sIzq + sDer) / 2, s * (hw - 0.18));
            cajaOrientada(mHormigonObra, pcrt[0], pcrt[2], yLosa - 0.42, yLosa, ux, uz, largoM, 0.12, largoM, 0.42);
          }
          cajaOrientada(mHormigonObra, pm[0], pm[2], yLosa, yLosa + 0.6, ux, uz, largoM, pi.ancho + 1.0);
          // Tímpanos sobre la abertura, hasta la plataforma, con imposta de coronación
          const yTop = pi.zCarril - 0.55 - anclaZ;
          for (const sb of [sIzq, sDer]) {
            const pt = punto(sb, 0);
            if (yTop > yLosa + 0.6) {
              cajaOrientada(mHormigonObra, pt[0], pt[2], yLosa + 0.6, yTop, ux, uz, 0.4, pi.ancho + 1.0);
              cajaOrientada(mApoyoViad, pt[0], pt[2], yTop - 0.02, yTop + 0.10, ux, uz, 0.52, pi.ancho + 1.15);
            }
          }
          // Aletas: de la boca al final, a cada lado, con la coronación siguiendo el terreno que contienen
          const coronacion = (sOff, lado) => {
            const Ew = pi.E + pi.ax * sOff + pi.tx * lado * (hw + 1.2), Nw = pi.N + pi.ay * sOff + pi.ty * lado * (hw + 1.2);
            return Math.min(pi.zCarril - 0.5, Math.max(pi.suelo + 0.6, cotaTerrenoUTM(Ew, Nw) + 0.25)) - anclaZ;
          };
          for (const [s0, s1] of [[-pi.finIzq - 1, sIzq], [sDer, pi.finDer + 1]]) {
            const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / 1.5));
            for (const lado of [-1, 1]) {
              for (let k = 0; k < n; k++) {
                const sa = s0 + (s1 - s0) * (k / n), sb = s0 + (s1 - s0) * ((k + 1) / n);
                const ya = coronacion(sa, lado), yb = coronacion(sb, lado);
                // Prisma de 0,5 m de espesor con la coronación inclinada entre sa y sb
                const v = [];
                for (const [sv, yTopv] of [[sa, ya], [sb, yb]]) {
                  for (const e of [-0.25, 0.25]) {
                    const b = punto(sv, lado * (hw + 0.25 + e));
                    v.push([b[0], yS - 0.3, b[2]], [b[0], yTopv, b[2]]);
                  }
                }
                // v: [a-in-bajo, a-in-alto, a-out-bajo, a-out-alto, b-in-bajo, b-in-alto, b-out-bajo, b-out-alto]
                const i = v.map((q) => mHormigonObra.v(q[0], q[1], q[2], q[0] * 0.25, q[1] * 0.25));
                mHormigonObra.quad(i[0], i[4], i[5], i[1]); // cara interior
                mHormigonObra.quad(i[2], i[3], i[7], i[6]); // cara exterior
                mHormigonObra.quad(i[1], i[5], i[7], i[3]); // coronación
                if (k === 0) mHormigonObra.quad(i[0], i[1], i[3], i[2]);
                if (k === n - 1) mHormigonObra.quad(i[4], i[6], i[7], i[5]);
              }
            }
          }
          void y0; void vx; void vz;
        }

        // 2f. Estación de Villena AV
        if (pk0 <= 435700 && pk1 > 435700) {
          const zR = Eje3D.enPk(435600).Z;                   // cota de carril en la estación
          const P = (pkP, of, z) => { const m = Eje3D.enPk(pkP); return L(m.E - m.ty * of, m.N + m.tx * of, z); };
          const Y = (z) => z - anclaZ;
          const anillo = (lista, z = zR) => { const a = lista.map(([pkP, of]) => { const q = P(pkP, of, z); return [q[0], q[2]]; }); a.push(a[0]); return a; };
          // Banda entre dos desplazamientos laterales a lo largo de [pa, pb], con puntos cada 20 m (sigue la curva)
          const banda = (pa, pb, of0, of1) => {
            const ks = []; for (let k = pa; k < pb; k += 20) ks.push(k); ks.push(pb);
            return anillo([...ks.map((k) => [k, of0]), ...ks.slice().reverse().map((k) => [k, of1])]);
          };
          const M = {}; for (const k of Object.keys(MAT_EST)) M[k] = new Malla();
          const rotulos = [];
          const yA = Y(zR + 0.76);                            // andén de 760 mm sobre carril (altura Adif para AV)
          // Andenes: de 10,42 m (1,72 m del eje de la vía de andén, a ±8,7 m) a 18,25 m; PK 435+379 a 435+690
          for (const sg of [1, -1]) {
            prisma(M.anden, banda(435379, 435690, sg * 10.42, sg * 18.25), Y(zR - 0.6), yA);
            prisma(M.bordeBlanco, banda(435379, 435690, sg * 10.42, sg * 10.62), yA, yA + 0.012);
            prisma(M.bandaRoja, banda(435379, 435690, sg * 10.62, sg * 11.3), yA, yA + 0.01);
            // Marquesina: losa oscura de 7,4 m a 4,2 m sobre el andén, pilares a 16,6 m cada 8,8 m (030051)
            const pmA = 435508, pmB = sg > 0 ? 435688 : 435688;
            prisma(M.marquesina, banda(pmA, pmB, sg * 10.7, sg * 18.1), yA + 4.2, yA + 4.55);
            for (let k = pmA + 4; k < pmB; k += 8.8) {
              const c = P(k, sg * 16.6, 0), m = Eje3D.enPk(k);
              cajaOrientada(M.pilar, c[0], c[2], yA, yA + 4.2, m.tx, -m.ty, 0.3, 0.3);
            }
            // Rótulos «Villena AV» colgados de la marquesina cada 45 m, de cara a la vía
            for (let k = pmA + 20; k < pmB; k += 45) {
              const c = P(k, sg * 12.6, 0), m = Eje3D.enPk(k);
              cajaOrientada(M.pilar, c[0], c[2], yA + 3.3, yA + 4.2, m.tx, -m.ty, 0.06, 0.06);
              rotulos.push({ x: c[0], y: yA + 3.02, z: c[2], yaw: Math.atan2(m.ty, m.tx) });
            }
          }
          // Vestíbulo-puente sobre las cuatro vías (PK 435+684 a 435+720, de -17,6 a +18,4 m): losa, fachadas de vidrio, cubierta
          const yP0 = Y(zR + 7.0), yP1 = Y(zR + 7.6), yP2 = Y(zR + 10.3);
          prisma(M.cubierta, anillo([[435684, -17.6], [435720, -17.6], [435720, 18.4], [435684, 18.4]]), yP0, yP1);
          for (const pkF of [435684.3, 435719.7]) {
            prisma(M.vidrio, anillo([[pkF - 0.08, -17.6], [pkF + 0.08, -17.6], [pkF + 0.08, 18.4], [pkF - 0.08, 18.4]]), yP1, yP2);
            for (let of = -17.6; of <= 18.4; of += 3) {
              const c = P(pkF, of, 0), m = Eje3D.enPk(pkF);
              cajaOrientada(M.pilar, c[0], c[2], yP1, yP2, m.tx, -m.ty, 0.12, 0.12);
            }
          }
          // Edificio de viajeros (lado aparcamiento): huella real 030001, zócalo de chapa y volumen alto de vidrio en mosaico
          const huellaEdif = [[435720, 18.4], [435720, 66.3], [435664, 66.5], [435664, 58.7], [435661, 58.7], [435661, 48.3], [435664, 48.3],
            [435664, 42.5], [435648, 42.6], [435648, 34.2], [435664, 34.2], [435664, 24.4], [435677, 24.4], [435680, 34.3], [435692, 34.2],
            [435692, 29], [435684, 29.1], [435684, 19.9], [435692, 19.9], [435692, 18.4]];
          const zSueloEd = Math.min(zR - 0.5, cotaTerrenoUTM(...(() => { const m = Eje3D.enPk(435690); return [m.E - m.ty * 45, m.N + m.tx * 45]; })()));
          prisma(M.chapa, anillo(huellaEdif), Y(zSueloEd - 0.3), Y(zR + 3.4));
          prisma(M.fachada, anillo(huellaEdif), Y(zR + 3.4), Y(zR + 10.3));
          prisma(M.vidrio, anillo([[435664.2, 24.6], [435676.8, 24.6], [435676.8, 33.9], [435664.2, 33.9]]), Y(zSueloEd), Y(zR + 3.4));
          // Torre de escaleras y ascensores del otro andén (huella real), de vidrio blanco
          prisma(M.vidrioBlanco, anillo([[435684, -17.6], [435720, -17.7], [435720, -29.5], [435688, -29.6], [435688, -29], [435684, -28.8], [435684, -19.5], [435688, -19.4], [435688, -17.6]]), Y(zR - 0.5), yP2);
          // Gran cubierta de celosía sobre puente y edificio: losa oscura con rejilla de vigas en diagonal por debajo
          const cub = [[435676, -32], [435728, -32], [435728, 70], [435676, 70]];
          prisma(M.cubierta, anillo(cub), Y(zR + 10.6), Y(zR + 11.0));
          {
            const m = Eje3D.enPk(435702), ux = m.tx, uz = -m.ty, nx = -uz, nz = ux;
            const d1x = (ux + nx) / Math.SQRT2, d1z = (uz + nz) / Math.SQRT2, d2x = (ux - nx) / Math.SQRT2, d2z = (uz - nz) / Math.SQRT2;
            for (let k = 435679; k < 435726; k += 6) {
              for (let of = -29; of < 68; of += 6) {
                const c = P(k, of, 0);
                cajaOrientada(M.celosia, c[0], c[2], Y(zR + 10.25), Y(zR + 10.6), d1x, d1z, 8.4, 0.18);
                cajaOrientada(M.celosia, c[0], c[2], Y(zR + 10.25), Y(zR + 10.6), d2x, d2z, 8.4, 0.18);
              }
            }
            // Pilares de la cubierta en el lado de la vía general y en el aparcamiento
            for (const of of [-31, 68]) {
              for (const k of [435680, 435702, 435724]) {
                const c = P(k, of, 0), zS = cotaTerrenoUTM(...(() => { const q = Eje3D.enPk(k); return [q.E - q.ty * of, q.N + q.tx * of]; })());
                cajaOrientada(M.pilar, c[0], c[2], Y(Math.min(zS, zR) - 0.3), Y(zR + 10.6), ux, uz, 0.45, 0.45);
              }
            }
          }
          // Explanada de aparcamiento asfaltada y glorieta ovalada de acceso (según plano arquitectónico de Villena AV)
          {
            const mmAp = Eje3D.enPk(435760);
            const zAp = cotaTerrenoUTM(mmAp.E - mmAp.ty * 46, mmAp.N + mmAp.tx * 46);
            prisma(mAsfalto, banda(435718, 435828, 19.5, 70.0), Y(zAp - 0.15), Y(zAp + 0.04));
            prisma(mAsfalto, banda(435638, 435726, 40.0, 72.0), Y(zAp - 0.15), Y(zAp + 0.04));
            // Isleta ajardinada ovalada central frente al edificio de viajeros
            const isleta = [];
            for (let i = 0; i < 20; i++) {
              const ang = (i / 20) * Math.PI * 2;
              isleta.push([435682 + Math.cos(ang) * 30, 56 + Math.sin(ang) * 10.5]);
            }
            isleta.push(isleta[0]);
            prisma(mHormigonObra, anillo(isleta), Y(zAp + 0.02), Y(zAp + 0.22));
            prisma(M.anden, anillo(isleta.map(([kp, op]) => [435682 + (kp - 435682) * 0.94, 56 + (op - 56) * 0.90])), Y(zAp + 0.20), Y(zAp + 0.26));
            for (const kp of [435662, 435675, 435688, 435701]) {
              const pAr = P(kp, 56, zAp + 0.26);
              inst.tronco.push(matInst(pAr, 0, 0.85, 2.2, 0.85));
              inst.copa.push(matInst([pAr[0], pAr[1] + 2.0, pAr[2]], kp * 0.1, 2.3, 2.1, 2.3));
            }
          }
          // Pérgolas fotovoltaicas del aparcamiento (5 bloques en 3 filas según plano: 2 + 2 + 1)
          for (const [pa, pb, o0, o1] of [
            [435721, 435766, 33.4, 38.6], [435772, 435820, 33.4, 38.6],
            [435729, 435768, 43.4, 53.4], [435774, 435815, 43.4, 53.4],
            [435773, 435815, 58.2, 63.4],
          ]) {
            const mm = Eje3D.enPk((pa + pb) / 2);
            const zS = cotaTerrenoUTM(mm.E - mm.ty * (o0 + o1) / 2, mm.N + mm.tx * (o0 + o1) / 2);
            prisma(M.placaSolar, banda(pa, pb, o0, o1), Y(zS + 2.9), Y(zS + 3.05));
            for (let k = pa + 2; k < pb; k += 7.5) {
              const c = P(k, (o0 + o1) / 2, 0), m = Eje3D.enPk(k);
              cajaOrientada(M.pilar, c[0], c[2], Y(zS - 0.2), Y(zS + 2.9), m.tx, -m.ty, 0.18, 0.18);
            }
          }
          // Pasarela cubierta de acceso desde el aparcamiento hacia el edificio de viajeros
          prisma(M.marquesina, banda(435720, 435816, 26.5, 31.0), Y(zR + 3.2), Y(zR + 3.45));
          const fichaEst = {
            capa: 'Estación de viajeros', nombre: 'Estación de Villena AV',
            info: 'PK 435+526 de la L042. Andenes de 7,8 m a 760 mm sobre carril con banda de borde, marquesinas, vestíbulo-puente acristalado sobre las cuatro vías, edificio de viajeros y torre de comunicación vertical en sus huellas de la cartografía 3D de Adif. Alturas de la cartografía (cubierta a unos 10,4 m sobre carril); acabados según las fotos del proyecto de INES Ingenieros para Adif. Celosía y pilares de cubierta, supuestos.',
          };
          for (const [k, malla] of Object.entries(M)) {
            if (malla.vacia || !grupos.edificios) continue;
            const mesh = new THREE.Mesh(malla.construir(true), MAT_EST[k]);
            mesh.castShadow = k !== 'vidrio'; mesh.receiveShadow = true;
            mesh.userData = fichaEst;
            grupos.edificios.add(mesh);
          }
          for (const r of rotulos) {
            if (!grupos.edificios) break;
            const mesh = new THREE.Mesh(GEO_ROTULO, MAT_EST.rotulo);
            mesh.position.set(r.x, r.y, r.z);
            mesh.rotation.y = r.yaw;
            mesh.userData = fichaEst;
            grupos.edificios.add(mesh);
          }
        }

        // 2g. Estación de Alicante-Terminal (fin del corredor)
        if (pk0 <= 485980 && pk1 > 485980) {
          const zR = Eje3D.enPk(485950).Z;                     // cota de carril en la playa de vías
          const P = (pkP, of, z) => { const m = Eje3D.enPk(Math.min(pkP, Eje3D.pkFin)); const ex = Math.max(0, pkP - Eje3D.pkFin); return L(m.E - m.ty * of + m.tx * ex, m.N + m.tx * of + m.ty * ex, z); };
          const Y = (z) => z - anclaZ;
          const anillo = (lista) => { const a = lista.map(([pkP, of]) => { const q = P(pkP, of, 0); return [q[0], q[2]]; }); a.push(a[0]); return a; };
          const M = {}; for (const k of Object.keys(MAT_ALI)) M[k] = new Malla();
          // Vías de la terminal (desplazamiento del eje de cada vía en PK 485+800, 485+900, 485+960 y, las del lado izquierdo,
          // 486+000), medidas en la cartografía. Por el ancho entre carriles: L1-L5 y R1 ibérico; R2-R6 ancho estándar (AV),
          // bajo la marquesina histórica. Las del lado derecho acaban en topes en 485+977; las del izquierdo, en 486+007.
          const VIAS = {
            L1: [-24.8, -24.1, -21.9, -20.3], L2: [-21.3, -15.5, -13.8, -12.8], L3: [-13.6, -10.8, -9.1, -8.0],
            L4: [-5.5, -2.5, -0.9, 0.2], L5: [-3.1, 2.2, 3.9, 5.0],
            R1: [26.6, 37.1, 43.3], R2: [36.2, 46.7, 53.0], R3: [40.1, 50.6, 57.0], R4: [53.5, 64.0, 69.5], R5: [57.5, 68.0, 73.5], R6: [66.8, 77.3, 83.5],
          };
          const PKS_VIA = [485800, 485900, 485960, 486000];
          const ofVia = (id, pkP) => {
            const v = VIAS[id], n = v.length;
            let i = 0;
            while (i < n - 2 && pkP > PKS_VIA[i + 1]) i++;
            return v[i] + (v[i + 1] - v[i]) * (pkP - PKS_VIA[i]) / (PKS_VIA[i + 1] - PKS_VIA[i]);
          };
          // Andenes entre vías: [vía izquierda, vía derecha (o ancho fijo), PK inicio, PK fin, altura sobre carril]
          const ANDENES = [
            ['L1', 'L2', 485872, 486006, 0.68], ['L3', 'L4', 485800, 486006, 0.68], ['L5', 5.7, 485890, 486006, 0.68],
            ['R1', 'R2', 485790, 485976, 0.68], ['R3', 'R4', 485790, 485976, 0.76], ['R5', 'R6', 485790, 485976, 0.76],
          ];
          for (const [va, vb, pA, pB, h] of ANDENES) {
            const ks = []; for (let k = pA; k < pB; k += 15) ks.push(k); ks.push(pB);
            const izq = ks.map((k) => [k, ofVia(va, k) + 1.7]);
            const der = ks.map((k) => [k, typeof vb === 'number' ? ofVia(va, k) + 1.7 + vb : ofVia(vb, k) - 1.7]);
            prisma(M.anden, anillo([...izq, ...der.slice().reverse()]), Y(zR - 0.6), Y(zR + h));
            const banda = (lado, d0, d1) => anillo([...lado.map(([k, o]) => [k, o + d0]), ...lado.slice().reverse().map(([k, o]) => [k, o + d1])]);
            prisma(M.bordeAnden, banda(izq, 0.6, 0.8), Y(zR + h), Y(zR + h + 0.01));
            prisma(M.bordeAnden, banda(der, -0.8, -0.6), Y(zR + h), Y(zR + h + 0.01));
          }
          // Topes al final de cada vía
          for (const id of Object.keys(VIAS)) {
            const pkT = id[0] === 'L' ? 486007 : 485977.5;
            const c = P(pkT, ofVia(id, pkT), 0), m = Eje3D.enPk(pkT);
            cajaOrientada(M.tope, c[0], c[2], Y(zR - 0.1), Y(zR + 1.1), m.tx, -m.ty, 0.8, 2.6);
          }
          // Marquesina Polonceau de dos aguas (030051): aleros a 26,3/62,3 m en 485+777 y 47/83,2 m en 485+977, lucernario central
          const eave = Y(zR + 5.4), alto = 4.6;
          const sh = (pkP, f) => { const t = (pkP - 485776) / 200; const a = 26.3 + 20.7 * t, b = 62.3 + 20.9 * t; return a + (b - a) * f; };
          const tejado = (f0, f1, y0, y1) => {
            const v = [];
            for (const k of [485776, 485976]) for (const [f, y] of [[f0, y0], [f1, y1]]) { const q = P(k, sh(k, f), 0); v.push(M.chapaShed.v(q[0], y, q[2], k * 0.2, f * 10)); }
            return v;
          };
          for (const [f0, f1] of [[0, 0.36], [0.64, 1]]) {
            const yA0 = eave + alto * (f0 < 0.5 ? f0 / 0.5 : (1 - f0) / 0.5), yA1 = eave + alto * (f1 < 0.5 ? f1 / 0.5 : (1 - f1) / 0.5);
            const v = tejado(f0, f1, yA0, yA1);
            M.chapaShed.quad(v[0], v[1], v[3], v[2]);
          }
          // Lucernario: banda acristalada sobre la cumbrera (36 % al 64 % del ancho), elevada 0,9 m
          {
            const yL = eave + alto * 0.72 + 0.9, yC = eave + alto + 0.9;
            const pts = [];
            for (const k of [485776, 485976]) for (const [f, y] of [[0.36, yL], [0.5, yC], [0.64, yL]]) { const q = P(k, sh(k, f), 0); pts.push(M.lucernario.v(q[0], y, q[2], 0, 0)); }
            M.lucernario.quad(pts[0], pts[1], pts[4], pts[3]);
            M.lucernario.quad(pts[1], pts[2], pts[5], pts[4]);
          }
          // Cerchas Polonceau cada 10 m: pares, tirante, bielas y pilares de fundición en los aleros
          for (let k = 485776; k <= 485976; k += 10) {
            const m = Eje3D.enPk(k), ux = m.tx, uz = -m.ty;
            const pa = P(k, sh(k, 0), 0), pb = P(k, sh(k, 1), 0), pc = P(k, sh(k, 0.5), 0);
            const barra = (p0, y0, p1, y1, r) => {
              const dx = p1[0] - p0[0], dz = p1[2] - p0[2], lh = Math.hypot(dx, dz);
              if (lh < 0.01) { cajaOrientada(M.hierro, p0[0], p0[2], Math.min(y0, y1), Math.max(y0, y1), ux, uz, r * 2, r * 2); return; }
              const lx = -dz / lh * r, lz = dx / lh * r;      // lateral horizontal
              const v = [];
              for (const [q, y] of [[p0, y0], [p1, y1]]) for (const sy of [-r, r]) for (const sl of [-1, 1]) v.push(M.hierro.v(q[0] + lx * sl, y + sy, q[2] + lz * sl, 0, 0));
              // v: 0-3 extremo 0 (abajo-, abajo+, arriba-, arriba+), 4-7 extremo 1
              M.hierro.quad(v[0], v[4], v[5], v[1]); M.hierro.quad(v[2], v[3], v[7], v[6]);
              M.hierro.quad(v[0], v[2], v[6], v[4]); M.hierro.quad(v[1], v[5], v[7], v[3]);
            };
            barra(pa, eave, pc, eave + alto, 0.12);
            barra(pc, eave + alto, pb, eave, 0.12);
            barra(pa, eave, pb, eave, 0.04);                                     // tirante
            for (const f of [0.25, 0.75]) {                                       // bielas
              const pf = P(k, sh(k, f), 0);
              barra(pf, eave + alto * 0.5, pf, eave, 0.05);
            }
            for (const pp of [pa, pb]) cajaOrientada(M.hierro, pp[0], pp[2], Y(zR + 0.5), eave, ux, uz, 0.32, 0.32);
          }
          // Marquesinas blancas de los andenes del lado izquierdo (030051), sobre pilares
          for (const [pa, pb, o0, o1, desde] of [[485901, 486001, 4.2, 9.9, 0], [485989, 486002, -6.2, -1.5, 0]]) {
            void desde;
            prisma(M.marqAV, anillo([[pa, o0], [pb, o0 + (pa === 485901 ? 2.9 : 0.4)], [pb, o1], [pa, o1 - (pa === 485901 ? 2.9 : 0)]]), Y(zR + 0.68 + 3.9), Y(zR + 0.68 + 4.2));
            for (let k = pa + 3; k < pb; k += 9) {
              const c = P(k, (o0 + o1) / 2, 0), m = Eje3D.enPk(k);
              cajaOrientada(M.hierro, c[0], c[2], Y(zR + 0.68), Y(zR + 0.68 + 3.9), m.tx, -m.ty, 0.25, 0.25);
            }
          }
          // Edificio de viajeros en U (030001): cuerpo central hacia la avenida de Salamanca, dos alas hacia las vías y
          // vestíbulo acristalado entre ellas. Alturas de la cartografía: unos 12,4 m el cuerpo, 10 m las alas y 8,3 m el frente.
          const cuerpo = [[486037, 20.1], [486118, 22.6], [486118, 38.7], [486133, 39], [486137, 36.2], [486137, 33.2], [486138, 32.2],
            [486139, 23.2], [486140, 11], [486141, 3.6], [486142, -2.6], [486142, -10.2], [486142, -22.2], [486106, -23.4],
            [486106, -30.4], [486092, -30.6], [486063, -30.7], [486039, -31.4], [486038, -17.5]];
          const alaIzq = [[486009, -32.2], [486038, -31.2], [486038, -17.5], [486009, -17.5]];
          const alaDer = [[485979, 43.6], [485974, 87], [486034, 93.2], [486036, 62.7], [486037, 46.6], [486007, 46.6]];
          const vestibulo = [[486008, -17.5], [486037, -17.5], [486037, 46.6], [486007, 46.6]];
          const yS = Y(zR - 0.4);
          for (const [huella, hEd] of [[cuerpo, 12.4], [alaIzq, 10], [alaDer, 10]]) {
            prisma(M.fachada, anillo(huella), yS, Y(zR + hEd));
            prisma(M.cornisa, anillo(huella), Y(zR + hEd), Y(zR + hEd + 0.45));
            prisma(M.cubiertaEd, anillo(huella), Y(zR + hEd + 0.45), Y(zR + hEd + 0.6));
          }
          prisma(M.vestibulo, anillo(vestibulo), yS, Y(zR + 8.3));
          prisma(M.cornisa, anillo(vestibulo), Y(zR + 8.3), Y(zR + 8.7));
          const fichaAli = {
            capa: 'Estación de viajeros', nombre: 'Estación de Alicante-Terminal',
            info: 'PK 485+975, fin de la L042. Edificio de viajeros de la MZA (1858), neoclásico y en planta en U, con su cuerpo central hacia la avenida de Salamanca; gran marquesina metálica de dos aguas tipo Polonceau, bajo la que acaban las vías de ancho estándar (alta velocidad) según el ancho entre carriles de la cartografía; a su izquierda, las vías de ancho ibérico con marquesinas blancas. Seis andenes entre las vías reales y topes al final de cada una. Huellas, aleros y alturas de la cartografía 3D de Adif; fachada, lucernario, cerchas y cubierta del edificio, supuestos a partir de la descripción del catálogo municipal de protecciones.',
          };
          for (const [k, malla] of Object.entries(M)) {
            if (malla.vacia || !grupos.edificios) continue;
            const mesh = new THREE.Mesh(malla.construir(true), MAT_ALI[k]);
            mesh.castShadow = k !== 'vestibulo' && k !== 'lucernario'; mesh.receiveShadow = true;
            mesh.userData = fichaAli;
            grupos.edificios.add(mesh);
          }
        }

        let tramoT = [];
        const cerrarTunel = () => {
          if (tramoT.length < 2) { tramoT = []; return; }
          const NA = 18, R_INT = 6.85, R_EXT = 7.38;
          const profBov = [];
          for (let k = 0; k <= NA; k++) {
            const ang = -0.13 + (Math.PI + 0.26) * (k / NA);
            profBov.push([Math.cos(ang) * R_INT, 1.20 + Math.sin(ang) * 6.25]);
          }
          for (let k = NA; k >= 0; k--) {
            const ang = -0.13 + (Math.PI + 0.26) * (k / NA);
            profBov.push([Math.cos(ang) * R_EXT, 1.20 + Math.sin(ang) * 6.72]);
          }
          const ptsT = tramoT.map((m) => L(m.E, m.N, m.Z));
          extruirSeccion(mTunelBoveda, ptsT, profBov, true, 0.1);
          cinta(mHormigonObra, ptsT, 13.8, -0.62, -0.43, 0, 0.2);
          for (const s of [-1, 1]) {
            const ptsAc = tramoT.map((m) => L(m.E + (-m.ty) * s * 5.80, m.N + m.tx * s * 5.80, m.Z));
            cinta(mTunelAcera, ptsAc, 1.35, -0.50, 0.34, 0, 0.2);
            const ptsBar = tramoT.map((m) => L(m.E + (-m.ty) * s * 5.16, m.N + m.tx * s * 5.16, m.Z));
            cinta(mBarandillaTunel, ptsBar, 0.06, 0.34, 1.38, 0, 0.2);
          }
          for (let i = 0; i < tramoT.length; i += 4) {
            const m = tramoT[i], yaw = Math.atan2(m.ty, m.tx);
            const pL = L(m.E, m.N, m.Z + 6.95);
            inst.lumTunel.push(matInst(pL, yaw));
            if (Math.round(m.pk) % 100 === 0) {
              for (const s of [-1, 1]) {
                const pCart = L(m.E + (-m.ty) * s * 6.38, m.N + m.tx * s * 6.38, m.Z + 2.35);
                inst.cartelTunel.push(matInst(pCart, yaw));
              }
            }
          }
          tramoT = [];
        };
        for (const m of muestras) { if (m.enTunel) tramoT.push(m); else cerrarTunel(); }
        cerrarTunel();

        // 2e. Catenaria EAC-350 longitudinalmente estable (cero trazado sinusoidal): postes HEB, contrapesos, ménsulas, sustentador y péndolas
        // Postes: en la posición y cota de la cartografía de Adif (capa 040242, bloque 2253); solo si un km no los trae
        // se generan cada 55 m como antes.
        const postesCarto = (rGeo.features || []).filter((f) => f.properties?.c === '040242' && f.properties?.b === '2253' && f.geometry?.type === 'Point');
        const usarPostesCarto = postesCarto.length > 0;
        if (usarPostesCarto) {
          postesCarto.forEach((f, iP) => {
            const c = f.geometry.coordinates, [E, N] = lonlatAUTM(c[0], c[1]);
            const q = Eje3D.proyUTM(E, N);
            if (q.enTunel) return;
            const m = Eje3D.enPk(q.pk), yaw = Math.atan2(m.ty, m.tx), nx = -m.ty, ny = m.tx;
            const s = Math.sign((E - m.E) * nx + (N - m.N) * ny) || 1;   // lado de la vía (+ izquierda)
            const zBase = Number.isFinite(f.properties.z) && f.properties.z > 5 ? f.properties.z : m.Z - 0.35;
            const mtP = matInst(L(E, N, zBase), yaw);
            inst.poste.push(mtP);
            inst.cimientoPoste.push(mtP);
            inst.placaPoste.push(mtP);
            if (q.d > 12 || q.pk > PK_TERMINAL) return; // poste de otra línea, de un ramal o de la terminal: sin ménsula hacia esta vía
            if (iP % 20 === 0) inst.contrapeso.push(mtP);
            // Ménsula desde el poste hasta el eje de la vía más cercana (a sep/2 del eje de la línea)
            const alcance = Math.max(1.2, q.d - m.sep * 0.5);
            const zHilo = m.Z;
            const pMen = L(E - nx * s * alcance * 0.5, N - ny * s * alcance * 0.5, zHilo + 5.55);
            inst.mensula.push(matInst(pMen, yaw + (s > 0 ? Math.PI * 0.5 : -Math.PI * 0.5), alcance, 1, 1));
            for (const h of [5.55, 6.32]) inst.aislador.push(matInst(L(E - nx * s * 0.42, N - ny * s * 0.42, zHilo + h), yaw + Math.PI * 0.5));
          });
        }
        const VANO = 55;
        const pkVanoIni = Math.floor((pk0 - VANO) / VANO) * VANO;
        for (let pkA = pkVanoIni; pkA < pk1; pkA += VANO) {
          const pkB = pkA + VANO;
          if (pkB <= Eje3D.pkIni || pkA >= Eje3D.pkFin || pkA >= PK_TERMINAL) continue;
          const a = Math.max(Eje3D.pkIni, pkA), b = Math.min(Eje3D.pkFin, pkB);
          const mA = Eje3D.enPk(a), mB = Eje3D.enPk(b);
          if (mA.enTunel || mB.enTunel) continue;

          const idxVano = Math.round(pkA / VANO);

          // Postes HEB a ±5,25 m y equipos de compensación mecánica cada 20 vanos (~1,1 km), solo sin postes cartografiados
          if (!usarPostesCarto && pkA >= pk0 && pkA < pk1 && pkA >= Eje3D.pkIni) {
            const yaw = Math.atan2(mA.ty, mA.tx), nx = -mA.ty, ny = mA.tx;
            for (const s of [-1, 1]) {
              const alcance = 2.90;
              const offPoste = s * (mA.sep * 0.5 + alcance);
              const pP = L(mA.E + nx * offPoste, mA.N + ny * offPoste, mA.Z - 0.35);
              const mtP = matInst(pP, yaw);
              inst.poste.push(mtP);
              inst.cimientoPoste.push(mtP);
              inst.placaPoste.push(mtP);
              if (idxVano % 20 === 0) inst.contrapeso.push(mtP);
              const pMen = L(mA.E + nx * (offPoste - s * alcance * 0.5), mA.N + ny * (offPoste - s * alcance * 0.5), mA.Z + 5.55);
              inst.mensula.push(matInst(pMen, yaw + (s > 0 ? Math.PI * 0.5 : -Math.PI * 0.5), alcance, 1, 1));
              const pAis1 = L(mA.E + nx * (offPoste - s * 0.42), mA.N + ny * (offPoste - s * 0.42), mA.Z + 5.55);
              const pAis2 = L(mA.E + nx * (offPoste - s * 0.42), mA.N + ny * (offPoste - s * 0.42), mA.Z + 6.32);
              inst.aislador.push(matInst(pAis1, yaw + Math.PI * 0.5));
              inst.aislador.push(matInst(pAis2, yaw + Math.PI * 0.5));
            }
          }

          // Hilos del vano alineados exactamente sobre el eje de cada vía (±2,350 m) sin zigzag sinusoidal
          const SUB = 12, pasoSub = (b - a) / SUB;
          if (pasoSub < 1) continue;
          for (let k = 0; k < SUB; k++) {
            const sa = a + k * pasoSub, sb = sa + pasoSub;
            const sm = (sa + sb) * 0.5;
            if (sm < pk0 || sm >= pk1) continue;
            const ua = (sa - pkA) / VANO, ub = (sb - pkA) / VANO;
            const pa = Eje3D.enPk(sa), pb2 = Eje3D.enPk(sb);
            const nxa = -pa.ty, nya = pa.tx, nxb = -pb2.ty, nyb = pb2.tx;
            const hSustA = 6.46 - 0.38 * 4 * ua * (1 - ua);
            const hSustB = 6.46 - 0.38 * 4 * ub * (1 - ub);
            const hFeedA = 7.36 - 0.28 * 4 * ua * (1 - ua);
            const hFeedB = 7.36 - 0.28 * 4 * ub * (1 - ub);

            for (const s of [-1, 1]) {
              const offCA = s * (pa.sep * 0.5), offCB = s * (pb2.sep * 0.5);
              const c1 = L(pa.E + nxa * offCA, pa.N + nya * offCA, pa.Z + 5.30);
              const c2 = L(pb2.E + nxb * offCB, pb2.N + nyb * offCB, pb2.Z + 5.30);
              const s1 = L(pa.E + nxa * offCA, pa.N + nya * offCA, pa.Z + hSustA);
              const s2 = L(pb2.E + nxb * offCB, pb2.N + nyb * offCB, pb2.Z + hSustB);
              linSeg(segContacto, c1, c2);
              linSeg(segSustent, s1, s2);
              if (k > 0) linSeg(segPendolas, c1, s1);

              const offFA = s * (pa.sep * 0.5 + 3.28), offFB = s * (pb2.sep * 0.5 + 3.28);
              linSeg(segFeeder, L(pa.E + nxa * offFA, pa.N + nya * offFA, pa.Z + hFeedA), L(pb2.E + nxb * offFB, pb2.N + nyb * offFB, pb2.Z + hFeedB));
            }
          }
        }
      }

      // 3. Cartografía vectorial 3D de Adif (201 teselas DXF: viales, drenaje, estructuras, BTS, subestaciones, señalización, cultivos…)
      const aLoc = (cs, modoZ = 'terreno', zExtra = 0) => cs.map((c) => {
        const [E, N] = lonlatAUTM(c[0], c[1]);
        let z = c.length > 2 && Number.isFinite(c[2]) && c[2] > 5 ? c[2] : null;
        // Vías de ramal sobre su viaducto: a la cota del tablero, no a la de la vía principal
        if (z === null && modoZ === 'via' && RAMALES.lista.length) z = RAMALES.cotaCarril(E, N);
        if (z === null) z = modoZ === 'via' ? Eje3D.proyUTM(E, N).Z : cotaTerrenoUTM(E, N);
        return L(E, N, z + zExtra);
      });

      // Modelo oficial de estación base GSM-R ADIF + caseta de operadores + torre celosía 30 m + bandeja Rejiband
      // Exacto al modelo de ingeniería Adif (public/visor3d/caseta-gsmr): UNA SOLA TORRE ENTRE LAS DOS CASETAS
      function construirComplejoBtsGsmr(cx, cz, zSuelo, ux, uz, nombreBts, pkBts) {
        const activo = document.getElementById('chkBtsModelos')?.checked ?? true;
        if (!activo) return;
        const nx = -uz, nz = ux;

        // Coordenadas canónicas relativas (Torre centrada en tx, tz = cx, cz):
        // - Torre de 30 m: exactamente en el centro (0, 0)
        // - Caseta GSM-R ADIF: a la izquierda (-5.58 m)
        // - Caseta Operadores comerciales: a la derecha (+8.53 m)
        // - Recinto perimetral: centrado (+1.45 m) englobando ambas casetas y la torre central
        const tx = cx, tz = cz;
        const cxG = cx - 5.58 * ux, czG = cz - 0.43 * nz;
        const cxO = cx + 8.53 * ux, czO = cz - 0.43 * nz;
        const cRecX = cx + 1.45 * ux, cRecZ = cz - 0.43 * nz;

        // 1. Recinto perimetral: losa técnica de grava con bordillo perimetral (24.9 × 7.0 m)
        cajaOrientada(mSubest, cRecX, cRecZ, zSuelo - 0.25, zSuelo + 0.12, ux, uz, 24.9, 7.0);
        cajaOrientada(mHormigonObra, cRecX, cRecZ, zSuelo + 0.08, zSuelo + 0.18, ux, uz, 25.2, 7.3);

        // Vallado perimetral con cancelas metálicas de acceso GSM-R y Operadores
        const vY0 = zSuelo + 0.18, vY1 = zSuelo + 2.18;
        vallaRecinto(mValla, mAlambreValla, inst.posteValla, cRecX, cRecZ, vY0, ux, uz, 24.9, 7.0, ALTO_VALLA, matInst);
        // Cancelas de acceso verde Adif
        cajaOrientada(mPuerta, cRecX - 6.5 * ux, cRecZ + 3.5 * nz, vY0, vY1, ux, uz, 2.75, 0.14);
        cajaOrientada(mPuerta, cRecX + 6.5 * ux, cRecZ + 3.5 * nz, vY0, vY1, ux, uz, 2.78, 0.14);

        // 2. ÚNICA TORRE CENTRAL de celosía 30 m troncopiramidal metálica (entre ambas casetas)
        torreGsmr(tx, tz, zSuelo, ux, uz);
        casetaGsmr(cxG, czG, zSuelo, ux, uz, 2.76, 2.48, tx, tz);
        casetaGsmr(cxO, czO, zSuelo, ux, uz, 8.28, 2.43, tx, tz);
      }

      /** Torre de celosía GSM-R de 30 m con escalera, plataforma, antenas GSM-R y de operadores, pararrayos y baliza. */
      function torreGsmr(tx, tz, zSuelo, ux, uz) {
        const nx = -uz, nz = ux;
        cajaOrientada(mHormigonObra, tx, tz, zSuelo - 0.45, zSuelo + 0.18, ux, uz, 5.4, 5.4);
        const H_TOR = 30.0, TRAMOS_TOR = 8;
        for (let t = 0; t < TRAMOS_TOR; t++) {
          const u0 = t / TRAMOS_TOR, u1 = (t + 1) / TRAMOS_TOR;
          const y0 = zSuelo + 0.18 + u0 * H_TOR, y1 = zSuelo + 0.18 + u1 * H_TOR;
          const w0 = 1.20 * (1 - u0 * 0.50), w1 = 1.20 * (1 - u1 * 0.50);
          const esq0 = [[-w0, -w0], [w0, -w0], [w0, w0], [-w0, w0]].map(([dx, dz]) => [tx + dx * ux + dz * nx, tz + dx * uz + dz * nz]);
          const esq1 = [[-w1, -w1], [w1, -w1], [w1, w1], [-w1, w1]].map(([dx, dz]) => [tx + dx * ux + dz * nx, tz + dx * uz + dz * nz]);
          for (let c = 0; c < 4; c++) {
            const c2 = (c + 1) % 4;
            cajaOrientada(mAceroGalv, (esq0[c][0] + esq1[c][0]) * 0.5, (esq0[c][1] + esq1[c][1]) * 0.5, y0, y1, ux, uz, 0.12, 0.12);
            linSeg(segSustent, [esq1[c][0], y1, esq1[c][1]], [esq1[c2][0], y1, esq1[c2][1]]);
            linSeg(segSustent, [esq0[c][0], y0, esq0[c][1]], [esq1[c2][0], y1, esq1[c2][1]]);
            linSeg(segSustent, [esq0[c2][0], y0, esq0[c2][1]], [esq1[c][0], y1, esq1[c][1]]);
          }
        }

        // Escalera vertical con quitamiedos adosada
        const yEscTop = zSuelo + 0.18 + H_TOR - 2.2;
        const eEscX = tx + 0.68 * nx, eEscZ = tz + 0.68 * nz;
        linSeg(segPendolas, [eEscX - 0.22 * ux, zSuelo + 0.2, eEscZ - 0.22 * uz], [eEscX - 0.22 * ux, yEscTop, eEscZ - 0.22 * uz]);
        linSeg(segPendolas, [eEscX + 0.22 * ux, zSuelo + 0.2, eEscZ + 0.22 * uz], [eEscX + 0.22 * ux, yEscTop, eEscZ + 0.22 * uz]);
        for (let yh = zSuelo + 0.6; yh < yEscTop; yh += 0.35) {
          linSeg(segPendolas, [eEscX - 0.22 * ux, yh, eEscZ - 0.22 * uz], [eEscX + 0.22 * ux, yh, eEscZ + 0.22 * uz]);
        }

        // Plataforma superior de trabajo a 25/28 m con barandilla
        const yPlat = zSuelo + 0.18 + H_TOR - 2.0;
        cajaOrientada(mAceroGalv, tx, tz, yPlat - 0.08, yPlat, ux, uz, 2.1, 2.1);
        cajaOrientada(mAceroGalv, tx, tz + 1.05 * nz, yPlat, yPlat + 1.1, ux, uz, 2.1, 0.06);
        cajaOrientada(mAceroGalv, tx, tz - 1.05 * nz, yPlat, yPlat + 1.1, ux, uz, 2.1, 0.06);
        cajaOrientada(mAceroGalv, tx - 1.05 * ux, tz, yPlat, yPlat + 1.1, nx, nz, 2.1, 0.06);
        cajaOrientada(mAceroGalv, tx + 1.05 * ux, tz, yPlat, yPlat + 1.1, nx, nz, 2.1, 0.06);

        // Antenas sectoriales GSM-R orientadas a la traza ferroviaria (+ux y -ux)
        cajaOrientada(mEdifTec, tx + 1.25 * ux, tz + 1.25 * uz, yPlat + 0.1, yPlat + 2.0, ux, uz, 0.30, 0.15);
        cajaOrientada(mEdifTec, tx - 1.25 * ux, tz - 1.25 * uz, yPlat + 0.1, yPlat + 2.0, ux, uz, 0.30, 0.15);

        // Soportes y antenas de Operadores comerciales (Telefónica, Orange, Vodafone)
        for (const sAng of [-0.6, 0.6, 2.4]) {
          const sDx = Math.cos(sAng) * 1.35, sDz = Math.sin(sAng) * 1.35;
          cajaOrientada(mEdifTec, tx + sDx * ux + sDz * nx, tz + sDx * uz + sDz * nz, yPlat + 1.2, yPlat + 2.8, sDx, sDz, 0.24, 0.14);
          linSeg(segSustent, [tx, yPlat + 2.0, tz], [tx + sDx * ux + sDz * nx, yPlat + 2.0, tz + sDx * uz + sDz * nz]);
        }

        // Pararrayos Franklin de 2,2 m + baliza luminosa destellante aeronáutica
        cajaOrientada(mAceroGalv, tx, tz, zSuelo + H_TOR + 0.18, zSuelo + H_TOR + 2.38, ux, uz, 0.08, 0.08);
        inst.foco.push(matInst([tx, zSuelo + H_TOR + 2.45, tz], 0, 1.2, 1.2, 1.2));
      }

      /**
       * Caseta prefabricada de hormigón (GSM-R de Adif u operadores) de `largo` × `ancho` con su eje largo en (ux, uz):
       * solera, cuerpo, cubierta, puerta en la fachada larga, climatizadores en los testeros y bandeja de cables a la torre.
       */
      function casetaGsmr(cx, cz, zSuelo, ux, uz, largo, ancho, tx, tz) {
        const nx = -uz, nz = ux;
        cajaOrientada(mHormigonObra, cx, cz, zSuelo - 0.25, zSuelo + 0.16, ux, uz, largo + 1.0, ancho + 1.0);
        cajaOrientada(mEdifTec, cx, cz, zSuelo + 0.16, zSuelo + 2.90, ux, uz, largo, ancho);
        cajaOrientada(mCubierta, cx, cz, zSuelo + 2.90, zSuelo + 3.12, ux, uz, largo + 0.27, ancho + 0.28);
        // Puerta en la fachada larga que no mira a la torre
        const lado = ((tx - cx) * nx + (tz - cz) * nz) > 0 ? -1 : 1;
        cajaOrientada(mAceroGalv, cx + nx * lado * (ancho / 2 + 0.01), cz + nz * lado * (ancho / 2 + 0.01), zSuelo + 0.16, zSuelo + 2.16, nx, nz, 0.08, 0.85);
        for (const s of [-1, 1]) cajaOrientada(mEdifTec, cx + ux * s * (largo / 2 + 0.2), cz + uz * s * (largo / 2 + 0.2), zSuelo + 0.95, zSuelo + 1.95, ux, uz, 0.38, 0.95);
        // Bandeja portacables a +2,4 m desde el testero más cercano a la torre
        const s = ((tx - cx) * ux + (tz - cz) * uz) > 0 ? 1 : -1;
        const ex = cx + ux * s * largo / 2, ez = cz + uz * s * largo / 2;
        const dx = tx - ex, dz = tz - ez, d = Math.hypot(dx, dz);
        if (d > 0.8) {
          const vx = dx / d, vz = dz / d, l = d - 0.7, mx = ex + vx * l / 2, mz = ez + vz * l / 2;
          cajaOrientada(mAceroGalv, mx, mz, zSuelo + 2.36, zSuelo + 2.46, vx, vz, l, 0.35);
          cajaOrientada(mAceroGalv, mx, mz, zSuelo + 0.16, zSuelo + 2.36, vx, vz, 0.12, 0.12);
          cajaOrientada(mHormigonObra, mx, mz, zSuelo + 0.08, zSuelo + 0.22, vx, vz, 0.5, 0.5);
        }
      }

      /**
       * BTS según la cartografía de Adif: la torre en el punto BTS (capa 050075, bloque BTS) y cada caseta sobre su contorno
       * real (rectángulos de 4,1 × 2,6 m GSM-R y 6,5 × 2,6 m de operadores), con su tamaño y orientación.
       */
      function construirBtsCartografia(ptE, ptN, contornos) {
        const activo = document.getElementById('chkBtsModelos')?.checked ?? true;
        if (!activo) return;
        const zS = cotaTerrenoUTM(ptE, ptN), pT = L(ptE, ptN, zS);
        const casetas = [];
        for (const cs of contornos) {
          const xy = cs.map((c) => lonlatAUTM(c[0], c[1]));
          if (xy.length < 4) continue;
          // Lado largo y centro del rectángulo
          let iL = 0, lMax = 0;
          for (let i = 0; i < xy.length - 1; i++) { const l = Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1]); if (l > lMax) { lMax = l; iL = i; } }
          const vx = (xy[iL + 1][0] - xy[iL][0]) / lMax, vy = (xy[iL + 1][1] - xy[iL][1]) / lMax;
          const pts = xy.slice(0, -1);
          const cE = pts.reduce((a, p) => a + p[0], 0) / pts.length, cN = pts.reduce((a, p) => a + p[1], 0) / pts.length;
          let ancho = 0;
          for (const p of pts) ancho = Math.max(ancho, Math.abs((p[0] - cE) * -vy + (p[1] - cN) * vx) * 2);
          if (lMax < 3 || lMax > 12 || ancho < 1.5) continue;
          casetas.push({ cE, cN, ux: vx, uz: -vy, largo: lMax, ancho });
        }
        // Torre orientada como las casetas (o como la vía si no hay)
        const m = Eje3D.enPk(Eje3D.proyUTM(ptE, ptN).pk);
        const ux = casetas[0]?.ux ?? m.tx, uz = casetas[0]?.uz ?? -m.ty;
        torreGsmr(pT[0], pT[2], zS - anclaZ, ux, uz);
        for (const c of casetas) {
          const zC = cotaTerrenoUTM(c.cE, c.cN), pc = L(c.cE, c.cN, zC);
          casetaGsmr(pc[0], pc[2], zC - anclaZ, c.ux, c.uz, c.largo, c.ancho, pT[0], pT[2]);
        }
      }

      // Modelo oficial ADIF de Centro de Autotransformación (ATI / ATF) 2×25 kV
      // Fiel a la arquitectura estándar de Adif Alta Velocidad según captura real de ATI 327.7 ADIF:
      // - Edificio técnico de celdas GIS SF6 con muros de hormigón blanco prefabricado, petos longitudinales y cubierta curva
      // - Escalera de acceso exterior, puerta metálica, rejillas de ventilación
      // - Patio exterior amurallado (muros cortafuegos continuos al edificio) con autotransformador de tracción
      // - Cuba de acero grafito con radiadores de aletas, depósito de expansión superior, 3 pasatapas cerámicos de AT a 45°
      // - Foso de recogida de aceite con lecho de grava y rejilla cortafuegos
      // - Pórtico de conexión de alta tensión hacia catenaria y feeder
      // - Explanada pavimentada y cerramiento perimetral de seguridad
      function construirCentroAutotransformador(cx, cz, zSuelo, ux, uz, nombre, pk, tipo = 'ATI') {
        const activo = document.getElementById('chkBtsModelos')?.checked ?? true;
        if (!activo) return;
        const nx = -uz, nz = ux;

        // 1. Explanada pavimentada del centro y vallado perimetral de seguridad (32.0 × 17.0 m)
        cajaOrientada(mAsfalto, cx, cz, zSuelo - 0.25, zSuelo + 0.10, ux, uz, 32.0, 17.0);
        cajaOrientada(mHormigonObra, cx, cz, zSuelo + 0.08, zSuelo + 0.18, ux, uz, 32.4, 17.4); // bordillo perimetral
        cajaOrientada(mSubest, cx, cz, zSuelo + 0.10, zSuelo + 0.14, ux, uz, 31.8, 16.8); // solera

        // Vallado perimetral (alambre y malla sobre postes)
        const vY0 = zSuelo + 0.18, vY1 = zSuelo + 2.45;
        vallaRecinto(mValla, mAlambreValla, inst.posteValla, cx, cz, vY0, ux, uz, 32.0, 17.0, 2.27, matInst);
        // Cancela corredera metálica de acceso para vehículos de mantenimiento
        cajaOrientada(mPuerta, cx - 11.0 * ux, cz + 8.5 * nz, vY0, vY1, ux, uz, 4.8, 0.14);

        // 2. Edificio Técnico de Celdas GIS y Mando (12.2 × 5.6 m, altura 4.5 m a alero)
        const bCx = cx - 3.4 * ux, bCz = cz;
        const hAlero = 4.5, hPeto = 5.15, hCumbrera = 4.88;

        // Muros perimetrales de hormigón prefabricado blanco/gris claro
        cajaOrientada(mEdifTec, bCx, bCz, zSuelo + 0.14, zSuelo + hAlero, ux, uz, 12.2, 5.6);

        // Petos perimetrales longitudinales (muros que suben por encima de la cubierta en fachada delantera y trasera)
        cajaOrientada(mHormigonObra, bCx, bCz + 2.7 * nz, zSuelo + hAlero - 0.05, zSuelo + hPeto, ux, uz, 12.4, 0.38);
        cajaOrientada(mHormigonObra, bCx, bCz - 2.7 * nz, zSuelo + hAlero - 0.05, zSuelo + hPeto, ux, uz, 12.4, 0.38);

        // Remates estilizados en ala / esquinas de los petos (fieles a las 4 capturas de ATI 327.7 ADIF)
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const cRx = bCx + sx * 6.1 * ux + sz * 2.7 * nx;
            const cRz = bCz + sx * 6.1 * uz + sz * 2.7 * nz;
            cajaOrientada(mHormigonObra, cRx, cRz, zSuelo + hPeto, zSuelo + hPeto + 0.28, ux, uz, 0.55, 0.55);
          }
        }

        // Cubierta curva metálica autoportante encajada entre los petos
        // Segmentada en arco bajo para conseguir la curvatura cilíndrica real vista en las fotos
        const N_SEG_ARC = 6;
        for (let s = 0; s < N_SEG_ARC; s++) {
          const uA = s / N_SEG_ARC, uB = (s + 1) / N_SEG_ARC;
          const offA = (uA - 0.5) * 5.0, offB = (uB - 0.5) * 5.0;
          const yA = zSuelo + hAlero + (1 - 4 * (uA - 0.5) ** 2) * (hCumbrera - hAlero);
          const yB = zSuelo + hAlero + (1 - 4 * (uB - 0.5) ** 2) * (hCumbrera - hAlero);
          const midOff = (offA + offB) * 0.5;
          const midY = (yA + yB) * 0.5;
          const thick = Math.abs(offB - offA);
          cajaOrientada(mCubierta, bCx, bCz + midOff * nz, midY - 0.06, midY + 0.06, ux, uz, 12.0, thick);
        }

        // Puerta principal centrada en fachada delantera (bCz + 2.8 * nz)
        cajaOrientada(mTrafo, bCx, bCz + 2.81 * nz, zSuelo + 0.55, zSuelo + 2.75, ux, uz, 1.35, 0.12);
        // Visera / moldura sobre puerta principal
        cajaOrientada(mHormigonObra, bCx, bCz + 2.95 * nz, zSuelo + 2.80, zSuelo + 2.92, ux, uz, 1.8, 0.35);

        // Escalera de acceso exterior prefabricada de hormigón (4 escalones de acceso)
        cajaOrientada(mHormigonObra, bCx, bCz + 3.25 * nz, zSuelo + 0.14, zSuelo + 0.55, ux, uz, 2.2, 0.8);
        cajaOrientada(mHormigonObra, bCx, bCz + 3.75 * nz, zSuelo + 0.14, zSuelo + 0.40, ux, uz, 2.2, 0.6);
        cajaOrientada(mHormigonObra, bCx, bCz + 4.15 * nz, zSuelo + 0.14, zSuelo + 0.25, ux, uz, 2.2, 0.5);

        // Puerta lateral de emergencia (tester izquierdo bCx - 6.1 * ux)
        cajaOrientada(mTrafo, bCx - 6.11 * ux, bCz, zSuelo + 0.25, zSuelo + 2.35, nx, nz, 1.15, 0.12);
        cajaOrientada(mHormigonObra, bCx - 6.45 * ux, bCz, zSuelo + 0.14, zSuelo + 0.25, nx, nz, 1.6, 0.6);

        // Puerta trasera de servicio (fachada posterior bCz - 2.8 * nz)
        cajaOrientada(mTrafo, bCx + 2.5 * ux, bCz - 2.81 * nz, zSuelo + 0.25, zSuelo + 2.35, ux, uz, 1.15, 0.12);
        cajaOrientada(mHormigonObra, bCx + 2.5 * ux, bCz - 3.20 * nz, zSuelo + 0.14, zSuelo + 0.25, ux, uz, 1.6, 0.6);

        // Rejillas de ventilación cuadradas en parte superior de muros
        for (const dxV of [-4.2, 4.2]) {
          cajaOrientada(mTrafo, bCx + dxV * ux, bCz + 2.82 * nz, zSuelo + 3.4, zSuelo + 4.0, ux, uz, 0.65, 0.08);
          cajaOrientada(mTrafo, bCx + dxV * ux, bCz - 2.82 * nz, zSuelo + 3.4, zSuelo + 4.0, ux, uz, 0.65, 0.08);
        }

        // 3. Patio Exterior Amurallado del Autotransformador (Recinto Cortafuegos adosado a la derecha)
        // Muros de hormigón de la misma altura que el edificio que abrazan el transformador
        const tCx = cx + 5.8 * ux, tCz = cz;
        const lPatio = 6.2, wPatio = 5.6;

        // Muro cortafuegos trasero (continuación longitudinal directa del muro trasero del edificio)
        cajaOrientada(mEdifTec, tCx, tCz - 2.7 * nz, zSuelo + 0.14, zSuelo + hAlero, ux, uz, lPatio, 0.38);
        cajaOrientada(mHormigonObra, tCx, tCz - 2.7 * nz, zSuelo + hAlero, zSuelo + hPeto, ux, uz, lPatio + 0.2, 0.42);

        // Muro cortafuegos lateral exterior (cierre derecho del patio)
        cajaOrientada(mEdifTec, tCx + 3.0 * ux, tCz, zSuelo + 0.14, zSuelo + hAlero, nx, nz, wPatio, 0.38);
        cajaOrientada(mHormigonObra, tCx + 3.0 * ux, tCz, zSuelo + hAlero, zSuelo + hPeto, nx, nz, wPatio + 0.2, 0.42);

        // Murete frontal de contención y apantallamiento (más bajo para refrigeración y acceso)
        cajaOrientada(mEdifTec, tCx, tCz + 2.7 * nz, zSuelo + 0.14, zSuelo + 1.45, ux, uz, lPatio, 0.35);
        cajaOrientada(mHormigonObra, tCx, tCz + 2.7 * nz, zSuelo + 1.40, zSuelo + 1.48, ux, uz, lPatio + 0.1, 0.40);

        // Foso colector de aceite con lecho de grava y rejilla cortafuegos bajo el autotransformador
        cajaOrientada(mSubest, tCx - 0.2 * ux, tCz, zSuelo - 0.65, zSuelo + 0.14, ux, uz, 4.4, 3.6);
        cajaOrientada(mAceroGalv, tCx - 0.2 * ux, tCz, zSuelo + 0.14, zSuelo + 0.18, ux, uz, 4.2, 3.4);

        // 4. Autotransformador de Tracción 2×25 kV (10-15 MVA, ONAN)
        const trX = tCx - 0.2 * ux, trZ = tCz;
        // Cuba principal de acero soldado
        cajaOrientada(mTrafo, trX, trZ, zSuelo + 0.18, zSuelo + 2.45, ux, uz, 2.65, 1.85);
        cajaOrientada(mHormigonObra, trX, trZ, zSuelo + 0.14, zSuelo + 0.22, ux, uz, 2.85, 2.05); // bancada

        // Baterías laterales de radiadores con aletas de refrigeración
        for (const sR of [-1, 1]) {
          const rZ = trZ + sR * 1.18 * nz, rX = trX + sR * 1.18 * nx;
          cajaOrientada(mTrafo, rX, rZ, zSuelo + 0.52, zSuelo + 2.25, ux, uz, 2.25, 0.38);
          // Aletas verticales
          for (let af = -0.9; af <= 0.9; af += 0.45) {
            cajaOrientada(mAceroGalv, rX + af * ux, rZ, zSuelo + 0.55, zSuelo + 2.22, ux, uz, 0.08, 0.42);
          }
        }

        // Depósito cilíndrico de expansión de aceite (conservador) en parte superior
        cajaOrientada(mTrafo, trX, trZ - 0.35 * nz, zSuelo + 2.65, zSuelo + 3.25, ux, uz, 1.85, 0.62);
        cajaOrientada(mAceroGalv, trX - 0.65 * ux, trZ - 0.35 * nz, zSuelo + 2.45, zSuelo + 2.68, ux, uz, 0.14, 0.14);
        cajaOrientada(mAceroGalv, trX + 0.65 * ux, trZ - 0.35 * nz, zSuelo + 2.45, zSuelo + 2.68, ux, uz, 0.14, 0.14);

        // 3 Pasatapas cerámicos de alta tensión marrón/teja a 45° (+25 kV, 0 kV retorno, -25 kV feeder)
        const offBush = [-0.75, 0, 0.75];
        for (let i = 0; i < 3; i++) {
          const bX = trX + offBush[i] * ux + 0.25 * nx;
          const bZ = trZ + offBush[i] * uz + 0.25 * nz;
          // Aislador cerámico marrón escalonado
          cajaOrientada(mAisladorAT, bX, bZ, zSuelo + 2.45, zSuelo + 3.45, ux, uz, 0.26, 0.26, 0.16, 0.16);
          cajaOrientada(mAceroGalv, bX, bZ, zSuelo + 3.45, zSuelo + 3.75, ux, uz, 0.06, 0.06); // terminal de conexión
          // Pararrayos adyacente
          cajaOrientada(mAisladorAT, bX, bZ - 0.45 * nz, zSuelo + 2.45, zSuelo + 3.25, ux, uz, 0.15, 0.15);
        }

        // Armario local de mando y bornes de control (caja rosada/roja visible en esquina de foto)
        cajaOrientada(mCajaControl, tCx + 2.1 * ux, tCz + 1.8 * nz, zSuelo + 0.18, zSuelo + 1.25, ux, uz, 0.65, 0.45);
        cajaOrientada(mTrafo, tCx + 2.1 * ux, tCz + 2.05 * nz, zSuelo + 0.22, zSuelo + 1.20, ux, uz, 0.55, 0.08);

        // 5. Pórtico metálico de conexión aérea hacia catenaria y feeder 2×25 kV
        const pX = tCx, pZ = tCz - 2.7 * nz;
        cajaOrientada(mAceroGalv, pX - 2.2 * ux, pZ, zSuelo + hPeto, zSuelo + 7.8, ux, uz, 0.22, 0.22);
        cajaOrientada(mAceroGalv, pX + 2.2 * ux, pZ, zSuelo + hPeto, zSuelo + 7.8, ux, uz, 0.22, 0.22);
        cajaOrientada(mAceroGalv, pX, pZ, zSuelo + 7.6, zSuelo + 7.85, ux, uz, 4.8, 0.22);
        // Aisladores de suspensión del pórtico
        for (const dxP of [-1.5, 0, 1.5]) {
          cajaOrientada(mAisladorAT, pX + dxP * ux, pZ, zSuelo + 6.8, zSuelo + 7.6, ux, uz, 0.18, 0.18);
        }
      }

      let numSenal = 0;
      // Capas cuyas huellas la cartografía dibuja a menudo como líneas cerradas (no como polígonos): arquetas, armarios de
      // vía, edificios, casetas, marquesinas, naves y subestaciones. Se tratan como polígonos para levantarlas en su sitio.
      const CAPAS_HUELLA = new Set(['050134', '050035', '030001', '030025', '030051', '030067', '030129', '030235', '050012']);
      // Coser segmentos LineString abiertos (p. ej. edificios técnicos/PB/PAET dibujados por aristas sueltas en DXF)
      const featuresGeo = (rGeo.features || []).slice();
      {
        const porCapa = new Map();
        for (const f of featuresGeo) {
          const id = f.properties?.c;
          if (!CAPAS_HUELLA.has(id) || f.geometry?.type !== 'LineString') continue;
          const cs = f.geometry.coordinates;
          if (!cs || cs.length < 2) continue;
          const a = cs[0], b = cs[cs.length - 1];
          if (cs.length >= 4 && Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) continue;
          if (!porCapa.has(id)) porCapa.set(id, []);
          porCapa.get(id).push({ f, cs });
        }
        for (const [id, lista] of porCapa) {
          const usados = new Set();
          for (let i = 0; i < lista.length; i++) {
            if (usados.has(i)) continue;
            usados.add(i);
            const chain = lista[i].cs.slice();
            let cambio = true;
            while (cambio) {
              cambio = false;
              const fin = chain[chain.length - 1], ini = chain[0];
              if (chain.length >= 4 && Math.hypot(fin[0] - ini[0], fin[1] - ini[1]) < 6e-6) break;
              let bestJ = -1, bestRev = false, bestEnd = true, bestD = 7e-6;
              for (let j = 0; j < lista.length; j++) {
                if (usados.has(j)) continue;
                const seg = lista[j].cs, s0 = seg[0], s1 = seg[seg.length - 1];
                let d = Math.hypot(fin[0] - s0[0], fin[1] - s0[1]); if (d < bestD) { bestD = d; bestJ = j; bestRev = false; bestEnd = true; }
                d = Math.hypot(fin[0] - s1[0], fin[1] - s1[1]); if (d < bestD) { bestD = d; bestJ = j; bestRev = true; bestEnd = true; }
                d = Math.hypot(ini[0] - s1[0], ini[1] - s1[1]); if (d < bestD) { bestD = d; bestJ = j; bestRev = false; bestEnd = false; }
                d = Math.hypot(ini[0] - s0[0], ini[1] - s0[1]); if (d < bestD) { bestD = d; bestJ = j; bestRev = true; bestEnd = false; }
              }
              if (bestJ >= 0) {
                usados.add(bestJ);
                const seg = lista[bestJ].cs.slice();
                if (bestRev) seg.reverse();
                if (bestEnd) chain.push(...seg.slice(1));
                else chain.unshift(...seg.slice(0, -1));
                cambio = true;
              }
            }
            if (chain.length >= 4 && Math.hypot(chain[0][0] - chain[chain.length - 1][0], chain[0][1] - chain[chain.length - 1][1]) < 2.2e-5) {
              chain[chain.length - 1] = chain[0];
              featuresGeo.push({ type: 'Feature', properties: { ...lista[i].f.properties, c: id }, geometry: { type: 'Polygon', coordinates: [chain] } });
            }
          }
        }
      }
      for (const f of featuresGeo) {
        const id = f.properties?.c;
        let g = f.geometry;
        if (!id || !g) continue;
        // En las bocas de túnel la cartografía dibuja la boquilla como contorno de edificio: la boquilla ya tiene su modelo
        if ((id === '030001' || id === '030051') && ESTACION_VILLENA.cubre(g)) {
          const pkF = f.properties?.pk ?? 0;
          if (id === '030051' || (pkF >= 435640 && pkF <= 435750)) continue;
        }
        if (id === '030001' || id === '030175') {
          const cs0 = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'LineString' ? g.coordinates : null;
          if (cs0?.length) {
            let sx = 0, sy = 0;
            for (const c of cs0) { sx += c[0]; sy += c[1]; }
            const [E0, N0] = lonlatAUTM(sx / cs0.length, sy / cs0.length);
            const q0 = Eje3D.proyUTM(E0, N0);
            if (q0.d < 25 && Eje3D.tuneles.some((t) => Math.min(Math.abs(q0.pk - t.pkIni), Math.abs(q0.pk - t.pkFin)) < 45)) continue;
          }
        }
        if (g.type === 'LineString' && CAPAS_HUELLA.has(id)) {
          const cs = g.coordinates, a = cs[0], b = cs[cs.length - 1];
          if (cs.length >= 4 && Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) g = { type: 'Polygon', coordinates: [cs] };
        }
        const metaCapa = capasMeta[id];

        if (g.type === 'Point') {
          const [E, N] = lonlatAUTM(g.coordinates[0], g.coordinates[1]);
          const q = Eje3D.proyUTM(E, N);
          const zDxf = g.coordinates.length > 2 && g.coordinates[2] > 5 ? g.coordinates[2] : null;
          const zTer = cotaTerrenoUTM(E, N);
          const zBase = zDxf ?? (q.d < 7.5 && !q.enTunel ? q.Z - 0.25 : zTer);
          const p = L(E, N, zBase);
          const pSup = L(E, N, Math.max(zTer, zDxf ?? zTer));
          const mRef = Eje3D.enPk(q.pk);
          const yawVia = Math.atan2(mRef.ty, mRef.tx);

          if (id === '040235') {
            // Si la cartografía marca «Señal vertical semáforo» junto a un paso superior (fuera del gálibo ±4,8 m),
            // corresponde a un báculo verde con cámara fija, foco infrarrojo y armario a media altura (ref. VisorLAV).
            const psCerca = PASOS_SUP.find((ps) => Math.abs(ps.pk - q.pk) <= 130);
            if (psCerca && Math.abs(q.of) >= 4.8 && Math.abs(q.of) <= 28) {
              const mPs = Eje3D.enPk(psCerca.pk);
              const yawCam = Math.atan2(-(mPs.N - N), mPs.E - E);
              const zBac = Math.max(zTer, zDxf ?? zTer);
              inst.baculoCamara.push(matInst(pSup, yawCam));
              const pMira = L(mPs.E, mPs.N, mPs.Z + 5.2);
              agregarConoCamara(pSup[0] + Math.cos(yawCam) * 0.9, pSup[1] + 9.05, pSup[2] - Math.sin(yawCam) * 0.9, pMira[0], pMira[1], pMira[2]);
              baculosCarto.push({ pk: q.pk, lado: Math.sign(q.of) });
              baculosCctvMeta.push({ pk: q.pk, E, N, Z: zBac, yaw: yawCam, miraE: mPs.E, miraN: mPs.N, miraZ: mPs.Z + 5.2, nombre: `Báculo CCTV · PS PK ${Math.round(psCerca.pk)}` });
            } else {
              inst.senalPoste.push(matInst(p, yawVia));
              inst.senalFoco.push(matInst(p, yawVia));
            }
            numSenal++;
          } else if (id === '050247') {
            inst.baliza.push(matInst(L(E, N, q.Z + 0.02), yawVia));
          } else if (id === '050035') {
            inst.armario.push(matInst(p, yawVia));
          } else if (id === '050134') {
            inst.arqueta.push(matInst(L(E, N, zBase + 0.06), yawVia));
          } else if (id === '040191' || f.properties?.b === '2405' || f.properties?.b === '2409') {
            inst.farola.push(matInst(pSup, yawVia));
            inst.foco.push(matInst([pSup[0] + Math.cos(yawVia) * 1.1, pSup[1] + 7.45, pSup[2] - Math.sin(yawVia) * 1.1], 0, 0.72, 0.45, 0.72));
          } else if (id === '090092') {
            if (entornoReal) continue;
            // Parcela agrícola mediterránea (olivar / almendral en marco real de plantación)
            for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
              const dE = E + ox * 7.5 + (hash2(E + ox, N + oz) - 0.5) * 1.8;
              const dN = N + oz * 7.5 + (hash2(N + oz, E - ox) - 0.5) * 1.8;
              const qO = Eje3D.proyUTM(dE, dN);
              if (!qO.enTunel && qO.d < 14) continue;
              const pO = L(dE, dN, cotaTerrenoUTM(dE, dN));
              const hO = 2.2 + hash2(dE, dN) * 1.4;
              inst.tronco.push(matInst(pO, 0, 0.85, hO * 0.48, 0.85));
              inst.copaOlivo.push(matInst([pO[0], pO[1] + hO * 0.36, pO[2]], hash2(dN, dE) * 6.28, hO * 0.72, hO * 0.62, hO * 0.72));
            }
          } else if (f.properties?.b === '2504' || f.properties?.b === '2506' || id === '030080') {
            if (entornoReal) continue;
            const cercaBocaTunel = Eje3D.tuneles.some((t) => Math.min(Math.abs(q.pk - t.pkIni), Math.abs(q.pk - t.pkFin)) < 45);
            if (!q.enTunel && q.d < (cercaBocaTunel ? 16 : 9)) continue;
            const h = 3.6 + ((Math.abs(Math.sin(E * 0.37 + N * 0.23)) * 4.5));
            inst.tronco.push(matInst(pSup, 0, 1, h * 0.45, 1));
            inst.copa.push(matInst([pSup[0], pSup[1] + h * 0.38, pSup[2]], E % 3.14, h * 0.44, h * 0.52, h * 0.44));
          }
        } else if (g.type === 'LineString') {
          const cs = g.coordinates; if (cs.length < 2) continue;
          if ((id === '050147' || id === '050117') && PK_TERMINAL < Infinity) {
            // Balasto y traviesas para ejes de vía reales en terminal (pk > PK_TERMINAL) y en desvíos / vías de apartado de PAET y PB
            const ptsRaw = aLoc(cs, 'via');
            const esExtra = cs.map((c) => {
              const [E, N] = lonlatAUTM(c[0], c[1]);
              const q = Eje3D.proyUTM(E, N);
              if (q.pk > PK_TERMINAL) return true;
              const sep = Eje3D.enPk(q.pk).sep * 0.5;
              return Math.min(Math.abs(q.of - sep), Math.abs(q.of + sep)) > 0.85;
            });
            const tramos = [];
            let cur = [];
            for (let i = 0; i < ptsRaw.length; i++) {
              if (esExtra[i]) {
                if (!cur.length && i > 0) cur.push(ptsRaw[i - 1]);
                cur.push(ptsRaw[i]);
              } else {
                if (cur.length) { cur.push(ptsRaw[i]); if (cur.length >= 2) tramos.push(cur); cur = []; }
              }
            }
            if (cur.length >= 2) tramos.push(cur);
            for (const ptsEje of tramos) {
              cinta(mBal, ptsEje, 3.45, -0.44, -0.23, 0.85, 0.25);
              let resto = 0;
              for (let i = 0; i < ptsEje.length - 1; i++) {
                const a = ptsEje[i], b = ptsEje[i + 1];
                const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz);
                if (l < 0.01) continue;
                const yaw = Math.atan2(-dz, dx);
                let d = resto;
                for (; d < l; d += 1.25) {
                  const t = d / l, pT = [a[0] + dx * t, a[1] + (b[1] - a[1]) * t - 0.16, a[2] + dz * t];
                  const mt = matInst(pT, yaw);
                  inst.traviesa.push(mt);
                  if (id === '050117') {
                    const clave = 'T' + Math.floor(i / 4) + '|' + Math.round(a[0] / 100) + '|' + Math.round(a[2] / 100);
                    if (!inst.sujecion.has(clave)) inst.sujecion.set(clave, { mats: [], p: pT });
                    inst.sujecion.get(clave).mats.push(mt);
                  }
                }
                resto = d - l;
              }
            }
          } else if (id === '050177') {
            // Hilos de carril reales del DXF (desvíos, escapes y vías de apartado en PAET y estaciones).
            // Umbral ajustado (0,22 m) para conservar íntegras las agujas y ramas divergentes de los desvíos.
            const ptsH = aLoc(cs, 'via');
            let maxDev = 0;
            const dup = cs.map((c) => {
              const [E, N] = lonlatAUTM(c[0], c[1]);
              const q = Eje3D.proyUTM(E, N);
              if (q.d > 7 || q.pk > PK_TERMINAL) { maxDev = Infinity; return false; }
              const sep = Eje3D.enPk(q.pk).sep * 0.5;
              const dMin = Math.min(...[sep - 0.7175, sep + 0.7175, -sep - 0.7175, -sep + 0.7175].map((o) => Math.abs(q.of - o)));
              if (dMin > maxDev) maxDev = dMin;
              return dMin < 0.22;
            });
            if (maxDev < 0.30) continue;
            let tramo = [];
            for (let i = 0; i < ptsH.length; i++) {
              if (!dup[i]) {
                if (!tramo.length && i > 0) tramo.push(ptsH[i - 1]); // arranca desde el último punto común (desvío)
                tramo.push(ptsH[i]);
              } else {
                if (tramo.length) { tramo.push(ptsH[i]); if (tramo.length >= 2) carrilUIC60(mCarAlma, mCarCab, tramo); }
                tramo = [];
              }
            }
            if (tramo.length >= 2) carrilUIC60(mCarAlma, mCarCab, tramo);
          } else if (id === '050207') {
            // Eje de vía convencional adyacente (ancho ibérico)
            const ptsIb = aLoc(cs, 'terreno', 0.16);
            cinta(mBal, ptsIb, 3.3, -0.36, -0.08, 0.7, 0.25);
            cinta(mCarCab, ptsIb, 1.72, -0.08, -0.02, 0, 0.4);
          } else if (id === '030175') {
            cinta(mEdif, aLoc(cs, 'terreno'), 0.28, -0.2, 1.85, 0, 0.25);
          } else if (id === '050150') {
            const [Em, Nm] = lonlatAUTM(cs[cs.length >> 1][0], cs[cs.length >> 1][1]);
            const qm = Eje3D.proyUTM(Em, Nm);
            // La vía principal ya genera una única canaleta continua a cada lado; evitar duplicados de cartografía
            if (qm.pk > PK_TERMINAL || qm.d >= 10) {
              cinta(mCanaleta, aLoc(cs, 'via', -0.32), 0.52, -0.26, 0.08, 0.04, 2.0);
            }
          } else if (id === '050185') {
            const [Em, Nm] = lonlatAUTM(cs[cs.length >> 1][0], cs[cs.length >> 1][1]);
            const qm = Eje3D.proyUTM(Em, Nm);
            const ptsP = aLoc(cs, qm.d < 12 ? 'via' : 'terreno');
            cinta(mPantalla, ptsP, 0.22, -0.25, 3.65, 0, 0.25);
            for (let i = 0; i < ptsP.length; i++) {
              cajaOrientada(mAceroGalv, ptsP[i][0], ptsP[i][2], ptsP[i][1] - 0.3, ptsP[i][1] + 3.72, 1, 0, 0.26, 0.26);
            }
          } else if (id === '030002' || id === '030253') {
            const [Em, Nm] = lonlatAUTM(cs[cs.length >> 1][0], cs[cs.length >> 1][1]);
            const qm = Eje3D.proyUTM(Em, Nm);
            if (qm.enViaducto && qm.d < 18) continue;
            // Evitar que vallados de pasos superiores o cartografía crucen por encima de las vías
            const ptsV = aLoc(cs, 'terreno');
            let seg = [];
            for (let i = 0; i < cs.length; i++) {
              const [Ev, Nv] = lonlatAUTM(cs[i][0], cs[i][1]);
              const qv = Eje3D.proyUTM(Ev, Nv);
              if (qv.d >= 7.5 || qv.enTunel) {
                seg.push(ptsV[i]);
              } else {
                if (seg.length >= 2) valla(mValla, mAlambreValla, inst.posteValla, seg, ALTO_VALLA, matInst);
                seg = [];
              }
            }
            if (seg.length >= 2) valla(mValla, mAlambreValla, inst.posteValla, seg, ALTO_VALLA, matInst);
          } else if (id === '050215') {
            const ptsG = aLoc(cs, 'terreno');
            cinta(mPuerta, ptsG, 0.12, 0, 2.25, 0, 0.3);
            cajaOrientada(mAceroGalv, ptsG[0][0], ptsG[0][2], ptsG[0][1] - 0.1, ptsG[0][1] + 2.4, 1, 0, 0.22, 0.22);
            const uG = ptsG[ptsG.length - 1];
            cajaOrientada(mAceroGalv, uG[0], uG[2], uG[1] - 0.1, uG[1] + 2.4, 1, 0, 0.22, 0.22);
          } else if (id === '040243') {
            cinta(mBionda, aLoc(cs, 'terreno'), 0.14, 0.38, 0.76, 0, 0.4);
          } else if (id === '050197') {
            // Los pasos reconstruidos (pasos-superiores.json) se dibujan enteros en 2c ter; aquí solo los que no lo están
            const [Em, Nm] = lonlatAUTM(cs[cs.length >> 1][0], cs[cs.length >> 1][1]);
            if (PASOS_SUP.length && enPasoSuperior(Em, Nm, km)) continue;
            const qm = Eje3D.proyUTM(Em, Nm);
            // Descartar fragmentos cortos o pegados a una boca de túnel (ej. pretil sobre boca de Alicante PK 485+327)
            if (Eje3D.tuneles.some((t) => Math.min(Math.abs(qm.pk - t.pkIni), Math.abs(qm.pk - t.pkFin)) < 32)) continue;
            let longPs = 0, minOfPs = Infinity, maxOfPs = -Infinity;
            for (let i = 0; i < cs.length; i++) {
              const [Ep, Np] = lonlatAUTM(cs[i][0], cs[i][1]);
              const qp = Eje3D.proyUTM(Ep, Np);
              if (qp.of < minOfPs) minOfPs = qp.of;
              if (qp.of > maxOfPs) maxOfPs = qp.of;
              if (i > 0) {
                const [E0, N0] = lonlatAUTM(cs[i - 1][0], cs[i - 1][1]);
                longPs += Math.hypot(Ep - E0, Np - N0);
              }
            }
            if (longPs < 14 || !(minOfPs < -6 && maxOfPs > 6)) continue;
            // Paso superior: tablero hormigón + calzada asfaltada + marcas viales + pilas + pantallas antivandálicas azules sobre la vía
            const ptsPS = aLoc(cs, 'terreno', 0.14);
            cinta(mHormigonObra, ptsPS, 10.6, -1.05, -0.02, 0.18, 0.12);
            cinta(mAsfalto, ptsPS, 9.2, -0.02, 0.08, 0, 0.15);
            for (const s of [-1, 1]) {
              const ptsBorde = cs.map((c, idx) => {
                const c2 = cs[Math.min(cs.length - 1, idx + 1)], c0 = cs[Math.max(0, idx - 1)];
                const [E, N] = lonlatAUTM(c[0], c[1]);
                const [E2, N2] = lonlatAUTM(c2[0], c2[1]), [E0, N0] = lonlatAUTM(c0[0], c0[1]);
                let dx = E2 - E0, dy = N2 - N0, dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
                const z = (c.length > 2 && c[2] > 5 ? c[2] : cotaTerrenoUTM(E, N)) + 0.15;
                return { E: E - dy * s * 4.95, N: N + dx * s * 4.95, z, dVia: Eje3D.proyUTM(E, N).d };
              });
              cinta(mMarcaVial, ptsBorde.map((b) => L(b.E, b.N, b.z)), 0.18, 0.07, 0.095, 0, 0.2);
              cinta(mBionda, ptsBorde.map((b) => L(b.E, b.N, b.z)), 0.14, 0.35, 0.82, 0, 0.3);
              // Pantalla antivandálica azul Adif en el vano sobre las vías (dVia < 24 m)
              const vanoVia = ptsBorde.filter((b) => b.dVia < 24);
              if (vanoVia.length >= 2) {
                cinta(mMallaAntivand, vanoVia.map((b) => L(b.E, b.N, b.z)), 0.08, 0.08, 2.38, 0, 0.25);
              }
            }
            // Pilas de apoyo en márgenes de la vía (10 m < dVia < 26 m)
            for (let i = 1; i < cs.length - 1; i++) {
              const [E, N] = lonlatAUTM(cs[i][0], cs[i][1]);
              const q = Eje3D.proyUTM(E, N);
              const zSuelo = cotaTerrenoUTM(E, N);
              const zTab = cs[i].length > 2 && cs[i][2] > 5 ? cs[i][2] : zSuelo;
              if (q.d > 9.5 && q.d < 25 && zTab - zSuelo > 2.8) {
                const pPila = L(E, N, zTab);
                cajaOrientada(mHormigonObra, pPila[0], pPila[2], (zSuelo - 0.8) - anclaZ, pPila[1] - 0.9, 1, 0, 1.4, 3.8);
              }
            }
          } else if (id === '040011' || id === '050235') {
            cinta(mHormigonObra, aLoc(cs, 'terreno', 0.12), 8.2, -0.85, -0.02, 0.15, 0.15);
            cinta(mAsfalto, aLoc(cs, 'terreno', 0.12), 7.4, -0.02, 0.08, 0, 0.15);
          } else if (id === '040031' || id === '040217' || id === '030197') {
            // El eje de la carretera que va sobre un paso superior ya lo lleva su tablero (si no, saldría a ras de suelo bajo él)
            if (PASOS_SUP.length) {
              const [Em, Nm] = lonlatAUTM(cs[cs.length >> 1][0], cs[cs.length >> 1][1]);
              if (enPasoSuperior(Em, Nm, km)) continue;
            }
            cinta(mAsfalto, aLoc(cs, 'terreno', 0.06), id === '040031' ? 9.5 : 6.4, -0.14, 0.05, 0.22, 0.15);
          } else if (id === '010127' || id === '050021' || id === '010047') {
            cinta(mCuneta, aLoc(cs, 'terreno', -0.18), 1.15, -0.35, 0.04, 0.35, 0.25);
          } else if (id === '050135' && PASOS_INF.some((pi) => Math.abs((f.properties.pk ?? 0) - pi.pk) < (pi.pkFin - pi.pkIni) / 2 + Math.max(pi.finIzq, pi.finDer) + 5)) {
            continue;
          } else if (id === '050135' || id === '030020' || id === '030203') {
            const [Em, Nm] = lonlatAUTM(cs[cs.length >> 1][0], cs[cs.length >> 1][1]);
            const qm = Eje3D.proyUTM(Em, Nm);
            if (qm.enViaducto && qm.d < 15) continue;
            const altoMuro = id === '030203' ? 2.85 : 1.35;
            cinta(mHormigonObra, aLoc(cs, 'terreno', 0), id === '030203' ? 0.55 : 1.15, -0.95, altoMuro, 0.12, 0.18);
          } else if ((id === '050012' || id === '030240') && cs.length >= 4 && cs[0][0] === cs[cs.length - 1][0] && cs[0][1] === cs[cs.length - 1][1]) {
            let sE = 0, sN = 0, sZ = 0, nP = 0;
            for (const c of cs) {
              const [E, N] = lonlatAUTM(c[0], c[1]);
              const z = c.length > 2 && c[2] > 5 ? c[2] : cotaTerrenoUTM(E, N);
              sE += E; sN += N; sZ += z; nP++;
            }
            const cE = sE / nP, cN = sN / nP, zBase = (sZ / nP) - anclaZ;
            const cLoc = L(cE, cN, sZ / nP);
            centrosPoligEdif.push([cE, cN]);
            let ctCercano = null, distMinCt = Infinity;
            for (const ct of CENTROS_TRACCION_CORREDOR) {
              const d = Math.hypot(ct.e - cE, ct.n - cN);
              if (d < distMinCt) { distMinCt = d; ctCercano = ct; }
            }
            if (ctCercano && distMinCt < 550) {
              if (!centrosTraccionConstruidos.has(ctCercano)) {
                centrosTraccionConstruidos.add(ctCercano);
                const mTang = Eje3D.enPk(ctCercano.pk);
                const ux = mTang.tx, uz = -mTang.ty;
                construirCentroAutotransformador(cLoc[0], cLoc[2], zBase, ux, uz, ctCercano.nombre, `PK ${fmtPk(ctCercano.pk)}`, ctCercano.tipo);
              }
            }
          }
        } else if (g.type === 'Polygon') {
          const ext = g.coordinates[0]; if (!ext || ext.length < 4) continue;
          const pts2 = [];
          let sE = 0, sN = 0, sZ = 0, nP = 0;
          for (const c of ext) {
            const [E, N] = lonlatAUTM(c[0], c[1]);
            const z = c.length > 2 && c[2] > 5 ? c[2] : cotaTerrenoUTM(E, N);
            const pl = L(E, N, z);
            pts2.push([pl[0], pl[2]]);
            sE += E; sN += N; sZ += z; nP++;
          }
          const cE = sE / nP, cN = sN / nP;
          const zBase = (sZ / nP) - anclaZ;
          const cLoc = L(cE, cN, sZ / nP);

          if (id === '050075') {
            centrosPoligEdif.push([cE, cN]);
            if (btsCartoKm.length) continue; // ya la construye construirBtsCartografia con sus elementos reales
            // Solo construir UN complejo completo por estación BTS en este kilómetro (UNA SOLA TORRE ENTRE LAS DOS CASETAS)
            let nombreBts = 'Estación Base GSM-R', pkBts = '';
            let btsCercana = null, distMinBts = Infinity;
            for (const b of (Eje3D.btsInfo || [])) {
              const d = Math.hypot(b.e - cE, b.n - cN);
              if (d < distMinBts) { distMinBts = d; btsCercana = b; }
            }
            if (btsCercana && distMinBts < 450) {
              nombreBts = btsCercana.nombre;
              pkBts = `PK ${fmtPk(btsCercana.pk)}`;
              if (!btsConstruidas.has(btsCercana)) {
                btsConstruidas.add(btsCercana);
                const mTang = Eje3D.enPk(btsCercana.pk);
                const ux = mTang.tx, uz = -mTang.ty;
                construirComplejoBtsGsmr(cLoc[0], cLoc[2], zBase, ux, uz, nombreBts, pkBts);
              }
            }
          } else if (id === '050012' || id === '030240') {
            centrosPoligEdif.push([cE, cN]);
            let ctCercano = null, distMinCt = Infinity;
            for (const ct of CENTROS_TRACCION_CORREDOR) {
              const d = Math.hypot(ct.e - cE, ct.n - cN);
              if (d < distMinCt) { distMinCt = d; ctCercano = ct; }
            }
            if (ctCercano && distMinCt < 550) {
              if (!centrosTraccionConstruidos.has(ctCercano)) {
                centrosTraccionConstruidos.add(ctCercano);
                const mTang = Eje3D.enPk(ctCercano.pk);
                const ux = mTang.tx, uz = -mTang.ty;
                construirCentroAutotransformador(cLoc[0], cLoc[2], zBase, ux, uz, ctCercano.nombre, `PK ${fmtPk(ctCercano.pk)}`, ctCercano.tipo);
              }
            } else {
              const mTang = Eje3D.enPk(Eje3D.proyUTM(cE, cN).pk);
              const ux = mTang.tx, uz = -mTang.ty;
              construirCentroAutotransformador(cLoc[0], cLoc[2], zBase, ux, uz, 'Centro Autotransformador 2×25 kV', `PK ${fmtPk(Eje3D.proyUTM(cE, cN).pk)}`, 'ATI');
            }
          } else if (id === '030051') {
            centrosPoligEdif.push([cE, cN]);
            // Andén de granito con banda podotáctil amarilla + marquesina acristalada sobre soportes metálicos
            prisma(mAnden, pts2, zBase - 0.45, zBase + 0.96);
            prisma(mMarquesina, pts2, zBase + 4.55, zBase + 4.92);
            for (let k = 0; k < pts2.length - 1; k += 2) {
              cajaOrientada(mAceroGalv, pts2[k][0], pts2[k][1], zBase + 0.92, zBase + 4.6, 1, 0, 0.24, 0.24);
            }
          } else if (id === '050134') {
            prisma(mHormigonObra, pts2, zBase - 0.35, zBase + 0.16);
          } else if (id === '050035') {
            // Armario de vía en su huella real: cuerpo metálico de 1,5 m sobre peana de hormigón
            prisma(mHormigonObra, pts2, zBase - 0.2, zBase + 0.15);
            prisma(mArmarioVia, pts2, zBase + 0.15, zBase + 1.55);
          } else if (metaCapa?.grupo === 'edificios') {
            centrosPoligEdif.push([cE, cN]);
            // Edificios y casetas junto a la vía en 3D (modelo Blender caseta-via.glb para casetas; cubiertas inclinadas / petos para edificios)
            const hEd = id === '030025' ? 3.0 : id === '030067' ? 3.5 : id === '030235' ? 6.5 : id === '030129' ? 1.2 : 5.0;
            let areaPol = 0;
            for (let i = 0; i < pts2.length - 1; i++) areaPol += pts2[i][0] * pts2[i + 1][1] - pts2[i + 1][0] * pts2[i][1];
            areaPol = Math.abs(areaPol) / 2;
            const rect = rectMinimo(pts2);
            const esCaseta = id === '030025' || id === '030067' || (id === '030001' && areaPol < 55);
            if (esCaseta && MODELOS.casetaVia && rect && rect.A > 0.6 && rect.B > 0.6) {
              const cxR = rect.sc * rect.ux - rect.tc * rect.uz, czR = rect.sc * rect.uz + rect.tc * rect.ux;
              const yawR = Math.atan2(-rect.uz, rect.ux);
              inst.casetaVia.push(matInst([cxR, zBase, czR], yawR, rect.A * 2, hEd, rect.B * 2));
            } else {
              const mMuro = (id === '030235' || id === '030025' || id === '030067') ? mEdifTec : id === '030129' ? mHormigonObra : mEdif;
              prisma(mMuro, pts2, zBase, zBase + hEd);
              if (rect && areaPol < 750 && areaPol / rect.area > 0.78 && rect.B > 1.2 && id !== '030235' && id !== '030129') {
                cubiertaInclinada(mMuro, mTejaAdif, rect, zBase + hEd, areaPol < 140 ? 'dos' : 'cuatro');
              } else {
                prisma(mCubierta, pts2, zBase + hEd - 0.05, zBase + hEd);
                if (id !== '030129') {
                  for (let i = 0; i < pts2.length - 1; i++) {
                    const [xa, za] = pts2[i], [xb, zb] = pts2[i + 1], u = Math.hypot(xb - xa, zb - za) / 4;
                    mMuro.quad(mMuro.v(xa, zBase + hEd, za, 0, 0), mMuro.v(xb, zBase + hEd, zb, u, 0), mMuro.v(xb, zBase + hEd + 0.45, zb, u, 0.1), mMuro.v(xa, zBase + hEd + 0.45, za, 0, 0.1));
                  }
                }
              }
            }
          } else if (id === '020005' || id === '020135' || id === '020137' || id === '020153') {
            lamina(mAgua, pts2, zBase + 0.12);
          } else if (id === '030080' && !entornoReal) {
            const pArb = L(cE, cN, cotaTerrenoUTM(cE, cN));
            const hArb = 4.5 + (Math.abs(cE * 0.13 + cN * 0.17) % 3.5);
            inst.tronco.push(matInst(pArb, 0, 1.1, hArb * 0.45, 1.1));
            inst.copa.push(matInst([pArb[0], pArb[1] + hArb * 0.38, pArb[2]], cE % 3.14, hArb * 0.52, hArb * 0.56, hArb * 0.52));
          }
        }
      }

      // Garantizar báculos con cámara en todos los pasos superiores (±50 m) cuando no haya ya uno de la cartografía (040235) en ese lado
      for (const ps of PASOS_SUP) {
        if (ps.km !== km) continue;
        const mPs = Eje3D.enPk(ps.pk);
        for (const sPk of [-1, 1]) {
          const pkB = Math.max(Eje3D.pkIni, Math.min(Eje3D.pkFin, ps.pk + sPk * 50));
          const yaCarto = baculosCarto.some((b) => Math.abs(b.pk - pkB) < 40);
          if (yaCarto) continue;
          const mB = Eje3D.enPk(pkB);
          const ofB = sPk > 0 ? 7.8 : -7.8;
          const EB = mB.E - mB.ty * ofB, NB = mB.N + mB.tx * ofB;
          const zBac = Math.max(mB.Z - 0.35, cotaTerrenoUTM(EB, NB));
          const pB = L(EB, NB, zBac);
          const yawCam = Math.atan2(-(mPs.N - NB), mPs.E - EB);
          inst.baculoCamara.push(matInst(pB, yawCam));
          const pMira = L(mPs.E, mPs.N, mPs.Z + 5.2);
          agregarConoCamara(pB[0] + Math.cos(yawCam) * 0.9, pB[1] + 9.05, pB[2] - Math.sin(yawCam) * 0.9, pMira[0], pMira[1], pMira[2]);
          baculosCctvMeta.push({ pk: pkB, E: EB, N: NB, Z: zBac, yaw: yawCam, miraE: mPs.E, miraN: mPs.N, miraZ: mPs.Z + 5.2, nombre: `Báculo CCTV · PS PK ${Math.round(ps.pk)}` });
        }
      }

      // Complejos oficiales de telecomunicaciones GSM-R + Operadores para todas las BTS oficiales de este km.
      // Si la cartografía trae la BTS (punto BTS + contornos de las casetas), se construye tal cual; si no, el modelo tipo.
      for (const b of btsCartoKm) {
        construirBtsCartografia(b.E, b.N, b.contornos);
      }
      for (const b of (Eje3D.btsInfo || [])) {
        if (Math.floor(b.pk / 1000) === km && !btsConstruidas.has(b)) {
          const zSueloBts = cotaTerrenoUTM(b.e, b.n);
          const pB = L(b.e, b.n, zSueloBts);
          const mTang = Eje3D.enPk(b.pk);
          const ux = mTang.tx, uz = -mTang.ty;
          construirComplejoBtsGsmr(pB[0], pB[2], zSueloBts - anclaZ, ux, uz, b.nombre, `PK ${fmtPk(b.pk)}`);
          btsConstruidas.add(b);
        }
      }

      // Complejos oficiales de tracción y autotransformación 2×25 kV (ATI / ATF / Subestaciones) para este km
      for (const ct of (CENTROS_TRACCION_CORREDOR || [])) {
        if (Math.floor(ct.pk / 1000) === km && !centrosTraccionConstruidos.has(ct)) {
          centrosTraccionConstruidos.add(ct);
          const zSueloCt = cotaTerrenoUTM(ct.e, ct.n);
          const pCt = L(ct.e, ct.n, zSueloCt);
          const mTang = Eje3D.enPk(ct.pk);
          const ux = mTang.tx, uz = -mTang.ty;
          construirCentroAutotransformador(pCt[0], pCt[2], zSueloCt - anclaZ, ux, uz, ct.nombre, `PK ${fmtPk(ct.pk)}`, ct.tipo);
        }
      }

      // 3b. Etiquetas flotantes 3D (.etq-edif) ancladas a edificios e instalaciones oficiales georreferenciadas
      for (const ed of edificiosPorKm.get(km) || []) {
        const zSuelo = cotaTerrenoUTM(ed.e, ed.n);

        const el = document.createElement('div');
        el.className = 'etq-edif';
        el.dataset.cat = ed.cat || 'civil';
        const dot = document.createElement('span');
        dot.className = 'etq-dot';
        dot.style.color = COLOR_CAT_EDIF[ed.cat] || '#eab308';
        dot.style.background = COLOR_CAT_EDIF[ed.cat] || '#eab308';
        const box = document.createElement('div');
        box.className = 'etq-txt';
        const bNom = document.createElement('span');
        bNom.className = 'etq-nom';
        bNom.textContent = ed.nombre;
        const bSub = document.createElement('span');
        bSub.className = 'etq-sub';
        bSub.textContent = ed.sub || `PK ${fmtPk(ed.pk)}`;
        box.append(bNom, bSub);
        el.append(dot, box);
        el.addEventListener('pointerdown', (ev) => ev.stopPropagation());
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const pt = datosDePunto(ed.e, ed.n, cotaTerrenoUTM(ed.e, ed.n));
          mostrarFicha(
            ed.cat === 'energia' ? 'Tracción y Autotransformación 2×25 kV' : ed.cat === 'bts' ? 'Comunicaciones GSM-R' : 'Edificación / Instalación ADIF',
            ed.nombre,
            ed.cat === 'energia'
              ? `${ed.sub || ''} · Centro técnico de tracción 2×25 kV 50 Hz. Alimentación directa a hilo de contacto (+25 kV), retorno de carril neutro (0 kV) y feeder (-25 kV).`
              : (ed.sub || ''),
            pt.filas, pt);
        });
        const obj = new CSS2DObject(el);
        const pLbl = L(ed.e, ed.n, zSuelo + (ed.h || 4.5));
        obj.position.set(pLbl[0], pLbl[1], pLbl[2]);
        obj.userData = { esEdificio: true, ed, anclaZ };
        raiz.add(obj);
        etiquetasEdif.push(obj);
      }

      // 3c. Entorno real: edificios de Catastro con su altura LiDAR y cada árbol medido en el LiDAR del IGN.
      // Se agrupan en celdas de 300 m con tres niveles de detalle (THREE.LOD): completo cerca, simplificado a media
      // distancia y oculto lejos (la ortofoto ya los muestra). Así cada celda también se descarta sola si queda fuera de cámara.
      const celdasEnt = new Map();
      const celdaEnt = (x, z) => {
        const k = `${Math.floor(x / CELDA_LOD)},${Math.floor(z / CELDA_LOD)}`;
        let c = celdasEnt.get(k);
        if (!c) {
          c = {
            x: (Math.floor(x / CELDA_LOD) + 0.5) * CELDA_LOD, z: (Math.floor(z / CELDA_LOD) + 0.5) * CELDA_LOD, ySum: 0, yN: 0,
            mEdif: new Malla(), mTeja: new Malla(), mAzotea: new Malla(), mSimple: new Malla(), nEdif: 0,
            arb: { olivo: { tr: [], co: [], col: [] }, almendro: { tr: [], co: [], col: [] }, pino: { tr: [], co: [], col: [] } }, lejos: [], colLejos: [],
          };
          celdasEnt.set(k, c);
        }
        return c;
      };
      let nEdifReal = 0;
      for (const ed of (entornoReal && rEnt.edificios) || []) {
        const a = ed.a; if (!a || a.length < 6) continue;
        const ptsUtm = [];
        let sE = 0, sN = 0;
        for (let i = 0; i < a.length; i += 2) {
          const E = rEnt.e0 + a[i] * 0.1, N = rEnt.n0 + a[i + 1] * 0.1;
          ptsUtm.push([E, N]); sE += E; sN += N;
        }
        const cE = sE / ptsUtm.length, cN = sN / ptsUtm.length;
        // Las instalaciones de Adif ya salen, con su forma propia, de la cartografía de la línea
        if (centrosPoligEdif.some(([e, n]) => (e - cE) ** 2 + (n - cN) ** 2 < 225)) continue;
        if (enZonaEstacion(cE, cN)) continue;
        let zMin = Infinity;
        for (const [E, N] of ptsUtm) zMin = Math.min(zMin, cotaTerrenoUTM(E, N));
        const anillo = ptsUtm.map(([E, N]) => { const p = L(E, N, 0); return [p[0], p[2]]; });
        anillo.push(anillo[0]);
        const y0 = zMin - 0.4 - anclaZ, y1 = zMin + ed.h * 0.1 - anclaZ;
        let cxL = 0, czL = 0;
        for (let i = 0; i < anillo.length - 1; i++) { cxL += anillo[i][0]; czL += anillo[i][1]; }
        const cel = celdaEnt(cxL / (anillo.length - 1), czL / (anillo.length - 1));
        cel.ySum += y0; cel.yN++; cel.nEdif++;
        const mEdifReal = cel.mEdif, mTejaReal = cel.mTeja, mAzoteaReal = cel.mAzotea;
        prisma(mEdifReal, anillo, y0, y1);
        // Cubierta (Catastro no la da): teja a dos o cuatro aguas en las casas bajas y casi rectangulares;
        // azotea con peto en naves grandes, bloques y plantas irregulares
        let areaPol = 0;
        for (let i = 0; i < anillo.length - 1; i++) areaPol += anillo[i][0] * anillo[i + 1][1] - anillo[i + 1][0] * anillo[i][1];
        areaPol = Math.abs(areaPol) / 2;
        const rect = rectMinimo(anillo), azar = hash2(cE, cN);
        const inclinada = rect && ed.h <= 90 && areaPol < 650 && areaPol / rect.area > 0.82 && rect.B > 1.5 && azar < 0.8;
        if (inclinada) {
          cubiertaInclinada(mEdifReal, mTejaReal, rect, y1, azar < 0.45 ? 'dos' : 'cuatro');
        } else {
          lamina(mAzoteaReal, anillo, y1 + 0.02);
          // Peto perimetral de 50 cm: solo paredes (la tapa de prisma() taparía la azotea)
          for (let i = 0; i < anillo.length - 1; i++) {
            const [xa, za] = anillo[i], [xb, zb] = anillo[i + 1], u = Math.hypot(xb - xa, zb - za) / 5.2;
            mEdifReal.quad(mEdifReal.v(xa, y1, za, 0, 0), mEdifReal.v(xb, y1, zb, u, 0), mEdifReal.v(xb, y1 + 0.5, zb, u, 0.09), mEdifReal.v(xa, y1 + 0.5, za, 0, 0.09));
          }
        }
        // Nivel medio: caja del rectángulo mínimo (o la huella con la mitad de vértices si no es rectangular)
        if (rect && areaPol / rect.area > 0.7) {
          const P = (s, t) => [s * rect.ux - t * rect.uz, s * rect.uz + t * rect.ux];
          const caja = [P(rect.sc - rect.A, rect.tc - rect.B), P(rect.sc + rect.A, rect.tc - rect.B), P(rect.sc + rect.A, rect.tc + rect.B), P(rect.sc - rect.A, rect.tc + rect.B)];
          caja.push(caja[0]);
          prisma(cel.mSimple, caja, y0, y1);
        } else {
          const red = anillo.length > 13 ? anillo.filter((_, i) => i % 2 === 0) : anillo.slice();
          if (red[red.length - 1] !== red[0]) red.push(red[0]);
          prisma(cel.mSimple, red, y0, y1);
        }
        nEdifReal++;
      }
      if (arbolesReal && grupos.entorno) {
        const { n, dat, e0, n0 } = arbolesReal;
        // Especie (no la da el LiDAR): por encima de 6 m pino carrasco; por debajo, olivo o almendro, igual en toda
        // la parcela (celdas de ~45 m en la orientación dominante de los bancales) para que cada finca sea homogénea
        const cTmp = new THREE.Color();
        for (let i = 0; i < n; i++) {
          const E = e0 + dat[i * 4] * 0.1, N = n0 + dat[i * 4 + 1] * 0.1, r = dat[i * 4 + 3] * 0.1;
          // El MDS normalizado viene en metros enteros: un olivo de 2,4 m llega como 2. Copa nunca más plana que 0,9 × radio
          const h = Math.max(1.4, dat[i * 4 + 2] * 0.1 + 0.4, r * 1.25);
          const p = L(E, N, cotaTerrenoUTM(E, N));
          const yaw = hash2(E, N) * 6.28, var1 = hash2(N, E), var2 = hash2(E * 0.7, N * 1.3);
          const tipo = h >= 6 ? 'pino' : hash2(Math.floor((E + 0.35 * N) / 45), Math.floor((N - 0.35 * E) / 45)) < 0.58 ? 'olivo' : 'almendro';
          const cel = celdaEnt(p[0], p[2]);
          cel.ySum += p[1]; cel.yN++;
          const s = cel.arb[tipo];
          let altoCopa, fuste, rTr;
          if (tipo === 'pino') { altoCopa = h * (0.38 + var2 * 0.12); fuste = h - altoCopa * 0.7; rTr = 0.12 + h * 0.012; }
          else if (tipo === 'olivo') { altoCopa = Math.min(h * 0.8, Math.max(1.0, r * 1.5)); fuste = h - altoCopa * 0.85; rTr = 0.09 + r * 0.05; }
          else { altoCopa = Math.min(h * 0.75, Math.max(1.0, r * 1.6)); fuste = h - altoCopa * 0.8; rTr = 0.07 + r * 0.035; }
          fuste = Math.max(0.35, fuste);
          s.tr.push(matInst(p, yaw, rTr, fuste + altoCopa * 0.25, rTr));
          const rx = r * (0.9 + var1 * 0.2), rz = r * (0.9 + var2 * 0.2);
          s.co.push(matInst([p[0], p[1] + h - altoCopa, p[2]], yaw, rx, altoCopa, rz));
          s.col.push(cTmp.copy(ARB.tinte[tipo]).offsetHSL((var1 - 0.5) * 0.04, (var2 - 0.5) * 0.1, (var1 - 0.5) * 0.1).clone());
          // Nivel medio: una sola copa sencilla (20 triángulos) por árbol, sin tronco
          cel.lejos.push(matInst([p[0], p[1] + h - altoCopa, p[2]], yaw, rx, altoCopa, rz));
          cel.colLejos.push(s.col[s.col.length - 1]);
        }
      }

      // Montaje de las celdas: un THREE.LOD por celda y por familia (edificios en su grupo, árboles en el de entorno)
      const fichaEd = {
        capa: 'Edificios',
        nombre: 'Edificaciones del entorno (Catastro)',
        info: `${nEdifReal} edificios en este kilómetro: huella y plantas de Catastro INSPIRE, altura medida con el LiDAR PNOA del IGN (MDS normalizado de edificación, 2,5 m). La cubierta es supuesta.`,
      };
      const fichaArb = {
        capa: 'Entorno',
        nombre: 'Arbolado real (LiDAR PNOA, IGN)',
        info: `${arbolesReal?.n || 0} árboles en este kilómetro, cada uno en su sitio y con su altura y copa medidas: máximos locales del MDS normalizado de vegetación del IGN (2,5 m). La especie es supuesta: pino por encima de 6 m; olivo o almendro por parcela.`,
      };
      // En los km urbanos (miles de edificios) sin sombra proyectada; la ortofoto ya trae la sombra real
      const sombraEdif = nEdifReal < 600;
      const mallaCelda = (m, material, c, cy, sombra) => {
        const g = m.construir(true);
        g.translate(-c.x, -cy, -c.z);
        const mesh = new THREE.Mesh(g, material);
        mesh.castShadow = sombra; mesh.receiveShadow = true;
        mesh.userData = fichaEd;
        return mesh;
      };
      const instCelda = (arr, cols, geo, material, c, cy, sombra) => {
        if (!arr.length) return null;
        const im = new THREE.InstancedMesh(geo, material, arr.length);
        for (let i = 0; i < arr.length; i++) {
          const mt = arr[i];
          mt.elements[12] -= c.x; mt.elements[13] -= cy; mt.elements[14] -= c.z;
          im.setMatrixAt(i, mt);
          if (cols) im.setColorAt(i, cols[i]);
        }
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
        im.castShadow = sombra; im.receiveShadow = true;
        im.userData = fichaArb;
        return im;
      };
      for (const c of celdasEnt.values()) {
        const cy = c.yN ? c.ySum / c.yN : 0;
        if (c.nEdif && grupos.edificios) {
          const cerca = new THREE.Group(), media = new THREE.Group();
          for (const [m, mat] of [[c.mEdif, matEdifCivil], [c.mTeja, matTejaArabe], [c.mAzotea, matCubiertaPlana]]) {
            if (!m.vacia) cerca.add(mallaCelda(m, mat, c, cy, sombraEdif));
          }
          if (!c.mSimple.vacia) media.add(mallaCelda(c.mSimple, matEdifCivil, c, cy, false));
          const lod = new THREE.LOD();
          lod.addLevel(cerca, 0);
          lod.addLevel(media, LOD_EDIF_MEDIO);
          lod.addLevel(new THREE.Object3D(), LOD_EDIF_FUERA);
          lod.position.set(c.x, cy, c.z);
          grupos.edificios.add(lod);
        }
        if (c.lejos.length && grupos.entorno) {
          const cerca = new THREE.Group(), media = new THREE.Group();
          const a = c.arb;
          // Olivos y almendros sin sombra proyectada: son miles (medido en PK 439+860: 36 fps sin entorno, 26 con
          // sombra, 31 sin ella); la ortofoto ya trae su sombra real
          for (const im of [
            instCelda(a.olivo.tr, null, ARB.troncoOlivo, ARB.matTronco, c, cy, false),
            instCelda(a.almendro.tr, null, ARB.troncoRecto, ARB.matTronco, c, cy, false),
            instCelda(a.pino.tr, null, ARB.troncoRecto, ARB.matTronco, c, cy, true),
            instCelda(a.olivo.co, a.olivo.col, ARB.copaOlivo, ARB.matCopa, c, cy, false),
            instCelda(a.almendro.co, a.almendro.col, ARB.copaAlmendro, ARB.matCopa, c, cy, false),
            instCelda(a.pino.co, a.pino.col, ARB.copaPino, ARB.matCopa, c, cy, true),
          ]) if (im) cerca.add(im);
          const imL = instCelda(c.lejos, c.colLejos, COPA_LEJANA, ARB.matCopa, c, cy, false);
          if (imL) media.add(imL);
          const lod = new THREE.LOD();
          lod.addLevel(cerca, 0);
          lod.addLevel(media, LOD_ARB_MEDIO);
          lod.addLevel(new THREE.Object3D(), LOD_ARB_FUERA);
          lod.position.set(c.x, cy, c.z);
          grupos.entorno.add(lod);
        }
      }

      // 4. Empaquetar geometrías acumuladas en mallas optimizadas por los 7 grupos oficiales de meta.json
      const addMalla = (malla, material, idGrupo, idCapaRef, sombra = false, conUV = false) => {
        if (malla.vacia || !grupos[idGrupo]) return;
        const mesh = new THREE.Mesh(malla.construir(conUV), material);
        mesh.castShadow = sombra;
        mesh.receiveShadow = true;
        mesh.userData = fichaElemento(idCapaRef, null, pkCentro);
        grupos[idGrupo].add(mesh);
      };
      const addHilos = (arrSeg, colorHex, idGrupo, nombre, info) => {
        if (!arrSeg.length || !grupos[idGrupo]) return;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(arrSeg, 3));
        const ln = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: colorHex }));
        ln.userData = { capa: 'Catenaria y señalización', nombre, info };
        grupos[idGrupo].add(ln);
      };

      addMalla(mSubbal, matSubbalasto, 'plataforma', '050055', false, true);
      addMalla(mBal, matBalasto, 'via', '050117', false, true);
      addMalla(mCarAlma, matCarrilAlma, 'via', '050177', false, true);
      addMalla(mCarCab, matCarrilCabeza, 'via', '050177', false, true);
      addMalla(mHiloContacto, matCobreContacto, 'catenaria', '040242', false, true);

      addMalla(mViadTablero, matHormigonViad, 'estructuras', '050025', true, true);
      addMalla(mApoyoViad, mat('#272b33', 1, { metalness: 0.55, roughness: 0.45 }), 'estructuras', '050025');
      addMalla(mPretil, mat('#cbd5e1', 0.78, { roughness: 0.35, metalness: 0.25 }), 'estructuras', '050025');
      addMalla(mAceroGalv, mat('#94a3b8', 1, { metalness: 0.65, roughness: 0.35 }), 'estructuras', '050025', true);
      addMalla(mTunelBoveda, mat('#64707d', 1, { roughness: 0.88 }), 'estructuras', '050020', false, true);
      addMalla(mTunelAcera, mat('#9ca3af', 1, { roughness: 0.85 }), 'estructuras', '050020', false, true);
      addMalla(mBarandillaTunel, mat('#eab308', 1, { metalness: 0.35, roughness: 0.4 }), 'estructuras', '050020');
      addMalla(mHormigonObra, matHormigonViad, 'estructuras', '030203', true, true);

      addHilos(segContacto, '#9a5833', 'catenaria', 'Hilo de contacto EAC-350 (Cu-Ag)', `PK ${fmtPk(pkCentro)} · Altura nominal constante 5,30 m alineada sobre el eje de vía.`);
      addHilos(segSustent, '#475569', 'catenaria', 'Cable sustentador y celosía EAC-350', `PK ${fmtPk(pkCentro)} · Sustentador de bronce compensado mecánicamente y arriostramientos.`);
      addHilos(segPendolas, '#64748b', 'catenaria', 'Péndolas equipotenciales EAC-350', `PK ${fmtPk(pkCentro)} · Péndolas verticales de bronce cada 4,6 m entre sustentador e hilo de contacto.`);
      addHilos(segFeeder, '#334155', 'catenaria', 'Feeder negativo 2×25 kV', `PK ${fmtPk(pkCentro)} · Conductor de retorno/alimentación suspendido en cabeza de poste.`);

      addMalla(mCanaleta, matCanaleta, 'plataforma', '050150', false, true);
      addMalla(mCuneta, mat('#9ba3ab'), 'plataforma', '010127', false, true);
      addMalla(mAsfalto, mat('#3b4048', 1, { roughness: 0.9 }), 'viales', '050197', false, true);
      addMalla(mZahorraPI, mat('#a8987c', 1, { roughness: 0.95 }), 'estructuras', '050135', false, true);
      addMalla(mMarcaVial, mat('#f1f5f9', 1, { roughness: 0.5 }), 'viales', '050197');
      addMalla(mMallaAntivand, mat('#1d4ed8', 0.62, { metalness: 0.3, roughness: 0.4 }), 'estructuras', '050197');
      addMalla(mBionda, mat('#aeb7c2', 1, { metalness: 0.72, roughness: 0.32 }), 'viales', '040243');
      addMalla(mPantalla, mat('#2d7a6e', 1, { roughness: 0.65 }), 'estructuras', '050185', true, true);
      // Vallado: malla de simple torsión con textura en rombo (como el entorno de la caseta GSM-R)
      addMalla(mValla, MAT_MALLA_VALLA, 'viales', '030002', false, true);
      addMalla(mAlambreValla, mat('#9aa3a6', 1, { metalness: 0.5, roughness: 0.45 }), 'viales', '030002');
      addMalla(mPuerta, mat('#10b981', 1, { metalness: 0.35, roughness: 0.45 }), 'viales', '050215', true);
      addMalla(mEdif, matEdifCivil, 'edificios', '030001', true, true);
      addMalla(mEdifTec, matEdifTecnico, 'edificios', '030235', true, true);
      addMalla(mCubierta, matCubiertaPlana, 'edificios', '030001', true, true);
      addMalla(mTejaAdif, matTejaArabe, 'edificios', '030001', true, true);
      addMalla(mAnden, matAndenGranito, 'edificios', '030051', false, true);
      addMalla(mMarquesina, mat('#dbe4ee', 0.86, { metalness: 0.45, roughness: 0.22 }), 'edificios', '030051', true, true);
      addMalla(mSubest, mat('#a8a29e'), 'estructuras', '050012', true, true);
      addMalla(mArmarioVia, mat('#94a3b8', 1, { metalness: 0.35, roughness: 0.5 }), 'catenaria', '050035', true);
      addMalla(mTrafo, mat('#2d3748', 1, { metalness: 0.65, roughness: 0.35 }), 'estructuras', '050012', true);
      addMalla(mAisladorAT, mat('#854d0e', 1, { roughness: 0.28, metalness: 0.15 }), 'estructuras', '050012', true);
      addMalla(mCajaControl, mat('#be123c', 1, { metalness: 0.15, roughness: 0.45 }), 'estructuras', '050012', true);
      addMalla(mAgua, mat('#2b7bbb', 0.88, { roughness: 0.12, metalness: 0.38 }), 'entorno', '020137', false, true);

      const addInst = (arr, geo, material, idGrupo, idCapaRef, sombra = false) => {
        if (!arr.length || !grupos[idGrupo]) return null;
        const im = new THREE.InstancedMesh(geo, material, arr.length);
        for (let i = 0; i < arr.length; i++) im.setMatrixAt(i, arr[i]);
        im.instanceMatrix.needsUpdate = true;
        im.castShadow = sombra;
        im.receiveShadow = true;
        im.userData = fichaElemento(idCapaRef, null, pkCentro);
        grupos[idGrupo].add(im);
        return im;
      };

      addInst(inst.traviesa, GEO.traviesa, matTraviesa, 'via', '050117');
      // Sujeciones: un InstancedMesh por tramo de 100 m y pieza; se encienden solo a menos de DIST_SUJECION de la cámara
      const sujeciones = [];
      if (grupos.via) {
        for (const { mats, p } of inst.sujecion.values()) {
          const tramo = new THREE.Group();
          tramo.userData = { centro: new THREE.Vector3(p[0], p[1], p[2]) };
          for (const [geo, matS] of [[GEO.placaAsiento, MAT_PLACA_GUIA], [GEO.grapa, MAT_GRAPA], [GEO.tirafondo, MAT_TIRAFONDO]]) {
            const im = new THREE.InstancedMesh(geo, matS, mats.length);
            for (let i = 0; i < mats.length; i++) im.setMatrixAt(i, mats[i]);
            im.instanceMatrix.needsUpdate = true;
            im.computeBoundingSphere();
            im.userData = fichaElemento('050117', null, pkCentro);
            im.userData.nombre = 'Sujeción de carril';
            im.userData.info = 'Sujeción elástica tipo Vossloh SKL sobre traviesa monobloque: grapa de varilla en verde Adif, placa guía acodada, tirafondo con arandela y placa de asiento de 10 mm bajo el patín del carril UIC 60. Una cada 0,6 m por carril (aquí se dibuja una por traviesa del modelo, cada 1,25 m).';
            tramo.add(im);
          }
          for (const c of tramo.children) c.visible = false;
          grupos.via.add(tramo);
          sujeciones.push(tramo);
        }
      }
      if (MODELOS.baculoCamara) {
        for (const parte of MODELOS.baculoCamara) {
          const im = addInst(inst.baculoCamara, parte.geo, parte.mat, 'catenaria', '040235', parte.nombre === 'VerdeBaculo');
          if (im) im.userData.baculosCctv = baculosCctvMeta;
        }
      } else {
        const im = addInst(inst.baculoCamara, GEO.poste, mat('#0f4336', 1, { metalness: 0.05, roughness: 0.5 }), 'catenaria', '040235', true);
        if (im) im.userData.baculosCctv = baculosCctvMeta;
      }
      if (MODELOS.casetaVia) {
        for (const parte of MODELOS.casetaVia) addInst(inst.casetaVia, parte.geo, parte.mat, 'edificios', '030025', true);
      }
      addInst(inst.hitoPk, GEO.hitoPk, mat('#f8fafc'), 'via', '050155');
      if (MODELOS.poste) {
        // Poste HEB 240 modelado en Blender (fuste, placa de anclaje, pernos, cartelas, macizo, abrazaderas,
        // placa de Adif y cable de tierra): una instancia por material
        for (const parte of MODELOS.poste) addInst(inst.poste, parte.geo, parte.mat, 'catenaria', '040242', parte.nombre === 'PinturaVerdeAdif');
      } else {
        // Postes pintados en verde Adif (RAL 6005 verde musgo)
        addInst(inst.poste, GEO.poste, mat('#0f4336', 1, { metalness: 0.05, roughness: 0.5 }), 'catenaria', '040242', true);
        addInst(inst.cimientoPoste, GEO.cimientoPoste, mat('#b8b4aa'), 'catenaria', '040242');
        addInst(inst.placaPoste, GEO.placaPoste, mat('#1d4ed8', 1, { roughness: 0.4 }), 'catenaria', '040242');
      }
      addInst(inst.contrapeso, GEO.contrapeso, mat('#475569', 1, { metalness: 0.62, roughness: 0.38 }), 'catenaria', '040242');
      addInst(inst.mensula, GEO.mensula, mat('#9aa5b1', 1, { metalness: 0.72, roughness: 0.28 }), 'catenaria', '040242');
      if (MODELOS.aislador) {
        // Aislador compuesto modelado en Blender (campanas de silicona y herrajes) en lugar del cilindro cian
        for (const parte of MODELOS.aislador) addInst(inst.aislador, parte.geo, parte.mat, 'catenaria', '040242');
      } else {
        addInst(inst.aislador, GEO.aislador, mat('#38bdf8', 0.88, { roughness: 0.22, metalness: 0.1 }), 'catenaria', '040242');
      }
      addInst(inst.senalPoste, GEO.senalPoste, mat('#334155', 1, { metalness: 0.45, roughness: 0.45 }), 'catenaria', '040235', true);
      addInst(inst.senalFoco, GEO.senalFoco, numSenal % 3 === 0 ? matBalizaRoja : matSalidaEmerg, 'catenaria', '040235');
      addInst(inst.baliza, GEO.baliza, mat('#eab308', 1, { roughness: 0.4 }), 'catenaria', '050247');
      addInst(inst.armario, GEO.armario, mat('#94a3b8', 1, { metalness: 0.35, roughness: 0.5 }), 'catenaria', '050035', true);
      addInst(inst.arqueta, GEO.arqueta, mat('#949ca6', 1, { metalness: 0.25, roughness: 0.65 }), 'plataforma', '050134');
      addInst(inst.posteValla, GEO.posteValla, mat('#9aa3a6', 1, { metalness: 0.5, roughness: 0.45 }), 'viales', '030002', true);
      addInst(inst.tronco, GEO.tronco, mat('#6b4f35'), 'entorno', '030080');
      addInst(inst.copa, GEO.copa, mat('#4a6e3d', 1, { roughness: 0.92 }), 'entorno', '030080', true);
      addInst(inst.copaOlivo, GEO.copaOlivo, mat('#6c7d56', 1, { roughness: 0.90 }), 'entorno', '090092', true);
      addInst(inst.farola, GEO.farola, mat('#64748b', 1, { metalness: 0.6 }), 'viales', '040191', true);
      addInst(inst.foco, GEO.foco, inst.foco.length === 1 ? matBalizaRoja : matFoco, 'viales', '040191');
      addInst(inst.lumTunel, GEO.lumTunel, matLumTunel, 'estructuras', '050020');
      addInst(inst.cartelTunel, GEO.cartelTunel, matSalidaEmerg, 'estructuras', '050020');

      let meshConosCamara = null;
      if (!mConoCamara.vacia) {
        meshConosCamara = new THREE.Mesh(
          mConoCamara.construir(false),
          new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
        );
        meshConosCamara.visible = Boolean(ctx.getConosCamara?.());
        meshConosCamara.renderOrder = 5;
        raiz.add(meshConosCamara);
      }

      grupoTeselas.add(raiz);
      teselasCargadas.set(km, { km, anclaE, anclaN, anclaZ, raiz, grupos, etiquetas, etiquetasEdif, sujeciones, meshConosCamara });
      if (!entornoReal && grupos.edificios) {
        cargarEdificiosOsmKm({
          km, anclaE, anclaN, anclaZ,
          utmALonlat, lonlatAUTM, cotaTerrenoUTM,
          enZonaEstacion, Eje3D,
          THREE, Malla, prisma, lamina, matEdifCivil, matCubiertaPlana,
          grupoEdificios: grupos.edificios,
          vivo: () => teselasCargadas.has(km),
        });
      }
      if (ultimoKmCentral >= 0) recortarCacheTeselas(ultimoKmCentral);
    } catch (err) {
      console.error('Error al construir tesela ' + km + ':', err);
    } finally {
      teselasEnVuelo.delete(km);
    }
  }


  function recortarCacheTeselas(kmCentral) {
    if (teselasCargadas.size <= MAX_TESELAS_CACHE) return;
    const orden = [...teselasCargadas.keys()].sort((a, b) => Math.abs(b - kmCentral) - Math.abs(a - kmCentral));
    while (teselasCargadas.size > MAX_TESELAS_CACHE && orden.length) {
      const kmBorrar = orden.shift();
      if (Math.abs(kmBorrar - kmCentral) <= RADIO_TESELAS) break;
      const t = teselasCargadas.get(kmBorrar);
      if (!t) continue;
      for (const e of t.etiquetas) t.raiz.remove(e);
      for (const e of t.etiquetasEdif || []) t.raiz.remove(e);
      t.raiz.traverse((o) => {
        if ((o.isMesh || o.isLineSegments) && o.geometry && !o.geometry.userData?.compartida) o.geometry.dispose();
      });
      grupoTeselas.remove(t.raiz);
      teselasCargadas.delete(kmBorrar);
      HashCotas.quitarKm(kmBorrar);
    }
  }

  function gestionarStreaming(pkObs) {
    const kmC = Math.floor(pkObs / 1000);
    if (kmC !== ultimoKmCentral) {
      ultimoKmCentral = kmC;
      for (let d = 0; d <= RADIO_TESELAS; d++) {
        cargarTeselaKm(kmC + d);
        if (d > 0) cargarTeselaKm(kmC - d);
      }
      recortarCacheTeselas(kmC);
    }
    const p = Eje3D.enPk(pkObs);
    actualizarVentanaTerreno(p.E, p.N);
  }


  return {
    teselasCargadas,
    grupoTeselas,
    cargarTeselaKm,
    recortarCacheTeselas,
    gestionarStreaming,
  };
}
