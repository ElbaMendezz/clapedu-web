/**
 * Lectura de las vacantes desde la Google Sheet pública de Talento Humano.
 *
 * Port del servicio del prototipo ("trabaja con nosotros"), pero solo del lado
 * servidor: aquí no hay CORS, así que basta el CSV de gviz y se elimina el
 * respaldo JSONP del navegador. La hoja es contenido editable por terceros, así
 * que todo enlace que sale de ella se sanea (ver `sanearEnlace`/`sanearImagen`).
 */
import {
  AREAS_CLAP,
  DOCUMENTOS_ESTANDAR,
  POSTULACION_FORM_URL,
  TALENTO_HUMANO_EMAIL,
} from "../../data/vacantes";
import type { AreaClap, EstadoVacante, Vacante } from "./types";

export interface ConfigHoja {
  id: string;
  gid?: string;
}

/** Hoja conectada actualmente (la misma del prototipo). Se puede sobrescribir
 * con VACANTES_SHEET_ID / VACANTES_SHEET_GID (ver .env.example). */
const HOJA_ID_POR_DEFECTO = "151kEyiRZB6gG7UKHVVgQgnqyQ3bl0fROjfuoJN-3CsM";
const HOJA_GID_POR_DEFECTO = "965160966";

const TIMEOUT_MS = 5000;

type FilaCruda = Record<string, string>;

