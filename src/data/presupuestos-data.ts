export interface Diplomado {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  category: 'Belleza' | 'Diseño & Textil' | 'Gastronomía' | 'Oficios Técnicos' | 'Cuidado Social' | 'Transporte';
  description: string;
  barrios: string[];
  hours: number;
  cupos: number;
  icon: string;
  specialRequirements?: string;
  colorTheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    gradient: string;
  };
  kitDescription: string;
  kitItems: string[];
  whatYouLearn: string[];
  isPendingValidation?: boolean;
}

export interface BarrioInfo {
  id: string;
  name: string;
  comuna: string;
  zone: 'Norte' | 'Morrorrico' | 'Occidental' | 'Sur';
  description: string;
  color: string;
  diplomadoIds: string[];
}

export const DIPLOMADOS_DATA: Diplomado[] = [
  {
    id: 'belleza-gestion',
    name: 'Belleza y Gestión Comercial',
    badge: '💅 Estética & Nails',
    tagline: 'Manicure profesional, miradas impactantes y gestión de clientes',
    category: 'Belleza',
    description: 'Aprenda manicure ruso, esmaltado semipermanente, uñas press on, laminado de cejas, lifting y extensiones de pestañas (pelo a pelo y volumen). Además, cómo cobrar, fijar precios y mantener a sus clientas.',
    barrios: [
      'Betania Etapa 12',
      'Bavaria II',
      'A.H. La Roca',
      'A.H. Villas del Claveriano',
      'Brisas del Sol',
      'A.H. Camilo Torres',
      'A.H. La Playita',
      'Milagro de Dios',
      'Villas de Girardot'
    ],
    hours: 100,
    cupos: 112,
    icon: 'Sparkles',
    colorTheme: {
      bg: 'bg-fuchsia-950/60',
      border: 'border-fuchsia-400',
      badgeBg: 'bg-fuchsia-500',
      badgeText: 'text-white',
      accent: '#ec4899',
      gradient: 'from-fuchsia-600 to-pink-500'
    },
    kitDescription: 'Kit profesional de estética para iniciar servicios a domicilio o en cabina.',
    kitItems: [
      'Lámpara LED/UV para secado semipermanente',
      'Torno micromotor con set de fresas diamantadas para manicure ruso',
      'Set de esmaltes semipermanentes y base ruber',
      'Kit de lifting y laminado de cejas con almohadillas',
      'Pinzas de precisión para volumen y pelo a pelo',
      'Guía de costos y cálculo de rentabilidad por servicio'
    ],
    whatYouLearn: [
      'Técnica rusa con torno y corte limpio de cutícula',
      'Esmaltado semipermanente de alta duración y nivelación',
      'Aplicación de uñas press on personalizadas',
      'Laminado y perfilado de cejas simétrico',
      'Lifting y extensiones de pestañas pelo a pelo y volumen ruso',
      'Estrategias comerciales: cómo cobrar, crear catálogo y fidelizar'
    ]
  },
  {
    id: 'estampados-sublimacion',
    name: 'Estampados y Sublimación',
    badge: '🎨 Sublimación & Textil',
    tagline: 'Del diseño al producto publicitario y textil rentable',
    category: 'Diseño & Textil',
    description: 'Aprenda sublimación y estampado: manejo de la maquinaria, software de diseño, tintas, papeles, calibración de color y transferencia sobre distintos materiales.',
    barrios: [
      'Bavaria II',
      'A.H. Villas del Claveriano',
      'Brisas del Sol',
      'Gaitán',
      'A.H. La Playita',
      'Luz de Salvación'
    ],
    hours: 80,
    cupos: 257,
    icon: 'Palette',
    colorTheme: {
      bg: 'bg-emerald-950/60',
      border: 'border-lime-400',
      badgeBg: 'bg-[#9eff00]',
      badgeText: 'text-black',
      accent: '#9eff00',
      gradient: 'from-lime-500 to-emerald-500'
    },
    kitDescription: 'Kit de inicio en personalización gráfica y acabados de transferencia.',
    kitItems: [
      'Cinta térmica de alta temperatura para estampación',
      'Set de papeles especiales para sublimación de alta transferencia',
      'Muestrario de productos en blanco (mugs, gorras, camisetas)',
      'Teflón protector para plancha térmica',
      'Paleta de calibración cromática y perfiles de color digitales'
    ],
    whatYouLearn: [
      'Operación segura de termoestampadoras y prensas planas y cilíndricas',
      'Software gráfico para maquetación e impresión en espejo',
      'Ajuste fino de temperatura, presión y tiempo por material',
      'Sublimación sobre poliéster, cerámica, aluminio y madera tratada',
      'Cálculo de mermas, tiempos de producción y precios mayoristas'
    ]
  },
  {
    id: 'reposteria',
    name: 'Repostería',
    badge: '🍰 Pastelería & Negocio',
    tagline: 'Postres modernos, costos al detalle y venta con margen',
    category: 'Gastronomía',
    description: 'Postres al vaso, brownies, tortas individuales, cheesecakes, glaseado espejo, frutas cubiertas de chocolate y postres personalizados, con costos y receta estándar para vender con ganancia.',
    barrios: [
      'Bavaria II',
      'Brisas del Sol',
      'Villas de Girardot'
    ],
    hours: 80,
    cupos: 43,
    icon: 'Cake',
    colorTheme: {
      bg: 'bg-amber-950/60',
      border: 'border-amber-400',
      badgeBg: 'bg-amber-400',
      badgeText: 'text-black',
      accent: '#f59e0b',
      gradient: 'from-amber-400 to-orange-500'
    },
    kitDescription: 'Kit de pastelería fina para producción y presentación comercial.',
    kitItems: [
      'Juego de boquillas rusas y estándar de acero inoxidable',
      'Mangas pasteleras reutilizables y siliconadas',
      'Termómetro digital culinario para chocolate y almíbares',
      'Espátulas acodadas de repostería y rasqueta de alisado',
      'Moldes de silicona para mono-porciones y glaseado espejo'
    ],
    whatYouLearn: [
      'Elaboración de postres al vaso de larga vida útil',
      'Técnicas de atemperado de chocolate y cobertura crujiente',
      'Cheesecakes horneados y fríos con coulis naturales',
      'Glaseados brillantes de efecto espejo para mini cakes',
      'Estandarización de fichas técnicas para asegurar ganancia en cada porción'
    ]
  },
  {
    id: 'culinaria-comidas-rapidas',
    name: 'Culinaria / Comidas Rápidas',
    badge: '🍔 Cocina & Comidas Rápidas',
    tagline: 'Recetas ganadoras, salsas de autor y buenas prácticas de manipulación',
    category: 'Gastronomía',
    description: 'Hamburguesas, pizzas, perros calientes, papas especiales, salsas base y fritos tradicionales colombianos, con buenas prácticas de manufactura y costos para su negocio.',
    barrios: [
      'A.H. La Roca',
      'Villas de Girardot'
    ],
    hours: 80,
    cupos: 30,
    icon: 'UtensilsCrossed',
    colorTheme: {
      bg: 'bg-orange-950/60',
      border: 'border-orange-500',
      badgeBg: 'bg-orange-500',
      badgeText: 'text-white',
      accent: '#ea580c',
      gradient: 'from-orange-500 to-red-500'
    },
    kitDescription: 'Dotación esencial de cocina para línea caliente y preparación rápida.',
    kitItems: [
      'Cuchillo de chef profesional en acero forjado',
      'Termómetro de sonda para cocción de carnes',
      'Dispensadores profesionales de salsa tipo squeeze',
      'Delantal de cocina resistente y cofia técnica',
      'Tabla de corte reglamentaria y espátula parrillera'
    ],
    whatYouLearn: [
      'Formulación de mezclas de carnes artesanales para hamburguesas',
      'Masa y cocción rápida de pizzas con borde crocante',
      'Salsas madres, emulsiones y recetas secretas de autor',
      'Técnicas de fritura profunda sin exceso de grasa para fritos típicos',
      'Buenas Prácticas de Manufactura (BPM) y control higiénico de alimentos'
    ]
  },
  {
    id: 'decoracion-eventos',
    name: 'Decoración de Eventos',
    badge: '🎈 Arte en Globos',
    tagline: 'Arcos orgánicos, paletas de color y montajes temáticos de alto impacto',
    category: 'Diseño & Textil',
    description: 'Arcos orgánicos, columnas, murales, bouquets y montajes con globos, con color, composición y diseño de bocetos temáticos.',
    barrios: [
      'Brisas del Sol'
    ],
    hours: 80,
    cupos: 19,
    icon: 'PartyPopper',
    colorTheme: {
      bg: 'bg-purple-950/60',
      border: 'border-purple-400',
      badgeBg: 'bg-purple-500',
      badgeText: 'text-white',
      accent: '#a855f7',
      gradient: 'from-purple-500 to-pink-500'
    },
    kitDescription: 'Herramientas de montaje y calibrado para decoradores de eventos.',
    kitItems: [
      'Inflador eléctrico de doble boquilla de alto rendimiento',
      'Caja calibradora de globos plegable',
      'Puntos de pegamento de montaje y cintas estructuradas',
      'Cortador de cinta y herramientas de nudo rápido',
      'Guía visual de armonía del círculo cromático y bocetos'
    ],
    whatYouLearn: [
      'Estructuras y técnicas para arcos orgánicos contemporáneos',
      'Muros de globos densos y fondos fotográficos (photocalls)',
      'Bouquets de helio y composiciones de pie para cumpleaños y bodas',
      'Cálculo de materiales, mermas de globos y cotizaciones formales'
    ]
  },
  {
    id: 'barberia',
    name: 'Barbería',
    badge: '✂️ Barber Shop',
    tagline: 'Degradados precisos, diseños urbanos y ritual de barba',
    category: 'Belleza',
    description: 'Cortes a tijera y a máquina, desvanecidos, diseños (cresta, cuadros, estilo 7, mullet, mohicano), perfilado, cejas y barba.',
    barrios: [
      'A.H. Villas del Claveriano',
      'A.H. La Playita'
    ],
    hours: 80,
    cupos: 43,
    icon: 'Scissors',
    colorTheme: {
      bg: 'bg-blue-950/60',
      border: 'border-cyan-400',
      badgeBg: 'bg-cyan-400',
      badgeText: 'text-black',
      accent: '#06b6d4',
      gradient: 'from-cyan-400 to-blue-600'
    },
    kitDescription: 'Kit de corte profesional con máquina de precisión y navajas.',
    kitItems: [
      'Máquina recortadora / clipper profesional con peines guía',
      'Navajín de afeitar tradicional de acero inoxidable',
      'Tijera de corte y tijera de pulir/degrafilado',
      'Capa de barbería impermeable y bledo suave de cuello',
      'Peine plano de degradado y aceite lubricante para cuchillas'
    ],
    whatYouLearn: [
      'Técnicas de desvanecido (Low Fade, Mid Fade, High Fade, Taper)',
      'Manejo de tijera sobre peine y texturizado de copete',
      'Diseños libres, líneas, grecas, cresta y cortes en tendencia',
      'Ritual de toalla caliente, perfilado de barba y cejas con navaja',
      'Higiene, esterilización de herramientas y atención al cliente'
    ]
  },
  {
    id: 'modisteria',
    name: 'Modistería',
    badge: '🧵 Costura & Confección',
    tagline: 'Manejo de máquinas industriales, patronaje y arreglo de prendas',
    category: 'Oficios Técnicos',
    description: 'Máquina plana, fileteadora y collarín, patronaje básico, toma de medidas, ajuste de jeans, cuellos, pretinas y cierres básicos e invisibles.',
    barrios: [
      'A.H. Zarabanda'
    ],
    hours: 100,
    cupos: 42,
    icon: 'Shirt',
    colorTheme: {
      bg: 'bg-teal-950/60',
      border: 'border-teal-400',
      badgeBg: 'bg-teal-400',
      badgeText: 'text-black',
      accent: '#14b8a6',
      gradient: 'from-teal-400 to-cyan-500'
    },
    kitDescription: 'Equipo de corte, patronaje y ensamble para taller de confección.',
    kitItems: [
      'Tijera de modistería pesada forjada en acero al carbono',
      'Juego de reglas de patronaje (sisómetro, escuadra y curva francesa)',
      'Cinta métrica profesional para toma de medidas corporales',
      'Pie prensatelas compensado y pie para cremallera invisible',
      'Desbaratador ergonómico y tiza de sastre para tela'
    ],
    whatYouLearn: [
      'Enhebrado, calibración y costura en máquina plana y fileteadora',
      'Lectura de patrones básicos y transformaciones de diseño',
      'Ajustes de pretina, entubado y dobladillo original de jeans',
      'Montaje de cierres invisibles, cuellos camiseros y mangas',
      'Presupuesto de confección: cobro por composturas y prendas desde cero'
    ]
  },
  {
    id: 'primera-infancia',
    name: 'Primera Infancia',
    badge: '🧸 Cuidado & Pedagogía',
    tagline: 'Desarrollo infantil, motricidad, nutrición y ambientes seguros',
    category: 'Cuidado Social',
    description: 'El juego en el desarrollo infantil, material didáctico, ambientes seguros, lenguaje, motricidad, educación inclusiva, primeros auxilios, vacunación y nutrición.',
    barrios: [
      'Brisas de Provenza'
    ],
    hours: 100,
    cupos: 59,
    icon: 'Baby',
    specialRequirements: 'Solo para mayores de 18 años. Requiere certificado de inhabilidades por delitos sexuales (con máximo 30 días de expedido).',
    colorTheme: {
      bg: 'bg-yellow-950/60',
      border: 'border-yellow-400',
      badgeBg: 'bg-yellow-400',
      badgeText: 'text-black',
      accent: '#eab308',
      gradient: 'from-yellow-400 to-amber-500'
    },
    kitDescription: 'Material de estimulación temprana y herramientas de cuidado infantil.',
    kitItems: [
      'Set de estimulación multisensorial y psicomotriz',
      'Botiquín pediátrico de primeros auxilios reglamentario',
      'Cuentos y fichas didácticas de desarrollo cognitivo y lenguaje',
      'Instrumentos de percusión y ritmo para juego colectivo',
      'Manual de signos de alarma de salud y nutrición infantil'
    ],
    whatYouLearn: [
      'Etapas del neurodesarrollo motor, lingüístico y socioafectivo',
      'Creación de ambientes de juego y aprendizaje seguros',
      'Primeros auxilios básicos en la infancia y prevención de accidentes',
      'Pautas de alimentación complementaria y esquemas de vacunación',
      'Estrategias de inclusión pedagógica y atención con enfoque de derechos'
    ]
  },
  {
    id: 'calzado-marroquineria',
    name: 'Calzado y Marroquinería',
    badge: '👞 Cuero & Marroquinería',
    tagline: 'Patronaje de calzado, costura en cuero y piezas propias en serie',
    category: 'Oficios Técnicos',
    description: 'Tipos de cuero, patronaje, costura a mano, manejo de máquina de poste, rebajadora y fileteadora, y producción de piezas propias en lotes pequeños.',
    barrios: [
      'A.H. La Playita'
    ],
    hours: 80,
    cupos: 18,
    icon: 'Briefcase',
    colorTheme: {
      bg: 'bg-amber-950/60',
      border: 'border-yellow-600',
      badgeBg: 'bg-amber-600',
      badgeText: 'text-white',
      accent: '#d97706',
      gradient: 'from-amber-600 to-yellow-600'
    },
    kitDescription: 'Set de herramientas de corte y guarnición para manufactura de cuero.',
    kitItems: [
      'Chaveta de corte de cuero con filo templado',
      'Compás de trazo y tenedor para perforado de costura artesanal',
      'Lezna diamantada y agujas para costura a dos agujas en cuero',
      'Hilos encerados de alta resistencia en colores tradicionales',
      'Martillo de zapatero y doblador de cantos'
    ],
    whatYouLearn: [
      'Reconocimiento de cueros, calibres, acabados y sintéticos',
      'Patronaje técnico para calzado básico y pequeña marroquinería (billeteras, correas)',
      'Costura manual con pespunte artesanal y montaje en máquina de poste',
      'Técnicas de desbastado, pegado con cemento de contacto y rematado',
      'Planificación de una mini línea de producción artesanal santandereana'
    ]
  },
  {
    id: 'transformacion-digital-taxis',
    name: 'Transformación Digital para Taxistas',
    badge: '🚖 Transportadores (10º Diplomado)',
    tagline: 'Pagos con QR, pasarelas digitales y servicio tecnológico al volante',
    category: 'Transporte',
    description: 'Diplomado especializado en digitalización del servicio público de transporte individual. Pagos digitales, geolocalización, finanzas del vehículo y servicio de calidad.',
    barrios: [
      'Bucaramanga (Gremio Taxistas y Transportadores)'
    ],
    hours: 80,
    cupos: 151,
    icon: 'Car',
    specialRequirements: 'Transportadores: mayores de edad y con tarjeta de control vigente.',
    colorTheme: {
      bg: 'bg-yellow-950/50',
      border: 'border-yellow-300',
      badgeBg: 'bg-yellow-400',
      badgeText: 'text-black',
      accent: '#facc15',
      gradient: 'from-yellow-400 to-amber-600'
    },
    kitDescription: 'Kit de conectividad y señalización de cobro digital para vehículo.',
    kitItems: [
      'Soporte magnético reforzado para teléfono en cabina',
      'Exhibidor de QR para medios de pago digitales en el espaldar',
      'Cargador rápido multipuerto de 12V con cables reforzados',
      'Guía práctica de seguridad en transacciones móviles'
    ],
    whatYouLearn: [
      'Configuración segura de billeteras digitales (Nequi, Daviplata, QR Bancolombia)',
      'Uso de aplicaciones de mapas y optimización de rutas en Bucaramanga',
      'Educación financiera del transportador: gasolina, mantenimiento y ahorro',
      'Servicio al cliente moderno y reputación digital'
    ],
    isPendingValidation: true
  }
];

