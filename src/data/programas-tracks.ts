import type { ImageMetadata } from "astro";
import logoComunidad from "../assets/images/programas-logo-comunidad.webp";
import logoGestion from "../assets/images/programas-logo-gestion.webp";
import logoPolitica from "../assets/images/programas-logo-politica.webp";
import bgComunidad from "../assets/images/programas-bg-comunidad.webp";
import bgComunidadFoto from "../assets/images/programas-bg-comunidad-foto.webp";
import bgSostenibilidad from "../assets/images/programas-bg-sostenibilidad.webp";
import bgGestionFoto from "../assets/images/programas-bg-gestion-foto.webp";
import bgImpacto from "../assets/images/programas-bg-impacto.webp";
import bgPoliticasFoto from "../assets/images/programas-bg-politicas-foto.webp";

export interface DevelItem {
  label: string;
  iconPaths: string;
  useLogo?: boolean;
}

export interface Program {
  key: string;
  logo: ImageMetadata;
  logoAlt: string;
  tabName: string;
  focus: string;
  badgeLabel: string;
  title: string;
  subtitle: string;
  desc: string;
  perfilEgreso: string;
  bgImage: ImageMetadata;
  bgPhotoOverlay: ImageMetadata;
  hasExtraDarkOverlay: boolean;
  hasRing: boolean;
  logoImgSize: number;
  develItems: DevelItem[];
}

/**
 * Los 3 programas (Comunidad/Sostenibilidad/Impacto institucional) son
 * contenido idéntico entre "Elige tu ruta" (Rutas.astro, track personas)
 * y "Círculo Empresas que Lideran" (CirculoEmpresas.astro, track
 * empresas) — verificado texto por texto contra el original, no es una
 * coincidencia. Se comparte esta fuente única para evitar que ambas
 * copias diverjan. El CTA de cada panel SÍ difiere entre ambos usos
 * (WhatsApp/"Conocer este programa" vs formulario/"Vincular mi empresa a
 * este programa"), por eso queda fuera de este dato y cada componente lo
 * renderiza por su cuenta.
 */
export const programs: Program[] = [
  {
    key: "comunidad",
    logo: logoComunidad,
    logoAlt: "Comunidad",
    tabName: "Liderazgo y Gestión Comunitaria",
    focus: "Comunidad",
    badgeLabel: "Programa · Comunidad",
    title: "Liderazgo y Gestión Comunitaria",
    subtitle: "Lidera procesos de transformación desde el territorio.",
    desc: "Aprende a identificar problemáticas sociales, movilizar comunidades y gestionar proyectos con enfoque de derechos humanos y desarrollo territorial.",
    perfilEgreso: "Estarás preparado para liderar procesos comunitarios, coordinar iniciativas sociales y promover transformaciones sostenibles en tu territorio.",
    bgImage: bgComunidad,
    bgPhotoOverlay: bgComunidadFoto,
    hasExtraDarkOverlay: false,
    hasRing: false,
    logoImgSize: 60,
    develItems: [
      { label: "Liderazgo comunitario", iconPaths: "", useLogo: true },
      {
        label: "Gestión de proyectos sociales",
        iconPaths:
          '<rect width="8" height="4" x="8" y="2" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path>',
      },
      {
        label: "Diagnóstico e intervención territorial",
        iconPaths: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
      },
      {
        label: "Participación ciudadana",
        iconPaths: '<path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>',
      },
      {
        label: "Trabajo con comunidades",
        iconPaths:
          '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>',
      },
    ],
  },
  {
    key: "sostenibilidad",
    logo: logoGestion,
    logoAlt: "Sostenibilidad",
    tabName: "Gestión de Organizaciones Sociales",
    focus: "Sostenibilidad",
    badgeLabel: "Programa · Sostenibilidad",
    title: "Gestión de Organizaciones Sociales",
    subtitle: "Convierte las buenas causas en organizaciones sostenibles.",
    desc: "Desarrolla las capacidades necesarias para dirigir fundaciones, ONG y proyectos sociales con modelos de gestión eficientes y sostenibles.",
    perfilEgreso: "Podrás fortalecer organizaciones sociales, optimizar sus procesos y ampliar su capacidad de generar impacto.",
    bgImage: bgSostenibilidad,
    bgPhotoOverlay: bgGestionFoto,
    hasExtraDarkOverlay: true,
    hasRing: true,
    logoImgSize: 46,
    develItems: [
      {
        label: "Planeación estratégica",
        iconPaths: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
      },
      {
        label: "Sostenibilidad financiera",
        iconPaths:
          '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v12"></path><path d="M15 9.5a2.5 2.5 0 0 0-2.5-2.5h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 1 0 5h-1A2.5 2.5 0 0 1 9 14.5"></path>',
      },
      {
        label: "Marketing social",
        iconPaths: '<path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>',
      },
      {
        label: "Gestión de equipos",
        iconPaths:
          '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
      },
      {
        label: "Evaluación de impacto",
        iconPaths:
          '<path d="M3 3v18h18"></path><rect x="7" y="11" width="3" height="6" rx="1"></rect><rect x="12" y="7" width="3" height="10" rx="1"></rect><rect x="17" y="13" width="3" height="4" rx="1"></rect>',
      },
    ],
  },
  {
    key: "impacto",
    logo: logoPolitica,
    logoAlt: "Impacto institucional",
    tabName: "Políticas Públicas y Gestión del Desarrollo",
    focus: "Impacto institucional",
    badgeLabel: "Programa · Impacto institucional",
    title: "Políticas Públicas y Gestión del Desarrollo",
    subtitle: "Diseña soluciones para los desafíos públicos actuales.",
    desc: "Fortalece tus capacidades para analizar problemas públicos, formular políticas y gestionar proyectos orientados al desarrollo.",
    perfilEgreso: "Estarás preparado para liderar iniciativas públicas y contribuir al fortalecimiento institucional desde una perspectiva de desarrollo.",
    bgImage: bgImpacto,
    bgPhotoOverlay: bgPoliticasFoto,
    hasExtraDarkOverlay: false,
    hasRing: true,
    logoImgSize: 46,
    develItems: [
      {
        label: "Diseño de políticas públicas",
        iconPaths: '<path d="M14 2v6h6"></path><path d="M4 22V4a2 2 0 0 1 2-2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path><path d="M9 13h6M9 17h4"></path>',
      },
      {
        label: "Análisis de datos y evidencia",
        iconPaths: '<path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path>',
      },
      {
        label: "Gestión pública",
        iconPaths: '<path d="M3 21h18"></path><path d="m12 3 8 5H4l8-5Z"></path><path d="M5 21V10M19 21V10M9 21V10M15 21V10"></path>',
      },
      {
        label: "Gobernanza y transparencia",
        iconPaths: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="m9 12 2 2 4-4"></path>',
      },
      {
        label: "Desarrollo territorial",
        iconPaths: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path>',
      },
    ],
  },
];
