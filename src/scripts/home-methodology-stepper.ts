/**
 * Stepper de 4 fases (versión home, sección #metodologia) — distinto del
 * stepper de /metodologia. Desktop: click/hover cambia panel visible
 * (superpuestos, absolutos dentro de .step-stage). Móvil: acordeón — cada
 * panel se reubica justo después de su item (mismo mecanismo que el
 * original, layoutMet()), click abre/cierra (un panel abierto a la vez).
 * Réplica de setupMetodologia()/setMet()/openMetAcc()/toggleMetAcc()/
 * metHighlight(), ver INVENTARIO.md.
 *
 * El color/estado activo lo resuelve CSS vía la clase `is-active` +
 * selectores de atributo `[data-step]` — este módulo solo alterna estado
 * y mueve los paneles de contenedor, no mete colores inline.
 *
 * Nota: el original define metScrollSync() y centerMetItem() (auto-abrir
 * acordeón según scroll + centrar con scroll suave) pero NUNCA las invoca
 * en ningún listener — es código muerto. No se migra: el acordeón móvil es
 * un toggle simple por click, tal como se comporta realmente el sitio.
 */
export function attachHomeMethodologyStepper(root: HTMLElement, desktopBreakpoint = 768): void {
  const list = root.querySelector<HTMLElement>("[data-met-list]");
  const stage = root.querySelector<HTMLElement>("[data-met-stage]");
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-met-item]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-met-panel]"));
  if (!list || !stage || !items.length || !panels.length) return;

  let mode: "grid" | "acc" = "grid";
  let accOpen = 0;

  const highlight = (i: number) => {
    items.forEach((item, idx) => item.classList.toggle("is-active", idx === i));
  };

  const setActiveGrid = (i: number) => {
    highlight(i);
    panels.forEach((panel, idx) => panel.classList.toggle("is-active", idx === i));
  };

  const openAccordion = (i: number) => {
    accOpen = i;
    highlight(i);
    panels.forEach((panel, idx) => {
      const active = idx === i;
      panel.classList.toggle("is-active", active);
      panel.style.maxHeight = active ? `${panel.scrollHeight + 40}px` : "0px";
    });
  };

  const toggleAccordion = (i: number) => {
    if (accOpen === i) {
      accOpen = -1;
      highlight(-1);
      panels[i].classList.remove("is-active");
      panels[i].style.maxHeight = "0px";
    } else {
      openAccordion(i);
    }
  };

  items.forEach((item, i) => {
    item.addEventListener("click", () => {
      if (mode === "acc") toggleAccordion(i);
      else setActiveGrid(i);
    });
    item.addEventListener("mouseenter", () => {
      if (mode === "grid") setActiveGrid(i);
    });
  });

  const layoutAccordion = () => {
    items.forEach((item, i) => item.insertAdjacentElement("afterend", panels[i]));
    panels.forEach((panel) => (panel.style.maxHeight = "0px"));
    accOpen = -1;
    openAccordion(0);
  };

  const layoutGrid = () => {
    panels.forEach((panel) => {
      stage.appendChild(panel);
      panel.style.maxHeight = "";
    });
    setActiveGrid(accOpen >= 0 ? accOpen : 0);
  };

  const mq = window.matchMedia(`(max-width: ${desktopBreakpoint - 1}px)`);
  const applyMode = (isMobile: boolean) => {
    mode = isMobile ? "acc" : "grid";
    if (isMobile) layoutAccordion();
    else layoutGrid();
  };
  applyMode(mq.matches);
  mq.addEventListener("change", (e) => applyMode(e.matches));
}