export const BARRIOS_DATA: BarrioInfo[] = [
  {
    id: 'betania-12',
    name: 'Betania Etapa 12',
    comuna: 'Comuna 1',
    zone: 'Norte',
    description: 'Sector dinámico del norte de Bucaramanga con gran empuje comunitario.',
    color: '#ec4899',
    diplomadoIds: ['belleza-gestion']
  },
  {
    id: 'bavaria-ii',
    name: 'Bavaria II',
    comuna: 'Comuna 2',
    zone: 'Norte',
    description: 'Comunidad organizada con alta demanda en oficios creativos y gastronómicos.',
    color: '#84cc16',
    diplomadoIds: ['belleza-gestion', 'estampados-sublimacion', 'reposteria']
  },
  {
    id: 'la-roca',
    name: 'A.H. La Roca',
    comuna: 'Comuna 14',
    zone: 'Morrorrico',
    description: 'Asentamiento con espíritu emprendedor en las laderas orientales de la ciudad.',
    color: '#06b6d4',
    diplomadoIds: ['belleza-gestion', 'culinaria-comidas-rapidas']
  },
  {
    id: 'villas-claveriano',
    name: 'A.H. Villas del Claveriano',
    comuna: 'Comuna 1',
    zone: 'Norte',
    description: 'Barrio juvenil con fuerte interés en barbería, estética y personalización textil.',
    color: '#eab308',
    diplomadoIds: ['belleza-gestion', 'estampados-sublimacion', 'barberia']
  },
  {
    id: 'brisas-del-sol',
    name: 'Brisas del Sol',
    comuna: 'Comuna 1',
    zone: 'Norte',
    description: 'Territorio con variada oferta de emprendimiento y artes visuales.',
    color: '#f97316',
    diplomadoIds: ['belleza-gestion', 'estampados-sublimacion', 'reposteria', 'decoracion-eventos']
  },
  {
    id: 'camilo-torres',
    name: 'A.H. Camilo Torres',
    comuna: 'Comuna 1',
    zone: 'Norte',
    description: 'Comunidad histórica del norte con cupos en belleza y gestión comercial.',
    color: '#ef4444',
    diplomadoIds: ['belleza-gestion']
  },
  {
    id: 'la-playita',
    name: 'A.H. La Playita',
    comuna: 'Comuna 14',
    zone: 'Morrorrico',
    description: 'Sector con la mayor diversidad de oficios técnicos y manufactura tradicional.',
    color: '#3b82f6',
    diplomadoIds: ['belleza-gestion', 'estampados-sublimacion', 'barberia', 'calzado-marroquineria']
  },
  {
    id: 'milagro-de-dios',
    name: 'Milagro de Dios',
    comuna: 'Comuna 1',
    zone: 'Norte',
    description: 'Sector vibrante en el norte con enfoque en formación estética.',
    color: '#22c55e',
    diplomadoIds: ['belleza-gestion']
  },
  {
    id: 'villas-girardot',
    name: 'Villas de Girardot',
    comuna: 'Comuna 4',
    zone: 'Occidental',
    description: 'Barrio occidental con acceso a belleza, gastronomía rápida y repostería.',
    color: '#f43f5e',
    diplomadoIds: ['belleza-gestion', 'reposteria', 'culinaria-comidas-rapidas']
  },
  {
    id: 'gaitan',
    name: 'Gaitán',
    comuna: 'Comuna 4',
    zone: 'Occidental',
    description: 'Punto clave del occidente bumangués con oferta en diseño y estampados.',
    color: '#fb7185',
    diplomadoIds: ['estampados-sublimacion']
  },
  {
    id: 'luz-de-salvacion',
    name: 'Luz de Salvación I',
    comuna: 'Comuna 11',
    zone: 'Sur',
    description: 'Comunidad del sur de Bucaramanga con cupos para estampados y sublimación.',
    color: '#a855f7',
    diplomadoIds: ['estampados-sublimacion']
  },
  {
    id: 'zarabanda',
    name: 'A.H. Zarabanda',
    comuna: 'Comuna 1',
    zone: 'Norte',
    description: 'Sector del norte donde se concentrará el diplomado en modistería y confección.',
    color: '#14b8a6',
    diplomadoIds: ['modisteria']
  },
  {
    id: 'brisas-provenza',
    name: 'Brisas de Provenza',
    comuna: 'Comuna 10',
    zone: 'Sur',
    description: 'Zona estratégica del sur que acogerá la formación integral en Primera Infancia.',
    color: '#6366f1',
    diplomadoIds: ['primera-infancia']
  }
];

