import type { Vacante } from "./types";

/** "Presencial en Bucaramanga", o lo que haya de modalidad/ubicación. */
export function modalidadTexto(vacante: Vacante): string | undefined {
  const { modalidad, ubicacion } = vacante;
  return modalidad && ubicacion ? `${modalidad} en ${ubicacion}` : modalidad || ubicacion;
}

/** Perfil para la tarjeta del listado: el resumen explícito o, si no hay, los
 * dos primeros requisitos ("Profesional en X (tarjeta profesional vigente)"). */
export function perfilTarjeta(vacante: Vacante): string | undefined {
  if (vacante.perfilRequerido) return vacante.perfilRequerido;
  const [principal, secundario] = vacante.requisitos ?? [];
  if (!principal) return undefined;
  return secundario ? `${principal} (${secundario.replace(/\.$/, "").toLowerCase()})` : principal;
}

/** Los enlaces `mailto:` abren en la misma pestaña; los http(s) en otra. */
export function esEnlaceExterno(href: string): boolean {
  return href.startsWith("http");
}

export function rutaVacante(id: string): string {
  return `/vacantes/${encodeURIComponent(id)}/`;
}
