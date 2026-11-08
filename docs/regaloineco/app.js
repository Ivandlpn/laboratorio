/**
 * REGALO SOLIDARIO INECO 2027 - CALENDARIO DE ADVIENTO
 * Ruta: Laponia (Círculo Polar) ➔ Sede Central Ineco (Madrid) ➔ Base de Monforte del Cid (Alicante)
 */

// ==========================================
// 1. DATOS OFICIALES DE LOS 9 REGALOS (RELATO CONTINUO SIN APARTADOS)
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
    description: "Obtenido directamente de olivares andaluces bajo Denominación de Origen protegida, este Aceite de Oliva Virgen Extra de 500 ml representa la máxima excelencia del campo andaluz. Su elaboración mediante extracción en frío a partir de aceitunas seleccionadas en su punto óptimo de maduración garantiza una acidez excepcionalmente baja, un perfil aromático de frutado verde con recuerdos a hierba fresca y tomatera, y una riqueza sobresaliente en polifenoles y antioxidantes naturales. Presentado en una distinguida botella individual de vidrio oscuro que lo resguarda de la luz y el oxígeno para preservar intactas todas sus propiedades organolépticas, es el auténtico oro líquido de nuestra gastronomía: sublime tanto para regar en crudo unas rebanadas de pan tostado en los desayunos de invierno como para ensalzar los ibéricos, asados y ensaladas en estas fiestas familiares.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="oilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D97706"/>
          <stop offset="50%" stop-color="#FBBF24"/>
          <stop offset="100%" stop-color="#84CC16"/>
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#047857" stop-opacity="0.95"/>
          <stop offset="35%" stop-color="#10B981" stop-opacity="0.8"/>
          <stop offset="70%" stop-color="#064E3B" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#022C22" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <path d="M92 25 L108 25 L108 45 L118 65 L124 165 Q124 175 114 175 L86 175 Q76 175 76 165 L82 65 L92 45 Z" fill="url(#glassGrad)" stroke="#34D399" stroke-width="1.8"/>
      <path d="M84 75 Q100 80 116 75 L122 165 Q122 173 114 173 L86 173 Q78 173 78 165 Z" fill="url(#oilGrad)" opacity="0.9"/>
      <rect x="80" y="95" width="40" height="50" rx="4" fill="#1A4488" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="112" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="123" font-size="6.5" fill="#D4AF37" text-anchor="middle" font-weight="600">AOVE 500ml</text>
      <text x="100" y="133" font-size="5" fill="#E2E8F0" text-anchor="middle">D.O. Andalucía</text>
      <rect x="91" y="20" width="18" height="12" rx="3" fill="#D4AF37" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="91" y1="26" x2="109" y2="26" stroke="#B45309" stroke-width="1.2"/>
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
    badge: "Cantábrico Seleccionado",
    iconBg: "from-sky-700 to-blue-500",
    realImage: "assets/products/P2.jpg",
    realThumb: "assets/products/P2_thumb.jpg",
    description: "Capturado de forma artesanal a caña uno a uno en aguas del Mar Cantábrico durante la costera estival tradicional, este tarro de cristal hermético de 400 gramos encierra los lomos más nobles, blancos y limpios del atún blanco (Thunnus alalunga). Su carne de tonalidad marfil, textura delicadamente hojaldrada y sabor limpio y marino reposa sumergida en un suave aceite de oliva de primera prensa que redondea su jugosidad sin enmascarar su frescura original. Una conserva artesanal de alta cuna que no precisa artificios: exquisita servida al natural con unas escamas de sal marina, sobre tostas crujientes de pan rústico o acompañada de pimientos asados templados en las celebraciones navideñas.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
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
      <rect x="62" y="65" width="76" height="95" rx="14" fill="#E0F2FE" opacity="0.4" stroke="#93C5FD" stroke-width="2"/>
      <rect x="66" y="75" width="68" height="80" rx="10" fill="url(#tunaGrad)" opacity="0.95"/>
      <path d="M72 90 Q100 85 128 90 M70 110 Q100 105 130 110 M72 130 Q100 125 128 130" stroke="#FFF7ED" stroke-width="2" opacity="0.75" stroke-dasharray="3,2"/>
      <rect x="60" y="98" width="80" height="36" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="112" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="122" font-size="6.5" font-weight="bold" fill="#FBBF24" text-anchor="middle">BONITO DEL NORTE</text>
      <text x="100" y="130" font-size="5" fill="#93C5FD" text-anchor="middle">En Aceite de Oliva • 400g</text>
      <rect x="58" y="52" width="84" height="15" rx="3" fill="url(#jarLid)" stroke="#F59E0B" stroke-width="1.8"/>
      <line x1="60" y1="59" x2="140" y2="59" stroke="#78350F" stroke-width="1.2"/>
      <path d="M92 48 L100 35 L108 48 L104 60 L96 60 Z" fill="#CB1823"/>
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
    description: "Elaborada artesanalmente a fuego muy lento a partir de pimientos del piquillo cuidadosamente seleccionados en su punto dulce de maduración y caramelizados con azúcar de caña puro, esta mermelada gourmet de 120 gramos ofrece un equilibrio magistral entre la dulzura untuosa y las notas sutilmente ahumadas y especiadas características de este pimiento tradicional. Envasada en un tarro de cristal con precinto hermético de calidad, su textura sedosa y brillante la convierte en el maridaje idóneo para acompañar quesos curados de oveja manchegos, rulos de cabra pasados por la plancha, patés de caza y carnes a la brasa, aportando un toque festivo sofisticado y lleno de matices a cualquier mesa de fiesta.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="pepperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EF4444"/>
          <stop offset="40%" stop-color="#DC2626"/>
          <stop offset="100%" stop-color="#991B1B"/>
        </linearGradient>
      </defs>
      <rect x="68" y="80" width="64" height="75" rx="12" fill="#FEE2E2" opacity="0.35" stroke="#FCA5A5" stroke-width="2"/>
      <rect x="72" y="88" width="56" height="62" rx="8" fill="url(#pepperGrad)"/>
      <path d="M60 70 Q100 62 140 70 L136 78 Q100 84 64 78 Z" fill="#FEF3C7" stroke="#D97706" stroke-width="1.8"/>
      <line x1="62" y1="76" x2="138" y2="76" stroke="#92400E" stroke-width="2"/>
      <circle cx="100" cy="76" r="3.5" fill="#78350F"/>
      <circle cx="100" cy="118" r="22" fill="#FFFBEB" stroke="#CB1823" stroke-width="1.8"/>
      <text x="100" y="112" font-size="7" font-weight="bold" fill="#1A4488" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="120" font-size="5" font-weight="bold" fill="#DC2626" text-anchor="middle">PIQUILLO</text>
      <text x="100" y="127" font-size="4.5" fill="#4B5563" text-anchor="middle">Mermelada 120g</text>
      <path d="M135 130 Q145 145 135 160 Q125 155 130 140 Z" fill="#DC2626"/>
      <path d="M135 130 L138 124" stroke="#15803D" stroke-width="2"/>
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
    description: "Auténtica trilogía del sabor insular presentada en un exclusivo pack expositor con tres tarros de cristal de 100 gramos que rinden homenaje a la rica tradición culinaria de las Islas Canarias. El conjunto reúne el Mojo Rojo clásico elaborado con pimiento y pimentón dulce para un paladar suave y meloso, el fresco y aromático Mojo Verde a base de cilantro fresco y ajo ideal para acompañar pescados y mariscos, y el vibrante Mojo Picón para quienes buscan ese toque bravo y enérgico que despierta los sentidos. Preparados únicamente con ingredientes naturales de primera calidad y aceite vegetal refinado, son el alma indispensable para dar vida a unas tradicionales papas arrugadas o enriquecer las carnes asadas de los encuentros navideños.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="25" y="130" width="150" height="28" rx="6" fill="#1E293B" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="148" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">PACK MOJO CANARIO • INECO</text>
      <rect x="36" y="80" width="36" height="52" rx="6" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
      <rect x="34" y="74" width="40" height="9" rx="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>
      <text x="54" y="105" font-size="5.5" font-weight="bold" fill="#FEF2F2" text-anchor="middle">MOJO</text>
      <text x="54" y="113" font-size="5.5" font-weight="bold" fill="#FEF2F2" text-anchor="middle">ROJO</text>
      <rect x="82" y="80" width="36" height="52" rx="6" fill="#16A34A" stroke="#14532D" stroke-width="1.5"/>
      <rect x="80" y="74" width="40" height="9" rx="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>
      <text x="100" y="105" font-size="5.5" font-weight="bold" fill="#F0FDF4" text-anchor="middle">MOJO</text>
      <text x="100" y="113" font-size="5.5" font-weight="bold" fill="#F0FDF4" text-anchor="middle">VERDE</text>
      <rect x="128" y="80" width="36" height="52" rx="6" fill="#EA580C" stroke="#9A3412" stroke-width="1.5"/>
      <rect x="126" y="74" width="40" height="9" rx="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>
      <text x="146" y="105" font-size="5.5" font-weight="bold" fill="#FFF7ED" text-anchor="middle">MOJO</text>
      <text x="146" y="113" font-size="5.5" font-weight="bold" fill="#FFF7ED" text-anchor="middle">PICÓN</text>
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
    description: "Una selecta colección de tres tabletas artesanales de 150 gramos cada una —Chocolate Negro de gran pureza e intensidad aromática, Chocolate con Leche de cuerpo cremoso y sedoso, y Chocolate Blanco delicadamente perfumado con manteca de cacao natural—, repletas de almendras enteras seleccionadas de la cuenca mediterránea tostadas a fuego lento hasta alcanzar un crujido inconfundible. Cortadas a cuchillo y elaboradas por maestros chocolateros siguiendo la receta tradicional, se presentan en un distinguido estuche de madera natural con tapa corredera grabado conmemorativamente, convirtiéndose en el postre gourmet imprescindible para compartir en la sobremesa junto a un buen café recién molido o una copa de licor dulce.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="42" y="55" width="116" height="105" rx="6" fill="#78350F" stroke="#92400E" stroke-width="3"/>
      <line x1="45" y1="75" x2="155" y2="75" stroke="#92400E" stroke-width="1.5" stroke-dasharray="25,5"/>
      <line x1="45" y1="105" x2="155" y2="105" stroke="#92400E" stroke-width="1.5" stroke-dasharray="15,10"/>
      <line x1="45" y1="135" x2="155" y2="135" stroke="#92400E" stroke-width="1.5" stroke-dasharray="20,8"/>
      <rect x="52" y="65" width="28" height="75" rx="3" fill="#3B1C0B" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="66" cy="85" r="3" fill="#FCD34D"/>
      <circle cx="66" cy="115" r="3" fill="#FCD34D"/>
      <rect x="86" y="65" width="28" height="75" rx="3" fill="#713F12" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="100" cy="85" r="3" fill="#FCD34D"/>
      <circle cx="100" cy="115" r="3" fill="#FCD34D"/>
      <rect x="120" y="65" width="28" height="75" rx="3" fill="#FEF3C7" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="134" cy="85" r="3" fill="#D97706"/>
      <circle cx="134" cy="115" r="3" fill="#D97706"/>
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
    description: "Selección exclusiva de granos 100% Arábica cosechados en cafetales de altura y sometidos a un proceso de tueste natural pausado que realza su cuerpo sedoso, sus elegantes notas florales y una acidez limpia y vivaz. Con un peso de 250 gramos y una molienda equilibrada apta para cafetera italiana tradicional o de goteo, se presenta en una bolsa termosellada con válvula de desgasificación unidireccional que aísla el grano del aire y la humedad exterior, garantizando que cada taza conserve intactos sus aceites aromáticos esenciales para inundar el hogar del inconfundible aroma a café tostado en las mañanas más entrañables del invierno.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <path d="M68 50 L132 50 L126 155 Q126 165 116 165 L84 165 Q74 165 74 155 Z" fill="#78350F" stroke="#92400E" stroke-width="2"/>
      <polygon points="68,50 132,50 128,38 72,38" fill="#5A240A" stroke="#B45309" stroke-width="1.5"/>
      <line x1="72" y1="44" x2="128" y2="44" stroke="#D4AF37" stroke-width="1" stroke-dasharray="3,2"/>
      <circle cx="100" cy="72" r="5" fill="#451A03" stroke="#D4AF37" stroke-width="1"/>
      <circle cx="100" cy="72" r="2" fill="#1E293B"/>
      <rect x="74" y="90" width="52" height="50" rx="4" fill="#0D2246" stroke="#D4AF37" stroke-width="1.8"/>
      <text x="100" y="105" font-size="8" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <text x="100" y="117" font-size="6" font-weight="bold" fill="#FBBF24" text-anchor="middle">CAFÉ ARÁBICA</text>
      <text x="100" y="126" font-size="4.5" fill="#E2E8F0" text-anchor="middle">100% Natural • 250g</text>
      <ellipse cx="140" cy="145" rx="6" ry="8" fill="#451A03" transform="rotate(25 140 145)"/>
      <ellipse cx="60" cy="150" rx="6" ry="8" fill="#451A03" transform="rotate(-30 60 150)"/>
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
    description: "Edición conmemorativa de coleccionista de la clásica baraja española de 40 cartas (61,5 x 95 mm), fabricada sobre naipe estucado de 310 g/m² de fibra larga y recubierta con un barniz acuoso protector de alta densidad que le otorga un deslizamiento sedoso y una resistencia incomparable frente al uso continuado. Cada naipe luce un reverso ilustrado en exclusiva con los colores corporativos y la iconografía del ferrocarril de alta velocidad de Ineco, protegido dentro de su estuche policromado con envoltura de celofán antihumedad, pensado para avivar las tertulias, risas y tradicionales partidas familiares de naipes tras las cenas de fiesta con la mirada ilusionada puesta en el 2027.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <g transform="translate(60, 65) rotate(-15)">
        <rect x="0" y="0" width="48" height="74" rx="4" fill="#1A4488" stroke="#D4AF37" stroke-width="1.8"/>
        <rect x="4" y="4" width="40" height="66" rx="2" fill="#0D2246" stroke="#6B96CF" stroke-width="0.75"/>
        <circle cx="24" cy="37" r="10" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
        <text x="24" y="40" font-size="6.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle">ineco</text>
      </g>
      <g transform="translate(95, 65) rotate(15)">
        <rect x="0" y="0" width="48" height="74" rx="4" fill="#CB1823" stroke="#D4AF37" stroke-width="1.8"/>
        <rect x="4" y="4" width="40" height="66" rx="2" fill="#991B1B" stroke="#FCA5A5" stroke-width="0.75"/>
        <text x="24" y="40" font-size="7.5" font-weight="bold" fill="#FEF3C7" text-anchor="middle">2027</text>
      </g>
      <g transform="translate(76, 55)">
        <rect x="0" y="0" width="48" height="74" rx="4" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.8"/>
        <circle cx="24" cy="37" r="14" fill="#FCD34D" stroke="#D97706" stroke-width="1.5"/>
        <text x="24" y="40" font-size="7.5" font-weight="bold" fill="#78350F" text-anchor="middle">AVE</text>
        <text x="8" y="14" font-size="7.5" font-weight="bold" fill="#D97706">1</text>
        <text x="40" y="68" font-size="7.5" font-weight="bold" fill="#D97706">1</text>
      </g>
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
    realImage: null,
    realThumb: null,
    description: "Concebidos para brindar el máximo confort térmico y ergonomía durante la temporada invernal, estos calcetines corporativos de alta velocidad han sido confeccionados con más de un 80% de algodón peinado transpirable de fibra larga y elastano de memoria para un ajuste ceñido que no resbala ni oprime la pierna. Destacan por su remallado plano artesanal punto a punto sin relieves en la puntera para eliminar cualquier punto de fricción o rozadura, reforzando además la suela y el talón con acolchado amortiguador. Un detalle cálido y confortable con el sello de Ineco, pensado para relajarse en casa o disfrutar de los días festivos con la calidez del espíritu de equipo.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <path d="M72 45 L98 45 L98 105 Q98 135 125 135 L135 135 Q145 135 145 148 Q145 160 130 160 L90 160 Q68 160 68 135 L68 48 Q68 45 72 45 Z" fill="#1A4488" stroke="#3463AC" stroke-width="2.2"/>
      <rect x="68" y="42" width="30" height="12" rx="2" fill="#CB1823" stroke="#D4AF37" stroke-width="1.2"/>
      <line x1="68" y1="48" x2="98" y2="48" stroke="#FFFFFF" stroke-width="1"/>
      <path d="M128 135 L135 135 Q145 135 145 148 Q145 160 130 160 L125 160 Z" fill="#CB1823"/>
      <path d="M68 130 Q68 160 90 160 L90 148 Q78 148 78 130 Z" fill="#CB1823"/>
      <line x1="72" y1="75" x2="94" y2="75" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2"/>
      <line x1="72" y1="85" x2="94" y2="85" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2"/>
      <text x="83" y="100" font-size="6.5" font-weight="bold" fill="#FCD34D" text-anchor="middle">ineco</text>
      <circle cx="83" cy="65" r="1.5" fill="#FFFFFF"/>
      <circle cx="75" cy="115" r="1.5" fill="#FFFFFF"/>
    </svg>`
  },
  {
    day: 9,
    title: "Tarjeta Navideña Solidaria Ineco",
    subtitle: "Formato A4 Doble Cara • Papel Offset Blanco 80g FSC",
    badge: "Compromiso Social",
    iconBg: "from-red-800 to-amber-700",
    realImage: null,
    realThumb: null,
    description: "Impresa a doble cara en formato A4 plegado sobre papel offset blanco premium de 80 g/m² de tacto natural y fibra reciclada con certificación ecológica FSC, esta tarjeta conmemorativa transmite el mensaje institucional de felicitación y gratitud de Ineco hacia todos los profesionales de la Base de Mantenimiento de Monforte del Cid. En su interior se plasma no solo el reconocimiento a su compromiso diario con la seguridad y la alta velocidad ferroviaria, sino también el balance social y solidario de los proyectos y colectivos apoyados con la entrega de este detalle, constituyendo un recuerdo entrañable y un testimonio de unión para dar la bienvenida con ilusión al nuevo año 2027.",
    svg: `<svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-2xl">
      <rect x="45" y="45" width="110" height="120" rx="5" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2.2"/>
      <line x1="100" y1="45" x2="100" y2="165" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3,3"/>
      <rect x="100" y="45" width="55" height="120" rx="0" fill="#1A4488" opacity="0.95"/>
      <text x="127" y="70" font-size="8.5" font-weight="bold" fill="#F8FAFC" text-anchor="middle" font-family="Poppins">ineco</text>
      <circle cx="127" cy="95" r="16" fill="none" stroke="#D4AF37" stroke-width="1.8"/>
      <polygon points="127,84 130,91 137,92 132,97 133,104 127,100 121,104 122,97 117,92 124,91" fill="#FCD34D"/>
      <text x="127" y="125" font-size="5.5" font-weight="bold" fill="#FEF3C7" text-anchor="middle">FELIZ 2027</text>
      <text x="127" y="135" font-size="4" fill="#93C5FD" text-anchor="middle">Detalle Solidario</text>
      <line x1="52" y1="65" x2="92" y2="65" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="52" y1="75" x2="92" y2="75" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="52" y1="85" x2="85" y2="85" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="52" y1="100" x2="92" y2="100" stroke="#CB1823" stroke-width="1.2"/>
      <text x="72" y="125" font-size="5.5" font-weight="bold" fill="#0D2246" text-anchor="middle">Compromiso</text>
      <text x="72" y="135" font-size="4.2" fill="#64748B" text-anchor="middle">Solidario Ineco</text>
    </svg>`
  }
];


// ==========================================
// 2. COMPAÑEROS DE LA OFICINA (ORDEN ALFABÉTICO ESTRICTO • DESEOS 2027)
// ==========================================
const COLLEAGUES = [
  {
    "name": "Ana",
    "role": "Ingeniería & Coordinación de Operaciones",
    "wish": "¡Que el 2027 traiga trazados despejados, máxima precisión en cada proyecto y momentos entrañables junto a los tuyos!",
    "ticketSeat": "Coche 01 • Asiento 01A (Club)",
    "loc": "LOC-ANA-2027-MDC"
  },
  {
    "name": "Edu",
    "role": "Especialista en Mantenimiento de Infraestructura",
    "wish": "¡Fuerza, salud y que la catenaria de la vida siga transmitiendo la mejor energía en este 2027 en cada guardia y jornada compartida!",
    "ticketSeat": "Coche 01 • Asiento 02B (Club)",
    "loc": "LOC-EDU-2027-MDC"
  },
  {
    "name": "Ernesto",
    "role": "Supervisión Técnica de Vía y Desvíos",
    "wish": "¡Que la aguja de tu destino apunte siempre a la felicidad y que en 2027 celebremos muchos éxitos en equipo!",
    "ticketSeat": "Coche 02 • Asiento 03A (Preferente)",
    "loc": "LOC-ERN-2027-MDC"
  },
  {
    "name": "Gloria",
    "role": "Gestión de Calidad & Seguridad Ferroviaria",
    "wish": "¡Brindamos por tu dedicación impecable! Que el 2027 llene tu hogar de paz, sonrisas y momentos dorados.",
    "ticketSeat": "Coche 02 • Asiento 04B (Preferente)",
    "loc": "LOC-GLO-2027-MDC"
  },
  {
    "name": "Irene",
    "role": "Planificación & Control de Gestión",
    "wish": "¡Que el cronograma de este 2027 venga repleto de alegrías cumplidas, tranquilidad y proyectos ilusionantes!",
    "ticketSeat": "Coche 03 • Asiento 05A (Turista Plus)",
    "loc": "LOC-IRE-2027-MDC"
  },
  {
    "name": "Iván Álvarez",
    "role": "Especialista de Sistemas y Auscultación",
    "wish": "¡Velocidad de crucero a 300 km/h para tus metas y la mejor sintonía en cada reto del nuevo año 2027!",
    "ticketSeat": "Coche 03 • Asiento 06B (Turista Plus)",
    "loc": "LOC-IVA-2027-MDC"
  },
  {
    "name": "Iván de la Paz",
    "role": "Responsable de Equipos & Innovación Tecnológica",
    "wish": "¡Gracias por liderar con entusiasmo y visión de futuro! Que el 2027 te devuelva multiplicado todo tu esfuerzo y compañerismo.",
    "ticketSeat": "Coche 01 • Asiento 01B (Cabina de Mando)",
    "loc": "LOC-IDP-2027-MDC"
  },
  {
    "name": "Jose Luis",
    "role": "Operaciones de Mantenimiento de Alta Velocidad",
    "wish": "¡Que en 2027 no falte nunca el buen humor, la salud de hierro y el calor de los tuyos en estas fechas tan señaladas!",
    "ticketSeat": "Coche 04 • Asiento 07A (Turista)",
    "loc": "LOC-JOS-2027-MDC"
  },
  {
    "name": "Manuel",
    "role": "Especialista en Instalaciones y Telecomunicaciones",
    "wish": "¡Conexión permanente con la felicidad y señal verde en todos los caminos que emprendas en 2027!",
    "ticketSeat": "Coche 04 • Asiento 08B (Turista)",
    "loc": "LOC-MAN-2027-MDC"
  },
  {
    "name": "Pascual",
    "role": "Coordinación de Seguridad y Salud en Obra",
    "wish": "¡Protección máxima y la mayor de las alegrías para ti y tu familia en esta Navidad y con la vista puesta en 2027!",
    "ticketSeat": "Coche 05 • Asiento 09A (Turista)",
    "loc": "LOC-PAS-2027-MDC"
  },
  {
    "name": "Pepe",
    "role": "Técnico Especialista de Mantenimiento Integral",
    "wish": "¡Maestría, experiencia y compañerismo puro. Que disfrutes de esta merecidísima cesta solidaria para dar la bienvenida al 2027 con los que más quieres!",
    "ticketSeat": "Coche 05 • Asiento 10B (Turista)",
    "loc": "LOC-PEP-2027-MDC"
  },
  {
    "name": "Raúl",
    "role": "Gestión de Activos y Logística Ferroviaria",
    "wish": "¡Distribución perfecta de salud, amor y prosperidad para el nuevo año 2027. ¡A disfrutar del detalle solidario!",
    "ticketSeat": "Coche 06 • Asiento 11A (Turista)",
    "loc": "LOC-RAU-2027-MDC"
  }
];


// ==========================================
// 3. MOTOR DE AUDIO (Desactivado por defecto)
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
    gain.gain.setValueAtTime(0.35, now);
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

  playGameCollect() {
    this.playNote(880, 0.15);
    setTimeout(() => this.playNote(1174.66, 0.25), 90);
  }

  playBellChime() {
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

    gain.gain.setValueAtTime(0.35, t);
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
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(3600, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

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
      gain.gain.linearRampToValueAtTime(0.22, t + 0.1);
      gain.gain.setValueAtTime(0.22, t + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.25);
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

      gain.gain.setValueAtTime(0.28, t);
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
// 3.1. MOTOR HÁPTICO MULTI-SENSORIAL (MEJORA 9)
// Patrones de rodadura sobre vías, crujido de escarcha y silbato
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
  const targetDate = new Date("2026-12-14T09:00:00+01:00").getTime();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById('cd-days').innerText = "00";
      document.getElementById('cd-hours').innerText = "00";
      document.getElementById('cd-mins').innerText = "00";
      document.getElementById('cd-secs').innerText = "00";
      document.getElementById('cd-status-text').innerText = "¡Los detalles solidarios han llegado a la Base de Monforte del Cid!";
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
// 6. RADAR FERROVIARIO DE PAPÁ NOEL (RUTA CONTINENTAL & LOCAL)
// Laponia (66°N) ➔ Corredor Europeo ➔ Sede Ineco (Madrid) ➔ Base Monforte del Cid
// ==========================================
class SantaRailTracker {
  constructor() {
    this.trainMarker = document.getElementById('train-marker');
    this.speedDisplay = document.getElementById('radar-speed');
    this.statusDisplay = document.getElementById('radar-status');
    this.distDisplay = document.getElementById('radar-distance');
    this.coordsDisplay = document.getElementById('radar-coords');
    this.etaDisplay = document.getElementById('radar-eta');
    this.slider = document.getElementById('radar-progress-slider');
    this.progressPct = 5; // Salida actual (quedan 35 días)
    
    // Puntos de la ruta en coordenadas SVG (Laponia a Monforte)
    this.waypoints = [
      { pct: 0, x: 440, y: 45, name: "Laponia (Círculo Polar 66°N)", coords: "66.5039°N, 25.7294°E", days: "36 días", dist: "3.850 km", speed: "180 km/h", eta: "8 Noviembre", status: "Taller Ártico de Papá Noel. Embarque de los lotes solidarios." },
      { pct: 5, x: 425, y: 58, name: "Laponia - Golfo de Botnia", coords: "65.1200°N, 22.8400°E", days: "35 días", dist: "3.690 km", speed: "180 km/h", eta: "8 Noviembre (Hoy)", status: "8 Noviembre: En travesía polar desde Laponia. Velocidad de crucero ártica." },
      { pct: 28, x: 370, y: 100, name: "Mar Báltico & Escandinavia Central", coords: "58.5900°N, 16.1800°E", days: "27 días", dist: "2.800 km", speed: "220 km/h", eta: "16 Noviembre", status: "Enlace ferroviario internacional por el corredor nórdico." },
      { pct: 50, x: 280, y: 160, name: "Corredor Europeo (Francia / Pirineos)", coords: "48.8566°N, 2.3522°E", days: "20 días", dist: "1.950 km", speed: "260 km/h", eta: "23 Noviembre", status: "Tránsito por el corredor de alta velocidad europeo hacia la Península Ibérica." },
      { pct: 75, x: 180, y: 245, name: "Sede Central Ineco (Madrid)", coords: "40.4532°N, -3.6883°W", days: "13 días", dist: "420 km", speed: "160 km/h", eta: "1 de Diciembre", status: "Escala técnica y felicitación institucional en Paseo de la Habana 138 (Madrid)." },
      { pct: 88, x: 235, y: 285, name: "L.A.V. Madrid - Levante (Cuenca / Albacete)", coords: "39.4699°N, -1.6500°W", days: "5 días", dist: "180 km", speed: "300 km/h", eta: "9 de Diciembre", status: "Velocidad punta de alta velocidad en vía balastada y control ERTMS." },
      { pct: 100, x: 285, y: 325, name: "Base de Mantenimiento de Monforte del Cid", coords: "38.406742°N, -0.694939°W", days: "0 días (Llegada)", dist: "0 km", speed: "0 km/h", eta: "14 de Diciembre", status: "¡Llegada y entrega oficial del Regalo Solidario en Monforte del Cid!" }
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

    // Interpolar coordenadas (x, y) entre los waypoints
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

    if (this.trainMarker) {
      this.trainMarker.setAttribute('transform', `translate(${currentX.toFixed(1)}, ${currentY.toFixed(1)})`);
    }

    // Calcular valores dinámicos
    const currentWp = factor < 0.5 ? p0 : p1;
    if (this.statusDisplay) this.statusDisplay.innerText = currentWp.status;
    if (this.distDisplay) this.distDisplay.innerText = currentWp.days;
    if (this.speedDisplay) this.speedDisplay.innerText = currentWp.speed;
    if (this.coordsDisplay) this.coordsDisplay.innerText = currentWp.coords;
    if (this.etaDisplay) this.etaDisplay.innerText = currentWp.eta;

    // Actualizar aguja del tacómetro / velocímetro analógico ferroviario (MEJORA 8)
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

      // Mapear 0 - 400 km/h a un arco de -90deg a +90deg
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
    sound.playBellChime();
  }

  animateTo(targetPct) {
    const startPct = this.progressPct;
    const diff = targetPct - startPct;
    const duration = 600;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
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
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    if (this.speedDisplay) this.speedDisplay.innerText = "350 km/h (Modo Trineo AVE)";
    setTimeout(() => {
      this.setProgress(this.progressPct);
    }, 3500);
  }
}

// ==========================================
// 7. GESTOR DEL CALENDARIO DE ADVIENTO
// (SIN SPOILERS EN LA CARA FRONTAL Y RELATO CONTINUO EN MODAL)
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
          <!-- CARA FRONTAL: BILLETE SOLIDARIO DE ALTA VELOCIDAD (LUJO, MISTERIO Y SIN SPOILER) -->
          <div class="advent-front p-4 sm:p-5 flex flex-col justify-between select-none foil-sheen relative overflow-hidden">
            <!-- Trama de Seguridad Ferroviaria Guilloche -->
            <div class="ticket-guilloche-bg"></div>

            <!-- Muescas Semicirculares de Billete Troquelado -->
            <div class="ticket-notch notch-left"></div>
            <div class="ticket-notch notch-right"></div>

            <!-- Cintas Festivas Cruzadas con Pespunte Dorado -->
            <div class="gift-ribbon-horizontal">
              <div class="ribbon-stitch-line"></div>
            </div>
            <div class="gift-ribbon-vertical">
              <div class="ribbon-stitch-line-vert"></div>
            </div>

            <!-- Sello Central: Moneda de Oro Relieve y Lacra 2026 -->
            <div class="gift-seal-badge w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center red-pulse">
              <div class="seal-inner-coin flex flex-col items-center justify-center w-full h-full rounded-full">
                <span class="text-[8px] font-black uppercase tracking-widest text-amber-950 flex items-center gap-1">
                  <span>★</span><span>DÍA</span><span>★</span>
                </span>
                <span class="text-2xl sm:text-3xl font-black text-slate-950 font-poppins leading-none my-0.5">${gift.day}</span>
                <span class="text-[8px] font-black tracking-widest text-slate-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-600/30">2026</span>
              </div>
            </div>

            <!-- Cabecera Superior del Billete -->
            <div class="flex justify-between items-center z-10 w-full">
              <span class="ticket-tag-ave inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9.5px] font-black tracking-wider uppercase shadow-md">
                <span class="text-xs">🚄</span> <span>BILLETE AVE</span>
              </span>
              <span class="ticket-tag-action inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold text-amber-200 shadow-md">
                <span>🎁</span> <span class="hidden xs:inline">Toca o Rasca</span>
              </span>
            </div>

            <!-- Banda de Serial y Microperforación Ferroviaria -->
            <div class="z-10 w-full my-auto pointer-events-none flex items-center justify-between text-[8px] font-mono text-blue-200/75 px-1">
              <span class="font-bold">№ 2026-AV-0${gift.day}</span>
              <span class="tracking-widest hidden sm:inline">• • • • • • • • • • • •</span>
              <span class="text-amber-300 font-bold">LAV LEVANTE</span>
            </div>

            <!-- Pie de Puerta: Enigma Total Sin Ningún Spoiler de Producto -->
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

          <!-- CARA TRASERA<!-- CARA TRASERA (Abierta / Producto Revelado) -->
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
              <button class="mt-2.5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 active:scale-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition">
                <span>Leer Detalle Completo</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      const card = col.querySelector('.advent-card');
      card.addEventListener('click', () => {
        this.handleCardClick(gift.day);
      });

      // Efecto rascar la escarcha en casillas aún no abiertas (MEJORA 2)
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
      card.classList.add('opened');
      this.openedDays.add(day);
      localStorage.setItem('ineco_advent_2026', JSON.stringify([...this.openedDays]));
      this.updateProgress();
      this.triggerConfettiAt(card);

      // Apertura instantánea sin esperas innecesarias
      this.openGiftModal(day);
      setTimeout(() => sound.playBellChime(), 120);
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

  // ==========================================
  // APERTURA MODAL: RELATO CONTINUO SIN APARTADOS NI PESTAÑAS
  // ==========================================
  openGiftModal(day) {
    this.currentModalDay = day;
    const gift = GIFTS_DATA.find(g => g.day === day);
    if (!gift) return;

    const modal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('gift-modal-body');

    modalContent.innerHTML = `
      <div class="relative">
        <!-- Encabezado del Modal con Mayor Jerarquía -->
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

        <!-- CUERPO PRINCIPAL AL 85% DE ANCHO: ILUSTRACIÓN REAL PROTAGONISTA + RELATO EDITORIAL -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-stretch">
          
          <!-- COLUMNA IZQUIERDA (5 COLS): FOTOGRAFÍA REAL DE ALTA DEFINICIÓN -->
          <div class="lg:col-span-5 flex flex-col justify-center">
            <div class="relative rounded-2xl overflow-hidden border-2 border-amber-400/70 shadow-2xl bg-slate-950 group h-full min-h-[300px] flex items-center justify-center">
              ${gift.realImage ? `
                <img src="${gift.realImage}" alt="${gift.title}" class="w-full h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] object-cover transform group-hover:scale-103 transition-transform duration-700" onerror="this.parentElement.innerHTML = '${gift.svg.replace(chr(10), ' ').replace(chr(39), '\'')}';">
              ` : `
                <div class="w-full h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] flex items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-blue-950">
                  ${gift.svg}
                </div>
              `}
              
              <!-- Insignia Superior sobre la Foto -->
              <div class="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/60 text-xs font-black text-amber-300 shadow flex items-center gap-1.5">
                <span>📸</span> <span>Fotografía Oficial del Lote</span>
              </div>
              
              <!-- Pie sobre la Foto con Identidad Ineco -->
              <div class="absolute bottom-3 inset-x-3 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-3 rounded-xl flex items-center justify-between text-xs text-white">
                <span class="font-bold text-amber-300 text-[11px] truncate mr-2">Base Monforte del Cid</span>
                <span class="text-[10px] bg-red-600 text-white px-2.5 py-0.5 rounded-full font-black tracking-wider shrink-0 shadow">INECO 2027</span>
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA (7 COLS): NARRATIVA EDITORIAL CONTINUA -->
          <div class="lg:col-span-7 flex flex-col justify-between">
            <div class="bg-gradient-to-br from-slate-900/95 via-blue-950/70 to-slate-900/95 rounded-2xl p-6 sm:p-8 border border-amber-400/30 shadow-2xl relative flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 mb-3.5">
                  <span class="text-xl">✨</span>
                  <h4 class="text-xs sm:text-sm uppercase font-extrabold tracking-wider text-amber-300">
                    Historia, Calidad y Nota de Degustación
                  </h4>
                </div>
                
                <p class="text-sm sm:text-base text-slate-100 leading-relaxed font-normal text-justify">
                  ${gift.description}
                </p>
              </div>

              <!-- Sellos de Calidad y Compromiso al Pie de la Narrativa -->
              <div class="mt-6 pt-4 border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1 rounded-lg bg-blue-900/70 text-blue-200 border border-blue-400/30 font-bold text-[11px] flex items-center gap-1">
                    <span>📦</span> Lote Solidario
                  </span>
                  <span class="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1">
                    <span>⭐</span> Calidad Gourmet
                  </span>
                </div>
                <span class="font-mono text-slate-300 text-xs font-semibold">L.A.V. Madrid - Levante</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Barra Inferior de Navegación del Modal -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/80">
          <div class="flex items-center gap-2">
            <button id="modal-prev-gift" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition ${day === 1 ? 'opacity-40 pointer-events-none' : ''}">
              ◀ Día Anterior
            </button>
            <button id="modal-next-gift" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition ${day === 9 ? 'opacity-40 pointer-events-none' : ''}">
              Día Siguiente ▶
            </button>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="modal-sound-btn" class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 border border-slate-700">
              <span>🔔 Campanada</span>
            </button>
            <button id="modal-confirm-btn" class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-red-600 hover:from-blue-600 hover:to-red-500 text-white text-xs font-black shadow-md transition active:scale-95">
              Listo
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
    const soundBtn = document.getElementById('modal-sound-btn');
    const prevBtn = document.getElementById('modal-prev-gift');
    const nextBtn = document.getElementById('modal-next-gift');

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (confirmBtn) confirmBtn.onclick = closeModal;
    if (soundBtn) soundBtn.onclick = () => sound.playBellChime();

    if (prevBtn) prevBtn.onclick = () => this.openGiftModal(day - 1);
    if (nextBtn) nextBtn.onclick = () => this.openGiftModal(day + 1);

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
// ORDEN ALFABÉTICO ESTRICTO Y DESEOS 2027
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
      btn.className = `px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none ${
        idx === 0 
          ? 'bg-blue-800/95 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40' 
          : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700/70'
      }`;
      btn.setAttribute('data-name', c.name);

      const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2);
      btn.innerHTML = `
        <div class="flex items-center gap-2 w-full overflow-hidden">
          <span class="w-7 h-7 rounded-lg bg-blue-950 text-amber-300 font-black flex items-center justify-center text-[11px] border border-blue-400/40 shrink-0 shadow-inner">
            ${initials}
          </span>
          <div class="truncate">
            <span class="font-bold text-xs block truncate">${c.name}</span>
            <span class="text-[9px] text-slate-400 font-mono block">#${String(idx + 1).padStart(2, '0')}</span>
          </div>
        </div>
      `;

      btn.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(35);
        sound.playBellChime();
        this.select(c);

        this.container.querySelectorAll('button').forEach(b => {
          b.className = 'px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700/70';
        });
        btn.className = 'px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-2 border select-none bg-blue-800/95 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40';
      });

      this.container.appendChild(btn);
    });
  }

  select(colleague) {
    this.selectedColleague = colleague;
    if (!this.detailsCard) return;

    this.detailsCard.innerHTML = `
      <div class="space-y-6">
        <!-- BILLETE DE ALTA VELOCIDAD PREMIUM 2027 -->
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
                LAV MADRID - ALICANTE
              </span>
              <p class="text-[11px] font-mono text-slate-800 font-bold mt-1">${colleague.ticketSeat}</p>
            </div>
          </div>

          <!-- Datos de Ruta y Base de Monforte -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 text-xs pl-3">
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold">ORIGEN:</span>
              <p class="font-bold text-slate-900">Sede Ineco Central</p>
              <p class="text-[10px] text-slate-500">Pº Habana 138, Madrid</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold">DESTINO PRIORITARIO:</span>
              <p class="font-bold text-red-600">Base Monforte del Cid</p>
              <p class="text-[10px] text-slate-600 font-mono font-bold">38.40674°N, -0.69494°W</p>
              <a href="https://www.google.com/maps?q=38.406741739956495,-0.6949394856139979" target="_blank" rel="noopener" class="inline-block text-[10px] text-blue-700 hover:text-blue-900 underline font-bold mt-0.5">📍 Ver Ubicación en Maps ↗</a>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold">FECHA ENTREGA:</span>
              <p class="font-bold text-slate-900">14 Diciembre 2026</p>
              <p class="text-[10px] text-slate-500">09:00 - 15:00 horas</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold">LOCALIZADOR:</span>
              <p class="font-bold text-blue-900 font-mono">${colleague.loc}</p>
              <p class="text-[10px] text-emerald-700 font-semibold">Cesta Solidaria Completa</p>
            </div>
          </div>

          <!-- Mensaje Personalizado Navideño para 2027 -->
          <div class="bg-blue-50/90 rounded-xl p-4 border border-blue-200 text-xs text-slate-800 leading-relaxed my-2 ml-3">
            <span class="font-bold text-blue-900">Deseo para el próximo 2027 • ${colleague.name} (${colleague.role}):</span>
            <p class="italic mt-1 text-sm font-medium">"${colleague.wish}"</p>
          </div>

          <!-- Código de Barras / QR Simulado -->
          <div class="flex items-center justify-between pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-mono pl-3">
            <span>RESGUARDO OFICIAL 2026</span>
            <span class="tracking-widest">|||||| | |||||||| ||| ||||||| | ||</span>
            <span>BASE MONFORTE DEL CID</span>
          </div>
        </div>

        <!-- MUESTRA DE LA CESTA DE NAVIDAD REALISTA -->
        <div class="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-blue-500/30 text-center relative overflow-hidden shadow-2xl">
          <div class="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <span class="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold mb-3">
            🎁 Presentación Real del Empaquetado
          </span>
          <h4 class="text-xl md:text-3xl font-black text-white font-poppins">
            La Gran Cesta de Navidad de ${colleague.name}
          </h4>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-1 mb-6">
            Caja de cartón reciclado sostenible serigrafiada con motivos de Ineco, acondicionada con separadores troquelados a medida para proteger cada frasco y producto en su viaje a Monforte.
          </p>

          <!-- CONTENEDOR DESPIECE 3D (MEJORA 6) -->
          <div id="exploded-view-container" class="hidden mb-6 relative">
            <div class="exploded-container py-8">
              <!-- Cesta Núcleo Central -->
              <div class="relative z-10 text-center">
                <img src="assets/cesta_solidaria_real.jpg" alt="Cesta Núcleo" class="exploded-basket-core mx-auto">
                <span class="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-900/90 text-amber-300 text-[10px] font-bold border border-amber-400/50">
                  📦 Lote Central Solidario
                </span>
              </div>

              <!-- 9 Burbujas Flotantes con Fotografías Reales de Productos -->
              <div class="exploded-item-bubble" style="top: 8px; left: 14%;" data-day="1" title="AOVE 500ml D.O. Andalucía">
                <img src="assets/products/P1_thumb.jpg" alt="AOVE" class="w-9 h-9 object-cover rounded-full border border-amber-400 mb-0.5" onerror="this.src=''; this.innerText='🫒';">
                <span class="text-[7.5px] font-bold text-amber-300 leading-none">AOVE</span>
              </div>
              <div class="exploded-item-bubble" style="top: 8px; right: 14%;" data-day="2" title="Bonito del Norte 400g">
                <img src="assets/products/P2_thumb.jpg" alt="Bonito" class="w-9 h-9 object-cover rounded-full border border-sky-400 mb-0.5">
                <span class="text-[7.5px] font-bold text-sky-300 leading-none">Bonito</span>
              </div>
              <div class="exploded-item-bubble" style="top: 130px; left: 3%;" data-day="3" title="Mermelada Piquillo 120g">
                <img src="assets/products/P3_thumb.jpg" alt="Piquillo" class="w-9 h-9 object-cover rounded-full border border-red-400 mb-0.5">
                <span class="text-[7.5px] font-bold text-red-300 leading-none">Piquillo</span>
              </div>
              <div class="exploded-item-bubble" style="top: 130px; right: 3%;" data-day="4" title="Trilogía Mojos Canarios">
                <img src="assets/products/P4_thumb.jpg" alt="Mojos" class="w-9 h-9 object-cover rounded-full border border-emerald-400 mb-0.5">
                <span class="text-[7.5px] font-bold text-emerald-300 leading-none">Mojos</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 110px; left: 5%;" data-day="5" title="Chocolates Artesanales en Caja Madera">
                <img src="assets/products/P5_thumb.jpg" alt="Chocolate" class="w-9 h-9 object-cover rounded-full border border-amber-600 mb-0.5">
                <span class="text-[7.5px] font-bold text-amber-400 leading-none">Chocolate</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 110px; right: 5%;" data-day="6" title="Café Arábica Natural 250g">
                <img src="assets/products/P6_thumb.jpg" alt="Café" class="w-9 h-9 object-cover rounded-full border border-amber-300 mb-0.5">
                <span class="text-[7.5px] font-bold text-amber-200 leading-none">Café</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 15px; left: 18%;" data-day="7" title="Baraja Española Ineco">
                <img src="assets/products/P7_thumb.jpg" alt="Baraja" class="w-9 h-9 object-cover rounded-full border border-blue-400 mb-0.5">
                <span class="text-[7.5px] font-bold text-blue-300 leading-none">Baraja</span>
              </div>
              <div class="exploded-item-bubble" style="bottom: 15px; right: 18%;" data-day="8" title="Calcetines Técnicos Ineco">
                <img src="assets/products/P8_thumb.jpg" alt="Calcetines" class="w-9 h-9 object-cover rounded-full border border-indigo-400 mb-0.5">
                <span class="text-[7.5px] font-bold text-indigo-300 leading-none">Calcetines</span>
              </div>
              <div class="exploded-item-bubble" style="top: 45%; left: 50%; transform: translate(-50%, -150%);" data-day="9" title="Tarjeta Navideña 2027">
                <img src="assets/products/P9_thumb.jpg" alt="Tarjeta" class="w-9 h-9 object-cover rounded-full border border-amber-300 mb-0.5">
                <span class="text-[7.5px] font-bold text-amber-300 leading-none">Tarjeta</span>
              </div>
            </div>
            <p class="text-[11px] text-amber-300 font-semibold mt-2">
              💡 Toca cualquier producto para leer su nota completa
            </p>
          </div>

          <!-- IMAGEN REAL DE LA CESTA<!-- IMAGEN REAL DE LA CESTA GENERADA SEGÚN ESPECIFICACIONES -->
          <div id="basket-render-box" class="w-full max-w-3xl mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/70 shadow-[0_0_40px_rgba(212,175,55,0.35)] mb-6 relative group bg-slate-950">
            <div class="relative overflow-hidden">
              <img src="assets/cesta_solidaria_real.jpg" alt="Gran Cesta de Navidad Solidaria Ineco 2026" class="w-full h-auto max-h-[520px] object-cover transform group-hover:scale-103 transition-transform duration-700">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-black/20 pointer-events-none"></div>
            </div>
            
            <div class="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-400/60 text-xs font-black text-amber-300 shadow flex items-center gap-2">
              <span>🎁</span> <span>Lote Solidario 2026 Completo (9 Artículos)</span>
            </div>

            <div class="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <span class="text-amber-300 font-extrabold text-sm block">Acondicionamiento Interior Antichoque con Separadores</span>
                <span class="text-slate-300 text-[11px]">Caja de cartón kraft reciclado serigrafiada con motivos de Ineco</span>
              </div>
              <span class="text-white bg-red-600/95 px-3 py-1 rounded-full text-xs font-black tracking-wider shadow shrink-0">
                Llegada 14 Dic 2026
              </span>
            </div>
          </div>

          <!-- Botones de Acción<!-- Botones de Acción -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 max-w-4xl mx-auto">
            <button id="unbox-basket-btn" class="px-3 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95">
              <span>🎉 ¡Abrir Cesta!</span>
            </button>
            <button id="toggle-exploded-btn" class="px-3 py-3 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition border border-indigo-400/40 active:scale-95">
              <span>🔍 Despiece 3D</span>
            </button>
            <button id="download-story-btn" class="px-3 py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95">
              <span>📱 Story (9:16)</span>
            </button>
            <button id="download-ticket-btn" class="px-3 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition border border-blue-400/40 active:scale-95">
              <span>🎟️ Billete 2026</span>
            </button>
            <button id="share-whatsapp-btn" class="col-span-2 sm:col-span-1 px-3 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95">
              <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.179.182-.077.357.101.174.449.741.963 1.199.662.59 1.22.774 1.393.861.173.087.274.072.376-.044.101-.116.433-.506.549-.68.116-.174.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const unboxBtn = document.getElementById('unbox-basket-btn');
    const downloadBtn = document.getElementById('download-ticket-btn');
    const downloadStoryBtn = document.getElementById('download-story-btn');
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
          sound.playBellChime();
          haptics.chime();
        }
      };

      // Interactividad en burbujas del despiece 3D
      explodedBox.querySelectorAll('.exploded-item-bubble').forEach(b => {
        b.onclick = () => {
          const day = parseInt(b.dataset.day, 10);
          sound.playBellChime();
          haptics.scratch();
          if (window.adventInstance) {
            window.adventInstance.openGiftModal(day);
          }
        };
      });
    }

    if (downloadStoryBtn) {
      downloadStoryBtn.onclick = () => {
        this.downloadStoryPass(colleague);
      };
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
        const text = encodeURIComponent(`🚄 ¡Hola! Mira mi Billete de Alta Velocidad y el Regalo Solidario de Ineco para 2027 en la Base de Monforte del Cid: ${window.location.href}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      };
    }
  }

  // ==========================================
  // GENERADOR DE STORY VERTICAL (9:16) (MEJORA 5)
  // Formato 1080 x 1920 para WhatsApp Status e Instagram
  // ==========================================
  downloadStoryPass(colleague) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // Fondo Azul Ineco Ultra Oscuro
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#030A18');
    bgGrad.addColorStop(0.35, '#071635');
    bgGrad.addColorStop(0.75, '#0D2246');
    bgGrad.addColorStop(1, '#020612');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Destellos dorados en esquinas
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.beginPath();
    ctx.arc(100, 150, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(980, 1750, 300, 0, Math.PI * 2);
    ctx.fill();

    // Marco exterior festivo
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1020, 1860);

    ctx.strokeStyle = '#CB1823';
    ctx.lineWidth = 4;
    ctx.strokeRect(45, 45, 990, 1830);

    // Cabecera Institucional
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(140, 100, 800, 120);
    ctx.fillStyle = '#1A4488';
    ctx.font = '900 48px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ineco', 540, 178);

    // Insignia Superior
    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 28px Poppins, sans-serif';
    ctx.fillText('✨ REGALO SOLIDARIO 2027 • MONFORTE DEL CID ✨', 540, 280);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 24px Poppins, sans-serif';
    ctx.fillText('Base de Mantenimiento de Alta Velocidad (Alicante)', 540, 320);

    // Tarjeta del Compañero
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.roundRect ? ctx.roundRect(80, 370, 920, 320, 32) : ctx.fillRect(80, 370, 920, 320);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#CB1823';
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillText('TREN AVE SOLIDARIO • BILLETE OFICIAL 2027', 540, 430);

    ctx.fillStyle = '#0D2246';
    ctx.font = '900 68px Poppins, sans-serif';
    ctx.fillText(colleague.name, 540, 520);

    ctx.fillStyle = '#334155';
    ctx.font = '600 30px Poppins, sans-serif';
    ctx.fillText(colleague.role, 540, 580);

    ctx.fillStyle = '#1A4488';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`${colleague.ticketSeat} | ${colleague.loc}`, 540, 640);

    // Cesta de Navidad (Foto real o silueta enmarcada)
    const basketImg = document.querySelector('#basket-render-box img');
    if (basketImg && basketImg.complete) {
      try {
        ctx.save();
        ctx.roundRect ? ctx.roundRect(80, 740, 920, 680, 32) : ctx.rect(80, 740, 920, 680);
        ctx.clip();
        ctx.drawImage(basketImg, 80, 740, 920, 680);
        ctx.restore();

        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 6;
        ctx.strokeRect ? ctx.roundRect(80, 740, 920, 680, 32) : ctx.strokeRect(80, 740, 920, 680);
      } catch (e) {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(80, 740, 920, 680);
      }
    }

    // Pie: Deseo Personalizado para 2027
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.roundRect ? ctx.roundRect(80, 1460, 920, 260, 28) : ctx.fillRect(80, 1460, 920, 260);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 26px Poppins, sans-serif';
    ctx.fillText(`Deseo para el próximo 2027:`, 540, 1515);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'italic 26px Poppins, sans-serif';
    
    // Wrap de texto simple para el deseo
    const words = colleague.wish.split(' ');
    let line = '';
    let yPos = 1570;
    words.forEach(w => {
      const testLine = line + w + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 820 && line !== '') {
        ctx.fillText(line, 540, yPos);
        line = w + ' ';
        yPos += 42;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line, 540, yPos);

    // Coordenadas y Marca Final
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('38.406742°N, -0.694939°W • BASE MONFORTE DEL CID', 540, 1780);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillText('¡FELIZ AÑO NUEVO 2027!', 540, 1830);

    const link = document.createElement('a');
    link.download = `Story_Ineco_2027_${colleague.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    sound.playBellChime();
    haptics.fanfare();
  }


  downloadTicketPass(colleague) {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    // Fondo tarjeta
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect ? ctx.roundRect(10, 10, 880, 400, 24) : ctx.rect(10, 10, 880, 400);
    ctx.fill();

    // Borde dorado
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Banda superior Ineco
    ctx.fillStyle = '#1A4488';
    ctx.fillRect(10, 10, 880, 100);

    // Tira holográfica a la izquierda
    ctx.fillStyle = '#CB1823';
    ctx.fillRect(35, 110, 12, 295);

    // Textos cabecera
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillText('INECO • BILLETE SOLIDARIO 2026', 75, 75);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 15px Poppins, sans-serif';
    ctx.fillText('BASE MONFORTE (38.4067°N, -0.6949°W)', 430, 75);

    // Nombre y detalles
    ctx.fillStyle = '#0D2246';
    ctx.font = '900 34px Poppins, sans-serif';
    ctx.fillText(colleague.name, 75, 160);

    ctx.fillStyle = '#CB1823';
    ctx.font = 'bold 18px Poppins, sans-serif';
    ctx.fillText(colleague.role, 75, 195);

    ctx.fillStyle = '#334155';
    ctx.font = '15px Poppins, sans-serif';
    ctx.fillText(`Asiento: ${colleague.ticketSeat} | Entrega: 14 Diciembre 2026`, 75, 240);

    // Dedicatoria 2027
    ctx.fillStyle = '#1E293B';
    ctx.font = 'italic 15px Poppins, sans-serif';
    ctx.fillText(`"${colleague.wish}"`, 75, 290);

    // Código de barras
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`BASE MONFORTE DEL CID  |||||||||| ||||| ||||||||  ${colleague.loc}`, 75, 360);

    const link = document.createElement('a');
    link.download = `Billete_Solidario_Ineco_2026_${colleague.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    sound.playBellChime();
  }
}

