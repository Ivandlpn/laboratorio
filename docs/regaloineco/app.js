/**
 * REGALO SOLIDARIO INECO 2026 - CALENDARIO DE ADVIENTO FERROVIARIO
 * Base de Mantenimiento de Monforte del Cid (Alicante)
 * Licitación Oficial: Expediente 20260923-00341
 */

// ==========================================
// 1. DATOS OFICIALES DE LOS 9 REGALOS
// ==========================================
const GIFTS_DATA = [
  {
    day: 1,
    title: "Aceite de Oliva Virgen Extra (AOVE)",
    subtitle: "D.O. de Andalucía • Botella Vidrio 500 ml",
    badge: "Producto 1 • Oro Líquido",
    price: "4,50 € / ud (PBL: 31.500 € + IVA)",
    specs: {
      denominacion: "Denominación de Origen de Andalucía",
      envase: "Botella individual de vidrio oscuro de 500 ml",
      unidades: "7.000 unidades en lote solidario nacional",
      calidad: "Extracción en frío, baja acidez, antioxidantes naturales",
      caducidad: "Etiquetado reglamentario con composición y lote"
    },
    railAnalogy: "El lubricante supremo para el equipo humano de vía. Así como los engrasadores automáticos cuidan las agujas y corazones de los desvíos AV, este AOVE andaluz mantiene engrasado nuestro motor para las jornadas más exigentes.",
    iconBg: "from-amber-600 to-yellow-500",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="oilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D97706"/>
          <stop offset="50%" stop-color="#FBBF24"/>
          <stop offset="100%" stop-color="#84CC16"/>
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#047857" stop-opacity="0.9"/>
          <stop offset="35%" stop-color="#10B981" stop-opacity="0.75"/>
          <stop offset="70%" stop-color="#064E3B" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#022C22" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <!-- Botella -->
      <path d="M92 25 L108 25 L108 45 L118 65 L124 165 Q124 175 114 175 L86 175 Q76 175 76 165 L82 65 L92 45 Z" fill="url(#glassGrad)" stroke="#34D399" stroke-width="1.5"/>
      <!-- Nivel de Aceite interno -->
      <path d="M84 75 Q100 80 116 75 L122 165 Q122 173 114 173 L86 173 Q78 173 78 165 Z" fill="url(#oilGrad)" opacity="0.85"/>
      <!-- Etiqueta Ineco Dorada -->
      <rect x="80" y="95" width="40" height="50" rx="3" fill="#1A4488" stroke="#D4AF37" stroke-width="1.5"/>
      <text x="100" y="112" font-size="8" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="123" font-size="6" fill="#D4AF37" text-anchor="middle" font-weight="600">AOVE 500ml</text>
      <text x="100" y="133" font-size="5" fill="#E2E8F0" text-anchor="middle">D.O. Andalucía</text>
      <!-- Cuello y Tapón dorado -->
      <rect x="91" y="20" width="18" height="12" rx="2" fill="#D4AF37" stroke="#F59E0B" stroke-width="1"/>
      <line x1="91" y1="26" x2="109" y2="26" stroke="#B45309" stroke-width="1"/>
      <!-- Ramita de Olivo y Aceitunas -->
      <circle cx="140" cy="145" r="9" fill="#4D7C0F"/>
      <ellipse cx="142" cy="143" rx="3" ry="2" fill="#BEF264" opacity="0.6"/>
      <path d="M130 155 Q138 140 150 135" stroke="#15803D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M134 142 Q144 135 152 144 Q142 150 134 142 Z" fill="#65A30D"/>
    </svg>`
  },
  {
    day: 2,
    title: "Tarro de Bonito del Norte en Aceite",
    subtitle: "Lomos Selectos del Cantábrico • 400 gramos",
    badge: "Producto 2 • Cantábrico Seleccionado",
    price: "8,00 € / ud (PBL: 56.000 € + IVA)",
    specs: {
      origen: "Bonito del Norte (Thunnus alalunga) capturado a caña",
      peso: "400 gramos neto en tarro de cristal hermético",
      cobertura: "Bañado en aceite de oliva suave de primera prensa",
      unidades: "7.000 tarros producidos y paletizados",
      conservacion: "Envasado individual con fecha de consumo preferente"
    },
    railAnalogy: "Pura resistencia y fibra maciza, exactamente igual que un carril de acero 60 E1 soldado en barra larga. La proteína de máxima calidad que aporta la energía necesaria para una intensa jornada de auscultación geométrica de vía.",
    iconBg: "from-sky-700 to-blue-500",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="jarLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#B45309"/>
          <stop offset="50%" stop-color="#FCD34D"/>
          <stop offset="100%" stop-color="#92400E"/>
        </linearGradient>
        <linearGradient id="tunaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="50%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#EA580C"/>
        </linearGradient>
      </defs>
      <!-- Tarro de Cristal -->
      <rect x="62" y="65" width="76" height="95" rx="14" fill="#E0F2FE" opacity="0.35" stroke="#93C5FD" stroke-width="2"/>
      <!-- Lomos de bonito en aceite -->
      <rect x="66" y="75" width="68" height="80" rx="10" fill="url(#tunaGrad)" opacity="0.9"/>
      <!-- Vetas de los lomos -->
      <path d="M72 90 Q100 85 128 90 M70 110 Q100 105 130 110 M72 130 Q100 125 128 130" stroke="#FFF7ED" stroke-width="2" opacity="0.7" stroke-dasharray="3,2"/>
      <!-- Etiqueta corporativa -->
      <rect x="60" y="98" width="80" height="36" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.5"/>
      <text x="100" y="112" font-size="8" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="122" font-size="6.5" font-weight="600" fill="#FBBF24" text-anchor="middle">BONITO DEL NORTE</text>
      <text x="100" y="130" font-size="5" fill="#93C5FD" text-anchor="middle">En Aceite de Oliva • 400g</text>
      <!-- Tapa metálica dorada -->
      <rect x="58" y="52" width="84" height="15" rx="3" fill="url(#jarLid)" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="60" y1="59" x2="140" y2="59" stroke="#78350F" stroke-width="1"/>
      <!-- Sello de Calidad Cinta Roja -->
      <path d="M92 48 L100 35 L108 48 L104 60 L96 60 Z" fill="#CB1823"/>
    </svg>`
  },
  {
    day: 3,
    title: "Tarro de Mermelada de Pimientos de Piquillo",
    subtitle: "Elaboración Artesanal • 120 gramos",
    badge: "Producto 3 • Dulce & Especiado",
    price: "3,00 € / ud (PBL: 21.000 € + IVA)",
    specs: {
      ingredientes: "Pimientos del piquillo selectos caramelizados a fuego lento",
      peso: "120 gramos en tarro de cristal gourmet",
      maridaje: "Perfecto para tostas de queso curado, patés y carnes",
      unidades: "7.000 tarros suministrados individualmente",
      caducidad: "Etiqueta identificativa con trazabilidad completa"
    },
    railAnalogy: "El rojo vibrante de los pimientos de piquillo rinde homenaje al Rojo Corporativo Ineco (Pantone 485 C) y a las luces de las señales ferroviarias que garantizan la seguridad de cantón en la línea de alta velocidad.",
    iconBg: "from-red-700 to-rose-500",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="pepperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EF4444"/>
          <stop offset="40%" stop-color="#DC2626"/>
          <stop offset="100%" stop-color="#991B1B"/>
        </linearGradient>
      </defs>
      <!-- Tarro -->
      <rect x="68" y="80" width="64" height="75" rx="12" fill="#FEE2E2" opacity="0.3" stroke="#FCA5A5" stroke-width="2"/>
      <rect x="72" y="88" width="56" height="62" rx="8" fill="url(#pepperGrad)"/>
      <!-- Tapa con tela de rafia rústica navideña -->
      <path d="M60 70 Q100 62 140 70 L136 78 Q100 84 64 78 Z" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
      <!-- Cuerda de atado -->
      <line x1="62" y1="76" x2="138" y2="76" stroke="#92400E" stroke-width="2"/>
      <circle cx="100" cy="76" r="3" fill="#78350F"/>
      <!-- Etiqueta redonda -->
      <circle cx="100" cy="118" r="22" fill="#FFFBEB" stroke="#CB1823" stroke-width="1.5"/>
      <text x="100" y="112" font-size="6.5" font-weight="bold" fill="#1A4488" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="120" font-size="5" font-weight="bold" fill="#DC2626" text-anchor="middle">PIQUILLO</text>
      <text x="100" y="127" font-size="4.5" fill="#4B5563" text-anchor="middle">Mermelada 120g</text>
      <!-- Ilustración de pimiento -->
      <path d="M135 130 Q145 145 135 160 Q125 155 130 140 Z" fill="#DC2626"/>
      <path d="M135 130 L138 124" stroke="#15803D" stroke-width="2"/>
    </svg>`
  },
  {
    day: 4,
    title: "Trilogía de Mojo Canario (Pack 3)",
    subtitle: "Rojo Tradicional • Verde Cilantro • Mojo Picón (3x100g)",
    badge: "Producto 4 • Sabor Canario",
    price: "6,00 € / pack (PBL: 42.000 € + IVA)",
    specs: {
      variedades: "Mojo Rojo suave, Mojo Verde aromático y Mojo Picón bravo",
      formato: "TRES (3) tarros de cristal de 100g aprox. en pack expositor",
      procedencia: "Receta tradicional de las Islas Canarias",
      unidades: "7.000 packs (21.000 tarritos en total)",
      etiquetado: "Identificación visible de composición y procedencia"
    },
    railAnalogy: "Tres tarros, tres caracteres, al igual que los tres aspectos luminosos del sistema de señalización ASFA y ERTMS Nivel 2: Verde (Vía Libre a 300 km/h), Naranja (Precaución) y Rojo (Parada Absoluta). ¡Pura energía volcánica para la oficina!",
    iconBg: "from-emerald-700 via-amber-600 to-red-600",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <!-- Base expositora -->
      <rect x="25" y="130" width="150" height="28" rx="6" fill="#1E293B" stroke="#D4AF37" stroke-width="1.5"/>
      <text x="100" y="148" font-size="8" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">PACK MOJO CANARIO • INECO</text>
      <!-- Tarro 1: Mojo Rojo -->
      <rect x="36" y="80" width="36" height="52" rx="6" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
      <rect x="34" y="74" width="40" height="9" rx="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>
      <text x="54" y="105" font-size="5" font-weight="bold" fill="#FEF2F2" text-anchor="middle">MOJO</text>
      <text x="54" y="113" font-size="5" font-weight="bold" fill="#FEF2F2" text-anchor="middle">ROJO</text>
      <!-- Tarro 2: Mojo Verde -->
      <rect x="82" y="80" width="36" height="52" rx="6" fill="#16A34A" stroke="#14532D" stroke-width="1.5"/>
      <rect x="80" y="74" width="40" height="9" rx="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>
      <text x="100" y="105" font-size="5" font-weight="bold" fill="#F0FDF4" text-anchor="middle">MOJO</text>
      <text x="100" y="113" font-size="5" font-weight="bold" fill="#F0FDF4" text-anchor="middle">VERDE</text>
      <!-- Tarro 3: Mojo Picón -->
      <rect x="128" y="80" width="36" height="52" rx="6" fill="#EA580C" stroke="#9A3412" stroke-width="1.5"/>
      <rect x="126" y="74" width="40" height="9" rx="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>
      <text x="146" y="105" font-size="5" font-weight="bold" fill="#FFF7ED" text-anchor="middle">MOJO</text>
      <text x="146" y="113" font-size="5" font-weight="bold" fill="#FFF7ED" text-anchor="middle">PICÓN</text>
    </svg>`
  },
  {
    day: 5,
    title: "Chocolate Artesanal en Caja de Madera",
    subtitle: "3 Tabletas con Almendras (Negro, Leche y Blanco) • 450g",
    badge: "Producto 5 • Delicatessen Gourmet",
    price: "14,00 € / ud (PBL: 98.000 € + IVA)",
    specs: {
      presentacion: "Elegante caja de madera serigrafiada con tapa corredera",
      variedades: "3 tabletas de 150g c/u: Chocolate Negro, con Leche y Blanco",
      ingredientes: "Almendras enteras seleccionadas tostadas al punto",
      elaboracion: "Artesanal y cortado a cuchillo por maestros chocolateros",
      unidades: "7.000 cajas de madera certificada sostenible"
    },
    railAnalogy: "Cortado a cuchillo con la precisión milimétrica de un alineador láser de carril. La solidez de la caja de madera emula la robustez de las traviesas de madera históricas que dieron origen al ferrocarril, albergando el dulce más apreciado de las guardias nocturnas.",
    iconBg: "from-amber-900 via-amber-800 to-amber-950",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <!-- Caja de Madera -->
      <rect x="42" y="55" width="116" height="105" rx="6" fill="#78350F" stroke="#92400E" stroke-width="3"/>
      <!-- Vetas de madera -->
      <line x1="45" y1="75" x2="155" y2="75" stroke="#92400E" stroke-width="1.5" stroke-dasharray="25,5"/>
      <line x1="45" y1="105" x2="155" y2="105" stroke="#92400E" stroke-width="1.5" stroke-dasharray="15,10"/>
      <line x1="45" y1="135" x2="155" y2="135" stroke="#92400E" stroke-width="1.5" stroke-dasharray="20,8"/>
      <!-- Tableta 1: Negro -->
      <rect x="52" y="65" width="28" height="75" rx="3" fill="#3B1C0B" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="66" cy="85" r="3" fill="#FCD34D"/>
      <circle cx="66" cy="115" r="3" fill="#FCD34D"/>
      <!-- Tableta 2: Leche -->
      <rect x="86" y="65" width="28" height="75" rx="3" fill="#713F12" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="100" cy="85" r="3" fill="#FCD34D"/>
      <circle cx="100" cy="115" r="3" fill="#FCD34D"/>
      <!-- Tableta 3: Blanco -->
      <rect x="120" y="65" width="28" height="75" rx="3" fill="#FEF3C7" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="134" cy="85" r="3" fill="#D97706"/>
      <circle cx="134" cy="115" r="3" fill="#D97706"/>
      <!-- Placa frontal grabada -->
      <rect x="56" y="143" width="88" height="18" rx="3" fill="#451A03" stroke="#F59E0B" stroke-width="1"/>
      <text x="100" y="155" font-size="6.5" font-weight="bold" fill="#FEF3C7" text-anchor="middle" font-family="Poppins">CHOCOLATE ARTESANAL • 3x150g</text>
    </svg>`
  },
  {
    day: 6,
    title: "Café 100% Arábica Natural",
    subtitle: "Paquete de 250 gramos • Tueste Natural Molido",
    badge: "Producto 6 • Esencia Ferroviaria",
    price: "7,50 € / ud (PBL: 52.500 € + IVA)",
    specs: {
      grano: "100% Arábica de altura seleccionado",
      tueste: "Variedad natural, equilibrio aromático y cuerpo sedoso",
      peso: "250 gramos de café recién molido",
      envasado: "Bolsa termosellada con válvula unidireccional de frescura",
      unidades: "7.000 paquetes distribuidos a nivel nacional"
    },
    railAnalogy: "La cafeína de alta pureza: el combustible indispensable para afrontar la Banda de Mantenimiento Nocturna (01:00 a 05:00 h), cuando los trenes comerciales descansan y nuestros técnicos recorren la vía para garantizar la seguridad del día siguiente.",
    iconBg: "from-stone-800 to-amber-950",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <!-- Paquete Kraft -->
      <path d="M68 50 L132 50 L126 155 Q126 165 116 165 L84 165 Q74 165 74 155 Z" fill="#78350F" stroke="#92400E" stroke-width="2"/>
      <!-- Pliegue superior sellado -->
      <polygon points="68,50 132,50 128,38 72,38" fill="#5A240A" stroke="#B45309" stroke-width="1.5"/>
      <line x1="72" y1="44" x2="128" y2="44" stroke="#D4AF37" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Válvula de aroma -->
      <circle cx="100" cy="72" r="5" fill="#451A03" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="100" cy="72" r="2" fill="#1E293B"/>
      <!-- Etiqueta Ineco -->
      <rect x="74" y="90" width="52" height="50" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.5"/>
      <text x="100" y="105" font-size="7.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="117" font-size="6" font-weight="bold" fill="#FBBF24" text-anchor="middle">CAFÉ ARÁBICA</text>
      <text x="100" y="126" font-size="4.5" fill="#E2E8F0" text-anchor="middle">100% Natural • 250g</text>
      <!-- Granos de café alrededor -->
      <ellipse cx="140" cy="145" rx="6" ry="8" fill="#451A03" transform="rotate(25 140 145)"/>
      <path d="M138 140 Q142 145 138 150" stroke="#FCD34D" stroke-width="1" fill="none"/>
      <ellipse cx="60" cy="150" rx="6" ry="8" fill="#451A03" transform="rotate(-30 60 150)"/>
    </svg>`
  },
  {
    day: 7,
    title: "Baraja Española Personalizada Ineco",
    subtitle: "40 Naipes de 61,5 x 95 mm • Barniz Acuoso Durabilidad",
    badge: "Producto 7 • Edición Coleccionista",
    price: "2,50 € / ud (PBL: 17.500 € + IVA)",
    specs: {
      formato: "Baraja tradicional española de 40 cartas (61,5 x 95 mm)",
      papel: "Laminado estucado de 310 g/m² bañado en barniz acuoso de alta resistencia",
      impresion: "Dorso personalizado a 4 tintas CMYK con diseño exclusivo Ineco",
      estuche: "Caja de cartón policromado y envoltura en celofán antihumedad",
      unidades: "7.000 barajas diseñadas para Ineco"
    },
    railAnalogy: "Para los campeonatos de mus y tute entre turnos y las sobremesas en familia. El rey de oros empuña una llave dinamométrica y el as de copas brinda por la seguridad ferroviaria en Monforte del Cid.",
    iconBg: "from-blue-700 to-indigo-900",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <!-- Carta trasera izquierda -->
      <g transform="translate(60, 65) rotate(-15)">
        <rect x="0" y="0" width="48" height="74" rx="4" fill="#1A4488" stroke="#D4AF37" stroke-width="1.5"/>
        <rect x="4" y="4" width="40" height="66" rx="2" fill="#0D2246" stroke="#6B96CF" stroke-width="0.75"/>
        <circle cx="24" cy="37" r="10" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
        <text x="24" y="40" font-size="6" font-weight="bold" fill="#F8FAFC" text-anchor="middle">ineco</text>
      </g>
      <!-- Carta trasera derecha -->
      <g transform="translate(95, 65) rotate(15)">
        <rect x="0" y="0" width="48" height="74" rx="4" fill="#CB1823" stroke="#D4AF37" stroke-width="1.5"/>
        <rect x="4" y="4" width="40" height="66" rx="2" fill="#991B1B" stroke="#FCA5A5" stroke-width="0.75"/>
        <text x="24" y="40" font-size="7" font-weight="bold" fill="#FEF3C7" text-anchor="middle">2026</text>
      </g>
      <!-- Carta central: As de Oros Alta Velocidad -->
      <g transform="translate(76, 55)">
        <rect x="0" y="0" width="48" height="74" rx="4" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="24" cy="37" r="14" fill="#FCD34D" stroke="#D97706" stroke-width="1.5"/>
        <text x="24" y="40" font-size="7" font-weight="bold" fill="#78350F" text-anchor="middle">AVE</text>
        <text x="8" y="14" font-size="7" font-weight="bold" fill="#D97706">1</text>
        <text x="40" y="68" font-size="7" font-weight="bold" fill="#D97706">1</text>
      </g>
      <!-- Estuche policromado -->
      <rect x="52" y="130" width="96" height="24" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.5"/>
      <text x="100" y="146" font-size="7" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">BARAJA ESPAÑOLA INECO</text>
    </svg>`
  },
  {
    day: 8,
    title: "Calcetines Técnicos Corporativos Ineco",
    subtitle: "Algodón ≥80% • Costura Plana Anti-Rozaduras • Puntera Reforzada",
    badge: "Producto 8 • Confort Alta Velocidad",
    price: "4,00 € / par (PBL: 28.000 € + IVA)",
    specs: {
      composicion: "Algodón premium mínimo 80% transpirable y cálido",
      ergonomia: "Costura punto por punto sin relieves para prevenir rozaduras",
      refuerzo: "Talones y punteras reforzados para máxima vida útil con calzado de seguridad",
      ajuste: "Puño elástico con elastano que no aprieta ni desliza en movimiento",
      diseno: "Diseño ferroviario corporativo exclusivo facilitado por Ineco"
    },
    railAnalogy: "Diseñados a medida para calzar en las botas de seguridad reglamentarias durante las inspecciones invernales de vía en la meseta y el corredor levantino. Máxima calidez ergonómica para nuestros técnicos de campo.",
    iconBg: "from-blue-800 to-red-700",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <!-- Calcetín Izquierdo -->
      <path d="M72 45 L98 45 L98 105 Q98 135 125 135 L135 135 Q145 135 145 148 Q145 160 130 160 L90 160 Q68 160 68 135 L68 48 Q68 45 72 45 Z" fill="#1A4488" stroke="#3463AC" stroke-width="2"/>
      <!-- Puño rojo elastano -->
      <rect x="68" y="42" width="30" height="12" rx="2" fill="#CB1823" stroke="#D4AF37" stroke-width="1"/>
      <line x1="68" y1="48" x2="98" y2="48" stroke="#FFFFFF" stroke-width="1"/>
      <!-- Puntera reforzada roja -->
      <path d="M128 135 L135 135 Q145 135 145 148 Q145 160 130 160 L125 160 Z" fill="#CB1823"/>
      <!-- Talón reforzado rojo -->
      <path d="M68 130 Q68 160 90 160 L90 148 Q78 148 78 130 Z" fill="#CB1823"/>
      <!-- Motivo de vías y tren en el calcetín -->
      <line x1="72" y1="75" x2="94" y2="75" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2"/>
      <line x1="72" y1="85" x2="94" y2="85" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2"/>
      <text x="83" y="100" font-size="6" font-weight="bold" fill="#FCD34D" text-anchor="middle">ineco</text>
      <!-- Copos de nieve bordados -->
      <circle cx="83" cy="65" r="1.5" fill="#FFFFFF"/>
      <circle cx="75" cy="115" r="1.5" fill="#FFFFFF"/>
    </svg>`
  },
  {
    day: 9,
    title: "Tarjeta Navideña Solidaria Ineco 2026",
    subtitle: "Formato A4 Doble Cara • Papel Offset Blanco 80g",
    badge: "Producto 9 • Compromiso Social",
    price: "0,70 € / ud (PBL: 4.900 € + IVA)",
    specs: {
      formato: "Formato A4 impreso a doble cara de máxima nitidez",
      papel: "Papel offset blanco de 80 g/m² de fibra reciclada certificada FSC",
      edicion: "Dos diseños institucionales aprobados por Ineco",
      mensaje: "Agradecimiento a los profesionales de la movilidad y proyectos solidarios",
      unidades: "7.000 tarjetas personalizadas para cada integrante"
    },
    railAnalogy: "El puente de comunicación que enlaza todas las sedes, proyectos y bases de mantenimiento de Ineco. Un homenaje al esfuerzo de los profesionales que mantienen a España conectada a alta velocidad.",
    iconBg: "from-red-800 to-amber-700",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl">
      <!-- Tarjeta Desplegada -->
      <rect x="45" y="45" width="110" height="120" rx="5" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2"/>
      <!-- Pliegue central -->
      <line x1="100" y1="45" x2="100" y2="165" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3,3"/>
      <!-- Portada (mitad derecha) -->
      <rect x="100" y="45" width="55" height="120" rx="0" fill="#1A4488" opacity="0.95"/>
      <text x="127" y="70" font-size="8" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <circle cx="127" cy="95" r="16" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
      <!-- Silueta de tren AVE y estrella navideña -->
      <polygon points="127,84 130,91 137,92 132,97 133,104 127,100 121,104 122,97 117,92 124,91" fill="#FCD34D"/>
      <text x="127" y="125" font-size="5" font-weight="bold" fill="#FEF3C7" text-anchor="middle">FELIZ 2026</text>
      <text x="127" y="135" font-size="4" fill="#93C5FD" text-anchor="middle">Detalle Solidario</text>
      <!-- Interior (mitad izquierda) con texto institucional -->
      <line x1="52" y1="65" x2="92" y2="65" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="52" y1="75" x2="92" y2="75" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="52" y1="85" x2="85" y2="85" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="52" y1="100" x2="92" y2="100" stroke="#CB1823" stroke-width="1"/>
      <text x="72" y="125" font-size="5" font-weight="bold" fill="#0D2246" text-anchor="middle">Base Monforte</text>
      <text x="72" y="135" font-size="4" fill="#64748B" text-anchor="middle">del Cid (Alicante)</text>
    </svg>`
  }
];

// ==========================================
// 2. COMPAÑEROS DE LA OFICINA (ORDEN ALFABÉTICO ESTRICTO)
// ==========================================
const COLLEAGUES = [
  {
    name: "Ana",
    role: "Ingeniería & Coordinación de Operaciones",
    wish: "¡Que el 2026 traiga trazados despejados, máxima precisión en cada proyecto y momentos entrañables junto a los tuyos!",
    ticketSeat: "Coche 01 • Asiento 01A (Club)"
  },
  {
    name: "Edu",
    role: "Especialista en Mantenimiento de Infraestructura",
    wish: "¡Fuerza, salud y que la catenaria de la vida siga transmitiendo la mejor energía en cada guardia y jornada compartida!",
    ticketSeat: "Coche 01 • Asiento 02B (Club)"
  },
  {
    name: "Ernesto",
    role: "Supervisión Técnica de Vía y Desvíos",
    wish: "¡Que la aguja de tu destino apunte siempre a la felicidad y que en 2026 celebremos muchos éxitos en equipo!",
    ticketSeat: "Coche 02 • Asiento 03A (Preferente)"
  },
  {
    name: "Gloria",
    role: "Gestión de Calidad & Seguridad Ferroviaria",
    wish: "¡Brindamos por tu dedicación impecable! Que estas fiestas llenen tu hogar de paz, sonrisas y momentos dorados.",
    ticketSeat: "Coche 02 • Asiento 04B (Preferente)"
  },
  {
    name: "Irene",
    role: "Planificación & Control de Gestión",
    wish: "¡Que el cronograma de este 2026 venga repleto de alegrías cumplidas, tranquilidad y proyectos ilusionantes!",
    ticketSeat: "Coche 03 • Asiento 05A (Turista Plus)"
  },
  {
    name: "Iván Álvarez",
    role: "Especialista de Sistemas y Auscultación",
    wish: "¡Velocidad de crucero a 300 km/h para tus metas y la mejor sintonía en cada reto del nuevo año!",
    ticketSeat: "Coche 03 • Asiento 06B (Turista Plus)"
  },
  {
    name: "Iván de la Paz",
    role: "Responsable de Equipos & Innovación Tecnológica",
    wish: "¡Gracias por liderar con entusiasmo y visión de futuro! Que el 2026 te devuelva multiplicado todo tu esfuerzo y compañerismo.",
    ticketSeat: "Coche 01 • Asiento 01B (Cabina de Mando)"
  },
  {
    name: "Jose Luis",
    role: "Operaciones de Mantenimiento de Alta Velocidad",
    wish: "¡Que no falte nunca el buen humor, la salud de hierro y el calor de los tuyos en estas fechas tan señaladas!",
    ticketSeat: "Coche 04 • Asiento 07A (Turista)"
  },
  {
    name: "Manuel",
    role: "Especialista en Instalaciones y Telecomunicaciones",
    wish: "¡Conexión permanente con la felicidad y señal verde en todos los caminos que emprendas en 2026!",
    ticketSeat: "Coche 04 • Asiento 08B (Turista)"
  },
  {
    name: "Pascual",
    role: "Coordinación de Seguridad y Salud en Obra",
    wish: "¡Protección máxima y la mayor de las alegrías para ti y tu familia en esta Navidad y durante todo el año nuevo!",
    ticketSeat: "Coche 05 • Asiento 09A (Turista)"
  },
  {
    name: "Pepe",
    role: "Técnico Especialista de Mantenimiento Integral",
    wish: "¡Maestría, experiencia y compañerismo puro. Que disfrutes de esta merecidísima cesta solidaria con los que más quieres!",
    ticketSeat: "Coche 05 • Asiento 10B (Turista)"
  },
  {
    name: "Raúl",
    role: "Gestión de Activos y Logística Ferroviaria",
    wish: "¡Distribución perfecta de salud, amor y prosperidad para el nuevo año 2026. ¡A disfrutar del detalle solidario!",
    ticketSeat: "Coche 06 • Asiento 11A (Turista)"
  }
];

// ==========================================
// 3. MOTOR DE AUDIO SINTETIZADO (Web Audio API)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgMelodyPlaying = false;
    this.melodyTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBgMelody();
    }
    return !this.muted;
  }

  playBellChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, t); // C6
    osc.frequency.exponentialRampToValueAtTime(2093, t + 0.08); // C7
    osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.2);
  }

  playUnwrap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Ruido rosa/blanco filtrado para efecto crujido de envoltorio
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  playTrainHorn() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Dos tonos armónicos típicos de tren de alta velocidad (311Hz Eb4 y 370Hz F#4)
    [311.13, 370.0].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.02, t + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
      gain.gain.setValueAtTime(0.2, t + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.2);
    });
  }

  playConfettiFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + (idx * 0.1);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  startBgMelody() {
    if (this.muted || this.bgMelodyPlaying) return;
    this.init();
    if (!this.ctx) return;
    this.bgMelodyPlaying = true;

    // Melodía procedural navideña suave tipo Jingle Bells
    const melody = [
      { f: 659.25, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 659.25, d: 0.5 },
      { f: 659.25, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 659.25, d: 0.5 },
      { f: 659.25, d: 0.25 }, { f: 783.99, d: 0.25 }, { f: 523.25, d: 0.35 }, { f: 587.33, d: 0.15 },
      { f: 659.25, d: 0.8 }
    ];

    let noteIdx = 0;
    const playNext = () => {
      if (!this.bgMelodyPlaying || this.muted) return;
      const note = melody[noteIdx];
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      noteIdx = (noteIdx + 1) % melody.length;
      const pause = noteIdx === 0 ? 3000 : note.d * 1000 + 100;
      this.melodyTimer = setTimeout(playNext, pause);
    };

    playNext();
  }

  stopBgMelody() {
    this.bgMelodyPlaying = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }
}

const sound = new SoundEngine();

// ==========================================
// 4. ANIMACIÓN DE NIEVE (Canvas)
// ==========================================
class Snowfall {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.flakes = [];
    this.active = true;
    this.maxFlakes = window.innerWidth < 640 ? 45 : 85;
    this.resize();
    this.initFlakes();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initFlakes() {
    this.flakes = [];
    for (let i = 0; i < this.maxFlakes; i++) {
      this.flakes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 3 + 1,
        d: Math.random() * this.maxFlakes,
        vx: Math.random() * 1 - 0.5,
        vy: Math.random() * 1.5 + 0.8,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
  }

  toggle() {
    this.active = !this.active;
    if (!this.active) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    return this.active;
  }

  animate() {
    if (this.active) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
      this.flakes.forEach(f => {
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(248, 250, 252, ${f.opacity})`;
        this.ctx.fill();

        f.y += f.vy;
        f.x += f.vx + Math.sin(f.y * 0.01) * 0.4;

        if (f.y > this.canvas.height) {
          f.y = -5;
          f.x = Math.random() * this.canvas.width;
        }
        if (f.x > this.canvas.width) f.x = 0;
        if (f.x < 0) f.x = this.canvas.width;
      });
    }
    requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 5. CUENTA ATRÁS OFICIAL (Entrega 14 Dic 2026, 09:00h)