export const METRICS = {
  totalCupos: 774,
  cuposDetalladosBarriales: 623,
  cuposTransportadores: 151,
  totalDiplomados: 10,
  diplomadosBarriales: 9,
  costo: '$0',
  kitGratis: '1 kit práctico por graduado',
  fechaInicio: '24 de octubre'
};

export const REQUISITOS_GENERALES = [
  {
    id: 'req-nacionalidad',
    title: 'Ser ciudadano colombiano',
    desc: 'Presentar documento de identidad válido y vigente.'
  },
  {
    id: 'req-edad',
    title: 'Tener mínimo 16 años',
    desc: 'A la fecha de ejecución e inicio del programa.'
  },
  {
    id: 'req-residencia',
    title: 'Vivir en el barrio o zona asignada',
    desc: 'Habitar en uno de los barrios convocados para el diplomado de su interés.'
  },
  {
    id: 'req-experiencia',
    title: 'Sin experiencia previa',
    desc: 'No se requieren conocimientos previos; se enseña desde cero con manos de maestro.'
  }
];

export const REQUISITOS_ESPECIALES = [
  {
    id: 'req-infancia',
    program: 'Primera Infancia',
    rules: [
      'Ser mayor de 18 años.',
      'Certificado de inhabilidades por delitos sexuales (expedido con máximo 30 días).'
    ]
  },
  {
    id: 'req-transporte',
    program: 'Transportadores / Taxistas',
    rules: [
      'Ser mayor de edad.',
      'Contar con tarjeta de control vigente.'
    ]
  }
];

