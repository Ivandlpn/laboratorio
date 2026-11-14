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

    this.routePath = document.getElementById('route-path');
    this.routeProgress = document.getElementById('route-progress');
    this.whereDisplay = document.getElementById('radar-where');
    this.metaDisplay = document.getElementById('radar-where-meta');
    this.playing = false;
    this.pctDisplay = document.getElementById('radar-pct');
    this.pctBar = document.getElementById('radar-pct-bar');
    this.stepBtns = Array.from(document.querySelectorAll('#rm-steps .rm-step'));

    // x,y = posición de cada hito sobre el mapa (viewBox 500x661, proyección Mercator real).
    // La posición del tren se calcula sobre la curva #route-path; "len" se resuelve en init().
    this.waypoints = [
      { pct: 0, x: 431.3, y: 52.6, name: "Laponia (Círculo Polar 66° 33'N)", coords: "66.5039°N, 25.7294°E", days: "36 días", speed: "180 km/h", status: "Taller Ártico de Laponia. Embarque de los lotes solidarios y salida por la red polar." },
      { pct: 15, x: 366.2, y: 128.3, name: "Golfo de Botnia & Báltico Norte", coords: "63.8258°N, 20.2630°E", days: "32 días", speed: "200 km/h", status: "Travesía por el corredor nórdico hacia Escandinavia central." },
      { pct: 30, x: 340.1, y: 241.1, name: "Escandinavia Sur (Estocolmo / Malmö)", coords: "59.3293°N, 18.0686°E", days: "27 días", speed: "230 km/h", status: "Enlace internacional por el corredor transfronterizo hacia Europa Central." },
      { pct: 50, x: 153, y: 455.1, name: "Corredor Europeo TEN-T (París)", coords: "48.8566°N, 2.3522°E", days: "20 días", speed: "270 km/h", status: "Tránsito por el corredor de alta velocidad europeo hacia el eje atlántico." },
      { pct: 65, x: 103.8, y: 549.7, name: "Paso Pirenaico (Burdeos / Hendaya)", coords: "43.3584°N, -1.7760°W", days: "16 días", speed: "220 km/h", status: "Paso fronterizo e interoperabilidad ferroviaria hacia la red española." },
      { pct: 75, x: 81.1, y: 596.2, name: "Sede Central Ineco (Madrid)", coords: "40.4532°N, -3.6883°W", days: "13 días", speed: "160 km/h", status: "Escala técnica y felicitación institucional en Paseo de la Habana 138 (Madrid)." },
      { pct: 88, x: 102.9, y: 618.8, name: "Línea de Alta Velocidad (Cuenca / Albacete)", coords: "39.4699°N, -1.6500°W", days: "5 días", speed: "300 km/h", status: "Velocidad de crucero 300 km/h con señalización ERTMS Nivel 2." },
      { pct: 100, x: 116.8, y: 627.7, name: "Base de Mantenimiento de Monforte del Cid", coords: "38.4067°N, -0.6949°W", days: "0 días (Llegada)", speed: "0 km/h", status: "¡Llegada y entrega oficial del Regalo Solidario en Monforte del Cid!" }
    ];

    this.init();
  }

  // Longitud sobre la ruta del punto más cercano a (x, y), buscando hacia delante desde "from".
  nearestLength(x, y, from) {
    let best = from, bestD = Infinity;
    for (let l = from; l <= this.routeLen; l += 1.5) {
      const p = this.routePath.getPointAtLength(l);
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bestD) { bestD = d; best = l; }
    }
    return best;
  }

  init() {
    this.routeLen = this.routePath ? this.routePath.getTotalLength() : 0;
    if (this.routeLen) {
      let from = 0;
      const last = this.waypoints.length - 1;
      this.waypoints.forEach((wp, i) => {
        if (i === 0) wp.len = 0;
        else if (i === last) wp.len = this.routeLen;
        else { wp.len = this.nearestLength(wp.x, wp.y, from); from = wp.len; }
      });
    }
    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.stop();
        this.setProgress(parseFloat(e.target.value));
      });
    }
    this.setProgress(5);
  }

  // Reproduce el viaje completo (≈28 s) desde la posición actual.
  play() {
    if (this.progressPct >= 100) this.setProgress(0);
    this.playing = true;
    this._last = performance.now();
    if (this.onPlayState) this.onPlayState(true);
    const step = (now) => {
      if (!this.playing) return;
      const dt = Math.min(0.1, (now - this._last) / 1000);
      this._last = now;
      this.setProgress(Math.min(100, this.progressPct + dt * (100 / 28)));
      if (this.progressPct >= 100) {
        this.stop();
        sound.playTrainHorn();
        if (window.confetti) window.confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
        return;
      }
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this._raf);
    if (this.onPlayState) this.onPlayState(false);
  }

  togglePlay() { this.playing ? this.stop() : this.play(); }

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

    if (this.trainMarker && this.routeLen) {
      // El tren avanza sobre la curva real de la ruta y se orienta según su tangente.
      const len = p0.len + (p1.len - p0.len) * factor;
      const pt = this.routePath.getPointAtLength(len);
      const a = this.routePath.getPointAtLength(Math.max(0, len - 3));
      const b = this.routePath.getPointAtLength(Math.min(this.routeLen, len + 3));
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      this.trainMarker.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
      if (this.routeProgress) this.routeProgress.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${(this.routeLen + 50).toFixed(1)}`);
      this.currentPoint = pt;
      if (this.onPoint) this.onPoint(pt);
    }

    const pctText = Math.round(this.progressPct) + '%';
    if (this.pctDisplay) this.pctDisplay.innerText = pctText;
    if (this.pctBar) this.pctBar.style.width = this.progressPct + '%';
    if (this.slider) this.slider.style.setProperty('--p', this.progressPct + '%');

    const currentWp = factor < 0.5 ? p0 : p1;
    if (this.whereDisplay) this.whereDisplay.innerText = currentWp.name;
    if (this.metaDisplay) this.metaDisplay.innerText = `${currentWp.days} · ${currentWp.speed}`;

    // Hito activo: el último hito alcanzado (0 / 50 / 75 / 100).
    if (this.stepBtns.length) {
      let active = 0;
      this.stepBtns.forEach((btn) => { if (this.progressPct >= parseFloat(btn.dataset.step) - 0.5) active = btn; });
      this.stepBtns.forEach((btn) => btn.classList.toggle('is-active', btn === active));
    }

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

    this.stop();
    this.animateTo(targetPct);
    sound.playChime();
    if (this.onJump) this.onJump(targetPct);
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
// 6b. CONTROLES DEL MAPA: zoom, arrastre, pellizco, seguimiento,
//     reproducción del viaje, etiquetas y pantalla completa
// ==========================================
class RailMapControls {
  constructor(tracker) {
    this.t = tracker;
    this.box = document.getElementById('radar-map-box');
    this.svg = document.getElementById('radar-svg-map');
    if (!this.box || !this.svg) return;
    const vb = this.svg.viewBox.baseVal;
    this.W = vb.width;
    this.H = vb.height;
    this.zoom = 1;
    this.cx = this.W / 2;
    this.cy = this.H / 2;
    this.maxZoom = 8;
    this.follow = false;
    this.pointers = new Map();
    this.drag = null;
    this.pinch = null;
    this.anim = null;
    this.hint = document.getElementById('rm-hint');

    this.bindPointer();
    this.bindControls();
    if (window.ResizeObserver) new ResizeObserver(() => this.apply()).observe(this.box);
    this.apply();

    tracker.onPoint = (pt) => { if (this.follow) this.centerOn(pt.x, pt.y); };
    tracker.onJump = (pct) => {
      if (this.zoom <= 1.02) return;
      const wp = tracker.waypoints.find((w) => w.pct === pct);
      if (wp) this.flyTo(wp.x, wp.y, this.zoom);
    };
    tracker.onPlayState = (on) => {
      const b = document.getElementById('rm-play');
      if (!b) return;
      b.textContent = on ? '⏸' : '▶';
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      if (on && !this.follow) this.setFollow(true);
    };
    setTimeout(() => this.hideHint(), 6000);
  }

  // --- geometría ---
  aspect() {
    const r = this.box.getBoundingClientRect();
    return r.width && r.height ? r.width / r.height : this.W / this.H;
  }
  view() {
    const a = this.aspect();
    const fitW = Math.max(this.W, this.H * a);
    const w = fitW / this.zoom;
    return { w, h: w / a };
  }
  clamp() {
    const { w, h } = this.view();
    const axis = (c, size, total) => (size >= total ? total / 2 : Math.min(Math.max(c, size / 2), total - size / 2));
    this.cx = axis(this.cx, w, this.W);
    this.cy = axis(this.cy, h, this.H);
  }
  apply() {
    this.clamp();
    const { w, h } = this.view();
    this.svg.setAttribute('viewBox', `${(this.cx - w / 2).toFixed(2)} ${(this.cy - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    this.svg.classList.toggle('is-zoomed', this.zoom > 1.02);
  }
  clientToSvg(x, y) {
    const r = this.svg.getBoundingClientRect();
    const { w, h } = this.view();
    return { x: (x - r.left) / r.width * w + (this.cx - w / 2), y: (y - r.top) / r.height * h + (this.cy - h / 2) };
  }

  // --- acciones ---
  zoomAt(factor, clientX, clientY) {
    this.cancelAnim();
    const r = this.svg.getBoundingClientRect();
    const p = this.clientToSvg(clientX, clientY);
    this.zoom = Math.min(this.maxZoom, Math.max(1, this.zoom * factor));
    const { w, h } = this.view();
    const fx = (clientX - r.left) / r.width;
    const fy = (clientY - r.top) / r.height;
    this.cx = p.x - (fx - 0.5) * w;
    this.cy = p.y - (fy - 0.5) * h;
    this.apply();
  }
  zoomCenter(factor) {
    const r = this.svg.getBoundingClientRect();
    this.zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
  }
  centerOn(x, y) {
    this.cx = x;
    this.cy = y;
    this.apply();
  }
  cancelAnim() {
    if (this.anim) cancelAnimationFrame(this.anim);
    this.anim = null;
  }
  flyTo(x, y, zoom, ms = 650) {
    this.cancelAnim();
    const z0 = this.zoom, x0 = this.cx, y0 = this.cy;
    const z1 = Math.min(this.maxZoom, Math.max(1, zoom));
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      this.zoom = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * e);
      this.cx = x0 + (x - x0) * e;
      this.cy = y0 + (y - y0) * e;
      this.apply();
      this.anim = k < 1 ? requestAnimationFrame(step) : null;
    };
    this.anim = requestAnimationFrame(step);
  }
  setFollow(on) {
    this.follow = on;
    const b = document.getElementById('rm-follow');
    if (b) { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); }
    if (on && this.t.currentPoint) this.flyTo(this.t.currentPoint.x, this.t.currentPoint.y, Math.max(this.zoom, 2.4));
  }
  hideHint() {
    if (this.hint) this.hint.classList.add('is-hidden');
  }
  toggleFull(force) {
    const on = typeof force === 'boolean' ? force : !this.box.classList.contains('rm-fullscreen');
    if (on === this.box.classList.contains('rm-fullscreen')) return;
    if (on) {
      // Se mueve al <body> para que "fixed" no dependa del blur/transform de la barra lateral.
      this.placeholder = document.createComment('radar-map');
      this.box.parentNode.insertBefore(this.placeholder, this.box);
      document.body.appendChild(this.box);
    } else if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.insertBefore(this.box, this.placeholder);
      this.placeholder.remove();
    }
    this.box.classList.toggle('rm-fullscreen', on);
    document.body.classList.toggle('rm-noscroll', on);
    const b = document.getElementById('rm-full');
    if (b) { b.textContent = on ? '✕' : '⛶'; b.title = on ? 'Salir de pantalla completa' : 'Pantalla completa'; }
    this.apply();
  }

  // --- eventos ---
  bindControls() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('rm-zoom-in', () => { this.hideHint(); this.zoomCenter(1.7); });
    on('rm-zoom-out', () => { this.hideHint(); this.zoomCenter(1 / 1.7); });
    on('rm-reset', () => { this.setFollow(false); this.flyTo(this.W / 2, this.H / 2, 1); });
    on('rm-follow', () => this.setFollow(!this.follow));
    on('rm-play', () => this.t.togglePlay());
    on('rm-labels', (e) => {
      const hidden = this.svg.classList.toggle('hide-labels');
      e.currentTarget.classList.toggle('is-on', !hidden);
      e.currentTarget.setAttribute('aria-pressed', String(!hidden));
    });
    on('rm-full', () => this.toggleFull());

    this.box.tabIndex = 0;
    this.box.addEventListener('keydown', (e) => {
      const step = 40 / this.zoom;
      if (e.key === '+' || e.key === '=') this.zoomCenter(1.4);
      else if (e.key === '-') this.zoomCenter(1 / 1.4);
      else if (e.key === '0') this.flyTo(this.W / 2, this.H / 2, 1);
      else if (e.key === 'ArrowLeft') this.centerOn(this.cx - step, this.cy);
      else if (e.key === 'ArrowRight') this.centerOn(this.cx + step, this.cy);
      else if (e.key === 'ArrowUp') this.centerOn(this.cx, this.cy - step);
      else if (e.key === 'ArrowDown') this.centerOn(this.cx, this.cy + step);
      else return;
      e.preventDefault();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.toggleFull(false); });
  }

  bindPointer() {
    const svg = this.svg;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.hideHint();
      this.setFollow(false);
      this.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX, e.clientY);
    }, { passive: false });

    svg.addEventListener('dblclick', (e) => {
      this.setFollow(false);
      this.zoomAt(2, e.clientX, e.clientY);
    });

    svg.addEventListener('pointerdown', (e) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { svg.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
      this.hideHint();
      this.cancelAnim();
      if (this.pointers.size === 1) {
        this.drag = { x: e.clientX, y: e.clientY, cx: this.cx, cy: this.cy, moved: false, target: e.target };
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom };
        if (this.drag) this.drag.moved = true;
      }
    });

    svg.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size >= 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const target = Math.min(this.maxZoom, Math.max(1, this.pinch.zoom * d / this.pinch.dist));
        this.setFollow(false);
        this.zoomAt(target / this.zoom, (a.x + b.x) / 2, (a.y + b.y) / 2);
      } else if (this.drag) {
        const dx = e.clientX - this.drag.x;
        const dy = e.clientY - this.drag.y;
        if (!this.drag.moved && Math.hypot(dx, dy) < 5) return;
        if (!this.drag.moved) { this.drag.moved = true; this.setFollow(false); svg.classList.add('is-dragging'); }
        const r = svg.getBoundingClientRect();
        const { w, h } = this.view();
        this.cx = this.drag.cx - dx * (w / r.width);
        this.cy = this.drag.cy - dy * (h / r.height);
        this.apply();
      }
    });

    const end = (e) => {
      const wasSingle = this.pointers.size === 1;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      svg.classList.remove('is-dragging');
      if (e.type === 'pointerup' && wasSingle && this.drag && !this.drag.moved) this.onTap(this.drag.target);
      if (this.pointers.size === 0) this.drag = null;
      else if (this.pointers.size === 1) {
        const [p] = [...this.pointers.values()];
        this.drag = { x: p.x, y: p.y, cx: this.cx, cy: this.cy, moved: true, target: null };
      }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  // Tocar una estación lleva el tren hasta ella y acerca la cámara.
  onTap(target) {
    const st = target && target.closest ? target.closest('.rm-st') : null;
    if (!st) return;
    this.t.stop();
    this.t.animateTo(parseFloat(st.dataset.pct));
    sound.playChime();
    this.setFollow(false);
    this.flyTo(parseFloat(st.dataset.x), parseFloat(st.dataset.y), Math.max(this.zoom, 2.6));
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
                         loop 
                         playsinline 
                         preload="metadata" 
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
            <button id="modal-prev-gift" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition ${(day > 1 && this.openedDays.has(day - 1)) ? '' : 'hidden'}">
              ◀ Anterior
            </button>
            <button id="modal-next-gift" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition ${(day < 9 && this.openedDays.has(day + 1)) ? '' : 'hidden'}">
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
        // Vídeo en pausa manual al alternar pestaña
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
// 8. GESTOR DE BILLETE CONMEMORATIVO AVE Y LOTE SOLIDARIO
// BILLETE OFICIAL: ORIGEN LAPONIA ➔ PARADA INTERMEDIA SEDE INECO ➔ DESTINO MONFORTE
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

    const currentIndex = COLLEAGUES.findIndex(c => c.name === colleague.name);
    const prevColleague = COLLEAGUES[(currentIndex - 1 + COLLEAGUES.length) % COLLEAGUES.length];
    const nextColleague = COLLEAGUES[(currentIndex + 1) % COLLEAGUES.length];

    this.detailsCard.innerHTML = `
      <div class="space-y-6">
        <!-- ============================================== -->
        <!-- BILLETE OFICIAL DE ALTA VELOCIDAD AVE INECO    -->
        <!-- ============================================== -->
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
            <p id="ticket-wish-text" class="italic mt-1 text-sm font-medium">"${colleague.wish}"</p>
          </div>

          <!-- Código de Barras / QR y Localizador -->
          <div class="flex items-center justify-between pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-mono pl-3">
            <span>${colleague.loc}</span>
            <span class="tracking-widest hidden sm:inline">|||||| | |||||||| ||| ||||||| | ||</span>
            <span class="font-bold text-slate-700">BASE MONFORTE DEL CID</span>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- BARRA DE ACCIONES EJECUTIVA DEL BILLETE        -->
        <!-- ============================================== -->
        <div class="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <!-- Selector rápido entre compañeros -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="ticket-prev-colleague-btn" class="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600/50 transition flex items-center justify-center gap-1.5 active:scale-95" title="Ver billete de ${prevColleague.name}">
              <span>◀</span>
              <span>${prevColleague.name}</span>
            </button>
            <button id="ticket-next-colleague-btn" class="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600/50 transition flex items-center justify-center gap-1.5 active:scale-95" title="Ver billete de ${nextColleague.name}">
              <span>${nextColleague.name}</span>
              <span>▶</span>
            </button>
          </div>

          <!-- Acciones principales: Guardar y Copiar -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button id="ticket-copy-btn" class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-400/40 transition flex items-center justify-center gap-2 active:scale-95">
              <span id="ticket-copy-icon">📋</span>
              <span id="ticket-copy-label">Copiar Deseos</span>
            </button>
            <button id="ticket-download-hd-btn" class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-red-600 hover:from-blue-600 hover:to-red-500 text-xs font-black text-white shadow-lg border border-amber-400/50 transition flex items-center justify-center gap-2 active:scale-95">
              <span>📥</span>
              <span>Guardar Billete HD</span>
            </button>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- PRESENTACIÓN LIMPIA DE LA GRAN CESTA DE NAVIDAD-->
        <!-- ============================================== -->
        <div class="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-5 sm:p-7 border-2 border-amber-400/40 text-center relative overflow-hidden shadow-2xl">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold mb-3">
            <span>🎁</span>
            <span>Lote Solidario Completo (9 Especialidades)</span>
          </div>

          <h4 class="text-xl md:text-2xl font-black text-white font-poppins mb-2">
            La Gran Cesta Navideña de ${colleague.name}
          </h4>

          <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
            Caja kraft con acondicionamiento interior reforzado y separadores protectores para la custodia de cada artículo en su travesía por alta velocidad.
          </p>

          <!-- Imagen Oficial de la Cesta de Navidad -->
          <div class="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/70 shadow-[0_0_40px_rgba(212,175,55,0.25)] relative group bg-slate-950 mb-6">
            <img src="assets/cesta_solidaria_real.jpg" alt="Gran Cesta de Navidad Solidaria Ineco 2026" class="w-full h-auto max-h-[460px] object-cover transform group-hover:scale-102 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20 pointer-events-none"></div>

            <div class="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between text-xs">
              <span class="text-amber-300 font-extrabold text-xs">Acondicionamiento Antichoque</span>
              <span class="text-white bg-red-600/95 px-3 py-1 rounded-full text-xs font-black tracking-wider shadow">
                Llegada 14 Dic • Base Monforte
              </span>
            </div>
          </div>

          <!-- Botón de Enlace al Calendario de Adviento -->
          <div class="flex justify-center">
            <button id="go-to-advent-btn" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 hover:from-blue-800 hover:to-indigo-800 text-amber-300 hover:text-white font-bold text-xs border border-amber-400/50 shadow-lg flex items-center gap-2 transition active:scale-95">
              <span>❄️</span>
              <span>Explorar los 9 Productos en el Calendario de Adviento</span>
              <span>⬆</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Manejador del botón Descargar Billete HD
    const downloadBtn = document.getElementById('ticket-download-hd-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        this.downloadTicketPass(colleague);
      };
    }

    // Manejador del botón Copiar Deseos
    const copyBtn = document.getElementById('ticket-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const textToCopy = `🚄 Billete Solidario Ineco 2026 • ${colleague.name} (${colleague.role})\n"${colleague.wish}"\n📍 Trayecto: Laponia ➔ Sede Ineco ➔ Base Monforte del Cid`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          const icon = document.getElementById('ticket-copy-icon');
          const label = document.getElementById('ticket-copy-label');
          if (icon) icon.innerText = '✅';
          if (label) label.innerText = '¡Copiado!';
          sound.playChime();
          haptics.chime();
          setTimeout(() => {
            if (icon) icon.innerText = '📋';
            if (label) label.innerText = 'Copiar Deseos';
          }, 2500);
        }).catch(() => {
          sound.playChime();
        });
      };
    }

    // Navegación entre compañeros
    const prevBtn = document.getElementById('ticket-prev-colleague-btn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        sound.playChime();
        this.select(prevColleague);
        this.updateActiveSelectorButton(prevColleague.name);
      };
    }

    const nextBtn = document.getElementById('ticket-next-colleague-btn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        sound.playChime();
        this.select(nextColleague);
        this.updateActiveSelectorButton(nextColleague.name);
      };
    }

    // Enlace al calendario de adviento
    const toAdventBtn = document.getElementById('go-to-advent-btn');
    if (toAdventBtn) {
      toAdventBtn.onclick = () => {
        sound.playChime();
        const adventSec = document.getElementById('seccion-calendario');
        if (adventSec) {
          adventSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    }
  }

  updateActiveSelectorButton(colleagueName) {
    if (!this.container) return;
    this.container.querySelectorAll('button').forEach(b => {
      if (b.getAttribute('data-name') === colleagueName) {
        b.className = 'px-3 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-blue-800/95 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40';
      } else {
        b.className = 'px-3 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700/70';
      }
    });
  }

  downloadTicketPass(colleague) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Fondo Blanco con Bisel Dorado
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect ? ctx.roundRect(10, 10, 940, 460, 24) : ctx.rect(10, 10, 940, 460);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cabecera Azul Corporativo Ineco
    ctx.fillStyle = '#1A4488';
    ctx.fillRect(10, 10, 940, 110);

    // Banda Roja Decorativa Lateral
    ctx.fillStyle = '#CB1823';
    ctx.fillRect(35, 120, 12, 335);

    // Tipografía de Cabecera
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillText('INECO • BILLETE SOLIDARIO 2026', 75, 80);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 14px Poppins, sans-serif';
    ctx.fillText('RUTA: LAPONIA ➔ SEDE INECO ➔ MONFORTE', 520, 80);

    // Nombre del Pasajero
    ctx.fillStyle = '#0D2246';
    ctx.font = '900 36px Poppins, sans-serif';
    ctx.fillText(colleague.name, 75, 175);

    // Rol y Asiento
    ctx.fillStyle = '#CB1823';
    ctx.font = 'bold 18px Poppins, sans-serif';
    ctx.fillText(`${colleague.role} • ${colleague.ticketSeat}`, 75, 215);

    // Trayecto Detallado
    ctx.fillStyle = '#334155';
    ctx.font = '15px Poppins, sans-serif';
    ctx.fillText('Origen: Laponia (66°N) | Parada: Sede Ineco | Destino: Base Monforte (14 Dic)', 75, 265);

    // Mensaje Personalizado
    ctx.fillStyle = '#1E293B';
    ctx.font = 'italic 16px Poppins, sans-serif';
    ctx.fillText(`"${colleague.wish}"`, 75, 320);

    // Pie con Código de Barras y Localizador
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`BASE MONFORTE DEL CID  |||||||||| ||||| ||||||||  ${colleague.loc}`, 75, 415);

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
// EFECTO ESPECTACULAR: REGALOS PERSONALIZADOS CAYENDO COMO COPOS DE NIEVE
// Fondo de la pantalla inicial con regalos y nombres de los compañeros flotando
// ==========================================
class TeaserFallingGifts {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.gifts = [];
    this.sparkles = [];
    this.active = true;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Listado de compañeros exacto (Iván A. e Iván C. para los regalos voladores)
    this.names = [
      "Ana", "Edu", "Ernesto", "Gloria", "Irene",
      "Iván A.", "Iván C.", "Jose Luis", "Manuel",
      "Pascual", "Pepe", "Raúl"
    ];
    this.nameCursor = 0;

    // Paletas elegantes de alta gama navideña / Ineco
    this.colorSchemes = [
      { bodyTop: "#DC2626", bodyBottom: "#991B1B", ribbon: "#FCD34D", ribbonDark: "#D97706", text: "#FEF08A" }, // Rojo Ineco & Oro
      { bodyTop: "#1A4488", bodyBottom: "#0D2246", ribbon: "#FCD34D", ribbonDark: "#D97706", text: "#FFFFFF" }, // Azul Ineco & Oro
      { bodyTop: "#047857", bodyBottom: "#064E3B", ribbon: "#FEF08A", ribbonDark: "#EAB308", text: "#FFFFFF" }, // Verde Abeto & Oro
      { bodyTop: "#D97706", bodyBottom: "#78350F", ribbon: "#FFFFFF", ribbonDark: "#E2E8F0", text: "#FEF3C7" }, // Oro Cálido & Blanco Seda
      { bodyTop: "#6D28D9", bodyBottom: "#4C1D95", ribbon: "#FDE047", ribbonDark: "#CA8A04", text: "#FFFFFF" }, // Púrpura Real & Oro
      { bodyTop: "#BE123C", bodyBottom: "#881337", ribbon: "#FCD34D", ribbonDark: "#D97706", text: "#FFFFFF" }  // Rubí Navideño & Oro
    ];

    // Dimensiones fijas e idénticas para TODOS los paquetes (tamaño uniforme)
    this.BOX_WIDTH = 74;
    this.BOX_HEIGHT = 56;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  getLanes() {
    // EN LA VERSIÓN MÓVIL (< 1024px): NO vuelan los regalos para mantener legibilidad total
    if (this.width < 1024) return null;

    const contentEl = document.getElementById('teaser-main-content');
    let leftLimit = 180;
    let rightLimit = this.width - 180;

    if (contentEl) {
      const rect = contentEl.getBoundingClientRect();
      // Margen de seguridad estricto antes del contenido central
      leftLimit = Math.max(30, Math.min(rect.left - 45, this.width * 0.22));
      rightLimit = Math.min(this.width - 30, Math.max(rect.right + 45, this.width * 0.78));
    } else {
      leftLimit = this.width * 0.18;
      rightLimit = this.width * 0.82;
    }

    // Si la pantalla no tiene espacio lateral suficiente para los paquetes, no dibujar
    if (leftLimit < 65 || (this.width - rightLimit) < 65) {
      return null;
    }

    return {
      leftLane: [20, leftLimit],
      rightLane: [rightLimit, this.width - 20]
    };
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const lanes = this.getLanes();
    if (!lanes) {
      // Móvil o pantalla estrecha: limpiar y no generar regalos
      this.gifts = [];
      this.sparkles = [];
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.maxGifts = 18; // 9 por lateral aprox
    this.initGifts(lanes);
    this.initSparkles(lanes);
  }

  getNextName() {
    const name = this.names[this.nameCursor % this.names.length];
    this.nameCursor++;
    return name;
  }

  initGifts(lanes) {
    this.gifts = [];
    const count = this.maxGifts;
    for (let i = 0; i < count; i++) {
      const startY = (this.height / count) * i + (Math.random() * 40 - 20);
      const side = (i % 2 === 0) ? 'left' : 'right';
      this.gifts.push(this.createGift(startY, side, lanes));
    }
  }

  createGift(startY, forceSide = null, lanes = null) {
    lanes = lanes || this.getLanes();
    if (!lanes) return null;

    const name = this.getNextName();
    const scheme = this.colorSchemes[Math.floor(Math.random() * this.colorSchemes.length)];
    const side = forceSide || (Math.random() < 0.5 ? 'left' : 'right');
    const [laneMin, laneMax] = side === 'left' ? lanes.leftLane : lanes.rightLane;

    const safeSpan = Math.max(10, (laneMax - laneMin) - this.BOX_WIDTH);
    const baseX = laneMin + this.BOX_WIDTH / 2 + Math.random() * safeSpan;

    return {
      name: name,
      scheme: scheme,
      side: side,
      x: baseX,
      baseX: baseX,
      laneMin: laneMin + this.BOX_WIDTH / 2,
      laneMax: laneMax - this.BOX_WIDTH / 2,
      y: startY !== undefined ? startY : -90 - Math.random() * 80,
      width: this.BOX_WIDTH,
      height: this.BOX_HEIGHT,
      speedY: 0.95 + Math.random() * 0.45,
      swayAmp: Math.min(1.2, Math.max(0.4, (laneMax - laneMin) * 0.05)),
      swayFreq: 0.009 + Math.random() * 0.006,
      swayOffset: Math.random() * Math.PI * 2,
      tiltAmp: 0.05 + Math.random() * 0.04,
      tiltFreq: 0.011 + Math.random() * 0.006,
      tiltOffset: Math.random() * Math.PI * 2,
      opacity: 0.95,
      t: Math.random() * 500
    };
  }

  initSparkles(lanes) {
    this.sparkles = [];
    if (!lanes) return;
    for (let i = 0; i < 30; i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      const [lMin, lMax] = side === 'left' ? lanes.leftLane : lanes.rightLane;
      this.sparkles.push({
        x: lMin + Math.random() * (lMax - lMin),
        y: Math.random() * (this.height || 600),
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random(),
        speed: 0.02 + Math.random() * 0.025,
        vy: 0.35 + Math.random() * 0.45,
        side: side,
        lMin: lMin,
        lMax: lMax
      });
    }
  }

  animate(now) {
    if (!this.active) {
      this.animId = requestAnimationFrame(this.animate);
      return;
    }

    // Si estamos en versión móvil (< 1024px), pantalla limpia sin regalos
    if (this.width < 1024) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.animId = requestAnimationFrame(this.animate);
      return;
    }

    const dt = Math.min((now - (this.lastTime || now)) / 16.67, 2.5);
    this.lastTime = now;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const lanes = this.getLanes();
    if (!lanes) {
      this.animId = requestAnimationFrame(this.animate);
      return;
    }

    // 1. Chispas doradas en los laterales
    this.drawSparkles(dt, lanes);

    // 2. Regalos cayendo exclusivamente por los laterales
    for (let i = 0; i < this.gifts.length; i++) {
      const g = this.gifts[i];
      if (!g) continue;
      g.t += dt;

      g.y += g.speedY * dt;
      
      // Oscilación suave estrictamente limitada a su carril lateral
      const sway = Math.sin(g.t * g.swayFreq + g.swayOffset) * g.swayAmp;
      g.x = Math.max(g.laneMin, Math.min(g.laneMax, g.baseX + sway));

      const tilt = Math.sin(g.t * g.tiltFreq + g.tiltOffset) * g.tiltAmp;

      if (g.y > this.height + 90) {
        const recycled = this.createGift(-90, g.side, lanes);
        if (recycled) Object.assign(g, recycled);
      }

      this.drawGiftBox(g, tilt);
    }

    this.animId = requestAnimationFrame(this.animate);
  }

  drawSparkles(dt, lanes) {
    const ctx = this.ctx;
    ctx.save();
    for (let s of this.sparkles) {
      s.y += s.vy * dt;
      s.alpha += s.speed * dt;
      if (s.y > this.height) {
        s.y = -10;
        const [lMin, lMax] = s.side === 'left' ? lanes.leftLane : lanes.rightLane;
        s.x = lMin + Math.random() * (lMax - lMin);
      }
      const currentAlpha = 0.2 + Math.sin(s.alpha) * 0.35;

      ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0, currentAlpha)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawGiftBox(g, tilt) {
    const ctx = this.ctx;
    ctx.save();

    ctx.translate(g.x, g.y);
    ctx.rotate(tilt);
    ctx.globalAlpha = g.opacity;

    const w = g.width;
    const h = g.height;
    const radius = 7;
    const ribbonW = 12;

    // Sombra suave profesional y nítida
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // 1. Cuerpo del Regalo
    const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, g.scheme.bodyTop);
    grad.addColorStop(1, g.scheme.bodyBottom);

    ctx.fillStyle = grad;
    this.drawRoundedRect(ctx, -w / 2, -h / 2, w, h, radius);
    ctx.fill();

    // Bisel superior iluminado
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Cinta Vertical Centrada
    const ribbonGradV = ctx.createLinearGradient(-ribbonW / 2, 0, ribbonW / 2, 0);
    ribbonGradV.addColorStop(0, g.scheme.ribbonDark);
    ribbonGradV.addColorStop(0.5, g.scheme.ribbon);
    ribbonGradV.addColorStop(1, g.scheme.ribbonDark);

    ctx.fillStyle = ribbonGradV;
    ctx.fillRect(-ribbonW / 2, -h / 2, ribbonW, h);

    // 3. Cinta Horizontal Centrada
    const ribbonGradH = ctx.createLinearGradient(0, -ribbonW / 2, 0, ribbonW / 2);
    ribbonGradH.addColorStop(0, g.scheme.ribbonDark);
    ribbonGradH.addColorStop(0.5, g.scheme.ribbon);
    ribbonGradH.addColorStop(1, g.scheme.ribbonDark);

    ctx.fillStyle = ribbonGradH;
    ctx.fillRect(-w / 2, -ribbonW / 2, w, ribbonW);

    // 4. Lazo Tridimensional Superior (Bow)
    const bowY = -h / 2;
    const loopW = 10;
    const loopH = 6;

    ctx.fillStyle = g.scheme.ribbon;
    ctx.beginPath();
    ctx.ellipse(-7, bowY - 4, loopW, loopH, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.scheme.ribbonDark;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(7, bowY - 4, loopW, loopH, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nudo central del lazo
    ctx.fillStyle = "#FFFBEB";
    ctx.beginPath();
    ctx.arc(0, bowY - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Placa con el Nombre de la Persona (Dentro del cuerpo del regalo)
    const tagW = w - 12; // 62px
    const tagH = 21;
    const tagY = 3;

    ctx.fillStyle = "rgba(10, 16, 28, 0.94)";
    this.drawRoundedRect(ctx, -tagW / 2, tagY - tagH / 2, tagW, tagH, 4);
    ctx.fill();

    ctx.strokeStyle = g.scheme.ribbon;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "700 11px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = g.scheme.text;
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    ctx.fillText(g.name, 0, tagY);

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y, x + radius, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  pause() {
    this.active = false;
  }

  resume() {
    this.active = true;
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

  // Inicializar efecto espectacular de regalos cayendo con los nombres de las personas
  window.teaserGiftsBlizzard = new TeaserFallingGifts('teaser-gifts-canvas');

  // 1. Manejo del Vídeo Oficial (REPRODUCCIÓN MANUAL: NO SE AUTOREPRODUCE SOLO)
  const videoPlayOverlay = document.getElementById('teaser-video-play-overlay');
  const videoPlayBtn = document.getElementById('teaser-video-play-btn');
  const videoContainer = document.getElementById('teaser-video-container');

  if (teaserVideo) {
    // Asegurar que comience pausado
    teaserVideo.pause();

    const hidePlayOverlay = () => {
      if (videoPlayOverlay) {
        videoPlayOverlay.classList.add('opacity-0', 'pointer-events-none');
      }
    };

    const showPlayOverlay = () => {
      if (videoPlayOverlay) {
        videoPlayOverlay.classList.remove('opacity-0', 'pointer-events-none');
      }
    };

    const toggleVideoPlayback = (e) => {
      if (e) e.stopPropagation();
      if (!teaserVideo) return;

      if (teaserVideo.paused) {
        teaserVideo.play().then(() => {
          hidePlayOverlay();
        }).catch(err => {
          console.log("Reproducción manual iniciada:", err);
        });
      } else {
        teaserVideo.pause();
        showPlayOverlay();
      }
    };

    if (videoPlayOverlay) videoPlayOverlay.onclick = toggleVideoPlayback;
    if (videoPlayBtn) videoPlayBtn.onclick = toggleVideoPlayback;
    if (videoContainer) videoContainer.onclick = toggleVideoPlayback;

    teaserVideo.addEventListener('play', hidePlayOverlay);
    teaserVideo.addEventListener('pause', showPlayOverlay);
    teaserVideo.addEventListener('ended', showPlayOverlay);

    // Botón de alternancia de Sonido
    if (unmuteBtn) {
      unmuteBtn.onclick = (e) => {
        e.stopPropagation();
        teaserVideo.muted = !teaserVideo.muted;
        if (muteIcon) muteIcon.innerText = teaserVideo.muted ? "🔇" : "🔊";
        if (muteLabel) muteLabel.innerText = teaserVideo.muted ? "Silenciado" : "Sonido Activo";
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
          teaserVideo.pause();
        }
        const badge = document.getElementById('teaser-video-badge');
        if (badge) badge.innerText = "DÍA 1 • VÍDEO OFICIAL";
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
          teaserVideo.pause();
        }
        const badge = document.getElementById('teaser-video-badge');
        if (badge) badge.innerText = "TRÁILER OFICIAL";
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
    if (window.teaserGiftsBlizzard) window.teaserGiftsBlizzard.pause();

    if (notify && typeof sound !== 'undefined') {
      sound.playSuccessTone();
    }
  }

  function disableCreatorMode() {
    isCreatorPreviewActive = false;
    localStorage.removeItem('ineco_creator_preview');
    teaserScreen.classList.remove('teaser-hidden');
    if (adminBar) adminBar.classList.add('hidden');
    if (window.teaserGiftsBlizzard) window.teaserGiftsBlizzard.resume();
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
      if (window.teaserGiftsBlizzard) window.teaserGiftsBlizzard.resume();
      evaluateTeaserState(false);
    };
  }
  if (testUnlockedBtn) {
    testUnlockedBtn.onclick = () => {
      teaserScreen.classList.remove('teaser-hidden');
      if (window.teaserGiftsBlizzard) window.teaserGiftsBlizzard.resume();
      evaluateTeaserState(true);
    };
  }

  // 7. Entrada a la aplicación cuando se desbloquea el 1 de diciembre
  if (enterAppBtn) {
    enterAppBtn.onclick = () => {
      if (typeof sound !== 'undefined') sound.playFanfare();
      teaserScreen.classList.add('teaser-hidden');
      if (window.teaserGiftsBlizzard) window.teaserGiftsBlizzard.pause();
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
    scratch(e.clientX, e.clientY);
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
    const $ = (id) => document.getElementById(id);
    this.modal = $('game-modal');
    this.openBtn = $('open-game-btn');
    this.mobileOpenBtn = $('mobile-game-btn');
    this.closeBtn = $('close-game-btn');
    this.pauseBtn = $('game-pause-btn');
    this.stage = $('game-stage');
    this.overlay = $('game-overlay-screen');
    this.countdownEl = $('game-countdown');
    this.canvas = $('game-canvas');
    this.btnLeft = $('game-btn-left');
    this.btnRight = $('game-btn-right');
    this.hud = {
      collected: $('g-collected'), time: $('g-time'), score: $('g-score'), bar: $('g-timebar'),
      combo: $('g-combo'), shield: $('g-shield'), turbo: $('g-turbo')
    };
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.GOAL = 9;
    this.TOTAL_TIME = 45;
    this.state = 'idle'; // idle | countdown | playing | paused | over
    this.W = 360; this.H = 560; this.dpr = 1;
    this.highScore = parseInt(localStorage.getItem('ineco_game_hi') || '0', 10);
    this.giftIcons = ['🫒', '🐟', '🌶️', '🥫', '🍫', '☕', '🃏', '🧦', '💌'];
    this.stars = [];
    this.flakes = [];
    this.scroll = 0;
    this.raf = null;
    this.last = 0;
    this.timers = [];
    this.pointerActive = false;
    this.resetRun();
    this.init();
  }

  resetRun() {
    this.targetLane = 1;
    this.trainX = this.laneX(1);
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.collected = 0;
    this.hits = 0;
    this.timeLeft = this.TOTAL_TIME;
    this.elapsed = 0;
    this.spawnTimer = 0.5;
    this.trailTimer = 0;
    this.turboT = 0;
    this.shield = false;
    this.flash = 0;
    this.shake = 0;
    this.speed = 0;
    this.lastShownTime = -1;
  }

  // ---------- geometría ----------
  get laneW() { return this.W / 3; }
  laneX(i) { return this.laneW * (i + 0.5); }
  get u() { return Math.min(1.5, Math.max(0.8, this.W / 360)); }
  get trainW() { return Math.min(this.laneW * 0.42, 54 * this.u); }
  get trainH() { return this.trainW * 1.7; }
  get trainY() { return this.H - this.trainH * 0.5 - 26 * this.u; }
  get itemSize() { return Math.min(this.laneW * 0.36, 46 * this.u); }

  resize() {
    if (!this.canvas || !this.stage) return;
    const r = this.stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.trainX = this.laneX(this.targetLane);
    // Campo de estrellas y copos adaptados al tamaño
    this.stars = Array.from({ length: Math.round(this.W * this.H / 5200) }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H * 0.9, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28
    }));
    this.flakes = Array.from({ length: Math.round(this.W / 12) }, () => this.newFlake(true));
  }

  newFlake(anywhere) {
    return {
      x: Math.random() * this.W, y: anywhere ? Math.random() * this.H : -8,
      r: Math.random() * 1.8 + 0.6, v: 25 + Math.random() * 45, s: Math.random() * 6.28
    };
  }

  // ---------- eventos ----------
  init() {
    if (this.openBtn) this.openBtn.onclick = () => this.open();
    if (this.mobileOpenBtn) this.mobileOpenBtn.onclick = () => this.open();
    if (this.closeBtn) this.closeBtn.onclick = () => this.close();
    if (this.pauseBtn) this.pauseBtn.onclick = () => this.togglePause();
    if (this.btnLeft) this.btnLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); this.moveLeft(); });
    if (this.btnRight) this.btnRight.addEventListener('pointerdown', (e) => { e.preventDefault(); this.moveRight(); });

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'start' || act === 'restart') this.startCountdown();
        else if (act === 'resume') this.resume();
        else if (act === 'close') this.close();
      });
    }

    if (this.canvas) {
      // Control directo: la locomotora va a la vía que toques y sigue al dedo al arrastrar.
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'playing') return;
        e.preventDefault();
        this.pointerActive = true;
        try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
        this.setLaneFromClientX(e.clientX);
      });
      this.canvas.addEventListener('pointermove', (e) => {
        if (this.pointerActive && this.state === 'playing') this.setLaneFromClientX(e.clientX);
      });
      const up = () => { this.pointerActive = false; };
      this.canvas.addEventListener('pointerup', up);
      this.canvas.addEventListener('pointercancel', up);
    }

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      const k = e.key;
      if (k === 'Escape') { this.state === 'playing' ? this.pause() : this.close(); return; }
      if (k === 'p' || k === 'P') { this.togglePause(); return; }
      if (this.state !== 'playing') {
        if ((k === 'Enter' || k === ' ') && (this.state === 'idle' || this.state === 'over')) { e.preventDefault(); this.startCountdown(); }
        return;
      }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); this.moveLeft(); }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); this.moveRight(); }
    });

    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'playing') this.pause(); });
    window.addEventListener('resize', () => this.isOpen() && this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.isOpen() && this.resize(), 250));
    if (window.ResizeObserver && this.stage) new ResizeObserver(() => this.isOpen() && this.resize()).observe(this.stage);
  }

  isOpen() { return this.modal && !this.modal.classList.contains('hidden'); }

  setLaneFromClientX(x) {
    const r = this.canvas.getBoundingClientRect();
    const lane = Math.max(0, Math.min(2, Math.floor((x - r.left) / r.width * 3)));
    if (lane !== this.targetLane) { this.targetLane = lane; haptics.scratch(); }
  }
  moveLeft() { if (this.state === 'playing' && this.targetLane > 0) { this.targetLane--; haptics.scratch(); } }
  moveRight() { if (this.state === 'playing' && this.targetLane < 2) { this.targetLane++; haptics.scratch(); } }

  // ---------- ciclo de vida ----------
  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.buildSlots();
    this.resetRun();
    this.resize();
    this.state = 'idle';
    this.showStart();
    this.syncHud(true);
    this.last = 0;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  close() {
    this.clearTimers();
    this.state = 'idle';
    cancelAnimationFrame(this.raf);
    if (this.modal) this.modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  clearTimers() { this.timers.forEach(clearTimeout); this.timers = []; }
  later(fn, ms) { this.timers.push(setTimeout(fn, ms)); }

  startCountdown() {
    this.clearTimers();
    this.resetRun();
    this.resize();
    this.hideOverlay();
    this.state = 'countdown';
    this.syncHud(true);
    const steps = ['3', '2', '1', '¡YA!'];
    steps.forEach((s, i) => this.later(() => {
      if (this.state !== 'countdown') return;
      if (this.countdownEl) {
        this.countdownEl.textContent = s;
        this.countdownEl.classList.remove('go'); void this.countdownEl.offsetWidth; this.countdownEl.classList.add('go');
      }
      i === steps.length - 1 ? sound.playTrainHorn() : sound.playChime();
    }, i * 800));
    this.later(() => {
      if (this.state !== 'countdown') return;
      if (this.countdownEl) this.countdownEl.textContent = '';
      this.state = 'playing';
    }, steps.length * 800);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.pointerActive = false;
    this.showOverlay(`
      <div class="text-5xl mb-2">⏸️</div>
      <h3 class="text-xl font-black text-white font-poppins mb-1">Juego en pausa</h3>
      <p class="text-xs text-blue-200 mb-5">Llevas ${this.collected} de ${this.GOAL} regalos · ${this.score} pts</p>
      <button data-act="resume" class="game-btn-primary">▶ Continuar</button>
      <button data-act="close" class="game-btn-ghost mt-3">Salir</button>`);
  }
  resume() {
    if (this.state !== 'paused') return;
    this.hideOverlay();
    this.last = 0;
    this.state = 'playing';
  }
  togglePause() { this.state === 'playing' ? this.pause() : this.state === 'paused' ? this.resume() : null; }

  showOverlay(html) { if (this.overlay) { this.overlay.innerHTML = html; this.overlay.classList.remove('hidden'); } }
  hideOverlay() { if (this.overlay) this.overlay.classList.add('hidden'); }

  showStart() {
    this.showOverlay(`
      <div class="text-5xl mb-3">🚄 🎁</div>
      <h3 class="text-xl font-black text-white font-poppins mb-1">El Maquinista Solidario 2027</h3>
      <p class="text-xs text-blue-200 max-w-xs mb-3 leading-relaxed">
        Guía el AVE por las 3 vías y entrega los <strong class="text-amber-300">9 regalos solidarios</strong> antes de que se acabe el tiempo.
      </p>
      <ul class="text-[11px] text-slate-300 mb-4 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700 space-y-1 text-left">
        <li>👆 <b>Toca o arrastra</b> para cambiar de vía</li>
        <li>❄️ Los bloques de hielo restan puntos y tiempo</li>
        <li>⏱️ +tiempo · 🛡️ escudo · ⚡ puntos dobles</li>
      </ul>
      <button id="start-game-btn" data-act="start" class="game-btn-primary">¡COMENZAR DESAFÍO!</button>
      <p class="text-[10px] text-slate-400 mt-3 font-mono">Récord: ${this.highScore} pts</p>`);
  }

  // ---------- partida ----------
  spawn() {
    const r = Math.random();
    let type = 'gift';
    if (r < 0.34) type = 'ice';
    else if (r > 0.93) type = 'turbo';
    else if (r > 0.87) type = 'shield';
    else if (r > 0.81) type = 'time';
    // Evita repetir ítem en la misma vía muy seguido
    let lane = Math.floor(Math.random() * 3);
    const prev = this.items[this.items.length - 1];
    if (prev && prev.y < this.H * 0.25 && prev.lane === lane) lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    const icons = { ice: '❄️', turbo: '⚡', shield: '🛡️', time: '⏱️' };
    this.items.push({
      lane, y: -this.itemSize, type,
      icon: type === 'gift' ? this.giftIcons[Math.floor(Math.random() * this.giftIcons.length)] : icons[type],
      ph: Math.random() * 6.28
    });
  }

  burst(x, y, color, n = 10, spd = 140) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = spd * (0.4 + Math.random() * 0.8);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, max: 0.8, r: 1.5 + Math.random() * 2.5, color });
    }
  }
  floatText(text, x, y, color) { this.floatingTexts.push({ text, x, y, life: 1, color }); }

  update(dt) {
    this.elapsed += dt;
    this.timeLeft -= dt;
    this.turboT = Math.max(0, this.turboT - dt);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 30);
    const ramp = Math.min(1, this.elapsed / 35);
    this.speed = this.H * (0.5 + 0.42 * ramp) * (this.turboT > 0 ? 1.12 : 1);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = Math.max(0.34, 0.82 - this.elapsed * 0.011);
    }

    const tx = this.laneX(this.targetLane);
    this.trainX += (tx - this.trainX) * Math.min(1, dt * 16);

    const ty = this.trainY, th = this.trainH, tw = this.trainW, r = this.itemSize * 0.5;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += this.speed * dt;
      const ix = this.laneX(it.lane);
      if (Math.abs(ix - this.trainX) < tw * 0.5 + r * 0.6 && Math.abs(it.y - ty) < th * 0.5 + r * 0.6) {
        this.items.splice(i, 1);
        if (this.collect(it, ix)) return;
        continue;
      }
      if (it.y > this.H + 60) {
        if (it.type === 'gift') this.combo = 0; // regalo perdido corta el combo
        this.items.splice(i, 1);
      }
    }

    // Estela de nieve del tren
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = this.turboT > 0 ? 0.015 : 0.04;
      this.particles.push({ x: this.trainX + (Math.random() - 0.5) * tw * 0.6, y: ty + th * 0.5, vx: (Math.random() - 0.5) * 30, vy: 60 + Math.random() * 60, life: 0.45, max: 0.45, r: 1.5 + Math.random() * 2, color: this.turboT > 0 ? '#FDE047' : '#E2E8F0' });
    }

    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endGame(false); }
  }

  // Devuelve true si la partida terminó.
  collect(it, ix) {
    const y = it.y;
    if (it.type === 'gift') {
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      const bonus = this.combo > 1 ? Math.min(this.combo, 10) * 20 : 0;
      const pts = (100 + bonus) * (this.turboT > 0 ? 2 : 1);
      this.score += pts;
      this.collected++;
      sound.playGameCollect();
      haptics.chime();
      this.burst(ix, y, '#FDE047', 12);
      this.floatText(`+${pts}${this.combo > 1 ? ` x${this.combo}` : ''}`, ix, y - 24, this.combo > 1 ? '#FCD34D' : '#38BDF8');
      if (this.collected >= this.GOAL) {
        this.score += Math.round(this.timeLeft) * 30;
        this.endGame(true);
        return true;
      }
    } else if (it.type === 'ice') {
      if (this.shield) {
        this.shield = false;
        sound.playChime();
        this.burst(ix, y, '#7DD3FC', 14);
        this.floatText('¡Escudo!', ix, y - 24, '#7DD3FC');
      } else {
        this.hits++;
        this.combo = 0;
        this.score = Math.max(0, this.score - 50);
        this.timeLeft = Math.max(0, this.timeLeft - 2);
        this.flash = 1;
        this.shake = 9;
        sound.playIceCrack();
        haptics.scratch();
        this.burst(ix, y, '#BAE6FD', 16, 190);
        this.floatText('-50 · -2s', ix, y - 24, '#F87171');
      }
    } else if (it.type === 'time') {
      this.timeLeft += 4;
      sound.playChime(); haptics.chime();
      this.burst(ix, y, '#86EFAC', 10);
      this.floatText('+4 s', ix, y - 24, '#86EFAC');
    } else if (it.type === 'shield') {
      this.shield = true;
      sound.playChime(); haptics.chime();
      this.burst(ix, y, '#7DD3FC', 10);
      this.floatText('Escudo', ix, y - 24, '#7DD3FC');
    } else if (it.type === 'turbo') {
      this.turboT = 6;
      sound.playChime(); haptics.chime();
      this.burst(ix, y, '#FDE047', 14);
      this.floatText('¡Puntos x2!', ix, y - 24, '#FDE047');
    }
    return false;
  }

  endGame(victory) {
    this.state = 'over';
    this.pointerActive = false;
    this.clearTimers();
    const isRecord = this.score > this.highScore;
    if (isRecord) { this.highScore = this.score; localStorage.setItem('ineco_game_hi', String(this.highScore)); }
    sound.playConfettiFanfare();
    haptics.fanfare();
    if (victory && typeof confetti === 'function') confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, zIndex: 9999 });

    const starCount = victory ? (this.timeLeft >= 12 ? 3 : 2) : (this.collected >= 5 ? 1 : 0);
    const stars = '⭐'.repeat(starCount) + '☆'.repeat(3 - starCount);
    const title = victory ? '¡ENTREGA EXITOSA EN MONFORTE!' : (this.collected >= 5 ? '¡CASI LLEGAS A MONFORTE!' : '¡SE ACABÓ EL TIEMPO!');
    this.syncHud(true);
    this.showOverlay(`
      <div class="text-4xl mb-1 tracking-wide">${stars}</div>
      <div class="text-3xl mb-2">🚄 🎁</div>
      <h3 class="text-base sm:text-lg font-black text-amber-300 font-poppins">${title}</h3>
      <p class="text-xs text-white max-w-xs mt-2 mb-4 leading-relaxed">
        Has entregado <strong class="text-amber-400 font-black text-sm">${this.collected} de ${this.GOAL} regalos solidarios</strong>.<br>
        <span class="text-emerald-400 font-bold text-sm block mt-1">Puntuación: ${this.score} pts${isRecord ? ' · ¡NUEVO RÉCORD!' : ''}</span>
        <span class="text-slate-400 text-[10px] block font-mono">Récord: ${this.highScore} pts · Mejor combo: x${this.bestCombo} · Choques: ${this.hits}</span>
        <span class="text-[11px] text-blue-200 block mt-1">¡Feliz y próspero año 2027!</span>
      </p>
      <button data-act="restart" class="game-btn-primary">🔄 Volver a jugar</button>
      <button data-act="close" class="game-btn-ghost mt-3">Cerrar</button>`);
  }

  // ---------- HUD ----------
  buildSlots() {
    const el = this.hud.collected;
    if (el && el.children.length !== this.GOAL) el.innerHTML = '<i></i>'.repeat(this.GOAL);
  }
  syncHud(force) {
    const h = this.hud;
    if (h.collected) Array.from(h.collected.children).forEach((s, i) => s.classList.toggle('on', i < this.collected));
    const t = Math.ceil(this.timeLeft);
    if (force || t !== this.lastShownTime) {
      this.lastShownTime = t;
      if (h.time) { h.time.textContent = t + 's'; h.time.classList.toggle('low', t <= 8); }
      if (h.bar) { h.bar.style.width = Math.max(0, Math.min(100, this.timeLeft / this.TOTAL_TIME * 100)) + '%'; h.bar.classList.toggle('low', t <= 8); }
    }
    if (h.score) h.score.textContent = this.score;
    if (h.combo) { h.combo.textContent = `🔥 x${this.combo}`; h.combo.classList.toggle('hidden', this.combo < 2); }
    if (h.shield) h.shield.classList.toggle('hidden', !this.shield);
    if (h.turbo) { h.turbo.textContent = `⚡ ${Math.ceil(this.turboT)}s`; h.turbo.classList.toggle('hidden', this.turboT <= 0); }
  }

  // ---------- bucle ----------
  loop(ts) {
    if (!this.isOpen()) return;
    const dt = this.last ? Math.min(0.05, (ts - this.last) / 1000) : 0;
    this.last = ts;
    if (this.state === 'playing') this.update(dt);
    const ambient = this.state === 'playing' ? this.speed : (this.state === 'paused' ? 0 : this.H * 0.12);
    this.scroll += ambient * dt;
    if (this.state !== 'paused') this.stepFx(dt);
    this.draw();
    this.syncHud(false);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  stepFx(dt) {
    this.flakes.forEach((f) => {
      f.y += f.v * dt; f.s += dt; f.x += Math.sin(f.s) * 12 * dt;
      if (f.y > this.H + 8) Object.assign(f, this.newFlake(false));
    });
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.life -= dt * 1.2; f.y -= 40 * dt;
      if (f.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  // ---------- dibujo ----------
  draw() {
    const ctx = this.ctx; if (!ctx) return;
    const W = this.W, H = this.H, u = this.u, lw = this.laneW;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    // Cielo/terreno nocturno
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#040c24'); g.addColorStop(1, '#0a1a3c');
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    const tw = performance.now() / 1000;
    ctx.fillStyle = '#fff';
    this.stars.forEach((s) => { ctx.globalAlpha = 0.35 + 0.35 * Math.sin(tw * 1.6 + s.p); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Vías
    for (let i = 0; i < 3; i++) {
      const lx = this.laneX(i), active = i === this.targetLane;
      ctx.fillStyle = active ? 'rgba(30, 58, 110, 0.7)' : 'rgba(12, 22, 44, 0.8)';
      ctx.fillRect(lx - lw * 0.36, -20, lw * 0.72, H + 40);
      ctx.strokeStyle = active ? 'rgba(252, 211, 77, 0.45)' : 'rgba(100, 130, 200, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - lw * 0.36, -20, lw * 0.72, H + 40);
      const gap = 26 * u, off = this.scroll % gap;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 3 * u;
      ctx.beginPath();
      for (let y = off - gap; y < H + gap; y += gap) { ctx.moveTo(lx - lw * 0.26, y); ctx.lineTo(lx + lw * 0.26, y); }
      ctx.stroke();
      ctx.strokeStyle = '#DDE6F3';
      ctx.lineWidth = 2.6 * u;
      ctx.beginPath();
      ctx.moveTo(lx - lw * 0.2, -20); ctx.lineTo(lx - lw * 0.2, H + 20);
      ctx.moveTo(lx + lw * 0.2, -20); ctx.lineTo(lx + lw * 0.2, H + 20);
      ctx.stroke();
    }

    // Postes de catenaria con luz
    const pg = 110 * u, po = this.scroll % pg;
    for (let y = po - pg; y < H + pg; y += pg) {
      [lw * 0.07, W - lw * 0.07].forEach((px, k) => {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(k ? px - lw * 0.1 : px + lw * 0.1, y); ctx.stroke();
        const lg = ctx.createRadialGradient(px, y, 0, px, y, 22 * u);
        lg.addColorStop(0, 'rgba(253, 224, 71, 0.55)'); lg.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = lg; ctx.fillRect(px - 22 * u, y - 22 * u, 44 * u, 44 * u);
        ctx.fillStyle = '#FDE68A'; ctx.beginPath(); ctx.arc(px, y, 2.4 * u, 0, 6.283); ctx.fill();
      });
    }

    // Ítems
    const fs = this.itemSize;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.items.forEach((it) => {
      const x = this.laneX(it.lane), y = it.y + Math.sin(tw * 4 + it.ph) * 2;
      if (it.type === 'ice') {
        const s = fs * 0.95;
        const ig = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2);
        ig.addColorStop(0, '#E0F2FE'); ig.addColorStop(0.5, '#7DD3FC'); ig.addColorStop(1, '#0284C7');
        ctx.fillStyle = ig; ctx.strokeStyle = '#E0F2FE'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - s / 2, y - s / 2, s, s, s * 0.22); else ctx.rect(x - s / 2, y - s / 2, s, s);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.fillRect(x - s * 0.32, y - s * 0.32, s * 0.28, s * 0.1);
        ctx.font = `${fs * 0.55}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
        ctx.fillStyle = '#fff'; ctx.fillText('❄', x + s * 0.04, y + s * 0.06);
      } else {
        const col = it.type === 'gift' ? '253, 224, 71' : it.type === 'time' ? '134, 239, 172' : it.type === 'shield' ? '125, 211, 252' : '253, 224, 71';
        const rg = ctx.createRadialGradient(x, y, 0, x, y, fs * 0.95);
        rg.addColorStop(0, `rgba(${col}, 0.55)`); rg.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, fs * 0.95, 0, 6.283); ctx.fill();
        if (it.type !== 'gift') {
          ctx.strokeStyle = `rgba(${col}, 0.9)`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, fs * 0.62, 0, 6.283); ctx.stroke();
        }
        ctx.font = `${fs}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
        ctx.fillStyle = '#fff'; ctx.fillText(it.icon, x, y + 1);
      }
    });

    // Partículas
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;

    this.drawTrain(ctx);

    // Nieve en primer plano
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.flakes.forEach((f) => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); });

    // Textos flotantes
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(16 * u)}px Poppins, sans-serif`;
    this.floatingTexts.forEach((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(2,6,23,.85)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // Líneas de velocidad en turbo
    if (this.turboT > 0) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const x = ((i * 53 + this.scroll * 0.3) % W), y = ((i * 97 + this.scroll * 2.2) % H);
        ctx.moveTo(x, y); ctx.lineTo(x, y + 26 * u);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Destello rojo al chocar
    if (this.flash > 0) { ctx.fillStyle = `rgba(239, 68, 68, ${this.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
  }

  drawTrain(ctx) {
    const x = this.trainX, y = this.trainY, w = this.trainW, h = this.trainH, u = this.u;
    const top = y - h / 2, bot = y + h / 2;

    // Cono de luz
    const bg = ctx.createLinearGradient(x, top, x, top - h * 2.2);
    bg.addColorStop(0, 'rgba(254, 240, 138, 0.6)'); bg.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(x - w * 0.18, top + 4); ctx.lineTo(x - w * 1.05, top - h * 2.2); ctx.lineTo(x + w * 1.05, top - h * 2.2); ctx.lineTo(x + w * 0.18, top + 4); ctx.fill();

    // Turbo: llamarada trasera
    if (this.turboT > 0) {
      const fl = ctx.createLinearGradient(x, bot, x, bot + h * 0.8);
      fl.addColorStop(0, 'rgba(253, 224, 71, 0.9)'); fl.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(x - w * 0.3, bot); ctx.lineTo(x, bot + h * (0.5 + Math.random() * 0.3)); ctx.lineTo(x + w * 0.3, bot); ctx.fill();
    }

    // Carrocería con morro aerodinámico
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bot - w * 0.12);
    ctx.lineTo(x - w / 2, top + h * 0.34);
    ctx.quadraticCurveTo(x - w * 0.42, top + h * 0.06, x, top);
    ctx.quadraticCurveTo(x + w * 0.42, top + h * 0.06, x + w / 2, top + h * 0.34);
    ctx.lineTo(x + w / 2, bot - w * 0.12);
    ctx.quadraticCurveTo(x + w / 2, bot, x + w * 0.35, bot);
    ctx.lineTo(x - w * 0.35, bot);
    ctx.quadraticCurveTo(x - w / 2, bot, x - w / 2, bot - w * 0.12);
    ctx.closePath();
    const body = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    body.addColorStop(0, '#9E1119'); body.addColorStop(0.5, '#E3202C'); body.addColorStop(1, '#9E1119');
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2 * u; ctx.stroke();

    // Franja azul corporativa y parabrisas
    ctx.fillStyle = '#1A4488';
    ctx.fillRect(x - w / 2 + 2, y + h * 0.05, w - 4, h * 0.09);
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.32, top + h * 0.34); ctx.quadraticCurveTo(x, top + h * 0.14, x + w * 0.32, top + h * 0.34);
    ctx.lineTo(x + w * 0.28, top + h * 0.46); ctx.lineTo(x - w * 0.28, top + h * 0.46); ctx.closePath(); ctx.fill();
    // Ventanillas
    ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - w * 0.34, y + h * 0.2 + i * h * 0.1, w * 0.68, h * 0.055);
    // Faros
    ctx.fillStyle = '#FFFBEB'; ctx.shadowColor = '#FEF08A'; ctx.shadowBlur = 10 * u;
    ctx.beginPath(); ctx.arc(x - w * 0.24, top + h * 0.3, 2.2 * u, 0, 6.283); ctx.arc(x + w * 0.24, top + h * 0.3, 2.2 * u, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0;

    // Escudo activo
    if (this.shield) {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)'; ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(125, 211, 252, 0.15)';
      ctx.beginPath(); ctx.ellipse(x, y, w * 0.85, h * 0.68, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    }
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
  const railMap = new RailMapControls(santaRadar);
  initCatenaryHarp();
  const themeMgr = new ThemeManager(snow);
  const driverGame = new SolidaryDriverGame();
  window.driverGame = driverGame;

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

  if (resetBtn) resetBtn.onclick = () => advent.resetAll();

  if (hornBtn) {
    hornBtn.onclick = () => {
      sound.playTrainHorn();
      haptics.horn();
    };
  }
  if (boostBtn) boostBtn.onclick = () => santaRadar.boostSpeed();
});
