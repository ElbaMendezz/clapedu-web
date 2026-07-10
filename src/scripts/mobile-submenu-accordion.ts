/**
 * Acordeón de submenús dentro del menú móvil: al abrir uno se cierran los
 * demás. Réplica de setupMobileSubmenus(), ver INVENTARIO.md §2.4.
 */
export function attachMobileSubmenuAccordion(root: HTMLElement): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>("[data-msub-btn]");

  buttons.forEach((btn) => {
    const key = btn.getAttribute("data-msub-btn");
    const panel = root.querySelector<HTMLElement>(`[data-msub="${key}"]`);
    const chevron = root.querySelector<HTMLElement>(`[data-msub-chev="${key}"]`);
    if (!panel) return;

    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", () => {
      const isOpen = !!panel.style.maxHeight && panel.style.maxHeight !== "0px";

      buttons.forEach((other) => {
        if (other === btn) return;
        const otherKey = other.getAttribute("data-msub-btn");
        const otherPanel = root.querySelector<HTMLElement>(`[data-msub="${otherKey}"]`);
        const otherChevron = root.querySelector<HTMLElement>(`[data-msub-chev="${otherKey}"]`);
        if (otherPanel) otherPanel.style.maxHeight = "0px";
        if (otherChevron) otherChevron.style.transform = "rotate(0deg)";
        other.setAttribute("aria-expanded", "false");
      });

      if (isOpen) {
        panel.style.maxHeight = "0px";
        if (chevron) chevron.style.transform = "rotate(0deg)";
        btn.setAttribute("aria-expanded", "false");
      } else {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
        if (chevron) chevron.style.transform = "rotate(180deg)";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}
