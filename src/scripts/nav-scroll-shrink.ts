/**
 * Cambia el fondo del nav fijo al hacer scroll. Réplica de handleScroll(),
 * ver INVENTARIO.md §2.4. Umbral idéntico al original: 60px.
 */
export function attachNavScrollShrink(nav: HTMLElement): void {
  const SCROLL_THRESHOLD = 60;

  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    nav.classList.toggle("is-scrolled", y > SCROLL_THRESHOLD);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}