// ==========================================
// 9. PANTALLA INTRODUCCIÓN ESPECTACULAR
// ==========================================
function initIntroScreen() {
  const intro = document.getElementById('intro-screen');
  const skipBtn = document.getElementById('skip-intro-btn');

  let finished = false;

  const finishIntro = () => {
    if (finished) return;
    finished = true;
    intro.classList.add('fade-out');
    setTimeout(() => {
      intro.style.display = 'none';
    }, 850);
  };

  if (skipBtn) {
    skipBtn.addEventListener('click', finishIntro);
  }

  setTimeout(finishIntro, 3300);
}

// ==========================================
// 10. INICIALIZACIÓN GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const snow = new Snowfall('snow-canvas');
  initIntroScreen();
  initCountdown();
  const advent = new AdventCalendar();
  window.adventInstance = advent;
  const colleagueBox = new ColleagueGiftBox();
  const santaRadar = new SantaRailTracker();
  // INICIALIZACIÓN DE LAS 10 MEJORAS VISUALES E INTERACTIVAS
  const gyro = new GyroParallaxManager();
  initCatenaryHarp();
  const cabViewer = new Cab360Viewer();
  const themeMgr = new ThemeManager(snow);
  const driverGame = new SolidaryDriverGame();

  // Desbloqueo silencioso de AudioContext en el primer gesto del usuario
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

  // Cerrar cualquier modal con la tecla ESCAPE y restaurar scroll
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = [
        document.getElementById('gift-modal'),
        document.getElementById('cab-modal'),
        document.getElementById('game-modal')
      ];
      modals.forEach(m => {
        if (m && !m.classList.contains('hidden')) {
          m.classList.add('hidden');
        }
      });
      document.body.style.overflow = '';
    }
  });



  const soundBtn = document.getElementById('toggle-sound-btn');
  const mobileSoundBtn = document.getElementById('mobile-sound-btn');
  const snowBtn = document.getElementById('toggle-snow-btn');
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
    const text = active ? '🔊 Sonido On' : '🔇 Sonido Off';
    if (soundBtn) soundBtn.querySelector('span').innerText = text;
    if (mobileSoundBtn) mobileSoundBtn.querySelector('span').innerText = active ? 'Sonido On' : 'Mudo';
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
    haptics.horn();
  if (boostBtn) boostBtn.onclick = () => santaRadar.boostSpeed();

  document.body.addEventListener('click', () => {
    sound.init();
  }, { once: true });
});



