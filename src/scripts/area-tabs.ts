/**
 * Tabs de "Equipos por área" (equipo.html): click selecciona un área,
 * activa por defecto "Marca y Comunicaciones" (índice 3, la única con
 * integrantes reales por ahora). Panel activo: display block + fade/slide,
 * mismo patrón que el stepper de fases de /metodologia. Réplica de
 * setArea(), ver INVENTARIO.md.
 */
export function attachAreaTabs(root: ParentNode): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-areatab]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-areapanel]"));
  if (!tabs.length || !panels.length) return;

  const setArea = (i: number) => {
    tabs.forEach((tab, idx) => tab.classList.toggle("is-active", idx === i));
    panels.forEach((panel, idx) => {
      if (idx === i) {
        panel.classList.add("is-active");
        requestAnimationFrame(() => panel.classList.add("is-visible"));
      } else {
        panel.classList.remove("is-active", "is-visible");
      }
    });
  };

  tabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => setArea(idx));
  });

  setArea(3);
}
