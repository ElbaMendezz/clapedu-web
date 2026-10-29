export type EstadoVacante = "activa" | "cerrada";

export type AreaClapOficial =
  | "Administrativo y Financiero"
  | "Comunidad"
  | "Incidencia"
  | "Marca y Comunicaciones"
  | "Proyectos"
  | "Educación"
  | "Cultura Organizacional";

/** Las 7 áreas oficiales, más cualquier área nueva que Talento Humano cree
 * desde la hoja (ej. "Salud"). `string & {}` conserva el autocompletado de
 * las oficiales sin cerrar el tipo. */
export type AreaClap = AreaClapOficial | (string & {});

export interface Vacante {
  /** Identificador para la URL amigable (ej: "coordinador-contable"). */
  id: string;
  cargo: string;
  area: AreaClap;
  estado: EstadoVacante;
  /** Presencial, Híbrido, Remoto. */
  modalidad?: string;
  ubicacion?: string;
  tipoContrato?: string;
  /** Salario o rango autorizado para publicación, ya formateado. */
  salario?: string;
  /** Resumen corto para la tarjeta del listado. */
  resumen: string;
  objetivoRol: string;
  responsabilidades?: string[];
  /** Resumen del perfil académico para la tarjeta del listado. */
  perfilRequerido?: string;
  requisitos?: string[];
  experiencia?: string;
  conocimientosHabilidades?: string[];
  documentosPostulacion?: string[];
  informacionAdicional?: string;
  correoPostulacion?: string;
  /** Enlace de postulación; solo http(s) o mailto (ver `hoja.ts`). */
  enlacePostulacion: string;
  /** URL de la pieza gráfica oficial; solo http(s) o ruta absoluta del sitio. */
  piezaGraficaUrl?: string;
  /** Fecha ISO (YYYY-MM-DD). Necesaria para emitir el JSON-LD JobPosting. */
  fechaPublicacion?: string;
}