// ==========================================
// 11. GIROSCOPIO & PARALLAX 3D (MEJORA 1)
// ==========================================
class GyroParallaxManager {
  constructor() {
    this.cards = [];
    this.ticket = null;
    this.init();
  }

  init() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          const gx = Math.max(-20, Math.min(20, e.gamma));
          const gy = Math.max(-20, Math.min(20, e.beta - 45));
          this.applyTilt(gx, gy);
        }
      });
    }

    document.addEventListener('mousemove', (e) => {
      const gx = ((e.clientX / window.innerWidth) - 0.5) * 24;
      const gy = ((e.clientY / window.innerHeight) - 0.5) * 24;
      this.applyTilt(gx, gy);
    });
  }

  applyTilt(x, y) {
    const ticket = document.getElementById('ticket-pass-element');
    if (ticket) {
      ticket.style.transform = `perspective(1000px) rotateY(${x * 0.4}deg) rotateX(${-y * 0.4}deg)`;
      const pctX = 50 + x * 2;
      const pctY = 50 + y * 2;
      ticket.style.setProperty('--gx', `${pctX}%`);
      ticket.style.setProperty('--gy', `${pctY}%`);
    }

    const box3d = document.querySelector('.box-stage-3d');
    if (box3d) {
      box3d.style.transform = `perspective(800px) rotateY(${x * 0.5}deg) rotateX(${-y * 0.5}deg)`;
    }
  }
}

