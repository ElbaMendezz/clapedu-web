/**
 * Reubica el grid de 4 tarjetas de "Aprender haciendo" (/programas) según
 * el ancho: en mobile (<560px) las tarjetas se mueven justo DESPUÉS del
 * h2, quedando entre el título y el bloque de párrafos colapsable
 * (orden visual: título → tarjetas → texto); en desktop (≥560px) vuelven
 * a su columna original del grid. Réplica del bloque de
 * `applyResponsive()` que mueve `[data-manifcards]`, ver INVENTARIO.md.
 */
export function attachManifCardsPosition(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>("[data-manifgrid]");
  const cards = root.querySelector<HTMLElement>("[data-manifcards]");
  const h2 = root.querySelector<HTMLElement>("[data-manifh2]");
  if (!grid || !cards || !h2) return;

  const position = () => {
    if (window.innerWidth < 560) {
      if (h2.nextElementSibling !== cards) h2.insertAdjacentElement("afterend", cards);
    } else {
      if (cards.parentElement !== grid) grid.appendChild(cards);
    }
  };

  position();
  window.addEventListener("resize", position);
}
