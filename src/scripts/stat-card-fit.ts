/**
 * En mobile (<560px) las 4 tarjetas de datos de "Información del programa"
 * pasan a layout horizontal (ícono + número en una fila, etiqueta debajo).
 * El tamaño del número se calcula en runtime: se busca el mayor tamaño
 * (18px→11px) que quepa junto al ícono en las 4 tarjetas simultáneamente,
 * midiendo con un `<span>` invisible fuera de pantalla — el texto más
 * largo ("3 de agosto") es el que normalmente limita el tamaño. En
 * desktop el tamaño vuelve al valor fijo de 26px. Réplica del bloque
 * `[data-statgrid]` de `applyResponsive()`, ver INVENTARIO.md.
 */
export function attachStatCardFit(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>("[data-statgrid]");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(".stat-card"));
  if (!cards.length) return;

  const fit = () => {
    const nums = cards.map((card) => card.querySelector<HTMLElement>(".stat-num"));
    if (window.innerWidth >= 560) {
      nums.forEach((num) => {
        if (num) num.style.fontSize = "";
      });
      return;
    }
    const span = document.createElement("span");
    span.style.cssText = "visibility:hidden;position:absolute;white-space:nowrap;font-family:var(--font-display);font-weight:900;";
    document.body.appendChild(span);
    let best = 11;
    for (let fs = 18; fs >= 11; fs -= 1) {
      span.style.fontSize = `${fs}px`;
      let ok = true;
      cards.forEach((card, i) => {
        const num = nums[i];
        if (!num) return;
        const avail = card.clientWidth - 28 - 20 - 9;
        span.textContent = num.textContent ?? "";
        if (span.offsetWidth > avail) ok = false;
      });
      if (ok) {
        best = fs;
        break;
      }
    }
    span.remove();
    nums.forEach((num) => {
      if (num) num.style.fontSize = `${best}px`;
    });
  };

  fit();
  window.addEventListener("resize", fit);
}