export const PASOS_INSCRIPCION = [
  {
    step: 1,
    title: 'Escoja su diplomado',
    desc: 'Consulte qué diplomado corresponde a su barrio de residencia en el explorador de la página.'
  },
  {
    step: 2,
    title: 'Reúna sus documentos',
    desc: 'Prepare los documentos obligatorios exigidos por la Alcaldía de Bucaramanga y el IMEBU:',
    documents: [
      'Copia legible por ambas caras de su cédula o tarjeta de identidad vigente.',
      'Certificado de residencia expedido y firmado por la Alcaldía de Bucaramanga (trámite en el CAME).',
      'Formulario de inscripción diligenciado y firmado debidamente.'
    ]
  },
  {
    step: 3,
    title: 'Si es menor de 18 años',
    desc: 'Debe presentar una autorización por escrito firmada por su padre, madre o representante legal, junto con la copia del documento de identidad de quien firma.'
  },
  {
    step: 4,
    title: 'Si se inscribe a Primera Infancia',
    desc: 'Presente además el certificado de antecedentes de inhabilidades por delitos sexuales, con máximo 30 días de expedido.'
  }
];

export const INSCRIPCION_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf7a_k_v3VKAczbauOiyNOzYOLswBRk-MpA3Q4d_sqJ6LWiDQ/viewform';

