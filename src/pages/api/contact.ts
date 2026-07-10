// Ruta on-demand (no se prerenderiza): necesita ejecutarse en cada
// request para poder llamar a la API de Resend con la clave secreta del
// servidor. El resto del sitio sigue siendo 100% estático — ver
// astro.config.mjs.
export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";
import { buildContactEmail } from "../../lib/contact-email";

const TO_EMAIL = "elba.mendez@clapedu.org";
const FROM_EMAIL = "CLAP — Formulario web <no-reply@clapedu.org>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { name: 120, email: 200, message: 5000 } as const;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Solicitud inválida." }, 400);
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const message = String(payload.message ?? "").trim();
  // Honeypot: campo oculto para personas, invisible por CSS. Si viene
  // relleno es un bot; respondemos "ok" sin enviar nada, para no
  // delatarle que fue detectado.
  const honeypot = String(payload.company ?? "").trim();
  if (honeypot) {
    return jsonResponse({ ok: true }, 200);
  }

  if (!name || !email || !message) {
    return jsonResponse({ error: "Todos los campos son obligatorios." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ error: "Ingresa un correo electrónico válido." }, 400);
  }
  if (
    name.length > MAX_LENGTHS.name ||
    email.length > MAX_LENGTHS.email ||
    message.length > MAX_LENGTHS.message
  ) {
    return jsonResponse({ error: "Uno de los campos supera el largo permitido." }, 400);
  }

  // process.env (no import.meta.env): con el adapter de Node, las
  // variables sin PUBLIC_ se leen en vivo del entorno del proceso en cada
  // request. import.meta.env quedaría "horneado" como literal dentro del
  // bundle en el momento del build, así que cambiar la variable en el
  // panel de Hostinger sin volver a compilar no tendría ningún efecto.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY no está configurada en el entorno del servidor.");
    return jsonResponse({ error: "El formulario no está disponible en este momento." }, 500);
  }

  const resend = new Resend(apiKey);
  const { html, text } = buildContactEmail({ name, email, message });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: email,
    subject: `Nuevo mensaje de contacto — ${name}`,
    html,
    text,
  });

  if (error) {
    console.error("Resend no pudo enviar el correo:", error);
    return jsonResponse({ error: "No se pudo enviar el mensaje. Intenta de nuevo." }, 502);
  }

  return jsonResponse({ ok: true }, 200);
};
