/**
 * Fuente única de vacantes para las páginas SSR de /vacantes.
 *
 * Lee la hoja de Google Sheets con una caché en memoria del proceso:
 *  - dentro del TTL no se vuelve a pedir nada a Google;
 *  - si la hoja falla, se sirve la última lectura buena (stale-while-error) o,
 *    en frío, el respaldo curado de src/data/vacantes.ts;
 *  - tras un fallo se espera un rato corto antes de reintentar, para no
 *    golpear a Google en cada request mientras está caído.
 * Las peticiones simultáneas con la caché vencida comparten una sola lectura.
 */
import { VACANTES_RESPALDO } from "../../data/vacantes";
import { leerVacantesDeHoja, resolverConfigHoja } from "./hoja";
import type { Vacante } from "./types";

const TTL_OK_MS = 5 * 60 * 1000;
const TTL_ERROR_MS = 30 * 1000;

let cache: { vacantes: Vacante[]; expira: number } | null = null;
let enCurso: Promise<Vacante[]> | null = null;

/** Algunas filas de la hoja no traen pieza gráfica; si el respaldo curado
 * tiene una para el mismo id, se conserva. */
function conPiezaDeRespaldo(vacantes: Vacante[]): Vacante[] {
  return vacantes.map((vacante) => {
    if (vacante.piezaGraficaUrl) return vacante;
    const respaldo = VACANTES_RESPALDO.find((v) => v.id === vacante.id);
    return respaldo?.piezaGraficaUrl
      ? { ...vacante, piezaGraficaUrl: respaldo.piezaGraficaUrl }
      : vacante;
  });
}

async function refrescar(): Promise<Vacante[]> {
  const config = resolverConfigHoja();
  try {
    if (!config) throw new Error("VACANTES_SHEET_ID inválido");
    const vacantes = conPiezaDeRespaldo(await leerVacantesDeHoja(config));
    cache = { vacantes, expira: Date.now() + TTL_OK_MS };
    return vacantes;
  } catch (error) {
    console.error("[vacantes] No se pudo leer la hoja; se usa la última lectura o el respaldo.", error);
    const vacantes = cache?.vacantes ?? VACANTES_RESPALDO;
    cache = { vacantes, expira: Date.now() + TTL_ERROR_MS };
    return vacantes;
  }
}

export async function getVacantes(): Promise<Vacante[]> {
  if (cache && cache.expira > Date.now()) return cache.vacantes;
  enCurso ??= refrescar().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

export async function getVacante(id: string): Promise<Vacante | undefined> {
  return (await getVacantes()).find((vacante) => vacante.id === id);
}
