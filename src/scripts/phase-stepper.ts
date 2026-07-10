/**
 * Stepper de las 4 fases (#fases en /metodologia): pestañas seleccionan un
 * panel (click, o hover solo en ≥1100px). En pantallas <1100px, al entrar
 * la sección en viewport (threshold 0.4) se recorre automáticamente cada
 * 1600ms empezando a los 500ms, hasta que el usuario interactúa; si sale
 * de viewport se detiene y el auto-tour puede repetirse en un reingreso.
 * Réplica de setupPhases()/setPhase()/setupPhaseAuto(), ver INVENTARIO.md.
 */
export function attachPhaseStepper(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-phasetab]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-phasepanel]"));
  if (!tabs.length || !panels.length) return;

  let userActed = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const setPhase = (i: number) => {
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

  const stopAuto = (silent: boolean) => {
    timers.forEach(clearTimeout);
    timers = [];
    if (!silent) userActed = true;
  };

  const startAuto = () => {
    stopAuto(true);
    let t = 500;
    tabs.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          if (!userActed) setPhase(i);
        }, t),
      );
      t += 1600;
    });
  };

  tabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => {
      stopAuto(false);
      setPhase(idx);
    });
    tab.addEventListener("mouseenter", () => {
      if (window.innerWidth >= 1100) setPhase(idx);
    });
  });

  setPhase(0);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (window.innerWidth < 1100 && !userActed) startAuto();
        } else {
          stopAuto(true);
          userActed = false;
        }
      });
    },
    { threshold: 0.4 },
  );
  io.observe(root);
}
