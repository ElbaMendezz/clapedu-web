/**
 * Plantilla del correo que recibe el equipo CLAP cuando alguien envía el
 * formulario de contacto. HTML con estilos inline y layout de tablas
 * (no CSS externo/flexbox/grid) porque así lo exigen los clientes de
 * correo — especialmente Outlook, que ignora <style> y la mayoría de
 * propiedades modernas. Colores tomados literalmente de las variables de
 * marca en src/styles/global.css.
 */

interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

const COLOR_INK = "#341c65";
const COLOR_INK_STRONG = "#43197c";
const COLOR_INK_SOFT = "#6b6786";
const COLOR_TEAL = "#3be0bb";
const COLOR_TEAL_DARK = "#13b89a";
const COLOR_BORDER = "#ece7f5";
const COLOR_BG = "#f4f1fa";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Preserva los saltos de línea del textarea al convertir a HTML. */
function messageToHtml(message: string): string {
  return escapeHtml(message).replace(/\n/g, "<br>");
}

export function buildContactEmail({ name, email, message }: ContactSubmission): {
  html: string;
  text: string;
} {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const receivedAt = new Date().toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nuevo mensaje de contacto</title>
  </head>
  <body style="margin:0; padding:0; background:${COLOR_BG}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR_BG}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:${COLOR_INK}; background:linear-gradient(125deg, #2a1457, ${COLOR_INK_STRONG} 45%, ${COLOR_TEAL_DARK}); border-radius:20px 20px 0 0; overflow:hidden;">
            <tr>
              <td style="padding:38px 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:rgba(59,224,187,0.16); border:1px solid rgba(59,224,187,0.4); border-radius:40px; padding:7px 16px; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:${COLOR_TEAL};">
                      CLAP &middot; Formulario web
                    </td>
                  </tr>
                </table>
                <h1 style="margin:20px 0 0; font-family:Arial, Helvetica, sans-serif; font-weight:800; font-size:26px; line-height:1.2; color:#ffffff;">
                  Nuevo mensaje de contacto
                </h1>
                <p style="margin:10px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.5; color:rgba(255,255,255,0.82);">
                  Alguien acaba de escribir desde el formulario de clapedu.org.
                </p>
              </td>
            </tr>
          </table>

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:0 0 20px 20px; box-shadow:0 30px 60px -30px rgba(52,28,101,0.35);">
            <tr>
              <td style="padding:36px 40px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:22px; border-bottom:1px solid ${COLOR_BORDER};">
                      <p style="margin:0 0 6px; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${COLOR_TEAL_DARK};">
                        Nombre
                      </p>
                      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:16px; color:${COLOR_INK};">
                        ${safeName}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:20px; padding-bottom:22px; border-bottom:1px solid ${COLOR_BORDER};">
                      <p style="margin:0 0 6px; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${COLOR_TEAL_DARK};">
                        Correo
                      </p>
                      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:16px;">
                        <a href="mailto:${safeEmail}" style="color:${COLOR_INK}; text-decoration:none;">${safeEmail}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:20px; padding-bottom:6px;">
                      <p style="margin:0 0 6px; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${COLOR_TEAL_DARK};">
                        Mensaje
                      </p>
                      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.65; color:${COLOR_INK_SOFT};">
                        ${messageToHtml(message)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:46px; background:${COLOR_TEAL};">
                      <a href="mailto:${safeEmail}" style="display:inline-block; padding:14px 26px; font-family:Arial, Helvetica, sans-serif; font-weight:700; font-size:14.5px; color:${COLOR_INK}; text-decoration:none;">
                        Responder a ${safeName}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 36px;">
                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12.5px; line-height:1.6; color:#9b96b3;">
                  Recibido el ${receivedAt} (hora Colombia) a través del formulario de contacto en
                  <a href="https://clapedu.org" style="color:${COLOR_TEAL_DARK}; text-decoration:none;">clapedu.org</a>.
                  Responde directamente a este correo para escribirle a ${safeName}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Nuevo mensaje de contacto — clapedu.org",
    "",
    `Nombre: ${name}`,
    `Correo: ${email}`,
    "",
    "Mensaje:",
    message,
    "",
    `Recibido el ${receivedAt} (hora Colombia).`,
  ].join("\n");

  return { html, text };
}