// ==========================================
function initCountdown() {
  // Fecha oficial según pliego: 14 de diciembre de 2026, 09:00:00
  const targetDate = new Date("2026-12-14T09:00:00+01:00").getTime();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById('cd-days').innerText = "00";
      document.getElementById('cd-hours').innerText = "00";
      document.getElementById('cd-mins').innerText = "00";
      document.getElementById('cd-secs').innerText = "00";
      document.getElementById('cd-status-text').innerText = "¡Los lotes solidarios han llegado a la Base de Monforte del Cid!";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMins = document.getElementById('cd-mins');
    const elSecs = document.getElementById('cd-secs');

    if (elDays) elDays.innerText = pad(days);
    if (elHours) elHours.innerText = pad(hours);
    if (elMins) elMins.innerText = pad(mins);
    if (elSecs) elSecs.innerText = pad(secs);
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// 6. MAPA RADAR PAPÁ NOEL & MONFORTE DEL CID
// ==========================================
class SantaRailTracker {
  constructor() {
    this.speed = 300; // km/h
    this.progress = 0.65; // progreso en la ruta
    this.direction = 1;
    this.trainMarker = document.getElementById('train-marker');
    this.speedDisplay = document.getElementById('radar-speed');
    this.statusDisplay = document.getElementById('radar-status');
    this.distDisplay = document.getElementById('radar-distance');
    this.init();
  }

  init() {
    this.animateTrain();
  }

  animateTrain() {
    setInterval(() => {
      // Simular suave avance del tren
      this.progress += 0.0015 * (this.speed / 300);
      if (this.progress > 0.98) {
        this.progress = 0.98; // Se mantiene en Monforte del Cid
      }

      // Trayecto SVG: de Madrid (x=160, y=70) pasando por Cuenca (x=240, y=120), Albacete (x=270, y=190) a Monforte del Cid (x=330, y=250)
      const pathPoints = [
        { x: 160, y: 70, name: "Madrid Puerta de Atocha / Pº Habana" },
        { x: 240, y: 125, name: "Cuenca Fernando Zóbel" },
        { x: 275, y: 195, name: "Albacete Los Llanos" },
        { x: 345, y: 260, name: "Base Monforte del Cid (Alicante)" }
      ];

      // Interpolación sobre el tramo Albacete -> Monforte del Cid
      const start = pathPoints[2];
      const end = pathPoints[3];
      const t = Math.min(1, Math.max(0, (this.progress - 0.5) / 0.5));

      const curX = start.x + (end.x - start.x) * t;
      const curY = start.y + (end.y - start.y) * t;

      if (this.trainMarker) {
        this.trainMarker.setAttribute('transform', `translate(${curX}, ${curY})`);
      }

      const kmRestantes = Math.max(0, Math.round((1 - this.progress) * 180));
      if (this.distDisplay) this.distDisplay.innerText = `${kmRestantes} km a destino`;
      if (this.speedDisplay) this.speedDisplay.innerText = `${this.speed} km/h`;

      if (this.statusDisplay) {
        if (kmRestantes === 0) {
          this.statusDisplay.innerText = "¡LLEGADA CONFIRMADA A BASE MONFORTE DEL CID!";
        } else if (kmRestantes < 40) {
          this.statusDisplay.innerText = "Aproximación por Bifurcación Monforte del Cid";
        } else {
          this.statusDisplay.innerText = "Crucero Alta Velocidad por LAV Madrid-Levante";
        }
      }
    }, 150);
  }

  boostSpeed() {
    this.speed = 350;
    sound.playTrainHorn();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => {
      this.speed = 300;
    }, 4000);
  }
}

