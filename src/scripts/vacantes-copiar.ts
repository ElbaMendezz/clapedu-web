/**
 * Botones "copiar" de /vacantes (correo de Talento Humano, enlace de la
 * vacante). Ver BotonCopiar.astro: el botón lleva el texto en `data-copiar` y
 * este script solo conmuta `data-copiado` durante unos segundos; el cambio de
 * etiqueta lo hace el CSS.
 */
const DURACION_MS = 2400;

async function copiarTexto(texto: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Cae al respaldo (contextos sin permiso de portapapeles, p. ej. iframes)
    }
  }

  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function attachCopiar(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>("[data-copiar]").forEach((boton) => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    boton.addEventListener("click", async () => {
      const texto = boton.dataset.copiar;
      if (!texto || !(await copiarTexto(texto))) return;

      boton.dataset.copiado = "true";
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        delete boton.dataset.copiado;
      }, DURACION_MS);
    });
  });
}
