/**
 * Tarjetas 3D volteables del Equipo Directivo (`equipo.html`): en desktop
 * (`@media(hover:hover)`) el volteo ya es 100% CSS vía `:hover`, sin JS. El
 * click añade un "candado" que fija la tarjeta abierta incluso sin hover —
 * pensado para touch, pero funciona igual en desktop — y un segundo click
 * lo libera. Réplica de setupEquipo() (la parte de flip; `syncAvatar()` no
 * se portó: era exclusiva del custom element `<image-slot>` del mockup para
 * copiar la foto ya elegida del frente al avatar del reverso — acá el
 * avatar del reverso usa directamente el mismo recurso importado en Astro,
 * no hace falta sincronizar nada en runtime). Ver INVENTARIO.md.
 */
export function attachFlipCards(root: ParentNode): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-flipcard]"));

  cards.forEach((card) => {
    const inner = card.querySelector<HTMLElement>("[data-flipinner]");
    if (!inner) return;
    card.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("a")) return;
      const locked = inner.classList.contains("is-locked");
      if (locked) {
        inner.classList.remove("is-locked", "is-open");
      } else {
        inner.classList.add("is-locked", "is-open");
      }
    });
  });
}