// ==========================================
// 7. GESTOR DEL CALENDARIO DE ADVIENTO
// ==========================================
class AdventCalendar {
  constructor() {
    this.openedDays = new Set(JSON.parse(localStorage.getItem('ineco_advent_2026') || '[]'));
    this.container = document.getElementById('advent-grid');
    this.progressCount = document.getElementById('discovered-count');
    this.progressBar = document.getElementById('discovered-bar');
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    GIFTS_DATA.forEach(gift => {
      const isOpened = this.openedDays.has(gift.day);

      const col = document.createElement('div');
      col.className = 'advent-card-wrapper';

      col.innerHTML = `
        <div class="advent-card ${isOpened ? 'opened' : ''}" data-day="${gift.day}" id="gift-card-${gift.day}">
          <!-- CARA FRONTAL (Cerrada / Regalo Misterioso con Lazos) -->
          <div class="advent-front p-5 flex flex-col justify-between select-none">
            <!-- Lazos Navideños cruzados -->
            <div class="gift-ribbon-horizontal"></div>
            <div class="gift-ribbon-vertical"></div>

            <!-- Sello Central Ineco & Día -->
            <div class="gift-seal-badge w-18 h-18 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-slate-900 shadow-2xl flex flex-col items-center justify-center p-2 red-pulse">
              <span class="text-xs uppercase font-extrabold tracking-wider text-slate-950">DÍA</span>
              <span class="text-2xl font-black text-slate-950 font-poppins">${gift.day}</span>
              <span class="text-[8px] font-bold text-slate-900">2026</span>
            </div>

            <!-- Cabecera de la puerta -->
            <div class="flex justify-between items-center z-10">
              <span class="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-900/90 text-blue-200 border border-blue-400/30">
                LAV MONFORTE
              </span>
              <span class="text-xs text-amber-300 font-medium">🎁 Toca para abrir</span>
            </div>

            <!-- Pie de la puerta -->
            <div class="z-10 mt-auto pt-2 flex items-center justify-between text-xs text-slate-300 border-t border-blue-400/20">
              <span class="font-medium text-[11px] truncate max-w-[140px] text-blue-200">${gift.title.split(' ')[0]} ${gift.title.split(' ')[1] || ''}</span>
              <span class="text-[10px] bg-red-700/80 text-white px-2 py-0.5 rounded-full font-bold">INECO</span>
            </div>
          </div>

          <!-- CARA TRASERA (Abierta / Producto Revelado) -->
          <div class="advent-back p-4 flex flex-col justify-between">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                Día ${gift.day} Desbloqueado
              </span>
              <span class="text-xs font-bold text-red-400">INECO 2026</span>
            </div>

            <!-- Ilustración SVG del Producto -->
            <div class="w-full h-32 my-1 flex items-center justify-center p-1">
              ${gift.svg}
            </div>

            <!-- Título y Botón Ficha Técnica -->
            <div class="text-center mt-auto">
              <h4 class="font-bold text-sm text-slate-100 line-clamp-1 font-poppins">${gift.title}</h4>
              <p class="text-[11px] text-amber-300 line-clamp-1 font-medium">${gift.subtitle}</p>
              <button class="mt-2.5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition">
                <span>Inspeccionar Ficha</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      const card = col.querySelector('.advent-card');
      card.addEventListener('click', (e) => {
        this.handleCardClick(gift.day);
      });

      this.container.appendChild(col);
    });

    this.updateProgress();
  }

  handleCardClick(day) {
    const card = document.getElementById(`gift-card-${day}`);
    const isAlreadyOpened = this.openedDays.has(day);

    if (navigator.vibrate) navigator.vibrate(50);

    if (!isAlreadyOpened) {
      sound.playUnwrap();
      setTimeout(() => sound.playBellChime(), 180);
      card.classList.add('opened');
      this.openedDays.add(day);
      localStorage.setItem('ineco_advent_2026', JSON.stringify([...this.openedDays]));
      this.updateProgress();
      this.triggerConfettiAt(card);

      // Abrir modal tras pequeña pausa de animación
      setTimeout(() => {
        this.openGiftModal(day);
      }, 700);
    } else {
      sound.playBellChime();
      this.openGiftModal(day);
    }
  }

  updateProgress() {
    const count = this.openedDays.size;
    if (this.progressCount) this.progressCount.innerText = `${count} de 9`;
    if (this.progressBar) {
      const pct = (count / 9) * 100;
      this.progressBar.style.width = `${pct}%`;
    }
  }

  openAll() {
    GIFTS_DATA.forEach(g => {
      this.openedDays.add(g.day);
      const card = document.getElementById(`gift-card-${g.day}`);
      if (card) card.classList.add('opened');
    });
    localStorage.setItem('ineco_advent_2026', JSON.stringify([...this.openedDays]));
    this.updateProgress();
    sound.playConfettiFanfare();
  }

  resetAll() {
    this.openedDays.clear();
    localStorage.removeItem('ineco_advent_2026');
    GIFTS_DATA.forEach(g => {
      const card = document.getElementById(`gift-card-${g.day}`);
      if (card) card.classList.remove('opened');
    });
    this.updateProgress();
  }

  openGiftModal(day) {
    const gift = GIFTS_DATA.find(g => g.day === day);
    if (!gift) return;

    const modal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('gift-modal-body');

    modalContent.innerHTML = `
      <div class="relative">
        <!-- Encabezado con insignias -->
        <div class="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                Día ${gift.day} de Adviento
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-200 text-xs font-medium border border-blue-500/30">
                ${gift.badge}
              </span>
            </div>
            <h3 class="text-xl md:text-2xl font-bold text-white font-poppins">${gift.title}</h3>
            <p class="text-sm text-amber-300 font-medium">${gift.subtitle}</p>
          </div>
          <button id="close-modal-btn" class="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 items-center">
          <!-- Ilustración en grande -->
          <div class="bg-gradient-to-b from-blue-950/70 to-slate-900 rounded-2xl p-6 border border-blue-500/20 flex flex-col items-center justify-center relative overflow-hidden">
            <div class="w-44 h-44 drop-shadow-2xl">
              ${gift.svg}
            </div>
            <span class="mt-3 px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 text-[11px] font-mono border border-slate-700">
              PBL Oficial: ${gift.price}
            </span>
          </div>

          <!-- Especificaciones Oficiales del Pliego -->
          <div class="space-y-4">
            <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <h4 class="text-xs uppercase font-bold text-blue-300 tracking-wider mb-2.5 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Ficha Técnica (Pliego Exp. 20260923-00341)
              </h4>
              <ul class="text-xs space-y-2 text-slate-200">
                ${Object.entries(gift.specs).map(([k, v]) => `
                  <li class="flex items-start gap-2">
                    <span class="text-amber-400 font-bold capitalize">• ${k}:</span>
                    <span class="text-slate-300">${v}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Vínculo Ferroviario / Mantenimiento Alta Velocidad -->
            <div class="bg-gradient-to-r from-red-950/40 to-blue-950/40 rounded-xl p-4 border border-red-500/30">
              <h4 class="text-xs uppercase font-bold text-red-300 tracking-wider mb-1.5 flex items-center gap-1.5">
                <span class="text-base">🚄</span>
                Conexión con la Base de Monforte del Cid
              </h4>
              <p class="text-xs text-slate-300 leading-relaxed italic">
                "${gift.railAnalogy}"
              </p>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>🎄 Detalle Solidario Ineco</span>
            <span>•</span>
            <span class="text-emerald-400">Entrega 14-18 Diciembre 2026</span>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="modal-sound-btn" class="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 transition flex items-center justify-center gap-1.5">
              <span>🔔 Campanada</span>
            </button>
            <button id="modal-next-btn" class="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-red-600 hover:from-blue-600 hover:to-red-500 text-white text-xs font-semibold shadow-md transition">
              Entendido
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Event listeners del modal
    const closeBtn = document.getElementById('close-modal-btn');
    const nextBtn = document.getElementById('modal-next-btn');
    const soundBtn = document.getElementById('modal-sound-btn');

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (nextBtn) nextBtn.onclick = closeModal;
    if (soundBtn) soundBtn.onclick = () => sound.playBellChime();
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  triggerConfettiAt(element) {
    if (typeof confetti === 'function') {
      const rect = element.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        colors: ['#1A4488', '#CB1823', '#D4AF37', '#FFFFFF']
      });
    }
  }
}

// ==========================================
// 8. SECCIÓN "ABRIR TU REGALO" (Personalizada Compañeros)
// ==========================================
class ColleagueGiftBox {
  constructor() {
    this.selectedColleague = null;
    this.container = document.getElementById('colleagues-selector');
    this.detailsCard = document.getElementById('colleague-card-details');
    this.init();
  }

  init() {
    this.renderButtons();
    // Seleccionar por defecto el primer compañero (Ana)
    this.select(COLLEAGUES[0]);
  }

  renderButtons() {
    if (!this.container) return;
    this.container.innerHTML = '';

    COLLEAGUES.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none ${
        idx === 0 
          ? 'bg-blue-800/90 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40' 
          : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60'
      }`;
      btn.setAttribute('data-name', c.name);

      btn.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-blue-950 text-amber-300 font-bold flex items-center justify-center text-[10px] border border-blue-400/30">
            ${idx + 1}
          </span>
          <span class="font-semibold">${c.name}</span>
        </div>
        <span class="text-[10px] opacity-75">🎁</span>
      `;

      btn.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(35);
        sound.playBellChime();
        this.select(c);

        // Actualizar estados visuales de los botones
        this.container.querySelectorAll('button').forEach(b => {
          b.className = 'px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60';
        });
        btn.className = 'px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-blue-800/90 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40';
      });

      this.container.appendChild(btn);
    });
  }

  select(colleague) {
    this.selectedColleague = colleague;
    if (!this.detailsCard) return;

    this.detailsCard.innerHTML = `
      <div class="space-y-6">
        <!-- Billete de Alta Velocidad (Boarding Pass Personalizado) -->
        <div class="ticket-boarding-pass p-5 md:p-6 border-2 border-amber-400/50 shadow-2xl relative">
          <!-- Cabecera del Billete -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-300">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow">
                🚄
              </div>
              <div>
                <span class="text-[10px] font-bold tracking-widest uppercase text-blue-900">BILLETE DE EMBARQUE SOLIDARIO 2026</span>
                <h3 class="text-xl font-black text-slate-900 font-poppins">${colleague.name}</h3>
              </div>
            </div>
            <div class="text-right">
              <span class="inline-block px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                LAV MADRID - ALICANTE
              </span>
              <p class="text-[11px] font-mono text-slate-600 mt-0.5">${colleague.ticketSeat}</p>
            </div>
          </div>

          <!-- Datos de Ruta y Base -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 text-xs">
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">ORIGEN:</span>
              <p class="font-bold text-slate-900">Sede Ineco Central</p>
              <p class="text-[10px] text-slate-500">Pº Habana 138, Madrid</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">DESTINO PRIORITARIO:</span>
              <p class="font-bold text-red-600">Base Monforte del Cid</p>
              <p class="text-[10px] text-slate-500">Alicante • P.K. 420</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">FECHA ENTREGA:</span>
              <p class="font-bold text-slate-900">14 Diciembre 2026</p>
              <p class="text-[10px] text-slate-500">09:00 - 15:00 horas</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">CONTENIDO:</span>
              <p class="font-bold text-emerald-700">Lote Completo (9 Prods)</p>
              <p class="text-[10px] text-slate-500">Packaging Cartón Reciclado</p>
            </div>
          </div>

          <!-- Mensaje Personalizado Navideño -->
          <div class="bg-blue-50/80 rounded-xl p-3.5 border border-blue-200 text-xs text-slate-800 leading-relaxed my-2">
            <span class="font-bold text-blue-900">Dedicatoria para ${colleague.name} (${colleague.role}):</span>
            <p class="italic mt-1">"${colleague.wish}"</p>
          </div>

          <!-- Código de Barras / QR Simulado -->
          <div class="flex items-center justify-between pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-mono">
            <span>EXPEDIENTE: 20260923-00341</span>
            <span class="tracking-widest">|||||| | |||||||| ||| ||||||| | ||</span>
            <span>OFICINA MONFORTE</span>
          </div>
        </div>

        <!-- Muestra 3D de la Cesta de Navidad Completa -->
        <div class="bg-gradient-to-b from-slate-900 to-blue-950/80 rounded-2xl p-6 border-2 border-blue-500/30 text-center relative overflow-hidden shadow-2xl">
          <div class="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <span class="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold mb-3">
            🎁 Gran Cesta Solidaria Ineco 2026
          </span>
          <h4 class="text-xl font-black text-white font-poppins">
            La Cesta de Navidad de ${colleague.name}
          </h4>
          <p class="text-xs text-slate-300 max-w-lg mx-auto mt-1 mb-5">
            Caja de cartón reciclado sostenible serigrafiada a color, equipada con acolchado interior troquelado resistente a impactos y vibraciones del transporte ferroviario.
          </p>

          <!-- Render de la Cesta con los 9 Artículos juntos -->
          <div id="basket-render-box" class="w-full max-w-md mx-auto bg-slate-950/60 rounded-2xl p-5 border border-amber-500/30 shadow-inner mb-6 transition-all duration-500">
            <div class="grid grid-cols-3 gap-2.5 items-center">
              ${GIFTS_DATA.map(g => `
                <div class="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60 flex flex-col items-center hover:scale-105 transition-transform" title="${g.title}">
                  <div class="w-12 h-12">
                    ${g.svg}
                  </div>
                  <span class="text-[9px] font-bold text-slate-200 truncate w-full mt-1 text-center">${g.title.split(' ')[0]}</span>
                </div>
              `).join('')}
            </div>
            <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-amber-300 font-semibold px-2">
              <span>Incluye los 9 Productos Oficiales</span>
              <span>Total 7.000 Lotes</span>
            </div>
          </div>

          <!-- Botón de Apertura Sorpresa -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button id="unbox-basket-btn" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 active:scale-95 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition duration-300">
              <span>🎉 ¡Desempaquetar y Celebrar!</span>
            </button>
            <button id="share-whatsapp-btn" class="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-medium text-xs shadow-lg flex items-center justify-center gap-2 transition">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.179.182-.077.357.101.174.449.741.963 1.199.662.59 1.22.774 1.393.861.173.087.274.072.376-.044.101-.116.433-.506.549-.68.116-.174.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
              <span>Compartir con la Oficina</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Eventos de los botones de la cesta
    const unboxBtn = document.getElementById('unbox-basket-btn');
    const shareBtn = document.getElementById('share-whatsapp-btn');
    const renderBox = document.getElementById('basket-render-box');

    if (unboxBtn) {
      unboxBtn.onclick = () => {
        sound.playConfettiFanfare();
        if (navigator.vibrate) navigator.vibrate([100, 80, 150]);
        if (renderBox) {
          renderBox.classList.remove('animate-basket-reveal');
          void renderBox.offsetWidth; // re-trigger
          renderBox.classList.add('animate-basket-reveal');
        }
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#CB1823', '#1A4488', '#10B981', '#FFFFFF']
          });
        }
      };
    }

    if (shareBtn) {
      shareBtn.onclick = () => {
        const text = `🎄 ¡Hola! He abierto la Cesta Solidaria Ineco 2026 de ${colleague.name} para la Base de Mantenimiento de Monforte del Cid: ${colleague.wish} 🚄 ¡Felices Fiestas!`;
        const url = window.location.href;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
      };
    }
  }
}

// ==========================================
// 9. PANTALLA INTRODUCCIÓN (3 SEGUNDOS)
// ==========================================
function initIntroScreen() {
  const intro = document.getElementById('intro-screen');
  const skipBtn = document.getElementById('skip-intro-btn');
  const timerCircle = document.getElementById('intro-timer-circle');

  let finished = false;

  const finishIntro = () => {
    if (finished) return;
    finished = true;
    intro.classList.add('fade-out');
    sound.startBgMelody();
    setTimeout(() => {
      intro.style.display = 'none';
    }, 850);
  };

  if (skipBtn) {
    skipBtn.addEventListener('click', finishIntro);
  }

  // Reproducir sonido de tren al inicio
  setTimeout(() => {
    sound.playTrainHorn();
  }, 400);

  // Terminar automáticamente a los 3 segundos exactos
  setTimeout(finishIntro, 3200);
}

// ==========================================
// 10. INICIALIZACIÓN GLOBAL DE LA APLICACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Nieve
  const snow = new Snowfall('snow-canvas');

