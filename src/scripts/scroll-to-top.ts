/**
 * Botón flotante "volver arriba": aparece pasado un umbral de scroll y hace
 * scroll suave al tope. Réplica de setupToTop(), ver INVENTARIO.md §2.4.
 * Umbral unificado a 600px (el original variaba 480/500/600/900 según
 * página sin razón aparente — ver INVENTARIO.md §2.4, nota de inconsistencia).
 */
export function attachScrollToTop(button: HTMLButtonElement): void {
  const SHOW_THRESHOLD = 600;

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    button.classList.toggle("is-visible", y > SHOW_THRESHOLD);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}