export const CAME_INFO = {
  url: 'https://camevirtual.bucaramanga.gov.co/tramites/101/certificado-de-residencia/',
  tramiteName: 'Certificado de Residencia de Bucaramanga (CAME)',
  requisitosJornada: [
    'Fotocopia de su cédula ampliada al 150%',
    'Recibo de servicios públicos reciente de su vivienda',
    'Carta de residencia firmada por el presidente de la JAC (Junta de Acción Comunal) de su barrio',
    'Pago de estampilla pro HUS y pro electrificación rural (en la sede del IMEBU se puede gestionar el pago)'
  ]
};

export const FAQ_DATA = [
  {
    question: '¿Tiene algún costo?',
    answer: 'No. Es completamente gratis. La formación y el kit de emprendimiento son 100% financiados mediante los Presupuestos Participativos 2026 de Bucaramanga.'
  },
  {
    question: '¿Necesito experiencia?',
    answer: 'No. Los diplomados no piden conocimientos previos. Aprenderá con manos de maestros del oficio desde los fundamentos hasta técnicas avanzadas.'
  },
  {
    question: '¿Puedo inscribirme si soy menor de edad?',
    answer: 'Sí, desde los 16 años, siempre y cuando presente la autorización escrita y firmada de su padre, madre o representante legal junto a la copia de su documento. Única excepción: Primera Infancia es exclusivo para mayores de 18 años.'
  },
  {
    question: '¿Puedo inscribirme en cualquier diplomado?',
    answer: 'Cada diplomado está asignado a barrios y zonas específicas de Bucaramanga. Es requisito obligatorio que su certificado de residencia corresponda a los barrios convocados para esa oferta formativa.'
  },
  {
    question: '¿Cuándo recibo el kit?',
    answer: 'Al terminar satisfactoriamente su formación, si cumplió con al menos el 70% de las horas del diplomado y superó la evaluación docente. El kit es personal e intransferible.'
  },
  {
    question: '¿Dónde saco el certificado de residencia?',
    answer: 'En la Alcaldía de Bucaramanga a través del CAME (Centro de Atención Municipal Especializado), tanto en su plataforma virtual como en las jornadas presenciales CAME-IMEBU.'
  }
];
