/**
 * Timeline de 11 años (2015-2026, sin 2017). Click/hover en un botón de año
 * detiene el auto-tour y salta a ese año; la barra de progreso y los
 * puntos del riel avanzan hasta ahí; el panel activo revela su checklist
 * de logros de a uno (220ms + 160ms por ítem). Auto-tour de una sola
 * pasada (1250ms por año) al entrar en viewport si el usuario no
 * interactuó; se repite si sales de la sección y vuelves a entrar.
 * Réplica de setupHistoria()/setYear()/fillChecks()/setupHistAuto(), ver
 * INVENTARIO.md.
 */
export function attachHistoriaTimeline(root: HTMLElement): void {
  const yearBtns = Array.from(root.querySelectorAll<HTMLElement>("[data-year-btn]"));
  const yearPanels = Array.from(root.querySelectorAll<HTMLElement>("[data-year-panel]"));
  const yearBar = root.querySelector<HTMLElement>("[data-year-bar]");
  const rail = root.querySelector<HTMLElement>("[data-year-rail]");
  if (!yearBtns.length) return;

  let userActed = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  const checkTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>[]>();

  const resetChecks = (panel: HTMLElement) => {
    checkTimers.get(panel)?.forEach(clearTimeout);
    checkTimers.set(panel, []);
    panel.querySelectorAll<HTMLElement>("[data-hist-check]").forEach((c) => c.classList.remove("is-checked"));
  };

  const fillChecks = (panel: HTMLElement) => {
    checkTimers.get(panel)?.forEach(clearTimeout);
    const list: ReturnType<typeof setTimeout>[] = [];
    const checks = Array.from(panel.querySelectorAll<HTMLElement>("[data-hist-check]"));
    checks.forEach((c, k) => {
      list.push(setTimeout(() => c.classList.add("is-checked"), 220 + k * 160));
    });
    checkTimers.set(panel, list);
  };

  const setYear = (i: number) => {
    const n = yearBtns.length;
    yearBtns.forEach((b, idx) => {
      b.classList.toggle("is-done", idx <= i);
      b.classList.toggle("is-active", idx === i);
    });
    if (yearBar) yearBar.style.width = `${n > 1 ? (i / (n - 1)) * 100 : 0}%`;
    yearPanels.forEach((p, idx) => {
      const active = idx === i;
      p.classList.toggle("is-active", active);
      if (active) fillChecks(p);
      else resetChecks(p);
    });
    const btn = yearBtns[i];
    if (btn && rail && rail.scrollWidth > rail.clientWidth) {
      const target = btn.offsetLeft - rail.clientWidth / 2 + btn.clientWidth / 2;
      rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  };

  const stopAuto = (silent: boolean) => {
    timers.forEach(clearTimeout);
    timers = [];
    if (!silent) userActed = true;
  };

  const startAuto = () => {
    stopAuto(true);
    const n = yearBtns.length;
    let t = 600;
    for (let i = 0; i < n; i++) {
      timers.push(
        setTimeout(() => {
          if (!userActed) setYear(i);
        }, t),
      );
      t += 1250;
    }
  };

  yearBtns.forEach((b) => {
    const go = () => {
      stopAuto(false);
      setYear(Number(b.dataset.yearBtn));
    };
    b.addEventListener("click", go);
    b.addEventListener("mouseenter", go);
  });

  setYear(0);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!userActed) startAuto();
        } else {
          stopAuto(true);
          userActed = false;
        }
      });
    },
    { threshold: 0.55 },
  );
  io.observe(rail ?? root);
}
