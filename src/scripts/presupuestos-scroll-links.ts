import { scrollToId } from "./presupuestos-ui";

/**
 * Botones/enlaces con `data-scroll-to="<id>"`: scroll suave hacia la sección,
 * como los `scrollIntoView({ behavior: 'smooth' })` del original. Los demás
 * enlaces `href="#…"` (navbar, footer) saltan sin animación, también como el
 * original, que no define `scroll-behavior` global.
 */
export function attachScrollLinks(): void {
  document.addEventListener("click", (event) => {
    const trigger = (event.target as Element).closest<HTMLElement>("[data-scroll-to]");
    if (!trigger?.dataset.scrollTo) return;
    event.preventDefault();
    scrollToId(trigger.dataset.scrollTo);
  });
}
