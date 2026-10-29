import type { AreaClapOficial, Vacante } from "../lib/vacantes/types";

export const TALENTO_HUMANO_EMAIL = "talento.humano@clapedu.org";

export const POSTULACION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc9bBghbLnc-hYIQTJXTj4V7ZmWB9B3LOxcW2Snd-qYG1eKlQ/viewform";

export const DOCUMENTOS_ESTANDAR: string[] = [
  "Hoja de vida actualizada con soportes académicos y laborales",
  "Soporte de tarjeta profesional vigente (si aplica)",
  "Portafolio profesional (si aplica)",
];

/** Las 7 áreas oficiales de CLAP, en el orden institucional. El filtro las
 * muestra siempre, aunque no tengan vacantes abiertas. */
export const AREAS_CLAP: AreaClapOficial[] = [
  "Administrativo y Financiero",
  "Comunidad",
  "Incidencia",
  "Marca y Comunicaciones",
  "Proyectos",
  "Educación",
  "Cultura Organizacional",
];

/** Respaldo curado: se usa cuando la hoja de Google Sheets no responde (sin
 * red, hoja privada, cambio de ID). La fuente de verdad es la hoja; ver
 * src/lib/vacantes/obtener-vacantes.ts. */
export const VACANTES_RESPALDO: Vacante[] = [
  {
    id: "coordinador-contable",
    cargo: "Coordinador Contable",
    area: "Administrativo y Financiero",
    estado: "activa",
    modalidad: "Presencial",
    ubicacion: "Bucaramanga",
    tipoContrato: "Contrato laboral a término indefinido",
    salario: "$2.350.000 - $3.350.000 mensual",
    resumen:
      "Coordinar y ejecutar integralmente la contabilidad de las empresas del ecosistema empresarial, garantizando que los registros, conciliaciones, cierres, impuestos, estados financieros y reportes se preparen de manera completa, confiable y oportuna.",
    objetivoRol:
      "Coordinar y ejecutar integralmente la contabilidad de las empresas del ecosistema empresarial, garantizando que los registros, conciliaciones, cierres, impuestos, estados financieros y reportes se preparen de manera completa, confiable y oportuna.",
    responsabilidades: [
      "Coordinar y ejecutar de manera integral los procesos contables de las empresas que conforman el ecosistema empresarial de CLAP.",
      "Garantizar el registro completo, veraz y oportuno de las operaciones contables y financieras.",
      "Realizar conciliaciones contables y liderar la ejecución puntual de los cierres periódicos.",
      "Preparar, validar y asegurar el cumplimiento oportuno de las obligaciones tributarias e impuestos.",
      "Elaborar estados financieros y reportes contables confiables para la toma de decisiones.",
    ],
    requisitos: [
      "Profesional en Contaduría Pública.",
      "Tarjeta profesional vigente.",
      "4 años de experiencia gestionando procesos contables.",
      "Disponibilidad para trabajo presencial en Bucaramanga.",
    ],
    experiencia: "4 años gestionando procesos contables",
    conocimientosHabilidades: [
      "Gestión integral de ciclos contables multiempresa",
      "Conciliaciones, cierres contables y estados financieros",
      "Liquidación y presentación de impuestos nacionales y territoriales",
      "Rigurosidad técnica, confiabilidad y cumplimiento oportuno de entregables",
    ],
    documentosPostulacion: DOCUMENTOS_ESTANDAR,
    informacionAdicional:
      "Completa el formulario oficial de postulación o envía tu portafolio y tu hoja de vida con soportes al correo de Talento Humano indicando en el asunto el nombre del cargo.",
    correoPostulacion: TALENTO_HUMANO_EMAIL,
    enlacePostulacion: POSTULACION_FORM_URL,
    piezaGraficaUrl: "/vacantes/pieza-coordinador-contable.webp",
    fechaPublicacion: "2026-10-01",
  },
  {
    id: "lider-articulacion-comunidad",
    cargo: "Líder de Comunidad y Voluntariado",
    area: "Comunidad",
    estado: "activa",
    modalidad: "Presencial",
    ubicacion: "Bucaramanga",
    tipoContrato: "Contrato laboral a término fijo",
    salario: "$2.400.000 - $2.900.000 mensual",
    resumen:
      "Dinamizar y fortalecer la red de voluntarios, egresados y aliados del Hub Creativo CLAP, promoviendo espacios de encuentro, participación juvenil y trabajo colaborativo con propósito.",
    objetivoRol:
      "Articular y acompañar a la comunidad de líderes, voluntarios y emprendedores vinculados a CLAP, asegurando experiencias de vinculación significativas y el crecimiento activo de nuestras redes en territorio.",
    responsabilidades: [
      "Coordinar el ciclo de convocatoria, acogida, formación y seguimiento de la red de voluntariado CLAP.",
      "Programar y dinamizar encuentros comunitarios, jornadas de networking y actividades en el Hub Creativo.",
      "Mantener comunicación cercana con egresados de los programas formativos e impulsar iniciativas colaborativas.",
      "Realizar seguimiento de indicadores de participación, permanencia y satisfacción de la comunidad.",
    ],
    requisitos: [
      "Profesional en Comunicación Social, Trabajo Social, Psicología, Administración o carreras afines.",
      "2 años de experiencia liderando comunidades, redes juveniles o programas de voluntariado.",
      "Disponibilidad presencial en Bucaramanga y flexibilidad para eventos puntuales.",
    ],
    experiencia: "2 años liderando comunidades o programas de voluntariado",
    conocimientosHabilidades: [
      "Facilitación grupal y metodologías participativas",
      "Gestión de alianzas y relacionamiento interinstitucional",
      "Planeación logística de encuentros y eventos con propósito",
      "Comunicación empática, liderazgo cercano y orientación al servicio",
    ],
    documentosPostulacion: DOCUMENTOS_ESTANDAR,
    informacionAdicional:
      "Completa el formulario oficial de postulación adjuntando tu documentación requerida.",
    correoPostulacion: TALENTO_HUMANO_EMAIL,
    enlacePostulacion: POSTULACION_FORM_URL,
  },
  {
    id: "analista-incidencia-liderazgo-publico",
    cargo: "Analista de Incidencia y Liderazgo Público",
    area: "Incidencia",
    estado: "activa",
    modalidad: "Híbrido",
    ubicacion: "Bucaramanga",
    tipoContrato: "Contrato laboral a término indefinido",
    salario: "$2.800.000 - $3.500.000 mensual",
    resumen:
      "Investigar problemáticas públicas regionales y articular espacios de diálogo multiactor como foros ciudadanos, escuelas de liderazgo público y mesas de co-creación en Santander.",
    objetivoRol:
      "Fortalecer la línea de incidencia pública y ciudadana de CLAP mediante investigación aplicada, articulación con actores institucionales y acompañamiento técnico a espacios de deliberación democrática.",
    responsabilidades: [
      "Elaborar diagnósticos, documentos de análisis e insumos técnicos sobre retos sociales y públicos de la región.",
      "Apoyar el diseño metodológico de espacios como el Congreso Multipartidista, Sinergia Social y foros ciudadanos.",
      "Articular alianzas con universidades, organizaciones civiles, sector privado y entidades públicas.",
      "Sistematizar memorias, propuestas ciudadanas y hojas de ruta derivadas de mesas de trabajo.",
    ],
    requisitos: [
      "Profesional en Ciencia Política, Derecho, Economía, Gobierno y Asuntos Públicos o afines.",
      "3 años de experiencia en análisis de políticas públicas, incidencia social o articulación institucional.",
      "Excelente capacidad de redacción analítica y vocería institucional.",
    ],
    experiencia: "3 años en incidencia pública, investigación social o asuntos públicos",
    conocimientosHabilidades: [
      "Análisis de políticas públicas y contexto regional latinoamericano",
      "Relacionamiento con actores públicos, académicos y sociedad civil",
      "Moderación de paneles y mesas de diálogo plural",
      "Investigación cualitativa y redacción de informes ejecutivos",
    ],
    documentosPostulacion: DOCUMENTOS_ESTANDAR,
    informacionAdicional:
      "Completa el formulario oficial de postulación indicando el cargo al que aplicas.",
    correoPostulacion: TALENTO_HUMANO_EMAIL,
    enlacePostulacion: POSTULACION_FORM_URL,
  },
  {
    id: "estratega-marca-comunicaciones",
    cargo: "Estratega de Marca y Comunicación Digital",
    area: "Marca y Comunicaciones",
    estado: "activa",
    modalidad: "Presencial",
    ubicacion: "Bucaramanga",
    tipoContrato: "Contrato laboral a término indefinido",
    salario: "$2.600.000 - $3.200.000 mensual",
    resumen:
      "Planear y ejecutar la estrategia narrativa, visual y digital de CLAP y sus programas, asegurando coherencia con la identidad de marca y amplificando el impacto de nuestras iniciativas.",
    objetivoRol:
      "Liderar la creación de contenidos estratégicos y campañas multicanal que posicionen el propósito, los programas educativos y los eventos de CLAP en América Latina.",
    responsabilidades: [
      "Diseñar y ejecutar el plan editorial y de campañas digitales para las redes y canales institucionales de CLAP.",
      "Velar por la correcta aplicación del Manual de Marca CLAP en piezas gráficas, audiovisuales y web.",
      "Cubrir y documentar historias de impacto, testimonios de becarios, eventos y proyectos en territorio.",
      "Analizar métricas de alcance, interacción y conversión para optimizar las convocatorias de formación.",
    ],
    requisitos: [
      "Profesional en Comunicación Social, Diseño Gráfico, Publicidad, Mercadeo o carreras afines.",
      "2 a 3 años de experiencia en estrategia de contenidos, branding y gestión de ecosistemas digitales.",
      "Portafolio comprobable de campañas, dirección visual o creación de contenido.",
    ],
    experiencia: "2 a 3 años en comunicación estratégica y contenidos digitales",
    conocimientosHabilidades: [
      "Storytelling de impacto social y redacción creativa",
      "Dirección de arte, suite creativa y formatos audiovisuales cortos (Reels/Stories)",
      "Gestión de pauta digital y analítica de redes sociales",
      "Criterio estético alineado a sistemas de diseño institucionales",
    ],
    documentosPostulacion: DOCUMENTOS_ESTANDAR,
    informacionAdicional:
      "Completa el formulario oficial de postulación adjuntando tu documentación requerida.",
    correoPostulacion: TALENTO_HUMANO_EMAIL,
    enlacePostulacion: POSTULACION_FORM_URL,
  },
  {
    id: "coordinador-academico-programas",
    cargo: "Coordinador Pedagógico de Programas Especializados",
    area: "Educación",
    estado: "activa",
    modalidad: "Híbrido",
    ubicacion: "Bucaramanga",
    tipoContrato: "Contrato laboral a término indefinido",
    salario: "$3.000.000 - $3.800.000 mensual",
    resumen:
      "Acompañar el diseño curricular, la facilitación y el seguimiento formativo de los Programas Especializados bajo la metodología CLAP (Explorar, Crear, Actuar y Resolver).",
    objetivoRol:
      "Garantizar la excelencia pedagógica y metodológica de las rutas de aprendizaje de CLAP, acompañando a mentores y estudiantes en el desarrollo de soluciones aplicadas a desafíos reales.",
    responsabilidades: [
      "Estructurar guías pedagógicas, sílabos y experiencias de aprendizaje basadas en la metodología CLAP.",
      "Coordinar y acompañar al equipo de mentores y facilitadores de los Programas Especializados.",
      "Hacer seguimiento al progreso académico y a los proyectos de intervención de cada cohorte.",
      "Sistematizar evaluaciones de aprendizaje y proponer mejoras continuas a la experiencia educativa.",
    ],
    requisitos: [
      "Profesional en Educación, Ciencias Sociales, Ingeniería, Administración o áreas afines (deseable posgrado).",
      "3 años de experiencia en diseño curricular, coordinación académica o facilitación de programas de liderazgo.",
      "Conocimiento en aprendizaje basado en retos o proyectos sociales.",
    ],
    experiencia: "3 años en coordinación pedagógica o diseño de programas formativos",
    conocimientosHabilidades: [
      "Diseño instruccional y metodologías activas de aprendizaje",
      "Acompañamiento a proyectos de innovación social en territorio",
      "Gestión de equipos docentes y mentores",
      "Evaluación de resultados formativos y sistematización pedagógica",
    ],
    documentosPostulacion: DOCUMENTOS_ESTANDAR,
    informacionAdicional:
      "Completa el formulario oficial de postulación adjuntando tu documentación requerida.",
    correoPostulacion: TALENTO_HUMANO_EMAIL,
    enlacePostulacion: POSTULACION_FORM_URL,
  },
];
