/**
 * Selector de rutas/programas de /programas (usado tanto en "Elige tu
 * ruta" como en "Círculo Empresas que Lideran", mismo mecanismo real).
 *
 * Desktop (≥900px): tabs horizontales, hover o click cambian cuál panel
 * se muestra (siempre exactamente uno visible, todos viven en el mismo
 * "stage").
 *
 * Mobile (<900px): acordeón — click en una tab expande su panel justo
 * debajo de ella (reparentado real de DOM, no solo mostrar/ocultar) y un
 * segundo click sobre la misma tab la vuelve a colapsar (ningún panel
 * abierto). Solo en mobile aparece un chevron por tab que rota 180° si
 * está abierta.
 *
 * Los 5 ítems de "Lo que desarrollarás" del panel activo se revelan con
 * stagger (translateX) la primera vez que la sección entra en viewport
 * (threshold 0.15); cambios de tab posteriores disparan el stagger de
 * inmediato, sin volver a esperar scroll.
 *
 * Réplica de setupProg()/setProg()/layoutProgAccordion()/staggerDevel(),
 * ver INVENTARIO.md.
 */
export interface ProgSelectorOptions {
  tabSelector: string;
  panelSelector: string;
  tabsContainerSelector: string;
}

export function attachProgSelector(root: HTMLElement, options: ProgSelectorOptions): void {
  const { tabSelector, panelSelector, tabsContainerSelector } = options;
  const tabsContainer = root.querySelector<HTMLElement>(tabsContainerSelector);
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(tabSelector));
  const panels = Array.from(root.querySelectorAll<HTMLElement>(panelSelector));
  if (!tabsContainer || !tabs.length || !panels.length) return;

  const stageHome = panels[0].parentElement!;
  let current = window.innerWidth < 900 ? -1 : 0;
  let everSeen = false;

  const staggerItems = (panel: HTMLElement | undefined) => {
    if (!panel) return;
    panel.querySelectorAll<HTMLElement>("[data-develitem]").forEach((item) => {
      item.classList.remove("is-visible");
      // Forzar reflow para reiniciar la transición en cada apertura.
      void item.offsetWidth;
      requestAnimationFrame(() => item.classList.add("is-visible"));
    });
  };

  const layout = () => {
    const mobile = window.innerWidth < 900;
    panels.forEach((panel, idx) => {
      const tab = tabs[idx];
      if (mobile) {
        if (tab.nextElementSibling !== panel) tab.insertAdjacentElement("afterend", panel);
      } else {
        if (panel.parentElement !== stageHome) stageHome.appendChild(panel);
      }
    });
  };

  const setProg = (i: number, initial = false) => {
    current = i;
    tabs.forEach((tab, idx) => {
      tab.classList.toggle("is-active", idx === i);
    });
    panels.forEach((panel, idx) => {
      const active = idx === i;
      panel.classList.toggle("is-active", active);
      if (active) {
        if (everSeen) {
          staggerItems(panel);
        }
        if (!initial) {
          panel.classList.remove("is-visible");
          requestAnimationFrame(() => panel.classList.add("is-visible"));
        } else {
          panel.classList.add("is-visible");
        }
      } else {
        panel.classList.remove("is-visible");
      }
    });
    layout();
  };

  tabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => {
      if (window.innerWidth < 900 && current === idx) {
        setProg(-1);
        return;
      }
      setProg(idx);
    });
    tab.addEventListener("mouseenter", () => {
      if (window.innerWidth < 900) return;
      setProg(idx);
    });
  });

  window.addEventListener("resize", layout);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        everSeen = true;
        staggerItems(panels[current >= 0 ? current : 0]);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );
  io.observe(stageHome);

  setProg(current, true);
}