// ==========================================
// 12. EFECTO RASCAR LA ESCARCHA (MEJORA 2)
// Scratch-to-reveal canvas en las tarjetas de adviento
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
  
  // Dibujar capa de escarcha / hielo translúcido
  ctx.fillStyle = 'rgba(186, 230, 253, 0.92)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Patrón de cristales de hielo
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

  // Texto guía
  ctx.fillStyle = '#0369A1';
  ctx.font = 'bold 13px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❄️ Rasca para abrir', canvas.width / 2, canvas.height - 24);

  let isScratching = false;
  let scratchedStrokes = 0;
  let revealed = false;

  const scratch = (clientX, clientY) => {
    if (revealed) return;
    const b = canvas.getBoundingClientRect();
    const x = clientX - b.left;
    const y = clientY - b.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    scratchedStrokes++;
    if (scratchedStrokes % 4 === 0) {
      sound.playIceCrack();
      haptics.scratch();
    }

    if (scratchedStrokes >= 20) {
      revealed = true;
      canvas.remove();
      onReveal();
    }
  };

  // Si el usuario simplemente hace clic o tap directo sin rascar
  canvas.addEventListener('click', () => {
    if (revealed) return;
    revealed = true;
    sound.playIceCrack();
    haptics.scratch();
    canvas.remove();
    onReveal();
  });

  canvas.addEventListener('mousedown', () => isScratching = true);
  window.addEventListener('mouseup', () => isScratching = false);
  canvas.addEventListener('mousemove', (e) => {
    if (isScratching) scratch(e.clientX, e.clientY);
  });

  canvas.addEventListener('touchstart', (e) => {
    isScratching = true;
    if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (isScratching && e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener('touchend', () => isScratching = false);
}

// ==========================================
// 13. CATENARIA MUSICAL INTERACTIVA (MEJORA 3)
// ==========================================
function initCatenaryHarp() {
  const wire = document.getElementById('interactive-catenary');
  if (!wire) return;

  const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
  const lights = wire.querySelectorAll('.catenary-light');

  lights.forEach((light, idx) => {
    const playLight = (e) => {
      const noteFreq = notes[idx % notes.length];
      sound.playNote(noteFreq, 0.4);
      haptics.chime();
      light.classList.add('playing');
      setTimeout(() => light.classList.remove('playing'), 250);

      // Crear chispas voladoras
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
// 14. VISOR 360° CABINA AVE EN MONFORTE (MEJORA 4)
// ==========================================
class Cab360Viewer {
  constructor() {
    this.modal = document.getElementById('cab-modal');
    this.openBtn = document.getElementById('open-cab-btn');
    this.mobileOpenBtn = document.getElementById('mobile-cab-btn');
    this.closeBtn = document.getElementById('close-cab-btn');
    this.viewport = document.getElementById('cab-viewport');
    this.panoramicLayer = document.getElementById('cab-panoramic-layer');
    this.wipersBtn = document.getElementById('cab-wipers-btn');
    this.lightsBtn = document.getElementById('cab-lights-btn');
    this.hornBtn = document.getElementById('cab-horn-sound-btn');
    this.wiperL = document.getElementById('wiper-left');
    this.wiperR = document.getElementById('wiper-right');
    this.lightBeam = document.getElementById('cab-light-beam');

    this.panX = -33.3; // Centro en panel 2
    this.isDragging = false;
    this.startX = 0;
    this.wipersOn = false;
    this.lightsOn = true;

    this.init();
  }

  init() {
    if (this.openBtn) this.openBtn.onclick = () => this.open();
    if (this.mobileOpenBtn) this.mobileOpenBtn.onclick = () => this.open();
    if (this.closeBtn) this.closeBtn.onclick = () => this.close();

    if (this.viewport && this.panoramicLayer) {
      const startDrag = (x) => {
        this.isDragging = true;
        this.startX = x;
      };
      const moveDrag = (x) => {
        if (!this.isDragging) return;
        const delta = (x - this.startX) * 0.08;
        this.panX = Math.max(-66.6, Math.min(0, this.panX + delta));
        this.startX = x;
        this.panoramicLayer.style.transform = `translateX(${this.panX}%)`;
      };
      const endDrag = () => this.isDragging = false;

      this.viewport.addEventListener('mousedown', (e) => startDrag(e.clientX));
      window.addEventListener('mousemove', (e) => moveDrag(e.clientX));
      window.addEventListener('mouseup', endDrag);

      this.viewport.addEventListener('touchstart', (e) => {
        if (e.touches[0]) startDrag(e.touches[0].clientX);
      }, { passive: true });
      this.viewport.addEventListener('touchmove', (e) => {
        if (e.touches[0]) moveDrag(e.touches[0].clientX);
      }, { passive: true });
      this.viewport.addEventListener('touchend', endDrag);
    }

    if (this.wipersBtn) {
      this.wipersBtn.onclick = () => {
        this.wipersOn = !this.wipersOn;
        if (this.wiperL) this.wiperL.classList.toggle('wiper-active', this.wipersOn);
        if (this.wiperR) this.wiperR.classList.toggle('wiper-active', this.wipersOn);
        this.wipersBtn.innerText = this.wipersOn ? '🌧️ Limpias: ON' : '🌧️ Limpiaparabrisas';
        sound.playNote(220, 0.15);
      };
    }

    if (this.lightsBtn) {
      this.lightsBtn.onclick = () => {
        this.lightsOn = !this.lightsOn;
        if (this.lightBeam) this.lightBeam.style.opacity = this.lightsOn ? '0.5' : '0.08';
        this.lightsBtn.innerText = this.lightsOn ? '💡 Faros: LARGOS' : '💡 Faros: CRUCE';
        sound.playBellChime();
      };
    }

    if (this.hornBtn) {
      this.hornBtn.onclick = () => {
        sound.playTrainHorn();
        haptics.horn();
      };
    }
  }

  open() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      sound.playBellChime();
      haptics.trainJoint();
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
}

// ==========================================
// 15. CONMUTADOR DÍA / NOCHE (MEJORA 7)
// Noche Polar Ártica vs. Atardecer Mediterráneo
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
      this.btn.innerHTML = this.isMed ? '<span>☀️</span> <span class="hidden md:inline">Atardecer</span>' : '<span>❄️</span> <span class="hidden md:inline">Polar</span>';
    }
    sound.playBellChime();
    haptics.chime();
  }
}

// ==========================================
// 16. MINIJUEGO: EL MAQUINISTA SOLIDARIO (MEJORA 10)
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
    this.currentLane = 1; // 0: izq, 1: centro, 2: dcha
    this.items = [];
    this.score = 0;
    this.collected = 0;
    this.timeLeft = 30;
    this.isPlaying = false;
    this.timerInterval = null;
    this.spawnInterval = null;
    this.animId = null;

    this.giftIcons = ['🫒', '🐟', '🌶️', '🥫', '🍫', '☕', '🃏', '🧦', '💌'];

    this.init();
  }

  init() {
    if (this.openBtn) this.openBtn.onclick = () => this.open();
    if (this.mobileOpenBtn) this.mobileOpenBtn.onclick = () => this.open();
    if (this.closeBtn) this.closeBtn.onclick = () => this.close();
    if (this.startBtn) this.startBtn.onclick = () => this.startGame();

    if (this.btnLeft) {
      this.btnLeft.onclick = () => this.moveLeft();
    }
    if (this.btnRight) {
      this.btnRight.onclick = () => this.moveRight();
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
    this.collected = 0;
    this.timeLeft = 30;
    this.items = [];
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
        speed: 4.8 + Math.random() * 2
      });
    }, 650);

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
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    }

    const stars = this.collected >= 9 ? '⭐⭐⭐' : this.collected >= 6 ? '⭐⭐' : '⭐';
    const rankTitle = this.collected >= 9 
      ? '¡MAQUINISTA DE HONOR DE MONFORTE!' 
      : this.collected >= 6 
        ? '¡EXCELENTE SERVICIO FERROVIARIO!' 
        : '¡BUEN TRAYECTO SOLIDARIO!';

    if (this.overlay) {
      this.overlay.innerHTML = `
        <div class="text-4xl mb-1">${stars}</div>
        <div class="text-3xl mb-2">🚄 🎁</div>
        <h3 class="text-base sm:text-lg font-black text-amber-300 font-poppins">${rankTitle}</h3>
        <p class="text-xs text-white max-w-xs mt-2 mb-4 leading-relaxed">
          Has entregado <strong class="text-amber-400 font-black text-sm">${this.collected} de 9 Regalos Solidarios 2026</strong> a tiempo en la Base de Monforte del Cid.<br>
          <span class="text-emerald-400 font-bold text-sm block mt-1">Puntuación Final: ${this.score} pts</span>
          <span class="text-[11px] text-blue-200 block mt-1">¡Feliz y próspero año 2027 para todo el equipo!</span>
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

    // Fondo túnel / cielo nocturno con efecto velocidad
    ctx.fillStyle = '#030816';
    ctx.fillRect(0, 0, w, h);

    // Dibujar postes de catenaria a los lados pasando a toda velocidad
    const postY = (Date.now() / 2.5) % 80;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    for (let y = postY; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(35, y);
      ctx.moveTo(w - 10, y);
      ctx.lineTo(w - 35, y);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(8, y - 2, 4, 4);
      ctx.fillRect(w - 12, y - 2, 4, 4);
    }

    // Dibujar 3 vías de alta velocidad balastadas
    this.lanes.forEach(lx => {
      // Balasto
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(lx - 34, 0, 68, h);

      // Traviesas de hormigón en movimiento
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.lineWidth = 4;
      const offset = (Date.now() / 4) % 24;
      for (let y = offset; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(lx - 32, y);
        ctx.lineTo(lx + 32, y);
        ctx.stroke();
      }

      // Carriles de acero relucientes
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(lx - 24, 0);
      ctx.lineTo(lx - 24, h);
      ctx.moveTo(lx + 24, 0);
      ctx.lineTo(lx + 24, h);
      ctx.stroke();
    });

    // Actualizar y dibujar ítems cayendo (regalos y copos)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.speed;

      const itemX = this.lanes[it.lane];
      
      // Halo brillante bajo el regalo
      if (it.isGift) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.beginPath();
        ctx.arc(itemX, it.y - 8, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.icon, itemX, it.y);

      // Colisión con tren del jugador
      if (it.y >= h - 110 && it.y <= h - 45 && it.lane === this.currentLane) {
        if (it.isGift) {
          this.score += 100;
          this.collected++;
          sound.playGameCollect();
          haptics.chime();
        } else {
          this.score = Math.max(0, this.score - 40);
          sound.playIceCrack();
          haptics.scratch();
        }
        this.items.splice(i, 1);
        continue;
      }

      if (it.y > h + 40) {
        this.items.splice(i, 1);
      }
    }

    // Dibujar Tren AVE del Maquinista
    const trainX = this.lanes[this.currentLane];
    const trainY = h - 75;

    // Cono de luz volumétrico de los faros
    const beamGrad = ctx.createLinearGradient(trainX, trainY, trainX, trainY - 140);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(trainX, trainY - 10);
    ctx.lineTo(trainX - 35, trainY - 140);
    ctx.lineTo(trainX + 35, trainY - 140);
    ctx.fill();

    // Sombra del tren sobre la vía
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(trainX - 22, trainY - 10, 44, 60);

    // Carrocería aerodinámica AVE
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

    // Faros LED
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(trainX - 18, trainY - 18, 6, 4);
    ctx.fillRect(trainX + 12, trainY - 18, 6, 4);

    // HUD Superior del Juego
    ctx.fillStyle = 'rgba(8, 16, 36, 0.95)';
    ctx.fillRect(0, 0, w, 44);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 44);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 12.5px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🎁 Lote: ${this.collected}/9`, 14, 28);

    ctx.textAlign = 'center';
    ctx.fillStyle = this.timeLeft <= 5 ? '#EF4444' : '#FFFFFF';
    ctx.fillText(`⏱️ ${this.timeLeft}s`, w / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`${this.score} pts`, w - 14, 28);

    this.animId = requestAnimationFrame(() => this.loop());
  }
}