/** Acepta el ID limpio o la URL completa de la hoja (con `?gid=` opcional). */
export function resolverConfigHoja(
  env: Record<string, string | undefined> = process.env,
): ConfigHoja | null {
  const origen = env.VACANTES_SHEET_ID?.trim() || HOJA_ID_POR_DEFECTO;
  let gid = env.VACANTES_SHEET_GID?.trim() || HOJA_GID_POR_DEFECTO;

  const gidEnUrl = origen.match(/[?&#]gid=([0-9]+)/);
  if (gidEnUrl?.[1]) gid = gidEnUrl[1];

  const enUrl = origen.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = enUrl ? enUrl[1] : origen;

  if (!id || id.length < 15) return null;
  return { id, gid };
}

/** Normaliza encabezados y textos: sin tildes, minúsculas y sin signos. */
function normalizarClave(valor: string): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(valor: string): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parser RFC-4180 del CSV de Google Sheets (soporta comas y saltos de línea dentro de celdas). */
function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;

  const csv = texto.replace(/^﻿/, "");

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const sig = csv[i + 1];

    if (entreComillas) {
      if (ch === '"' && sig === '"') {
        celda += '"';
        i++;
      } else if (ch === '"') {
        entreComillas = false;
      } else {
        celda += ch;
      }
    } else if (ch === '"') {
      entreComillas = true;
    } else if (ch === ",") {
      fila.push(celda);
      celda = "";
    } else if (ch === "\r" && sig === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else {
      celda += ch;
    }
  }

  if (celda.length > 0 || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }

  return filas;
}

function matrizAObjetos(matriz: string[][]): FilaCruda[] {
  if (matriz.length < 2) return [];
  const encabezados = matriz[0].map((h, idx) => normalizarClave(h) || `col_${idx}`);
  const resultado: FilaCruda[] = [];

  for (let r = 1; r < matriz.length; r++) {
    const fila = matriz[r];
    if (!fila || fila.every((celda) => !String(celda || "").trim())) continue;
    const obj: FilaCruda = {};
    encabezados.forEach((h, idx) => {
      obj[h] = String(fila[idx] ?? "").trim();
    });
    resultado.push(obj);
  }

  return resultado;
}

async function descargarCsv(id: string, gid?: string): Promise<FilaCruda[]> {
  const consulta = gid ? `&gid=${encodeURIComponent(gid)}` : "";
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${consulta}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Google Sheets respondió HTTP ${res.status}`);

  const texto = await res.text();
  const inicio = texto.trimStart().slice(0, 15).toLowerCase();
  if (inicio.startsWith("<!doctype html") || inicio.startsWith("<html")) {
    throw new Error("La hoja de Google Sheets no tiene acceso público de lectura habilitado.");
  }
  return matrizAObjetos(parsearCsv(texto));
}

/** Primero la pestaña por `gid`; si falla, la primera pestaña del libro. */
async function cargarFilas({ id, gid }: ConfigHoja): Promise<FilaCruda[]> {
  try {
    return await descargarCsv(id, gid);
  } catch (error) {
    if (!gid) throw error;
    return await descargarCsv(id);
  }
}

/** Valor de la primera columna que coincida con algún alias (exacto, o parcial
 * para encabezados largos de Google Forms). La coincidencia parcial se omite
 * para claves muy cortas: "id" estaría contenido en "modalidad". */
function tomarCampo(fila: FilaCruda, alias: string[]): string {
  const normalizados = alias.map(normalizarClave);

  for (const a of normalizados) {
    if (a in fila && fila[a] !== "") return fila[a];
  }

  const claves = Object.keys(fila);
  for (const a of normalizados) {
    if (a.length < 3) continue;
    const clave = claves.find((k) => k.length >= 3 && (k.includes(a) || a.includes(k)));
    if (clave && fila[clave] !== "") return fila[clave];
  }

  return "";
}

/** Celdas multilínea o separadas por ";" → viñetas limpias. */
function separarLista(crudo: string): string[] {
  if (!crudo) return [];
  const partes = crudo.includes("\n") ? crudo.split(/\r?\n/) : crudo.split(";");
  return partes
    .map((item) => item.replace(/^\s*(?:[•\-*–—]+|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function etiquetaAreaPersonalizada(crudo: string): string {
  const limpio = crudo.trim().replace(/\s+/g, " ");
  if (!limpio) return "General";
  if (limpio === limpio.toLowerCase()) return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  return limpio;
}

/** Área oficial (sin importar tildes/mayúsculas) o, si es nueva, se conserva
 * para que aparezca su propio filtro en la web. */
function resolverArea(crudo: string, registro: Map<string, string>): AreaClap {
  const norm = normalizarClave(crudo);
  if (!norm) return "General";

  const oficial = AREAS_CLAP.find((area) => normalizarClave(area) === norm);
  if (oficial) return oficial;

  const existente = registro.get(norm);
  if (existente) return existente;

  const formateada = etiquetaAreaPersonalizada(crudo);
  registro.set(norm, formateada);
  return formateada;
}

/** `null` retira la vacante de la página pública (Oculta, Borrador, etc.). */
function resolverEstado(crudo: string): EstadoVacante | null {
  const norm = normalizarClave(crudo);
  if (!norm) return "activa";
  if (/ocult|elimin|borrad|inactiv|pausad|archiv|no publicar/.test(norm)) return null;
  if (/cerrad|finaliz|vencid/.test(norm)) return "cerrada";
  return "activa";
}

/** Solo http(s) y mailto: nada de `javascript:`, `data:` y similares. */
function sanearEnlace(crudo: string): string | undefined {
  const limpio = crudo.trim();
  if (!limpio) return undefined;
  if (/^mailto:[^\s]+$/i.test(limpio)) return limpio;
  try {
    const url = new URL(limpio);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** http(s) o ruta absoluta del propio sitio; convierte enlaces compartidos de
 * Drive en una URL de imagen embebible. */
function sanearImagen(crudo: string): string | undefined {
  const limpio = crudo.trim();
  if (!limpio) return undefined;

  if (limpio.includes("drive.google.com")) {
    const idDrive =
      limpio.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || limpio.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (idDrive?.[1]) return `https://lh3.googleusercontent.com/d/${idDrive[1]}=w1200`;
  }

  if (limpio.startsWith("/") && !limpio.startsWith("//")) return limpio;
  const enlace = sanearEnlace(limpio);
  return enlace && !enlace.toLowerCase().startsWith("mailto:") ? enlace : undefined;
}

