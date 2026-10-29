/**
 * JSON-LD `JobPosting` (schema.org) de una vacante, para Google for Jobs.
 *
 * Google exige `datePosted`; la hoja no siempre lo trae, así que sin
 * `fechaPublicacion` no se emite nada (mejor sin marcado que con uno inválido).
 */
import type { Vacante } from "./types";

const ORGANIZACION = {
  "@type": "Organization",
  "@id": "https://clapedu.org/#organization",
  name: "CLAP - Centro Latinoamericano del Propósito",
  sameAs: "https://clapedu.org/",
};

function tipoEmpleo(tipoContrato?: string): string | undefined {
  const t = (tipoContrato ?? "").toLowerCase();
  if (/medio tiempo|part/.test(t)) return "PART_TIME";
  if (/prestaci|servicios|freelance|contratista/.test(t)) return "CONTRACTOR";
  if (/pasant|practic/.test(t)) return "INTERN";
  if (/t[eé]rmino|laboral|indefinido|fijo/.test(t)) return "FULL_TIME";
  return undefined;
}

/** "$2.350.000 - $3.350.000 mensual" → { min: 2350000, max: 3350000 }. */
function rangoSalarial(salario?: string): { min: number; max: number } | undefined {
  const numeros = (salario ?? "").match(/\d[\d.]*/g)?.map((n) => Number(n.replaceAll(".", "")));
  if (!numeros?.length || numeros.some((n) => !Number.isFinite(n) || n <= 0)) return undefined;
  return { min: Math.min(...numeros), max: Math.max(...numeros) };
}

function escaparHtml(texto: string): string {
  return texto.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function descripcionHtml(vacante: Vacante): string {
  const partes = [`<p>${escaparHtml(vacante.objetivoRol)}</p>`];
  if (vacante.responsabilidades?.length) {
    const items = vacante.responsabilidades.map((r) => `<li>${escaparHtml(r)}</li>`).join("");
    partes.push(`<p>Responsabilidades principales:</p><ul>${items}</ul>`);
  }
  return partes.join("");
}

export function buildJobPosting(vacante: Vacante): Record<string, unknown> | null {
  if (vacante.estado !== "activa" || !vacante.fechaPublicacion) return null;

  const salario = rangoSalarial(vacante.salario);
  const empleo = tipoEmpleo(vacante.tipoContrato);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: vacante.cargo,
    description: descripcionHtml(vacante),
    datePosted: vacante.fechaPublicacion,
    ...(empleo && { employmentType: empleo }),
    hiringOrganization: ORGANIZACION,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(vacante.ubicacion && { addressLocality: vacante.ubicacion }),
        addressCountry: "CO",
      },
    },
    ...(salario && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "COP",
        value: {
          "@type": "QuantitativeValue",
          minValue: salario.min,
          maxValue: salario.max,
          unitText: "MONTH",
        },
      },
    }),
  };
}

const BACKSLASH = String.fromCodePoint(92);

/** Serializa para `<script type="application/ld+json" set:html>`: reemplaza
 * `<` por su escape JSON (barra invertida + "u003c") para que ningún texto de
 * la hoja pueda cerrar el <script>. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replaceAll("<", BACKSLASH + "u003c");
}
