/**
 * Reubica la tarjeta de cuenta regresiva del hero de /programas según el
 * ancho de pantalla y la variante activa (personas/empresas):
 *   - Desktop (≥980px): vive en la segunda columna del grid del hero.
 *   - Tablet (560-979px): se mueve justo DESPUÉS del párrafo activo.
 *   - Mobile (<560px): se mueve justo ANTES del párrafo activo (entre el
 *     h1 y el párrafo) — una posición distinta a la de tablet, no la misma
 *     regla aplicada dos veces.
 * Se reevalúa en resize y cuando cambia el track (personas/empresas),
 * ya que cada variante tiene su propio párrafo `[data-heropara]`. Réplica
 * de positionCountdown(), ver INVENTARIO.md.
 */
export function attachCountdownPosition(root: HTMLElement): void {
  const cell = root.querySelector<HTMLElement>("[data-cdcell]");
  const grid = root.querySelector<HTMLElement>("[data-herogrid]");
  if (!cell || !grid) return;

  const activePara = (): HTMLElement | null => {
    let para: HTMLElement | null = null;
    root.querySelectorAll<HTMLElement>("[data-herovar]").forEach((v) => {
      if (!v.classList.contains("is-track-hidden")) {
        const p = v.querySelector<HTMLElement>("[data-heropara]");
        if (p) para = p;
      }
    });
    return para;
  };

  const position = () => {
    const w = window.innerWidth;
    const para = activePara();
    if (w < 560) {
      if (para && cell.nextElementSibling !== para) para.insertAdjacentElement("beforebegin", cell);
      cell.classList.add("is-inline");
    } else if (w < 980) {
      if (para && cell.previousElementSibling !== para) para.insertAdjacentElement("afterend", cell);
      cell.classList.add("is-inline");
    } else {
      if (cell.parentElement !== grid) grid.appendChild(cell);
      cell.classList.remove("is-inline");
    }
  };

  position();
  window.addEventListener("resize", position);
  document.addEventListener("programas:track-change", position);
}
