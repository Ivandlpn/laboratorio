/**
 * REGALO SOLIDARIO INECO 2026 • NUESTROS MEJORES DESEOS PARA EL NUEVO AÑO
 * Ruta: Laponia (66°N) ➔ Sede Central Ineco (Madrid) ➔ Base de Monforte del Cid (Alicante)
 */

// ==========================================
// 1. DATOS OFICIALES DE LOS 9 REGALOS (ESTRUCTURA EDITORIAL DE MÁXIMA LEGIBILIDAD)
// ==========================================
const GIFTS_DATA = [
  {
    day: 1,
    title: "Aceite de Oliva Virgen Extra (AOVE)",
    subtitle: "D.O. de Andalucía • Botella Vidrio 500 ml",
    badge: "Oro Líquido",
    iconBg: "from-amber-600 to-yellow-500",
    realImage: "assets/products/P1.jpg",
    realThumb: "assets/products/P1_thumb.jpg",
    video: "Videos/Dia1.mp4",
    intro: "Obtenido directamente de olivares andaluces bajo Denominación de Origen protegida, este Aceite de Oliva Virgen Extra de 500 ml representa la máxima excelencia del campo andaluz.",
    details: [
      { label: "Origen y Extracción", text: "Elaborado mediante primera extracción en frío a partir de aceitunas seleccionadas en su punto óptimo de maduración, garantizando una acidez excepcionalmente baja." },
      { label: "Perfil Sensorial", text: "Aromas de frutado verde con recuerdos a hierba fresca recién cortada y tomatera, con un equilibrio sedoso y una riqueza sobresaliente en polifenoles naturales." },
      { label: "En Mesa", text: "Sublime para regar en crudo sobre pan tostado en los desayunos de invierno, así como para ensalzar ibéricos, asados y ensaladas en estas fiestas familiares." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="oilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D97706"/><stop offset="50%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#84CC16"/>
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#047857" stop-opacity="0.95"/><stop offset="35%" stop-color="#10B981" stop-opacity="0.8"/><stop offset="70%" stop-color="#064E3B" stop-opacity="0.95"/><stop offset="100%" stop-color="#022C22" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <path d="M92 25 L108 25 L108 45 L118 65 L124 165 Q124 175 114 175 L86 175 Q76 175 76 165 L82 65 L92 45 Z" fill="url(#glassGrad)" stroke="#34D399" stroke-width="1.8"/>
      <path d="M84 75 Q100 80 116 75 L122 165 Q122 173 114 173 L86 173 Q78 173 78 165 Z" fill="url(#oilGrad)" opacity="0.9"/>
      <rect x="80" y="95" width="40" height="50" rx="4" fill="#1A4488" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="112" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="123" font-size="6.5" fill="#D4AF37" text-anchor="middle" font-weight="600">AOVE 500ml</text>
      <text x="100" y="133" font-size="5" fill="#E2E8F0" text-anchor="middle">D.O. Andalucía</text>
      <rect x="91" y="20" width="18" height="12" rx="3" fill="#D4AF37" stroke="#F59E0B" stroke-width="1.5"/>
    </svg>`
  },
  {
    day: 2,
    title: "Tarro de Bonito del Norte en Aceite",
    subtitle: "Lomos Selectos del Cantábrico • 400 gramos",
    badge: "Cantábrico Seleccionado",
    iconBg: "from-sky-700 to-blue-500",
    realImage: "assets/products/P2.jpg",
    realThumb: "assets/products/P2_thumb.jpg",
    intro: "Capturado de forma artesanal a caña uno a uno en aguas del Mar Cantábrico durante la costera estival tradicional, este tarro hermético encierra los lomos más nobles del atún blanco.",
    details: [
      { label: "Calidad de Pieza", text: "Carne de tonalidad marfil claro y textura delicadamente laminada y hojaldrada, seleccionada a mano sin espinas ni pieles." },
      { label: "Maduración en Aceite", text: "Sumergido en aceite de oliva suave de primera prensa que redondea su jugosidad potenciando el auténtico sabor marino sin enmascararlo." },
      { label: "En Mesa", text: "Exquisito al natural con escamas de sal marina, sobre tostas crujientes de pan rústico o acompañado de pimientos templados en aperitivos navideños." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="tunaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FEF08A"/><stop offset="50%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#EA580C"/>
        </linearGradient>
      </defs>
      <rect x="62" y="65" width="76" height="95" rx="14" fill="#E0F2FE" opacity="0.4" stroke="#93C5FD" stroke-width="2"/>
      <rect x="66" y="75" width="68" height="80" rx="10" fill="url(#tunaGrad)" opacity="0.95"/>
      <rect x="60" y="98" width="80" height="36" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="112" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="122" font-size="6.5" font-weight="bold" fill="#FBBF24" text-anchor="middle">BONITO DEL NORTE</text>
      <text x="100" y="130" font-size="5" fill="#93C5FD" text-anchor="middle">En Aceite de Oliva • 400g</text>
      <rect x="58" y="52" width="84" height="15" rx="3" fill="#D4AF37" stroke="#F59E0B" stroke-width="1.8"/>
    </svg>`
  },
  {
    day: 3,
    title: "Tarro de Mermelada de Pimientos de Piquillo",
    subtitle: "Elaboración Artesanal • 120 gramos",
    badge: "Dulce & Especiado",
    iconBg: "from-red-700 to-rose-500",
    realImage: "assets/products/P3.jpg",
    realThumb: "assets/products/P3_thumb.jpg",
    intro: "Elaborada artesanalmente a fuego lento a partir de pimientos del piquillo recolectados en su punto óptimo de dulzura y caramelizados con azúcar de caña puro.",
    details: [
      { label: "Equilibrio Gastronómico", text: "Aporta un contraste magistral entre la dulzura untuosa y las notas sutilmente ahumadas y especiadas propias del pimiento del piquillo asado." },
      { label: "Textura", text: "Cremosa, brillante y de textura sedosa, ideal para untar con precisión o servir como base en canapés gourmet." },
      { label: "Maridaje Ideal", text: "Perfecta para acompañar quesos curados de oveja manchegos, rulos de cabra pasados por la plancha, patés selectos y carnes a la brasa." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="pepperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EF4444"/><stop offset="40%" stop-color="#DC2626"/><stop offset="100%" stop-color="#991B1B"/>
        </linearGradient>
      </defs>
      <rect x="68" y="80" width="64" height="75" rx="12" fill="#FEE2E2" opacity="0.35" stroke="#FCA5A5" stroke-width="2"/>
      <rect x="72" y="88" width="56" height="62" rx="8" fill="url(#pepperGrad)"/>
      <circle cx="100" cy="118" r="22" fill="#FFFBEB" stroke="#CB1823" stroke-width="1.8"/>
      <text x="100" y="112" font-size="7" font-weight="bold" fill="#1A4488" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="120" font-size="5" font-weight="bold" fill="#DC2626" text-anchor="middle">PIQUILLO</text>
      <text x="100" y="127" font-size="4.5" fill="#4B5563" text-anchor="middle">Mermelada 120g</text>
    </svg>`
  },
  {
    day: 4,
    title: "Trilogía de Mojo Canario (Pack 3)",
    subtitle: "Rojo Tradicional • Verde Cilantro • Mojo Picón (3x100g)",
    badge: "Sabor Canario",
    iconBg: "from-emerald-700 via-amber-600 to-red-600",
    realImage: "assets/products/P4.jpg",
    realThumb: "assets/products/P4_thumb.jpg",
    intro: "Auténtica trilogía del sabor insular presentada en un exclusivo pack expositor con tres tarros de 100 g que rinden tributo a la rica tradición culinaria de las Islas Canarias.",
    details: [
      { label: "Variedades del Pack", text: "Mojo Rojo suave para acompañamientos melosos; Mojo Verde aromático a base de cilantro fresco y ajo; y Mojo Picón bravo para los amantes del carácter intenso." },
      { label: "Ingredientes Naturales", text: "Preparados según recetas tradicionales únicamente con ingredientes naturales, sin conservantes ni aditivos artificiales." },
      { label: "Sugerencia", text: "El alma indispensable para bañar unas tradicionales papas arrugadas o realzar pescados a la plancha, verduras y carnes asadas." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="25" y="130" width="150" height="28" rx="6" fill="#1E293B" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="148" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">PACK MOJO CANARIO • INECO</text>
      <rect x="36" y="80" width="36" height="52" rx="6" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
      <rect x="82" y="80" width="36" height="52" rx="6" fill="#16A34A" stroke="#14532D" stroke-width="1.5"/>
      <rect x="128" y="80" width="36" height="52" rx="6" fill="#EA580C" stroke="#9A3412" stroke-width="1.5"/>
    </svg>`
  },
  {
    day: 5,
    title: "Chocolate Artesanal en Caja de Madera",
    subtitle: "3 Tabletas con Almendras (Negro, Leche y Blanco) • 450g",
    badge: "Delicatessen Gourmet",
    iconBg: "from-amber-900 via-amber-800 to-amber-950",
    realImage: "assets/products/P5.jpg",
    realThumb: "assets/products/P5_thumb.jpg",
    intro: "Una selecta colección de tres tabletas artesanales de 150 g elaboradas por maestros chocolateros y presentadas en un distinguido estuche de madera con tapa corredera.",
    details: [
      { label: "Tres Variedades", text: "Chocolate Negro de gran pureza e intensidad aromática; Chocolate con Leche cremoso y aterciopelado; y Chocolate Blanco perfumado con manteca de cacao pura." },
      { label: "Almendras Mediterráneas", text: "Repletas de almendras enteras seleccionadas de la cuenca mediterránea, tostadas a fuego lento hasta alcanzar el crujido perfecto." },
      { label: "Sobremesa Festiva", text: "El postre gourmet imprescindible para compartir en tertulias junto a café recién hecho o una copa de licor dulce." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="42" y="55" width="116" height="105" rx="6" fill="#78350F" stroke="#92400E" stroke-width="3"/>
      <rect x="52" y="65" width="28" height="75" rx="3" fill="#3B1C0B" stroke="#D4AF37" stroke-width="1"/>
      <rect x="86" y="65" width="28" height="75" rx="3" fill="#713F12" stroke="#D4AF37" stroke-width="1"/>
      <rect x="120" y="65" width="28" height="75" rx="3" fill="#FEF3C7" stroke="#D4AF37" stroke-width="1"/>
      <rect x="56" y="143" width="88" height="18" rx="3" fill="#451A03" stroke="#F59E0B" stroke-width="1.2"/>
      <text x="100" y="155" font-size="7" font-weight="bold" fill="#FEF3C7" text-anchor="middle" font-family="Poppins">CHOCOLATE ARTESANAL • 3x150g</text>
    </svg>`
  },
  {
    day: 6,
    title: "Café 100% Arábica Natural",
    subtitle: "Paquete de 250 gramos • Tueste Natural Molido",
    badge: "Esencia Exclusiva",
    iconBg: "from-stone-800 to-amber-950",
    realImage: "assets/products/P6.jpg",
    realThumb: "assets/products/P6_thumb.jpg",
    intro: "Selección de granos 100% Arábica cultivados en plantaciones de altura y sometidos a un tueste natural pausado que preserva toda su riqueza aromática.",
    details: [
      { label: "Perfil de Taza", text: "Cuerpo sedoso y equilibrado, con elegantes notas florales y achocolatadas, y una acidez limpia muy agradable." },
      { label: "Conservación Óptima", text: "Envase termosellado con válvula desgasificadora unidireccional para proteger los aceites esenciales del grano frente al aire y la humedad." },
      { label: "Molienda Versátil", text: "Calibrado ideal para cafetera italiana tradicional (moka) o de filtro, inundando la casa del inconfundible aroma a café tostado." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <path d="M68 50 L132 50 L126 155 Q126 165 116 165 L84 165 Q74 165 74 155 Z" fill="#78350F" stroke="#92400E" stroke-width="2"/>
      <rect x="74" y="90" width="52" height="50" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="105" font-size="8" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="117" font-size="6" font-weight="bold" fill="#FBBF24" text-anchor="middle">CAFÉ ARÁBICA</text>
      <text x="100" y="126" font-size="4.5" fill="#E2E8F0" text-anchor="middle">100% Natural • 250g</text>
    </svg>`
  },
  {
    day: 7,
    title: "Baraja Española Personalizada Ineco",
    subtitle: "40 Naipes de 61,5 x 95 mm • Barniz Acuoso Durabilidad",
    badge: "Edición Coleccionista",
    iconBg: "from-blue-700 to-indigo-900",
    realImage: "assets/products/P7.jpg",
    realThumb: "assets/products/P7_thumb.jpg",
    intro: "Edición conmemorativa de coleccionista de la clásica baraja española de 40 cartas, diseñada en exclusiva con la iconografía corporativa de Ineco y la alta velocidad ferroviaria.",
    details: [
      { label: "Calidad de Naipe", text: "Fabricada sobre cartulina estucada de 310 g/m² de fibra larga con acabado barniz acuoso protector de alta densidad." },
      { label: "Diseño Conmemorativo", text: "Reversos personalizados conmemorando el horizonte de unión y los retos del nuevo año 2027." },
      { label: "Tradición Familiar", text: "El complemento perfecto para avivar las risas, anécdotas y tradicionales partidas familiares tras las comidas de fiesta." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="76" y="55" width="48" height="74" rx="4" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.8"/>
      <circle cx="100" cy="92" r="14" fill="#FCD34D" stroke="#D97706" stroke-width="1.5"/>
      <text x="100" y="95" font-size="7.5" font-weight="bold" fill="#78350F" text-anchor="middle">AVE</text>
      <rect x="52" y="130" width="96" height="24" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="146" font-size="7.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">BARAJA ESPAÑOLA INECO</text>
    </svg>`
  },
  {
    day: 8,
    title: "Calcetines Técnicos Corporativos Ineco",
    subtitle: "Algodón ≥80% • Costura Plana Anti-Rozaduras • Puntera Reforzada",
    badge: "Confort Máximo",
    iconBg: "from-blue-800 to-red-700",
    realImage: "assets/products/P8.jpg",
    realThumb: "assets/products/P8_thumb.jpg",
    intro: "Diseñados para brindar un confort térmico y una ergonomía superior en los meses de invierno, combinando transpirabilidad, elasticidad y abrigo duradero.",
    details: [
      { label: "Tejido Técnico", text: "Confección con más de un 80% de algodón peinado transpirable de fibra larga y elastano de memoria para un ajuste perfecto que no oprime." },
      { label: "Acabado Sin Fricciones", text: "Remallado plano artesanal punto a punto en la puntera para eliminar cualquier relieve o molestia, con talón reforzado acolchado." },
      { label: "Detalle Festivo", text: "Un detalle cálido y confortable con el sello de Ineco para relajarse en casa o afrontar las jornadas de guardia con la máxima calidez." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <path d="M72 45 L98 45 L98 105 Q98 135 125 135 L135 135 Q145 135 145 148 Q145 160 130 160 L90 160 Q68 160 68 135 L68 48 Q68 45 72 45 Z" fill="#1A4488" stroke="#3463AC" stroke-width="2.2"/>
      <rect x="68" y="42" width="30" height="12" rx="2" fill="#CB1823" stroke="#D4AF37" stroke-width="1.2"/>
      <text x="83" y="100" font-size="6.5" font-weight="bold" fill="#FCD34D" text-anchor="middle">ineco</text>
    </svg>`
  },
  {
    day: 9,
    title: "Tarjeta Navideña Solidaria Ineco",
    subtitle: "Formato A4 Doble Cara • Papel Offset Blanco 80g FSC",
    badge: "Compromiso Social",
    iconBg: "from-red-800 to-amber-700",
    realImage: "assets/products/P9.jpg",
    realThumb: "assets/products/P9_thumb.jpg",
    intro: "Tarjeta institucional de felicitación y gratitud de Ineco, impresa a doble cara en formato A4 plegado sobre papel offset blanco de 80 g/m² con certificación ecológica FSC.",
    details: [
      { label: "Mensaje Institucional", text: "Transmite el agradecimiento a la dedicación, profesionalidad y compromiso de todo el equipo durante el año 2026." },
      { label: "Dimensión Solidaria", text: "Detalla el balance social de los proyectos y colectivos apoyados con la adquisición de esta cesta navideña solidaria." },
      { label: "Deseos 2027", text: "Un recuerdo entrañable y testimonio de unión para brindar juntos por los éxitos personales y profesionales del año que comienza." }
    ],
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="45" y="45" width="110" height="120" rx="5" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2.2"/>
      <rect x="100" y="45" width="55" height="120" rx="0" fill="#1A4488" opacity="0.95"/>
      <text x="127" y="70" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="127" y="125" font-size="5.5" font-weight="bold" fill="#FEF3C7" text-anchor="middle">FELIZ 2027</text>
    </svg>`
  }
];

// ==========================================
// 2. COMPAÑEROS DE LA OFICINA (12 INTEGRANTES EN ORDEN ALFABÉTICO • DESEOS 2027)
// ==========================================
const COLLEAGUES = [
  {
    name: "Ana",
    role: "Ingeniería & Coordinación de Operaciones",
    wish: "¡Que el 2027 traiga trazados despejados, máxima precisión en cada proyecto y momentos entrañables junto a los tuyos!",
    ticketSeat: "Coche 01 • Asiento 01A (Club)",
    loc: "LOC-ANA-2027-MDC"
  },
  {
    name: "Edu",
    role: "Especialista en Mantenimiento de Infraestructura",
    wish: "¡Fuerza, salud y que la catenaria de la vida siga transmitiendo la mejor energía en este 2027 en cada guardia y jornada compartida!",
    ticketSeat: "Coche 01 • Asiento 02B (Club)",
    loc: "LOC-EDU-2027-MDC"
  },
  {
    name: "Ernesto",
    role: "Supervisión Técnica de Vía y Desvíos",
    wish: "¡Que la aguja de tu destino apunte siempre a la felicidad y que en 2027 celebremos muchos éxitos en equipo!",
    ticketSeat: "Coche 02 • Asiento 03A (Preferente)",
    loc: "LOC-ERN-2027-MDC"
  },
  {
    name: "Gloria",
    role: "Gestión de Calidad & Seguridad Ferroviaria",
    wish: "¡Brindamos por tu dedicación impecable! Que el 2027 llene tu hogar de paz, sonrisas y momentos dorados.",
    ticketSeat: "Coche 02 • Asiento 04B (Preferente)",
    loc: "LOC-GLO-2027-MDC"
  },
  {
    name: "Irene",
    role: "Planificación & Control de Gestión",
    wish: "¡Que el cronograma de este 2027 venga repleto de alegrías cumplidas, tranquilidad y proyectos ilusionantes!",
    ticketSeat: "Coche 03 • Asiento 05A (Turista Plus)",
    loc: "LOC-IRE-2027-MDC"
  },
  {
    name: "Iván Álvarez",
    role: "Especialista de Sistemas y Auscultación",
    wish: "¡Velocidad de crucero a 300 km/h para tus metas y la mejor sintonía en cada reto del nuevo año 2027!",
    ticketSeat: "Coche 03 • Asiento 06B (Turista Plus)",
    loc: "LOC-IVA-2027-MDC"
  },
  {
    name: "Iván de la Paz",
    role: "Responsable de Equipos & Innovación Tecnológica",
    wish: "¡Gracias por liderar con entusiasmo y visión de futuro! Que el 2027 te devuelva multiplicado todo tu esfuerzo y compañerismo.",
    ticketSeat: "Coche 01 • Asiento 01B (Cabina de Mando)",
    loc: "LOC-IDP-2027-MDC"
  },
  {
    name: "Jose Luis",
    role: "Operaciones y Mantenimiento Ferroviario",
    wish: "¡Que en 2027 no falte nunca el buen humor, la salud de hierro y el calor de los tuyos en estas fechas tan señaladas!",
    ticketSeat: "Coche 04 • Asiento 07A (Turista)",
    loc: "LOC-JOS-2027-MDC"
  },
  {
    name: "Manuel",
    role: "Especialista en Instalaciones y Telecomunicaciones",
    wish: "¡Conexión permanente con la felicidad y señal verde en todos los caminos que emprendas en 2027!",
    ticketSeat: "Coche 04 • Asiento 08B (Turista)",
    loc: "LOC-MAN-2027-MDC"
  },
  {
    name: "Pascual",
    role: "Coordinación de Seguridad y Salud en Obra",
    wish: "¡Protección máxima y la mayor de las alegrías para ti y tu familia en esta Navidad y con la vista puesta en 2027!",
    ticketSeat: "Coche 05 • Asiento 09A (Turista)",
    loc: "LOC-PAS-2027-MDC"
  },
  {
    name: "Pepe",
    role: "Técnico Especialista de Mantenimiento Integral",
    wish: "¡Maestría, experiencia y compañerismo puro. Que disfrutes de esta merecidísima cesta solidaria para dar la bienvenida al 2027 con los que más quieres!",
    ticketSeat: "Coche 05 • Asiento 10B (Turista)",
    loc: "LOC-PEP-2027-MDC"
  },
  {
    name: "Raúl",
    role: "Gestión de Activos y Logística Ferroviaria",
    wish: "¡Distribución perfecta de salud, amor y prosperidad para el nuevo año 2027. ¡A disfrutar del detalle solidario!",
    ticketSeat: "Coche 06 • Asiento 11A (Turista)",
    loc: "LOC-RAU-2027-MDC"
  }
];

// ==========================================
// 3. MOTOR DE AUDIO
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = true;
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
    } else {
      this.init();
      this.startBgMelody();
    }
    return !this.muted;
  }

  playNote(freq = 440, duration = 0.35) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playIceCrack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playSuccessTone() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 0.22), idx * 80);
    });
  }

  playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const fanfare = [
      { f: 523.25, d: 0.15, delay: 0 },
      { f: 523.25, d: 0.15, delay: 150 },
      { f: 523.25, d: 0.15, delay: 300 },
      { f: 659.25, d: 0.35, delay: 450 },
      { f: 783.99, d: 0.60, delay: 750 }
    ];
    fanfare.forEach(n => {
      setTimeout(() => this.playNote(n.f, n.d), n.delay);
    });
  }

  playGameCollect() {
    this.playNote(880, 0.12);
    setTimeout(() => this.playNote(1174.66, 0.2), 80);
  }

  playChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, t);
    osc.frequency.exponentialRampToValueAtTime(2093, t + 0.08);
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
    const bufferSize = this.ctx.sampleRate * 0.35;
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
    filter.frequency.exponentialRampToValueAtTime(3600, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
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
    [311.13, 370.0].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.02, t + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1300, t);

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

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + (idx * 0.1);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.85);
    });
  }

  startBgMelody() {
    if (this.muted || this.bgMelodyPlaying) return;
    this.init();
    if (!this.ctx) return;
    this.bgMelodyPlaying = true;

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

      gain.gain.setValueAtTime(0.07, t);
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
// 3.1. MOTOR HÁPTICO MULTI-SENSORIAL
// ==========================================
const haptics = {
  trainJoint() {
    if (navigator.vibrate) navigator.vibrate([25, 35, 25]);
  },
  scratch() {
    if (navigator.vibrate) navigator.vibrate(12);
  },
  horn() {
    if (navigator.vibrate) navigator.vibrate([180, 60, 260]);
  },
  fanfare() {
    if (navigator.vibrate) navigator.vibrate([40, 50, 40, 50, 100, 40, 160]);
  },
  chime() {
    if (navigator.vibrate) navigator.vibrate(30);
  }
};

// ==========================================
// 4. ANIMACIÓN DE NIEVE (Canvas Dinámico con Dual Palette)
// ==========================================
class Snowfall {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.flakes = [];
    this.active = true;
    this.theme = 'arctic'; // 'arctic' o 'mediterranean'
    this.maxFlakes = window.innerWidth < 640 ? 40 : 80;
    this.resize();
    this.initFlakes();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setTheme(themeName) {
    this.theme = themeName === 'mediterranean' ? 'mediterranean' : 'arctic';
    this.initFlakes();
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
        opacity: Math.random() * 0.7 + 0.3,
        colorType: Math.floor(Math.random() * 3)
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
    if (this.active && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.flakes.forEach(f => {
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);

        if (this.theme === 'mediterranean') {
          if (f.colorType === 0) {
            this.ctx.fillStyle = `rgba(252, 211, 77, ${f.opacity * 0.9})`;
          } else if (f.colorType === 1) {
            this.ctx.fillStyle = `rgba(245, 158, 11, ${f.opacity * 0.8})`;
          } else {
            this.ctx.fillStyle = `rgba(254, 243, 199, ${f.opacity})`;
          }
        } else {
          if (f.colorType === 0) {
            this.ctx.fillStyle = `rgba(186, 230, 253, ${f.opacity * 0.85})`;
          } else {
            this.ctx.fillStyle = `rgba(248, 250, 252, ${f.opacity})`;
          }
        }

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
  const targetDate = new Date("2026-12-14T09:00:00+01:00").getTime();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMins = document.getElementById('cd-mins');
    const elSecs = document.getElementById('cd-secs');
    const statusText = document.getElementById('cd-status-text');

    if (diff <= 0) {
      if (elDays) elDays.innerText = "00";
      if (elHours) elHours.innerText = "00";
      if (elMins) elMins.innerText = "00";
      if (elSecs) elSecs.innerText = "00";
      if (statusText) {
        statusText.innerText = "¡Los detalles solidarios han llegado a la Base de Monforte del Cid!";
        statusText.classList.remove('hidden');
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    if (elDays) elDays.innerText = pad(days);
    if (elHours) elHours.innerText = pad(hours);
    if (elMins) elMins.innerText = pad(mins);
    if (elSecs) elSecs.innerText = pad(secs);
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// 6. RADAR FERROVIARIO Y HILO TEMPORAL
// Laponia (66°N) ➔ Corredor Europeo ➔ Sede Ineco (Madrid) ➔ Base Monforte del Cid
// ==========================================
class SantaRailTracker {
  constructor() {
    this.trainMarker = document.getElementById('train-marker');
    this.speedDisplay = document.getElementById('radar-speed');
    this.statusDisplay = document.getElementById('radar-status');
    this.distDisplay = document.getElementById('radar-distance');
    this.coordsDisplay = document.getElementById('radar-coords');
    this.slider = document.getElementById('radar-progress-slider');
    this.progressPct = 5;

    // Coordenadas calibradas sobre el mapa GIS profesional (460x330)
    this.waypoints = [
      { pct: 0, x: 380, y: 40, angle: 120, name: "Laponia (Círculo Polar 66° 33'N)", coords: "66.5039°N, 25.7294°E", days: "36 días", speed: "180 km/h", status: "Taller Ártico de Laponia. Embarque de los lotes solidarios y salida por la red polar." },
      { pct: 15, x: 355, y: 85, angle: 145, name: "Golfo de Botnia & Báltico Norte", coords: "63.8258°N, 20.2630°E", days: "32 días", speed: "200 km/h", status: "Travesía por el corredor nórdico hacia Escandinavia central." },
      { pct: 30, x: 315, y: 140, angle: 155, name: "Escandinavia Sur (Estocolmo / Malmö)", coords: "59.3293°N, 18.0686°E", days: "27 días", speed: "230 km/h", status: "Enlace internacional por el corredor transfronterizo hacia Europa Central." },
      { pct: 50, x: 235, y: 195, angle: 145, name: "Corredor Europeo TEN-T (París)", coords: "48.8566°N, 2.3522°E", days: "20 días", speed: "270 km/h", status: "Tránsito por el corredor de alta velocidad europeo hacia el eje atlántico." },
      { pct: 65, x: 185, y: 242, angle: 160, name: "Paso Pirenaico (Burdeos / Hendaya)", coords: "43.3584°N, -1.7760°W", days: "16 días", speed: "220 km/h", status: "Paso fronterizo e interoperabilidad ferroviaria hacia la red española." },
      { pct: 75, x: 162, y: 288, angle: 125, name: "Sede Central Ineco (Madrid)", coords: "40.4532°N, -3.6883°W", days: "13 días", speed: "160 km/h", status: "Escala técnica y felicitación institucional en Paseo de la Habana 138 (Madrid)." },
      { pct: 88, x: 185, y: 304, angle: 125, name: "Línea de Alta Velocidad (Cuenca / Albacete)", coords: "39.4699°N, -1.6500°W", days: "5 días", speed: "300 km/h", status: "Velocidad de crucero 300 km/h con señalización ERTMS Nivel 2." },
      { pct: 100, x: 202, y: 318, angle: 125, name: "Base de Mantenimiento de Monforte del Cid", coords: "38.4067°N, -0.6949°W", days: "0 días (Llegada)", speed: "0 km/h", status: "¡Llegada y entrega oficial del Regalo Solidario en Monforte del Cid!" }
    ];

    this.init();
  }

  init() {
    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.setProgress(parseFloat(e.target.value));
      });
    }
    this.setProgress(5);
  }

  setProgress(pct) {
    this.progressPct = Math.max(0, Math.min(100, pct));
    if (this.slider && parseFloat(this.slider.value) !== this.progressPct) {
      this.slider.value = this.progressPct;
    }

    let p0 = this.waypoints[0];
    let p1 = this.waypoints[this.waypoints.length - 1];

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      if (this.progressPct >= this.waypoints[i].pct && this.progressPct <= this.waypoints[i + 1].pct) {
        p0 = this.waypoints[i];
        p1 = this.waypoints[i + 1];
        break;
      }
    }

    const span = p1.pct - p0.pct;
    const factor = span === 0 ? 0 : (this.progressPct - p0.pct) / span;

    const currentX = p0.x + (p1.x - p0.x) * factor;
    const currentY = p0.y + (p1.y - p0.y) * factor;

    const currentAngle = p0.angle + (p1.angle - p0.angle) * factor;

    if (this.trainMarker) {
      this.trainMarker.setAttribute('transform', `translate(${currentX.toFixed(1)}, ${currentY.toFixed(1)}) rotate(${currentAngle.toFixed(1)})`);
    }

    const currentWp = factor < 0.5 ? p0 : p1;
    if (this.statusDisplay) this.statusDisplay.innerText = currentWp.status;
    if (this.distDisplay) this.distDisplay.innerText = currentWp.days;
    if (this.speedDisplay) this.speedDisplay.innerText = currentWp.speed;
    if (this.coordsDisplay) this.coordsDisplay.innerText = currentWp.coords;

    const needle = document.getElementById('speedo-needle-line');
    if (needle) {
      let numericSpeed = 180;
      if (currentWp.speed.includes('350')) numericSpeed = 350;
      else if (currentWp.speed.includes('300')) numericSpeed = 300;
      else if (currentWp.speed.includes('260')) numericSpeed = 260;
      else if (currentWp.speed.includes('220')) numericSpeed = 220;
      else if (currentWp.speed.includes('180')) numericSpeed = 180;
      else if (currentWp.speed.includes('160')) numericSpeed = 160;
      else if (currentWp.speed.includes('0')) numericSpeed = 0;

      const angle = -90 + (numericSpeed / 400) * 180;
      needle.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    }
  }

  jumpTo(stage) {
    let targetPct = 5;
    if (stage === 'laponia') targetPct = 0;
    else if (stage === 'europe') targetPct = 50;
    else if (stage === 'madrid') targetPct = 75;
    else if (stage === 'monforte') targetPct = 100;

    this.animateTo(targetPct);
    sound.playChime();
  }

  animateTo(targetPct) {
    const startPct = this.progressPct;
    const diff = targetPct - startPct;
    const duration = 500;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.setProgress(startPct + diff * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  boostSpeed() {
    sound.playTrainHorn();
    haptics.horn();
    if (this.speedDisplay) this.speedDisplay.innerText = "350 km/h (Modo Trineo AVE)";
    setTimeout(() => {
      this.setProgress(this.progressPct);
    }, 3500);
  }
}

// ==========================================
// 7. GESTOR DEL CALENDARIO DE ADVIENTO (9 DÍAS)
// ==========================================
class AdventCalendar {
  constructor() {
    this.openedDays = new Set(JSON.parse(localStorage.getItem('ineco_advent_2026') || '[]'));
    this.container = document.getElementById('advent-grid');
    this.progressCount = document.getElementById('discovered-count');
    this.progressBar = document.getElementById('discovered-bar');
    this.currentModalDay = 1;
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
          <!-- CARA FRONTAL: BILLETE SOLIDARIO MISTERIOSO (SIN SPOILERS) -->
          <div class="advent-front p-4 sm:p-5 flex flex-col justify-between select-none foil-sheen relative overflow-hidden">
            <div class="ticket-guilloche-bg"></div>
            <div class="ticket-notch notch-left"></div>
            <div class="ticket-notch notch-right"></div>

            <div class="gift-ribbon-horizontal"></div>
            <div class="gift-ribbon-vertical"></div>

            <!-- Sello Central Moneda de Oro Relieve -->
            <div class="gift-seal-badge w-20 h-20 rounded-full flex flex-col items-center justify-center red-pulse">
              <div class="seal-inner-coin flex flex-col items-center justify-center w-full h-full rounded-full">
                <span class="text-[8px] font-black uppercase tracking-widest text-amber-950 flex items-center gap-1">
                  <span>★</span><span>DÍA</span><span>★</span>
                </span>
                <span class="text-2xl font-black text-slate-950 font-poppins leading-none my-0.5">${gift.day}</span>
                <span class="text-[8px] font-black tracking-widest text-slate-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-600/30">2026</span>
              </div>
            </div>

            <div class="flex justify-between items-center z-10 w-full">
              <span class="ticket-tag-ave inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9.5px] font-black tracking-wider uppercase shadow-md">
                <span class="text-xs">🚄</span> <span>BILLETE AVE</span>
              </span>
              <span class="ticket-tag-action inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold text-amber-200 shadow-md">
                <span>🎁</span> <span class="hidden xs:inline">Toca o Rasca</span>
              </span>
            </div>

            <div class="z-10 w-full my-auto pointer-events-none flex items-center justify-between text-[8px] font-mono text-blue-200/75 px-1">
              <span class="font-bold">№ 2026-AV-0${gift.day}</span>
              <span class="tracking-widest hidden sm:inline">• • • • • • • • • • • •</span>
              <span class="text-amber-300 font-bold">ALTA VELOCIDAD</span>
            </div>

            <div class="z-10 mt-auto pt-2.5 w-full flex items-center justify-between text-xs border-t border-amber-400/30">
              <span class="font-bold text-[11px] text-amber-300 flex items-center gap-1.5 drop-shadow">
                <span class="text-xs animate-pulse">✨</span>
                <span>Regalo Misterioso</span>
              </span>
              <span class="ticket-ineco-badge px-3 py-0.5 rounded-full text-[10px] text-white font-black tracking-wider shadow-md">
                INECO 2026
              </span>
            </div>
          </div>

          <!-- CARA TRASERA (Producto Revelado) -->
          <div class="advent-back p-4 flex flex-col justify-between">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                ✓ Día ${gift.day} Descubierto
              </span>
              <span class="text-xs font-black text-red-400">INECO 2026</span>
            </div>

            <div class="w-full h-36 my-1 flex items-center justify-center p-1 relative overflow-hidden rounded-xl bg-slate-950/60 border border-slate-700/60">
              ${gift.realThumb ? `
                <img src="${gift.realThumb}" alt="${gift.title}" class="w-full h-full object-cover rounded-lg border border-amber-400/40 shadow-md group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
                <div class="hidden w-full h-full flex items-center justify-center">${gift.svg}</div>
              ` : `
                <div class="w-full h-full flex items-center justify-center">${gift.svg}</div>
              `}
            </div>

            <div class="text-center mt-auto">
              <h4 class="font-bold text-sm text-slate-100 line-clamp-1 font-poppins">${gift.title}</h4>
              <p class="text-[11px] text-amber-300 line-clamp-1 font-medium">${gift.subtitle}</p>
              <button type="button" class="open-gift-detail-btn mt-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 active:scale-95 text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition cursor-pointer border border-blue-400/40 hover:border-amber-400" data-day="${gift.day}">
                <span>📖</span>
                <span>Leer Detalle Completo</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      const card = col.querySelector('.advent-card');
      card.addEventListener('click', (e) => {
        if (e.target.closest('.open-gift-detail-btn')) return;
        this.handleCardClick(gift.day);
      });

      const detailBtn = col.querySelector('.open-gift-detail-btn');
      if (detailBtn) {
        detailBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          sound.playChime();
          this.openGiftModal(gift.day);
        });
      }

      if (!isOpened) {
        setupCardScratch(card, gift.day, () => {
          this.handleCardClick(gift.day);
        });
      }

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
      if (card) card.classList.add('opened');
      this.openedDays.add(day);
      localStorage.setItem('ineco_advent_2026', JSON.stringify([...this.openedDays]));
      this.updateProgress();
      if (card) this.triggerConfettiAt(card);

      this.openGiftModal(day);
      setTimeout(() => sound.playChime(), 120);
    } else {
      sound.playChime();
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
    this.render();
    sound.playChime();
    haptics.chime();
  }

  // ==========================================
  // APERTURA MODAL: ALTA LEGIBILIDAD EDITORIAL (SIN LOS TEXTOS PROHIBIDOS NI CAMPANADA)
  // ==========================================
  openGiftModal(day) {
    this.currentModalDay = day;
    const gift = GIFTS_DATA.find(g => g.day === day);
    if (!gift) return;

    const modal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('gift-modal-body');

    modalContent.innerHTML = `
      <div class="relative">
        <!-- Encabezado del Modal -->
        <div class="flex items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white font-black flex items-center justify-center text-lg shadow-md border border-amber-300">
              ${gift.day}
            </span>
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
                  Día ${gift.day} de Adviento
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-blue-900/70 text-blue-200 text-[11px] font-semibold border border-blue-500/30">
                  ${gift.badge}
                </span>
              </div>
              <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-white font-poppins leading-tight">${gift.title}</h3>
              <p class="text-xs sm:text-sm text-amber-300 font-semibold">${gift.subtitle}</p>
            </div>
          </div>
          <button id="close-modal-btn" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition shadow-lg shrink-0 border border-slate-700 active:scale-95" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- CUERPO PRINCIPAL: FOTOGRAFÍA LIMPIA + NARRATIVA EDITORIAL DE ALTA LEGIBILIDAD -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-stretch">
          
          <!-- COLUMNA IZQUIERDA: VISOR MULTIMEDIA FOTO / VÍDEO OFICIAL -->
          <div class="lg:col-span-5 flex flex-col justify-center">
            <div class="relative rounded-2xl overflow-hidden border-2 border-amber-400/70 shadow-2xl bg-slate-950 group h-full min-h-[300px] flex items-center justify-center">
              
              ${gift.video ? `
              <!-- VISOR MULTIMEDIA CONMUTABLE (FOTO / VÍDEO OFICIAL) -->
              <div class="relative w-full h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden p-2">
                <!-- Contenedor del Vídeo -->
                <div id="modal-video-box" class="w-full h-full flex items-center justify-center relative">
                  <video id="modal-product-video" 
                         src="${gift.video || 'Videos/Dia1.mp4'}"
                         controls 
                         autoplay 
                         muted 
                         loop 
                         playsinline 
                         preload="auto" 
                         poster="assets/products/P${gift.day}.jpg" 
                         class="w-full h-full object-contain rounded-xl shadow-2xl bg-black">
                    <source src="${gift.video || 'Videos/Dia1.mp4'}" type="video/mp4">
                    <source src="assets/products/Dia${gift.day}.mp4" type="video/mp4">
                  </video>
                </div>

                <!-- Contenedor de la Fotografía (Alternable) -->
                <div id="modal-photo-box" class="hidden w-full h-full flex items-center justify-center">
                  <img src="assets/products/P${gift.day}.jpg" 
                       alt="${gift.title}" 
                       class="w-full h-full object-contain sm:object-cover rounded-xl shadow-2xl" 
                       onerror="this.onerror=null; this.src='${gift.realImage || 'assets/cesta_solidaria_real.jpg'}';">
                </div>
              </div>

              <!-- Pestañas de Alternancia Foto / Vídeo -->
              <div class="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-amber-400/50 shadow-lg">
                <button id="modal-toggle-video" class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gradient-to-r from-red-600 to-amber-500 text-white shadow">
                  <span>🎬</span> Vídeo
                </button>
                <button id="modal-toggle-photo" class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-300 hover:text-white">
                  <span>📸</span> Foto
                </button>
              </div>
              ` : `
              <!-- VISOR DE FOTOGRAFÍA ESTÁNDAR -->
              <div class="relative w-full h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden p-2">
                <img src="assets/products/P${gift.day}.jpg" 
                     alt="${gift.title}" 
                     class="w-full h-full object-contain sm:object-cover rounded-xl transform group-hover:scale-103 transition-transform duration-700 shadow-2xl" 
                     loading="eager" 
                     onerror="this.onerror=null; this.src='${gift.realImage || 'assets/cesta_solidaria_real.jpg'}';">
              </div>
              `}

              <!-- Pie Limpio con Identidad Ineco (Sin Base Monforte ni LAV) -->
              <div class="absolute bottom-3 right-3 z-10">
                <span class="text-[10px] bg-red-600/90 text-white px-3 py-1 rounded-full font-black tracking-wider shadow border border-amber-300/40">
                  INECO 2026
                </span>
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA: DESCRIPCIÓN ESTRUCTURADA Y DE MÁXIMA LEGIBILIDAD -->
          <div class="lg:col-span-7 flex flex-col justify-between">
            <div class="bg-gradient-to-br from-slate-900/95 via-blue-950/70 to-slate-900/95 rounded-2xl p-5 sm:p-7 border border-amber-400/30 shadow-2xl relative flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xl">✨</span>
                  <h4 class="text-xs sm:text-sm uppercase font-extrabold tracking-wider text-amber-300">
                    Ficha Técnica y Nota Gastronómica
                  </h4>
                </div>
                
                <!-- Introducción Fluida -->
                <p class="text-sm sm:text-base text-slate-100 leading-relaxed font-normal mb-4">
                  ${gift.intro}
                </p>

                <!-- 3 Bloques Estructurados para Lectura Cómoda -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  ${gift.details.map(d => `
                    <div class="bg-slate-900/90 rounded-xl p-3 border border-slate-700/80 shadow">
                      <span class="text-[11px] font-bold text-amber-300 block mb-1">
                        ✦ ${d.label}
                      </span>
                      <p class="text-xs text-slate-200 leading-relaxed">
                        ${d.text}
                      </p>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Sellos de Calidad al Pie -->
              <div class="pt-4 border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1 rounded-lg bg-blue-900/70 text-blue-200 border border-blue-400/30 font-bold text-[11px] flex items-center gap-1">
                    <span>📦</span> Lote Solidario
                  </span>
                  <span class="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1">
                    <span>⭐</span> Calidad Gourmet
                  </span>
                </div>
                <span class="font-mono text-amber-300 text-xs font-semibold">Nuestros Mejores Deseos</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Barra Inferior de Navegación del Modal (Sin botón Campanada) -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/80">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="modal-prev-gift" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition ${day === 1 ? 'opacity-40 pointer-events-none' : ''}">
              ◀ Anterior
            </button>
            <button id="modal-next-gift" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition ${day === 9 ? 'opacity-40 pointer-events-none' : ''}">
              Siguiente ▶
            </button>
          </div>
          <div class="w-full sm:w-auto flex justify-end">
            <button id="modal-confirm-btn" class="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-red-600 hover:from-blue-600 hover:to-red-500 text-white text-xs font-black shadow-md transition active:scale-95">
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('close-modal-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const prevBtn = document.getElementById('modal-prev-gift');
    const nextBtn = document.getElementById('modal-next-gift');

    const stopModalVideo = () => {
      const v = document.getElementById('modal-product-video');
      if (v) v.pause();
    };

    const closeModal = () => {
      stopModalVideo();
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (confirmBtn) confirmBtn.onclick = closeModal;

    if (prevBtn) prevBtn.onclick = () => {
      stopModalVideo();
      this.openGiftModal(day - 1);
    };
    if (nextBtn) nextBtn.onclick = () => {
      stopModalVideo();
      this.openGiftModal(day + 1);
    };

    // Conmutador interactivo Foto / Vídeo
    const toggleVideoBtn = document.getElementById('modal-toggle-video');
    const togglePhotoBtn = document.getElementById('modal-toggle-photo');
    const videoBox = document.getElementById('modal-video-box');
    const photoBox = document.getElementById('modal-photo-box');
    if (toggleVideoBtn && togglePhotoBtn && videoBox && photoBox) {
      toggleVideoBtn.onclick = () => {
        videoBox.classList.remove('hidden');
        photoBox.classList.add('hidden');
        toggleVideoBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gradient-to-r from-red-600 to-amber-500 text-white shadow";
        togglePhotoBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-300 hover:text-white";
        const v = document.getElementById('modal-product-video');
        if (v) v.play().catch(() => {});
      };
      togglePhotoBtn.onclick = () => {
        videoBox.classList.add('hidden');
        photoBox.classList.remove('hidden');
        togglePhotoBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gradient-to-r from-red-600 to-amber-500 text-white shadow";
        toggleVideoBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-300 hover:text-white";
        stopModalVideo();
      };
    }

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
        particleCount: 50,
        spread: 70,
        origin: { x, y: Math.max(0.2, y) }
      });
    }
  }
}

// ==========================================
// 8. GESTOR DE "ABRIR TU REGALO" (OFICINA MONFORTE)
// BILLETE OFICIAL: ORIGEN LAPONIA ➔ PARADA INTERMEDIA SEDE INECO ➔ DESTINO MONFORTE
// DESPIECE 3D PROFESIONAL MEJORADO
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
    this.select(COLLEAGUES[0]);
  }

  renderButtons() {
    if (!this.container) return;
    this.container.innerHTML = '';

    COLLEAGUES.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `px-3 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none ${
        idx === 0 
          ? 'bg-blue-800/95 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40' 
          : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700/70'
      }`;
      btn.setAttribute('data-name', c.name);

      const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2);
      btn.innerHTML = `
        <div class="flex items-center gap-2 w-full overflow-hidden">
          <span class="w-6 h-6 rounded-lg bg-blue-950 text-amber-300 font-black flex items-center justify-center text-[10px] border border-blue-400/40 shrink-0 shadow-inner">
            ${initials}
          </span>
          <span class="font-bold text-xs truncate">${c.name}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(35);
        sound.playChime();
        this.select(c);

        this.container.querySelectorAll('button').forEach(b => {
          b.className = 'px-3 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700/70';
        });
        btn.className = 'px-3 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-blue-800/95 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40';

        if (window.innerWidth < 1024 && this.detailsCard) {
          this.detailsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      this.container.appendChild(btn);
    });
  }

  select(colleague) {
    this.selectedColleague = colleague;
    if (!this.detailsCard) return;

    this.detailsCard.innerHTML = `
      <div class="space-y-6">
        <!-- BILLETE DE ALTA VELOCIDAD: LAPONIA ➔ SEDE INECO ➔ MONFORTE -->
        <div id="ticket-pass-element" class="ticket-boarding-pass p-5 sm:p-7 relative shadow-2xl">
          <div class="ticket-hologram-strip"></div>

          <!-- Cabecera del Billete -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-300 pl-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-amber-400">
                🚄
              </div>
              <div>
                <span class="text-[10px] font-black tracking-widest uppercase text-blue-900 flex items-center gap-1.5">
                  <span>INECO ALTA VELOCIDAD</span>
                  <span class="text-amber-500">•</span>
                  <span>BILLETE SOLIDARIO 2026</span>
                </span>
                <h3 class="text-2xl sm:text-3xl font-black text-slate-900 font-poppins">${colleague.name}</h3>
              </div>
            </div>
            <div class="text-right">
              <span class="inline-block px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                EXPEDICIÓN POLAR SOLIDARIA
              </span>
              <p class="text-[11px] font-mono text-slate-800 font-bold mt-1">${colleague.ticketSeat}</p>
            </div>
          </div>

          <!-- TRAYECTORIA COMPLETA: LAPONIA ➔ PARADA INECO ➔ MONFORTE -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-4 text-xs pl-3 bg-blue-50/60 rounded-xl my-2 border border-blue-100">
            <div>
              <span class="text-[9px] text-sky-800 uppercase font-black flex items-center gap-1">
                <span>🎅</span> ORIGEN:
              </span>
              <p class="font-black text-slate-900 text-sm">Laponia (66°N)</p>
              <p class="text-[10px] text-slate-600">Taller Ártico de Papá Noel</p>
            </div>
            <div>
              <span class="text-[9px] text-amber-800 uppercase font-black flex items-center gap-1">
                <span>🏢</span> PARADA INTERMEDIA:
              </span>
              <p class="font-black text-blue-900 text-sm">Sede Central Ineco</p>
              <p class="text-[10px] text-slate-600">Paseo de la Habana 138, Madrid (1 Dic)</p>
            </div>
            <div>
              <span class="text-[9px] text-red-800 uppercase font-black flex items-center gap-1">
                <span>📍</span> DESTINO FINAL:
              </span>
              <p class="font-black text-red-600 text-sm">Base Monforte del Cid</p>
              <p class="text-[10px] text-slate-700 font-mono font-bold">14 Dic 2026 (09:00 - 15:00 h)</p>
            </div>
          </div>

          <!-- Mensaje Personalizado Navideño para 2027 -->
          <div class="bg-white/90 rounded-xl p-4 border border-blue-200 text-xs text-slate-800 leading-relaxed my-2 ml-3 shadow-inner">
            <span class="font-bold text-blue-900">Mensaje de Felicitación y Buenos Deseos • ${colleague.name} (${colleague.role}):</span>
            <p class="italic mt-1 text-sm font-medium">"${colleague.wish}"</p>
          </div>

          <!-- Código de Barras / QR y Localizador -->
          <div class="flex items-center justify-between pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-mono pl-3">
            <span>${colleague.loc}</span>
            <span class="tracking-widest hidden sm:inline">|||||| | |||||||| ||| ||||||| | ||</span>
            <span class="font-bold text-slate-700">BASE MONFORTE DEL CID</span>
          </div>
        </div>

        <!-- MUESTRA DE LA CESTA Y DESPIECE 3D PROFESIONAL -->
        <div class="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-5 sm:p-7 border-2 border-blue-500/30 text-center relative overflow-hidden shadow-2xl">
          <span class="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold mb-3">
            🎁 Presentación Real del Empaquetado
          </span>
          <h4 class="text-xl md:text-3xl font-black text-white font-poppins">
            La Gran Cesta de Navidad de ${colleague.name}
          </h4>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-1 mb-6">
            Caja de cartón kraft reciclado con acondicionamiento interior antichoque y separadores a medida para proteger cada frasco en su viaje.
          </p>

          <!-- DESPIECE 3D PROFESIONAL MEJORADO -->
          <div id="exploded-view-container" class="hidden mb-6 relative">
            <div class="exploded-container py-6 relative">
              <!-- Cesta Núcleo Central -->
              <div class="relative z-10 text-center">
                <img src="assets/cesta_solidaria_real.jpg" alt="Cesta Núcleo" class="exploded-basket-core mx-auto">
                <span class="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-900/90 text-amber-300 text-[10px] font-bold border border-amber-400/50 shadow">
                  📦 Lote Solidario Completo
                </span>
              </div>

              <!-- 9 Fichas de Producto Orbitales con Cota Visual -->
              <div class="exploded-item-bubble" style="top: 8px; left: 12%;" data-day="1" title="AOVE 500ml D.O. Andalucía">
                <span class="bubble-day-badge">1</span>
                <img src="assets/products/P1_thumb.jpg" alt="AOVE" class="w-8 h-8 object-cover rounded-full border border-amber-400 mb-0.5">
                <span class="text-[8px] font-bold text-amber-300 leading-none">AOVE</span>
              </div>
              <div class="exploded-item-bubble" style="top: 8px; right: 12%;" data-day="2" title="Bonito del Norte 400g">
                <span class="bubble-day-badge">2</span>
                <img src="assets/products/P2_thumb.jpg" alt="Bonito" class="w-8 h-8 object-cover rounded-full border border-sky-400 mb-0.5">
                <span class="text-[8px] font-bold text-sky-300 leading-none">Bonito</span>
              </div>
              <div class="exploded-item-bubble" style="top: 130px; left: 2%;" data-day="3" title="Mermelada Piquillo 120g">
                <span class="bubble-day-badge">3</span>
                <img src="assets/products/P3_thumb.jpg" alt="Piquillo" class="w-8 h-8 object-cover rounded-full border border-red-400 mb-0.5">
                <span class="text-[8px] font-bold text-red-300 leading-none">Piquillo</span>
              </div>
              <div class="exploded-item-bubble" style="top: 130px; right: 2%;" data-day="4" title="Trilogía Mojos Canarios">
                <span class="bubble-day-badge">4</span>
                <img src="assets/products/P4_thumb.jpg" alt="Mojos" class="w-8 h-8 object-cover rounded-full border border-emerald-400 mb-0.5">
                <span class="text-[8px] font-bold text-emerald-300 leading-none">Mojos</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 110px; left: 4%;" data-day="5" title="Chocolates Artesanales en Caja Madera">
                <span class="bubble-day-badge">5</span>
                <img src="assets/products/P5_thumb.jpg" alt="Chocolate" class="w-8 h-8 object-cover rounded-full border border-amber-600 mb-0.5">
                <span class="text-[8px] font-bold text-amber-400 leading-none">Chocolate</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 110px; right: 4%;" data-day="6" title="Café Arábica Natural 250g">
                <span class="bubble-day-badge">6</span>
                <img src="assets/products/P6_thumb.jpg" alt="Café" class="w-8 h-8 object-cover rounded-full border border-amber-300 mb-0.5">
                <span class="text-[8px] font-bold text-amber-200 leading-none">Café</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 15px; left: 16%;" data-day="7" title="Baraja Española Ineco">
                <span class="bubble-day-badge">7</span>
                <img src="assets/products/P7_thumb.jpg" alt="Baraja" class="w-8 h-8 object-cover rounded-full border border-blue-400 mb-0.5">
                <span class="text-[8px] font-bold text-blue-300 leading-none">Baraja</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 15px; right: 16%;" data-day="8" title="Calcetines Técnicos Ineco">
                <span class="bubble-day-badge">8</span>
                <img src="assets/products/P8_thumb.jpg" alt="Calcetines" class="w-8 h-8 object-cover rounded-full border border-indigo-400 mb-0.5">
                <span class="text-[8px] font-bold text-indigo-300 leading-none">Calcetines</span>
              </div>
              <div class="exploded-item-bubble center-top-bubble" data-day="9" title="Tarjeta Navideña 2027">
                <span class="bubble-day-badge">9</span>
                <img src="assets/products/P9_thumb.jpg" alt="Tarjeta" class="w-8 h-8 object-cover rounded-full border border-amber-300 mb-0.5">
                <span class="text-[8px] font-bold text-amber-300 leading-none">Tarjeta</span>
              </div>
            </div>
            <p class="text-[11px] text-amber-300 font-semibold mt-2">
              💡 Haz clic en cualquier producto para abrir su ficha detallada
            </p>
          </div>

          <!-- IMAGEN REAL DE LA CESTA -->
          <div id="basket-render-box" class="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/70 shadow-[0_0_40px_rgba(212,175,55,0.35)] mb-6 relative group bg-slate-950">
            <div class="relative overflow-hidden">
              <img src="assets/cesta_solidaria_real.jpg" alt="Gran Cesta de Navidad Solidaria Ineco 2026" class="w-full h-auto max-h-[480px] object-cover transform group-hover:scale-103 transition-transform duration-700">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-black/20 pointer-events-none"></div>
            </div>
            
            <div class="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-400/60 text-xs font-black text-amber-300 shadow flex items-center gap-2">
              <span>🎁</span> <span>Lote Solidario Completo (9 Artículos)</span>
            </div>

            <div class="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between text-xs">
              <span class="text-amber-300 font-extrabold text-xs">Acondicionamiento Interior Antichoque</span>
              <span class="text-white bg-red-600/95 px-3 py-1 rounded-full text-xs font-black tracking-wider shadow">
                Llegada 14 Dic 2026
              </span>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
            <button id="unbox-basket-btn" class="px-3 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95">
              <span>🎉 ¡Abrir Cesta!</span>
            </button>
            <button id="toggle-exploded-btn" class="px-3 py-3 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition border border-indigo-400/40 active:scale-95">
              <span>🔍 Despiece 3D</span>
            </button>
            <button id="download-ticket-btn" class="px-3 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition border border-blue-400/40 active:scale-95">
              <span>🎟️ Billete 2026</span>
            </button>
            <button id="share-whatsapp-btn" class="px-3 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95">
              <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.179.182-.077.357.101.174.449.741.963 1.199.662.59 1.22.774 1.393.861.173.087.274.072.376-.044.101-.116.433-.506.549-.68.116-.174.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const unboxBtn = document.getElementById('unbox-basket-btn');
    const downloadBtn = document.getElementById('download-ticket-btn');
    const toggleExplodedBtn = document.getElementById('toggle-exploded-btn');
    const shareBtn = document.getElementById('share-whatsapp-btn');
    const renderBox = document.getElementById('basket-render-box');
    const explodedBox = document.getElementById('exploded-view-container');

    if (toggleExplodedBtn && explodedBox && renderBox) {
      toggleExplodedBtn.onclick = () => {
        const isExploded = !explodedBox.classList.contains('hidden');
        if (isExploded) {
          explodedBox.classList.add('hidden');
          renderBox.classList.remove('hidden');
          toggleExplodedBtn.innerHTML = '<span>🔍 Despiece 3D</span>';
        } else {
          renderBox.classList.add('hidden');
          explodedBox.classList.remove('hidden');
          toggleExplodedBtn.innerHTML = '<span>📦 Vista Empaque</span>';
          sound.playChime();
          haptics.chime();
        }
      };

      explodedBox.querySelectorAll('.exploded-item-bubble').forEach(b => {
        b.onclick = () => {
          const day = parseInt(b.dataset.day, 10);
          sound.playChime();
          haptics.scratch();
          if (window.adventInstance) {
            window.adventInstance.openGiftModal(day);
          }
        };
      });
    }

    if (unboxBtn) {
      unboxBtn.onclick = () => {
        sound.playConfettiFanfare();
        if (typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
        }
        if (renderBox) {
          renderBox.classList.remove('animate-basket-reveal');
          void renderBox.offsetWidth;
          renderBox.classList.add('animate-basket-reveal');
        }
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        this.downloadTicketPass(colleague);
      };
    }

    if (shareBtn) {
      shareBtn.onclick = () => {
        const text = encodeURIComponent(`🚄 ¡Hola! Mira mi Billete AVE y el Regalo Solidario de Ineco (Laponia ➔ Sede Ineco ➔ Monforte del Cid): ${window.location.href}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      };
    }
  }

  downloadTicketPass(colleague) {
    const canvas = document.createElement('canvas');
    canvas.width = 1800;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect ? ctx.roundRect(10, 10, 880, 400, 24) : ctx.rect(10, 10, 880, 400);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#1A4488';
    ctx.fillRect(10, 10, 880, 100);

    ctx.fillStyle = '#CB1823';
    ctx.fillRect(35, 110, 12, 295);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillText('INECO • BILLETE SOLIDARIO 2026', 75, 75);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 15px Poppins, sans-serif';
    ctx.fillText('RUTA: LAPONIA ➔ SEDE INECO ➔ MONFORTE', 480, 75);

    ctx.fillStyle = '#0D2246';
    ctx.font = '900 34px Poppins, sans-serif';
    ctx.fillText(colleague.name, 75, 160);

    ctx.fillStyle = '#CB1823';
    ctx.font = 'bold 18px Poppins, sans-serif';
    ctx.fillText(colleague.role, 75, 195);

    ctx.fillStyle = '#334155';
    ctx.font = '15px Poppins, sans-serif';
    ctx.fillText(`Origen: Laponia (66°N) | Parada: Sede Ineco | Destino: Base Monforte (14 Dic)`, 75, 240);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'italic 15px Poppins, sans-serif';
    ctx.fillText(`"${colleague.wish}"`, 75, 290);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`BASE MONFORTE DEL CID  |||||||||| ||||| ||||||||  ${colleague.loc}`, 75, 360);

    try {
      const link = document.createElement('a');
      link.download = `Billete_Solidario_Ineco_2026_${colleague.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      sound.playChime();
      haptics.chime();
    } catch (e) {
      console.warn('Canvas export warning:', e);
    }
  }
}

// ==========================================
// 9. PANTALLA DE INICIO / TEASER GATE (1 DIC 12:00)
// ==========================================
// Fecha y hora oficial de apertura: 1 de diciembre de 2026 a las 12:00:00 (Hora Peninsular)
const TEASER_TARGET_DATE = new Date("2026-12-01T12:00:00+01:00").getTime();
const TEASER_START_DATE = new Date("2026-11-01T00:00:00+01:00").getTime();

let teaserTimerInterval = null;
let isCreatorPreviewActive = false;

function initTeaserGate() {
  const teaserScreen = document.getElementById('teaser-gate-screen');
  const lockedView = document.getElementById('teaser-locked-view');
  const unlockedView = document.getElementById('teaser-unlocked-view');
  const adminBar = document.getElementById('creator-admin-bar');
  const teaserVideo = document.getElementById('teaser-video');
  const videoPlaceholder = document.getElementById('teaser-video-placeholder');
  const unmuteBtn = document.getElementById('teaser-video-unmute-btn');
  const muteIcon = document.getElementById('teaser-video-mute-icon');
  const muteLabel = document.getElementById('teaser-video-mute-label');
  const soundToggleBtn = document.getElementById('teaser-sound-toggle');
  const soundToggleIcon = document.getElementById('teaser-sound-icon');
  const logoWrapper = document.getElementById('teaser-logo-wrapper');
  const creatorSecretBtn = document.getElementById('creator-secret-btn');
  const creatorUnlockBtn = document.getElementById('creator-unlock-btn');
  const enterAppBtn = document.getElementById('teaser-enter-app-btn');
  const exitAdminBtn = document.getElementById('creator-exit-btn');
  const testLockedBtn = document.getElementById('creator-test-locked');
  const testUnlockedBtn = document.getElementById('creator-test-unlocked');

  if (!teaserScreen) return;

  // 1. Manejo del Vídeo con Autoplay
  if (teaserVideo) {
    teaserVideo.muted = true;

    const hidePlaceholder = () => {
      if (videoPlaceholder) {
        videoPlaceholder.style.opacity = '0';
        videoPlaceholder.style.pointerEvents = 'none';
        setTimeout(() => {
          if (videoPlaceholder) videoPlaceholder.style.display = 'none';
        }, 500);
      }
    };

    teaserVideo.addEventListener('playing', hidePlaceholder);
    teaserVideo.addEventListener('loadeddata', hidePlaceholder);
    teaserVideo.addEventListener('canplay', hidePlaceholder);
    teaserVideo.addEventListener('timeupdate', () => {
      if (teaserVideo.currentTime > 0.05) hidePlaceholder();
    });

    const tryPlay = () => {
      teaserVideo.muted = true;
      const playPromise = teaserVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          hidePlaceholder();
        }).catch(err => {
          console.log("Autoplay de vídeo en espera de interacción del usuario:", err);
        });
      }
    };

    tryPlay();
    // Reintentar si hubo restricciones de carga inicial
    setTimeout(tryPlay, 400);

    // Clic en el vídeo para alternar pausa/reproducción
    teaserVideo.addEventListener('click', () => {
      if (teaserVideo.paused) {
        teaserVideo.play();
      } else {
        teaserVideo.pause();
      }
    });

    if (unmuteBtn) {
      unmuteBtn.onclick = (e) => {
        e.stopPropagation();
        teaserVideo.muted = !teaserVideo.muted;
        if (muteIcon) muteIcon.innerText = teaserVideo.muted ? "🔇" : "🔊";
        if (muteLabel) muteLabel.innerText = teaserVideo.muted ? "Activar Sonido" : "Silenciar";
        if (!teaserVideo.muted && teaserVideo.paused) {
          teaserVideo.play();
        }
      };
    }
  }

  // 2. Comprobar si el creador tiene activa la previsualización
  const urlParams = new URLSearchParams(window.location.search);
  const hasUrlCreator = urlParams.has('creator') || urlParams.has('preview');
  const hasStorageCreator = localStorage.getItem('ineco_creator_preview') === 'true';

  if (hasUrlCreator || hasStorageCreator) {
    enableCreatorMode(false);
  } else {
    evaluateTeaserState();
  }

  // 3. Evaluar estado temporal (Antes vs Después del 1 de Diciembre a las 12:00)
  function evaluateTeaserState(forcedState = null) {
    const now = Date.now();
    const isUnlocked = forcedState !== null ? forcedState : (now >= TEASER_TARGET_DATE);

    if (isUnlocked) {
      // Estado Desbloqueado: Día 1 de diciembre alcanzado
      if (lockedView) lockedView.classList.add('hidden');
      if (unlockedView) unlockedView.classList.remove('hidden');
      if (teaserTimerInterval) clearInterval(teaserTimerInterval);

      // Reproducir el vídeo oficial del Día 1: Videos/Dia1.mp4
      if (teaserVideo) {
        const currentSrc = teaserVideo.currentSrc || teaserVideo.src || '';
        if (!currentSrc.includes('Dia1.mp4')) {
          teaserVideo.src = 'Videos/Dia1.mp4';
          teaserVideo.load();
          teaserVideo.play().catch(e => console.log('Autoplay Dia1:', e));
        }
      }
    } else {
      // Estado Bloqueado: Antes del 1 de diciembre
      if (lockedView) lockedView.classList.remove('hidden');
      if (unlockedView) unlockedView.classList.add('hidden');
      startTeaserCountdown();

      // Reproducir el vídeo del tráiler introductorio: Videos/Video1.mp4
      if (teaserVideo) {
        const currentSrc = teaserVideo.currentSrc || teaserVideo.src || '';
        if (!currentSrc.includes('Video1.mp4')) {
          teaserVideo.src = 'Videos/Video1.mp4';
          teaserVideo.load();
          teaserVideo.play().catch(e => console.log('Autoplay Video1:', e));
        }
      }
    }
  }

  // 4. Cuenta atrás en vivo para el Teaser
  function startTeaserCountdown() {
    if (teaserTimerInterval) clearInterval(teaserTimerInterval);

    function update() {
      const now = Date.now();
      const diff = TEASER_TARGET_DATE - now;

      if (diff <= 0) {
        // En vivo se cumple el 1 de diciembre a las 12:00
        evaluateTeaserState(true);
        if (typeof sound !== 'undefined') sound.playFanfare();
        if (typeof launchConfetti === 'function') launchConfetti();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('teaser-days');
      const hEl = document.getElementById('teaser-hours');
      const mEl = document.getElementById('teaser-minutes');
      const sEl = document.getElementById('teaser-seconds');
      const pctEl = document.getElementById('teaser-pct-label');
      const barEl = document.getElementById('teaser-progress-bar');

      if (dEl) dEl.innerText = days < 10 ? '0' + days : days;
      if (hEl) hEl.innerText = hours < 10 ? '0' + hours : hours;
      if (mEl) mEl.innerText = minutes < 10 ? '0' + minutes : minutes;
      if (sEl) sEl.innerText = seconds < 10 ? '0' + seconds : seconds;

      const totalSpan = TEASER_TARGET_DATE - TEASER_START_DATE;
      const elapsed = now - TEASER_START_DATE;
      const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100)));
      if (pctEl) pctEl.innerText = pct + '%';
      if (barEl) barEl.style.width = pct + '%';
    }

    update();
    teaserTimerInterval = setInterval(update, 1000);
  }

  // 5. Botón Secreto y Mecanismos de Acceso del Creador
  function enableCreatorMode(notify = true) {
    isCreatorPreviewActive = true;
    localStorage.setItem('ineco_creator_preview', 'true');
    teaserScreen.classList.add('teaser-hidden');
    if (adminBar) adminBar.classList.remove('hidden');

    if (notify && typeof sound !== 'undefined') {
      sound.playSuccessTone();
    }
  }

  function disableCreatorMode() {
    isCreatorPreviewActive = false;
    localStorage.removeItem('ineco_creator_preview');
    teaserScreen.classList.remove('teaser-hidden');
    if (adminBar) adminBar.classList.add('hidden');
    evaluateTeaserState();
  }

  if (creatorSecretBtn) creatorSecretBtn.onclick = () => enableCreatorMode(true);
  if (creatorUnlockBtn) creatorUnlockBtn.onclick = () => enableCreatorMode(true);
  if (exitAdminBtn) exitAdminBtn.onclick = () => disableCreatorMode();

  // Atajos para el creador:
  // a) Triple clic en el logo oficial
  let logoClicks = 0;
  let logoTimer = null;
  if (logoWrapper) {
    logoWrapper.onclick = () => {
      logoClicks++;
      clearTimeout(logoTimer);
      if (logoClicks >= 3) {
        logoClicks = 0;
        enableCreatorMode(true);
      } else {
        logoTimer = setTimeout(() => { logoClicks = 0; }, 800);
      }
    };
  }

  // b) Atajo de teclado: Alt+P o Ctrl+Shift+P
  window.addEventListener('keydown', (e) => {
    if ((e.altKey && (e.key === 'p' || e.key === 'P')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p'))) {
      e.preventDefault();
      if (isCreatorPreviewActive) {
        disableCreatorMode();
      } else {
        enableCreatorMode(true);
      }
    }
  });

  // 6. Controles de simulación rápida para el creador
  if (testLockedBtn) {
    testLockedBtn.onclick = () => {
      teaserScreen.classList.remove('teaser-hidden');
      evaluateTeaserState(false);
    };
  }
  if (testUnlockedBtn) {
    testUnlockedBtn.onclick = () => {
      teaserScreen.classList.remove('teaser-hidden');
      evaluateTeaserState(true);
    };
  }

  // 7. Entrada a la aplicación cuando se desbloquea el 1 de diciembre
  if (enterAppBtn) {
    enterAppBtn.onclick = () => {
      if (typeof sound !== 'undefined') sound.playFanfare();
      teaserScreen.classList.add('teaser-hidden');
      if (typeof launchConfetti === 'function') launchConfetti();
    };
  }

  // 8. Control de sonido en la pantalla de inicio
  if (soundToggleBtn) {
    soundToggleBtn.onclick = () => {
      if (typeof sound !== 'undefined') {
        sound.toggleMute();
        if (soundToggleIcon) soundToggleIcon.innerText = sound.muted ? "🔇" : "🔔";
      }
    };
  }
}

// ==========================================
// 10. EFECTO RASCAR LA ESCARCHA
// ==========================================
function setupCardScratch(cardElement, day, onReveal) {
  const front = cardElement.querySelector('.advent-front');
  if (!front) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'frost-scratch-canvas';
  front.appendChild(canvas);

  const rect = front.getBoundingClientRect();
  canvas.width = rect.width || 300;
  canvas.height = rect.height || 240;

  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(186, 230, 253, 0.92)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }

  ctx.fillStyle = '#0369A1';
  ctx.font = 'bold 13px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❄️ Rasca para abrir', canvas.width / 2, canvas.height - 24);

  let isScratching = false;
  let scratchedStrokes = 0;
  let revealed = false;

  const triggerReveal = () => {
    if (revealed) return;
    revealed = true;
    sound.playIceCrack();
    haptics.scratch();
    canvas.classList.add('shattering');
    setTimeout(() => {
      canvas.remove();
      onReveal();
    }, 280);
  };

  const scratch = (clientX, clientY) => {
    if (revealed) return;
    const b = canvas.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    const scaleX = canvas.width / b.width;
    const scaleY = canvas.height / b.height;
    const x = (clientX - b.left) * scaleX;
    const y = (clientY - b.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28 * scaleX, 0, Math.PI * 2);
    ctx.fill();

    scratchedStrokes++;
    if (scratchedStrokes % 4 === 0) {
      sound.playIceCrack();
      haptics.scratch();
    }

    if (scratchedStrokes >= 18) {
      triggerReveal();
    }
  };

  canvas.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    triggerReveal();
  });

  canvas.addEventListener('mousedown', () => isScratching = true);
  window.addEventListener('mouseup', () => isScratching = false);
  canvas.addEventListener('mousemove', (e) => {
    if (isScratching) scratch(e.clientX, e.clientY);
  });

  canvas.addEventListener('touchstart', (e) => {
    isScratching = true;
    if (e.touches && e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (isScratching && e.touches && e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener('touchend', () => isScratching = false);
}

// ==========================================
// 11. CATENARIA MUSICAL INTERACTIVA
// ==========================================
function initCatenaryHarp() {
  const wire = document.getElementById('interactive-catenary');
  if (!wire) return;

  const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
  const lights = wire.querySelectorAll('.catenary-light');

  lights.forEach((light, idx) => {
    const playLight = () => {
      const noteFreq = notes[idx % notes.length];
      sound.playNote(noteFreq, 0.4);
      haptics.chime();
      light.classList.add('playing');
      setTimeout(() => light.classList.remove('playing'), 250);

      for (let s = 0; s < 4; s++) {
        const spark = document.createElement('div');
        spark.className = 'spark-particle';
        spark.style.left = `${light.offsetLeft + 4}px`;
        spark.style.top = `${light.offsetTop + 4}px`;
        spark.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
        spark.style.setProperty('--dy', `${(Math.random() - 0.5) * 40 + 10}px`);
        wire.appendChild(spark);
        setTimeout(() => spark.remove(), 600);
      }
    };

    light.addEventListener('pointerenter', playLight);
    light.addEventListener('click', playLight);
  });
}

// ==========================================
// 12. CONMUTADOR DÍA / NOCHE
// ==========================================
class ThemeManager {
  constructor(snowInstance) {
    this.snow = snowInstance;
    this.btn = document.getElementById('toggle-theme-btn');
    this.isMed = false;
    this.init();
  }

  init() {
    if (this.btn) {
      this.btn.onclick = () => this.toggle();
    }
  }

  toggle() {
    this.isMed = !this.isMed;
    document.body.classList.toggle('theme-mediterraneo', this.isMed);
    if (this.snow) {
      this.snow.setTheme(this.isMed ? 'mediterranean' : 'arctic');
    }
    if (this.btn) {
      this.btn.innerHTML = this.isMed ? '<span>☀️</span>' : '<span>🌓</span>';
    }
    sound.playChime();
    haptics.chime();
  }
}

// ==========================================
// 13. MINIJUEGO: EL MAQUINISTA SOLIDARIO MEJORADO
// Combos x2/x3, Aceleración, HUD Alta Visibilidad, Swipe & Partículas
// ==========================================
class SolidaryDriverGame {
  constructor() {
    this.modal = document.getElementById('game-modal');
    this.openBtn = document.getElementById('open-game-btn');
    this.mobileOpenBtn = document.getElementById('mobile-game-btn');
    this.closeBtn = document.getElementById('close-game-btn');
    this.startBtn = document.getElementById('start-game-btn');
    this.overlay = document.getElementById('game-overlay-screen');
    this.canvas = document.getElementById('game-canvas');
    this.btnLeft = document.getElementById('game-btn-left');
    this.btnRight = document.getElementById('game-btn-right');

    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.lanes = [70, 180, 290];
    this.currentLane = 1;
    this.items = [];
    this.score = 0;
    this.combo = 0;
    this.collected = 0;
    this.timeLeft = 30;
    this.isPlaying = false;
    this.timerInterval = null;
    this.spawnInterval = null;
    this.animId = null;
    this.floatingTexts = [];
    this.highScore = parseInt(localStorage.getItem('ineco_game_hi') || '0', 10);

    this.giftIcons = ['🫒', '🐟', '🌶️', '🥫', '🍫', '☕', '🃏', '🧦', '💌'];

    this.init();
  }

  init() {
    if (this.openBtn) this.openBtn.onclick = () => this.open();
    if (this.mobileOpenBtn) this.mobileOpenBtn.onclick = () => this.open();
    if (this.closeBtn) this.closeBtn.onclick = () => this.close();
    if (this.startBtn) this.startBtn.onclick = () => this.startGame();

    if (this.btnLeft) this.btnLeft.onclick = () => this.moveLeft();
    if (this.btnRight) this.btnRight.onclick = () => this.moveRight();

    if (this.canvas) {
      let touchStartX = 0;
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
      }, { passive: true });
      this.canvas.addEventListener('touchend', (e) => {
        if (!this.isPlaying) return;
        const touchEndX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : touchStartX;
        const diffX = touchEndX - touchStartX;
        if (diffX < -30) this.moveLeft();
        else if (diffX > 30) this.moveRight();
      }, { passive: true });
    }

    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.moveRight();
    });
  }

  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      haptics.scratch();
    }
  }

  moveRight() {
    if (this.currentLane < 2) {
      this.currentLane++;
      haptics.scratch();
    }
  }

  open() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      if (this.overlay) this.overlay.classList.remove('hidden');
    }
  }

  close() {
    this.stopGame();
    if (this.modal) {
      this.modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  startGame() {
    if (this.overlay) this.overlay.classList.add('hidden');
    this.score = 0;
    this.combo = 0;
    this.collected = 0;
    this.timeLeft = 30;
    this.items = [];
    this.floatingTexts = [];
    this.currentLane = 1;
    this.isPlaying = true;

    clearInterval(this.timerInterval);
    clearInterval(this.spawnInterval);
    cancelAnimationFrame(this.animId);

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);

    this.spawnInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const lane = Math.floor(Math.random() * 3);
      const isSnowball = Math.random() < 0.35;
      const icon = isSnowball ? '❄️' : this.giftIcons[Math.floor(Math.random() * this.giftIcons.length)];
      this.items.push({
        lane: lane,
        y: -30,
        isGift: !isSnowball,
        icon: icon,
        speed: 5.2 + Math.min(3, this.collected * 0.35)
      });
    }, 600);

    this.loop();
  }

  stopGame() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    clearInterval(this.spawnInterval);
    cancelAnimationFrame(this.animId);
  }

  endGame() {
    this.stopGame();
    sound.playConfettiFanfare();
    haptics.fanfare();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('ineco_game_hi', String(this.highScore));
    }

    const isVictory = this.collected >= 9;
    const stars = isVictory ? '⭐⭐⭐' : this.collected >= 6 ? '⭐⭐' : '⭐';
    const rankTitle = isVictory 
      ? '¡ENTREGA EXITOSA EN MONFORTE!' 
      : this.collected >= 6 
        ? '¡EXCELENTE SERVICIO FERROVIARIO!' 
        : '¡BUEN TRAYECTO SOLIDARIO!';

    if (this.overlay) {
      this.overlay.innerHTML = `
        <div class="text-4xl mb-1">${stars}</div>
        <div class="text-3xl mb-2">🚄 🎁</div>
        <h3 class="text-base sm:text-lg font-black text-amber-300 font-poppins">${rankTitle}</h3>
        <p class="text-xs text-white max-w-xs mt-2 mb-4 leading-relaxed">
          Has recogido <strong class="text-amber-400 font-black text-sm">${this.collected} de 9 Regalos Solidarios</strong>.<br>
          <span class="text-emerald-400 font-bold text-sm block mt-1">Puntuación: ${this.score} pts</span>
          <span class="text-slate-400 text-[10px] block font-mono">Récord Histórico: ${this.highScore} pts</span>
          <span class="text-[11px] text-blue-200 block mt-1">¡Feliz y próspero año 2027!</span>
        </p>
        <button id="restart-game-btn" class="px-8 py-3 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs shadow-xl active:scale-95 transition border border-amber-300">
          🔄 Volver a Jugar
        </button>
      `;
      this.overlay.classList.remove('hidden');
      const rBtn = document.getElementById('restart-game-btn');
      if (rBtn) rBtn.onclick = () => this.startGame();
    }
  }

  loop() {
    if (!this.isPlaying || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Fondo nocturno con velocidad
    ctx.fillStyle = '#020716';
    ctx.fillRect(0, 0, w, h);

    // Catenaria a los lados
    const postY = (Date.now() / 2) % 80;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    for (let y = postY; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(32, y);
      ctx.moveTo(w - 10, y);
      ctx.lineTo(w - 32, y);
      ctx.stroke();
    }

    // 3 Vías de alta velocidad balastadas
    this.lanes.forEach(lx => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(lx - 34, 0, 68, h);

      // Traviesas en movimiento
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.lineWidth = 4;
      const offset = (Date.now() / 3) % 24;
      for (let y = offset; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(lx - 30, y);
        ctx.lineTo(lx + 30, y);
        ctx.stroke();
      }

      // Carriles relucientes
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(lx - 22, 0);
      ctx.lineTo(lx - 22, h);
      ctx.moveTo(lx + 22, 0);
      ctx.lineTo(lx + 22, h);
      ctx.stroke();
    });

    // Ítems cayendo
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.speed;

      const itemX = this.lanes[it.lane];
      
      if (it.isGift) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.beginPath();
        ctx.arc(itemX, it.y - 8, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.icon, itemX, it.y);

      // Colisión con tren
      if (it.y >= h - 110 && it.y <= h - 45 && it.lane === this.currentLane) {
        if (it.isGift) {
          this.combo++;
          const comboBonus = (this.combo > 1) ? this.combo * 20 : 0;
          const pts = 100 + comboBonus;
          this.score += pts;
          this.collected++;
          sound.playGameCollect();
          haptics.chime();

          this.floatingTexts.push({
            text: `+${pts}` + (this.combo > 1 ? ` (x${this.combo}!)` : ''),
            x: itemX,
            y: it.y - 20,
            alpha: 1,
            color: this.combo > 1 ? '#FCD34D' : '#38BDF8'
          });

          if (this.collected >= 9) {
            this.score += this.timeLeft * 30; // Bonus por velocidad
            this.endGame();
            return;
          }
        } else {
          this.combo = 0;
          this.score = Math.max(0, this.score - 50);
          sound.playIceCrack();
          haptics.scratch();
          this.floatingTexts.push({
            text: '-50 ❄️',
            x: itemX,
            y: it.y - 20,
            alpha: 1,
            color: '#EF4444'
          });
        }
        this.items.splice(i, 1);
        continue;
      }

      if (it.y > h + 40) {
        this.items.splice(i, 1);
      }
    }

    // Textos flotantes
    for (let f = this.floatingTexts.length - 1; f >= 0; f--) {
      const ft = this.floatingTexts[f];
      ft.y -= 1.5;
      ft.alpha -= 0.03;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(f, 1);
      } else {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    // Dibujar Tren AVE del Maquinista
    const trainX = this.lanes[this.currentLane];
    const trainY = h - 75;

    // Cono de luz volumétrico
    const beamGrad = ctx.createLinearGradient(trainX, trainY, trainX, trainY - 140);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(trainX, trainY - 10);
    ctx.lineTo(trainX - 35, trainY - 140);
    ctx.lineTo(trainX + 35, trainY - 140);
    ctx.fill();

    // Carrocería AVE Ineco
    ctx.fillStyle = '#CB1823';
    ctx.roundRect ? ctx.roundRect(trainX - 22, trainY - 20, 44, 65, 10) : ctx.fillRect(trainX - 22, trainY - 20, 44, 65);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Franja corporativa azul
    ctx.fillStyle = '#1A4488';
    ctx.fillRect(trainX - 20, trainY + 8, 40, 8);

    // Parabrisas
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(trainX - 16, trainY - 12, 32, 14);

    // HUD Superior del Juego
    ctx.fillStyle = 'rgba(8, 16, 36, 0.95)';
    ctx.fillRect(0, 0, w, 44);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 44);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 12px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🎁 Lote: ${this.collected}/9`, 14, 27);

    ctx.textAlign = 'center';
    ctx.fillStyle = this.timeLeft <= 5 ? '#EF4444' : '#FFFFFF';
    ctx.fillText(`⏱️ ${this.timeLeft}s`, w / 2, 27);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`${this.score} pts`, w - 14, 27);

    this.animId = requestAnimationFrame(() => this.loop());
  }
}

// ==========================================
// 14. INICIALIZACIÓN GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const snow = new Snowfall('snow-canvas');
  initTeaserGate();
  initCountdown();
  const advent = new AdventCalendar();
  window.adventInstance = advent;
  const colleagueBox = new ColleagueGiftBox();
  const santaRadar = new SantaRailTracker();
  initCatenaryHarp();
  const themeMgr = new ThemeManager(snow);
  const driverGame = new SolidaryDriverGame();

  const unlockAudioOnGesture = () => {
    sound.init();
    if (sound.ctx && sound.ctx.state === 'suspended') {
      sound.ctx.resume();
    }
    document.removeEventListener('pointerdown', unlockAudioOnGesture);
    document.removeEventListener('keydown', unlockAudioOnGesture);
  };
  document.addEventListener('pointerdown', unlockAudioOnGesture, { passive: true });
  document.addEventListener('keydown', unlockAudioOnGesture, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = [
        document.getElementById('gift-modal'),
        document.getElementById('game-modal')
      ];
      modals.forEach(m => {
        if (m && !m.classList.contains('hidden')) {
          m.classList.add('hidden');
          m.classList.remove('flex');
        }
      });
      document.body.style.overflow = '';
    }
  });

  const soundBtn = document.getElementById('toggle-sound-btn');
  const mobileSoundBtn = document.getElementById('mobile-sound-btn');
  const snowBtn = document.getElementById('toggle-snow-btn');
  const mobileSnowBtn = document.getElementById('mobile-snow-btn');
  const openAllBtn = document.getElementById('open-all-days-btn');
  const resetBtn = document.getElementById('reset-advent-btn');
  const hornBtn = document.getElementById('radar-horn-btn');
  const boostBtn = document.getElementById('radar-boost-btn');

  const btnGoLaponia = document.getElementById('map-btn-laponia');
  const btnGoEurope = document.getElementById('map-btn-europe');
  const btnGoMadrid = document.getElementById('map-btn-madrid');
  const btnGoMonforte = document.getElementById('map-btn-monforte');

  if (btnGoLaponia) btnGoLaponia.onclick = () => santaRadar.jumpTo('laponia');
  if (btnGoEurope) btnGoEurope.onclick = () => santaRadar.jumpTo('europe');
  if (btnGoMadrid) btnGoMadrid.onclick = () => santaRadar.jumpTo('madrid');
  if (btnGoMonforte) btnGoMonforte.onclick = () => santaRadar.jumpTo('monforte');

  const updateSoundUI = (active) => {
    const icon = active ? '🔊' : '🔇';
    [soundBtn, mobileSoundBtn].forEach(btn => {
      if (!btn) return;
      const iconEl = btn.querySelector('.sound-icon') || btn.querySelector('span');
      if (iconEl) iconEl.innerText = icon;
      btn.classList.toggle('text-emerald-400', active);
    });
  };

  const handleToggleSound = () => {
    const active = sound.toggleMute();
    updateSoundUI(active);
    haptics.chime();
  };

  if (soundBtn) soundBtn.onclick = handleToggleSound;
  if (mobileSoundBtn) mobileSoundBtn.onclick = handleToggleSound;

  const updateSnowUI = (active) => {
    const icon = active ? '❄️' : '⏹️';
    [snowBtn, mobileSnowBtn].forEach(btn => {
      if (!btn) return;
      const iconEl = btn.querySelector('.snow-icon') || btn.querySelector('span');
      if (iconEl) iconEl.innerText = icon;
      btn.classList.toggle('opacity-50', !active);
    });
  };

  const handleToggleSnow = () => {
    const active = snow.toggle();
    updateSnowUI(active);
    haptics.scratch();
  };

  if (snowBtn) snowBtn.onclick = handleToggleSnow;
  if (mobileSnowBtn) mobileSnowBtn.onclick = handleToggleSnow;

  if (openAllBtn) openAllBtn.onclick = () => advent.openAll();
  if (resetBtn) resetBtn.onclick = () => advent.resetAll();

  if (hornBtn) {
    hornBtn.onclick = () => {
      sound.playTrainHorn();
      haptics.horn();
    };
  }
  if (boostBtn) boostBtn.onclick = () => santaRadar.boostSpeed();
});
