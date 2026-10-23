import { setState } from "./presupuestos-ui";

/**
 * Acordeón de preguntas frecuentes. Igual que el original: una sola abierta a
 * la vez, la primera abierta por defecto, y volver a pulsar la abierta la
 * cierra. Sin animación de altura.
 */
export function attachFaq(root: HTMLElement): void {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-faq-item]"));
  let openIndex: number | null = 0;

  const render = (): void => {
    items.forEach((item, idx) => {
      const isOpen = openIndex === idx;
      setState(item, isOpen);
      item.querySelectorAll("[data-faq-mark], [data-faq-chevron]").forEach((el) => setState(el, isOpen));
      item.querySelector<HTMLElement>("[data-faq-btn]")?.setAttribute("aria-expanded", String(isOpen));
      const panel = item.querySelector<HTMLElement>("[data-faq-panel]");
      if (panel) panel.hidden = !isOpen;
    });
  };

  items.forEach((item, idx) => {
    item.querySelector("[data-faq-btn]")?.addEventListener("click", () => {
      openIndex = openIndex === idx ? null : idx;
      render();
    });
  });
}