/** `2026-10-01`, `1/10/2026` o `01/10/2026` (Sheets en es-CO: día/mes/año) → ISO. */
function normalizarFecha(crudo: string): string | undefined {
  const limpio = crudo.trim();
  if (!limpio) return undefined;

  let anio: number, mes: number, dia: number;
  const iso = limpio.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const latino = limpio.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (iso) {
    [anio, mes, dia] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (latino) {
    [dia, mes, anio] = [Number(latino[1]), Number(latino[2]), Number(latino[3])];
  } else {
    return undefined;
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    return undefined;
  }
  return fecha.toISOString().slice(0, 10);
}

/** Descarga la hoja y la convierte en `Vacante[]` listas para renderizar. */
export async function leerVacantesDeHoja(config: ConfigHoja): Promise<Vacante[]> {
  const filas = await cargarFilas(config);
  const idsUsados = new Set<string>();
  const registroAreas = new Map<string, string>();
  const vacantes: Vacante[] = [];

  for (const fila of filas) {
    const cargo = tomarCampo(fila, [
      "cargo",
      "nombre del cargo",
      "titulo de la vacante",
      "vacante",
      "puesto",
    ]);
    // Filas vacías o de ejemplo sin cargo
    if (!cargo) continue;

    const estado = resolverEstado(tomarCampo(fila, ["estado", "estatus", "estado de la convocatoria"]));
    if (estado === null) continue;

    const idBase =
      slugify(tomarCampo(fila, ["id", "slug", "identificador"]) || cargo) ||
      `vacante-${vacantes.length + 1}`;
    let id = idBase;
    for (let n = 2; idsUsados.has(id); n++) id = `${idBase}-${n}`;
    idsUsados.add(id);

    const area = resolverArea(tomarCampo(fila, ["area", "area de trabajo", "equipo"]), registroAreas);
    const objetivoRol = tomarCampo(fila, [
      "objetivo del rol",
      "objetivo",
      "descripcion del cargo",
      "descripcion general",
    ]);
    const resumen =
      tomarCampo(fila, ["resumen corto", "resumen", "descripcion corta"]) ||
      objetivoRol ||
      `Convocatoria abierta para el cargo de ${cargo} en el área de ${area} de CLAP.`;

    const perfilRequerido = tomarCampo(fila, [
      "perfil requerido",
      "perfil",
      "formacion academica",
      "profesion",
    ]);
    const responsabilidades = separarLista(
      tomarCampo(fila, ["responsabilidades", "responsabilidades principales", "funciones"]),
    );
    const listaRequisitos = separarLista(
      tomarCampo(fila, ["requisitos", "requisitos y experiencia", "requisitos indispensables"]),
    );
    const conocimientos = separarLista(
      tomarCampo(fila, [
        "habilidades y herramientas",
        "conocimientos y habilidades",
        "conocimientos",
        "habilidades",
        "herramientas",
        "enfoque del cargo",
      ]),
    );
    const documentos = separarLista(
      tomarCampo(fila, ["documentos requeridos", "documentos", "soportes requeridos"]),
    );

    vacantes.push({
      id,
      cargo,
      area,
      estado,
      modalidad: tomarCampo(fila, ["modalidad de trabajo", "modalidad"]) || undefined,
      ubicacion: tomarCampo(fila, ["ciudad", "ubicacion", "lugar", "sede"]) || undefined,
      tipoContrato: tomarCampo(fila, ["tipo de contrato", "contrato", "vinculacion"]) || undefined,
      salario: tomarCampo(fila, ["salario", "asignacion salarial", "rango salarial"]) || undefined,
      resumen,
      objetivoRol: objetivoRol || resumen,
      perfilRequerido: perfilRequerido || undefined,
      responsabilidades: responsabilidades.length > 0 ? responsabilidades : undefined,
      requisitos:
        listaRequisitos.length > 0 ? listaRequisitos : perfilRequerido ? [perfilRequerido] : undefined,
      experiencia:
        tomarCampo(fila, ["experiencia", "experiencia minima", "anos de experiencia"]) || undefined,
      conocimientosHabilidades: conocimientos.length > 0 ? conocimientos : undefined,
      documentosPostulacion: documentos.length > 0 ? documentos : DOCUMENTOS_ESTANDAR,
      informacionAdicional:
        tomarCampo(fila, ["informacion adicional", "notas de postulacion", "instrucciones"]) ||
        "Completa el formulario oficial de postulación adjuntando tu documentación requerida.",
      correoPostulacion:
        tomarCampo(fila, ["correo recepcion", "correo", "correo postulacion", "email"]) ||
        TALENTO_HUMANO_EMAIL,
      enlacePostulacion:
        sanearEnlace(
          tomarCampo(fila, [
            "link de postulacion",
            "enlace de postulacion",
            "url formulario",
            "formulario de postulacion",
          ]),
        ) ?? POSTULACION_FORM_URL,
      piezaGraficaUrl: sanearImagen(
        tomarCampo(fila, ["url pieza grafica", "pieza grafica", "imagen", "flyer"]),
      ),
      fechaPublicacion: normalizarFecha(
        // Sin alias genérico "fecha": la coincidencia parcial podría leer "fecha de cierre".
        tomarCampo(fila, ["fecha de publicacion", "fecha publicacion"]),
      ),
    });
  }

  return vacantes;
}
