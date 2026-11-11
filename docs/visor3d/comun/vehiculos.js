/* Vehículos de carretera para los visores 3D: turismo, todoterreno, furgoneta, moto, tráiler y autobús. Cada uno es UNA malla
   (cajas y ruedas cilíndricas fusionadas con el color por vértice), así que mover veinte vehículos cuesta veinte llamadas de dibujo.
   Sistema local: x = ancho, y = altura sobre el suelo, z = largo con el frente hacia -z. */
(function () {
  let T = null, merge = null;
  const CRISTAL = '#1b2630', NEUMATICO = '#141618', FARO = '#fff4c8', PILOTO = '#c01616', CROMO = '#aeb4b8', PLASTICO = '#25282b';

  /** partes: [w, h, d, x, y, z, color] (caja) o ['r', radio, grosor, x, y, z, color] (rueda con eje en x) */
  function geoVehiculo(partes) {
    const c = new T.Color();
    const geos = partes.map((p) => {
      let g;
      if (p[0] === 'r') { g = new T.CylinderGeometry(p[1], p[1], p[2], 14); g.rotateZ(Math.PI / 2); g.translate(p[3], p[4], p[5]); c.set(p[6]); }
      else { g = new T.BoxGeometry(p[0], p[1], p[2]); g.translate(p[3], p[4], p[5]); c.set(p[6]); }
      const n = g.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
    });
    const u = merge(geos, false); geos.forEach((g) => g.dispose()); return u;
  }
  const ruedas = (r, ancho, xs, zs) => zs.flatMap((z) => xs.map((x) => ['r', r, ancho, x, r, z, NEUMATICO]));
  const llantas = (r, ancho, xs, zs) => zs.flatMap((z) => xs.map((x) => ['r', r * 0.55, ancho + 0.02, x, r, z, CROMO]));

  const modelos = {
    coche: (c) => [
      [1.78, 0.5, 4.3, 0, 0.55, 0, c], [1.7, 0.18, 1.0, 0, 0.84, -1.35, c], [1.7, 0.1, 0.9, 0, 0.82, 1.55, c],         // carrocería, capó y maletero
      [1.56, 0.5, 2.05, 0, 1.08, 0.2, CRISTAL], [1.5, 0.08, 1.7, 0, 1.36, 0.2, c],                                      // habitáculo y techo
      [0.1, 0.1, 0.2, -0.95, 0.95, -0.55, c], [0.1, 0.1, 0.2, 0.95, 0.95, -0.55, c],                                    // retrovisores
      [1.75, 0.2, 0.12, 0, 0.32, -2.15, PLASTICO], [1.75, 0.2, 0.12, 0, 0.32, 2.15, PLASTICO],                          // parachoques
      [0.3, 0.1, 0.05, -0.62, 0.68, -2.17, FARO], [0.3, 0.1, 0.05, 0.62, 0.68, -2.17, FARO], [0.3, 0.1, 0.05, -0.62, 0.7, 2.17, PILOTO], [0.3, 0.1, 0.05, 0.62, 0.7, 2.17, PILOTO],
      ...ruedas(0.32, 0.22, [-0.86, 0.86], [-1.38, 1.38]), ...llantas(0.32, 0.22, [-0.86, 0.86], [-1.38, 1.38])
    ],
    suv: (c, limpio) => [
      [1.92, 0.7, 4.6, 0, 0.82, 0, c], [1.8, 0.58, 2.8, 0, 1.45, 0.3, CRISTAL], [1.76, 0.08, 2.6, 0, 1.78, 0.3, c],
      [0.12, 0.1, 0.22, -1.02, 1.2, -0.95, c], [0.12, 0.1, 0.22, 1.02, 1.2, -0.95, c], ...(limpio ? [] : [[1.6, 0.06, 0.06, 0, 1.86, 0.3, PLASTICO]]),   // barra del techo (el vehiculo «limpio» no la lleva)
      [1.9, 0.24, 0.14, 0, 0.4, -2.3, PLASTICO], [1.9, 0.24, 0.14, 0, 0.4, 2.3, PLASTICO],
      [0.36, 0.12, 0.05, -0.65, 0.85, -2.32, FARO], [0.36, 0.12, 0.05, 0.65, 0.85, -2.32, FARO], [0.34, 0.14, 0.05, -0.68, 0.9, 2.32, PILOTO], [0.34, 0.14, 0.05, 0.68, 0.9, 2.32, PILOTO],
      ...ruedas(0.38, 0.26, [-0.92, 0.92], [-1.45, 1.45]), ...llantas(0.38, 0.26, [-0.92, 0.92], [-1.45, 1.45])
    ],
    furgoneta: (c) => [
      [2.0, 1.9, 5.0, 0, 1.35, 0.35, c], [1.92, 0.8, 1.15, 0, 1.55, -2.35, CRISTAL], [1.96, 0.7, 0.9, 0, 0.75, -2.55, c],
      [0.12, 0.1, 0.22, -1.08, 1.5, -2.2, c], [0.12, 0.1, 0.22, 1.08, 1.5, -2.2, c],
      [2.0, 0.24, 0.14, 0, 0.42, -2.9, PLASTICO], [2.0, 0.24, 0.14, 0, 0.42, 2.85, PLASTICO],
      [0.4, 0.14, 0.05, -0.7, 0.85, -3.0, FARO], [0.4, 0.14, 0.05, 0.7, 0.85, -3.0, FARO], [0.16, 0.5, 0.05, -0.9, 1.1, 2.86, PILOTO], [0.16, 0.5, 0.05, 0.9, 1.1, 2.86, PILOTO],
      ...ruedas(0.36, 0.24, [-0.92, 0.92], [-1.75, 1.7]), ...llantas(0.36, 0.24, [-0.92, 0.92], [-1.75, 1.7])
    ],
    moto: (c) => [
      [0.3, 0.42, 1.0, 0, 0.72, 0.15, c], [0.22, 0.22, 0.5, 0, 0.95, -0.2, c],                                          // depósito y carenado
      [0.26, 0.1, 0.7, 0, 0.86, 0.65, '#1c1e20'], [0.7, 0.05, 0.05, 0, 1.12, -0.5, '#8e969a'],                         // asiento y manillar
      ['r', 0.31, 0.12, 0, 0.31, -0.8, NEUMATICO], ['r', 0.33, 0.16, 0, 0.33, 0.85, NEUMATICO], ['r', 0.17, 0.13, 0, 0.31, -0.8, CROMO], ['r', 0.18, 0.17, 0, 0.33, 0.85, CROMO],
      [0.12, 0.5, 0.1, 0.0, 0.6, -0.55, '#8e969a'],
      [0.42, 0.62, 0.34, 0, 1.28, 0.22, '#1d2a3e'], [0.3, 0.3, 0.3, 0, 1.78, 0.12, '#d8d8d4'], [0.26, 0.1, 0.2, 0, 1.78, -0.04, CRISTAL],   // piloto con casco
      [0.2, 0.1, 0.05, 0, 0.9, -0.72, FARO], [0.2, 0.08, 0.05, 0, 0.9, 1.05, PILOTO]
    ],
    trailer: (c, c2) => [
      [2.5, 0.35, 15.2, 0, 0.62, 0, '#2a2d30'], [2.45, 2.6, 2.3, 0, 1.95, -6.1, c], [2.46, 0.5, 2.31, 0, 3.0, -6.1, c], [2.3, 0.95, 0.06, 0, 2.4, -7.26, CRISTAL],   // cabina
      [2.5, 0.3, 0.2, 0, 0.5, -7.3, PLASTICO], [0.5, 0.5, 0.3, 1.0, 3.5, -5.9, CROMO], [0.12, 1.4, 0.12, 1.25, 3.6, -5.2, CROMO],                                 // paragolpes, faro y tubo de escape
      [0.18, 0.12, 0.3, -1.3, 2.4, -6.4, c], [0.18, 0.12, 0.3, 1.3, 2.4, -6.4, c],
      [2.55, 3.3, 11.0, 0, 2.5, 1.6, c2], [2.57, 0.12, 11.0, 0, 4.2, 1.6, '#cfd3d6'], [2.58, 0.22, 11.0, 0, 0.98, 1.6, '#35393d'],                              // caja y faldones
      [2.6, 0.08, 0.1, 0, 1.2, 7.1, '#c9a020'], [2.3, 0.14, 0.05, 0, 0.9, 7.15, PILOTO],
      ...ruedas(0.52, 0.32, [-1.0, 1.0, -1.35, 1.35], [-6.5]).filter((_, i) => i < 2), ...llantas(0.52, 0.32, [-1.0, 1.0], [-6.5]),
      ...ruedas(0.52, 0.32, [-1.1, 1.1], [-2.1, -0.85, 4.4, 5.6, 6.8]), ...llantas(0.52, 0.32, [-1.1, 1.1], [-2.1, -0.85, 4.4, 5.6, 6.8])
    ],
    autobus: (c) => [
      [2.55, 3.0, 12.0, 0, 2.0, 0, c], [2.58, 0.95, 10.6, 0, 2.55, 0.2, CRISTAL], [2.57, 0.28, 12.0, 0, 1.2, 0, '#2d3a63'], [2.52, 0.12, 12.0, 0, 3.55, 0, '#d4d8da'],
      [2.3, 1.25, 0.06, 0, 2.6, -6.03, CRISTAL], [2.3, 0.14, 0.05, 0, 0.75, -6.03, FARO], [2.3, 0.14, 0.05, 0, 0.75, 6.03, PILOTO], [1.0, 0.2, 0.05, 0, 3.15, -6.04, '#f2b600'],
      [0.9, 0.5, 0.9, 0, 3.8, 1.5, '#cfd3d6'],
      ...ruedas(0.52, 0.34, [-1.1, 1.1], [-4.0, 4.0, 5.0]), ...llantas(0.52, 0.34, [-1.1, 1.1], [-4.0, 4.0, 5.0])
    ]
  };
  window.Vehiculos3D = { init(THREE, mergeGeometries) { T = THREE; merge = mergeGeometries; }, geoVehiculo, modelos };
})();