  // Inicializar Intro
  initIntroScreen();

  // Inicializar Cuenta Atrás
  initCountdown();

  // Inicializar Calendario de Adviento
  const advent = new AdventCalendar();

  // Inicializar Sección de Compañeros
  const colleagueBox = new ColleagueGiftBox();

  // Inicializar Radar de Papá Noel
  const santaRadar = new SantaRailTracker();

  // Botones de Cabecera y Barra Móvil
  const soundBtn = document.getElementById('toggle-sound-btn');
  const mobileSoundBtn = document.getElementById('mobile-sound-btn');
  const snowBtn = document.getElementById('toggle-snow-btn');
  const openAllBtn = document.getElementById('open-all-days-btn');
  const resetBtn = document.getElementById('reset-advent-btn');
  const hornBtn = document.getElementById('radar-horn-btn');
  const boostBtn = document.getElementById('radar-boost-btn');

  const updateSoundUI = (active) => {
    const text = active ? '🔊 Sonido' : '🔇 Silencio';
    if (soundBtn) soundBtn.querySelector('span').innerText = text;
    if (mobileSoundBtn) mobileSoundBtn.querySelector('span').innerText = active ? 'Sonido' : 'Mudo';
  };

  const handleToggleSound = () => {
    const active = sound.toggleMute();
    updateSoundUI(active);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  if (soundBtn) soundBtn.onclick = handleToggleSound;
  if (mobileSoundBtn) mobileSoundBtn.onclick = handleToggleSound;

  if (snowBtn) {
    snowBtn.onclick = () => {
      const active = snow.toggle();
      snowBtn.querySelector('span').innerText = active ? '❄️ Nieve On' : '❄️ Nieve Off';
      if (navigator.vibrate) navigator.vibrate(30);
    };
  }

  if (openAllBtn) openAllBtn.onclick = () => advent.openAll();
  if (resetBtn) resetBtn.onclick = () => advent.resetAll();

  if (hornBtn) hornBtn.onclick = () => sound.playTrainHorn();
  if (boostBtn) boostBtn.onclick = () => santaRadar.boostSpeed();

  // Modal de Transparencia de Licitación
  const tenderBtn = document.getElementById('view-tender-btn');
  const tenderModal = document.getElementById('tender-modal');
  const closeTenderBtn = document.getElementById('close-tender-btn');

  if (tenderBtn && tenderModal) {
    tenderBtn.onclick = () => {
      tenderModal.classList.remove('hidden');
      tenderModal.classList.add('flex');
    };
  }
  if (closeTenderBtn && tenderModal) {
    closeTenderBtn.onclick = () => {
      tenderModal.classList.add('hidden');
      tenderModal.classList.remove('flex');
    };
  }
  if (tenderModal) {
    tenderModal.onclick = (e) => {
      if (e.target === tenderModal) {
        tenderModal.classList.add('hidden');
        tenderModal.classList.remove('flex');
      }
    };
  }

  // Primer toque en la pantalla desbloquea audio
  document.body.addEventListener('click', () => {
    sound.init();
  }, { once: true });
});
