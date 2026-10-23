import { setState } from "./presupuestos-ui";

/** `transition: { duration: 0.3 }` de framer sin `ease` explícito → easeInOut. */
const EASE_IN_OUT = "cubic-bezier(0.42, 0, 0.58, 1)";
const DURATION = 300;

/**
 * "¿Qué son los Presupuestos Participativos?": selector de las 4 etapas del
 * ciclo. Equivale al `activeStep` + `AnimatePresence mode="wait"` del original:
 * el panel actual sale (opacity 0, y -15) y recién después entra el nuevo
 * (opacity 0 → 1, y 15 → 0).
 */
export function attachCiclo(root: HTMLElement): void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>("[data-ciclo-btn]"));
  const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-ciclo-dot]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-ciclo-panel]"));
  const next = root.querySelector<HTMLElement>("[data-ciclo-next]");
  if (!panels.length) return;

  let active = 0;
  let token = 0;
  let running: Animation | null = null;

  const paint = (i: number): void => {
    buttons.forEach((btn, idx) => {
      const on = idx === i;
      setState(btn, on);
      btn.querySelectorAll("[data-ciclo-num], [data-ciclo-title], [data-ciclo-icon]").forEach((el) => setState(el, on));
    });
    dots.forEach((dot, idx) => setState(dot, idx === i));
    if (next) next.hidden = i >= panels.length - 1;
  };

  const fade = (el: HTMLElement, from: string, to: string, opacity: [number, number]): Animation =>
    el.animate(
      [
        { opacity: opacity[0], transform: from },
        { opacity: opacity[1], transform: to },
      ],
      { duration: DURATION, easing: EASE_IN_OUT, fill: "forwards" },
    );

  const show = (i: number): void => {
    if (i === active || i < 0 || i >= panels.length) return;
    const leaving = panels[active];
    const entering = panels[i];
    const mine = ++token;
    running?.cancel();
    panels.forEach((p) => {
      p.getAnimations().forEach((a) => a.cancel());
      if (p !== leaving) p.hidden = true;
    });
    active = i;
    paint(i);

    running = fade(leaving, "translateY(0)", "translateY(-15px)", [1, 0]);
    running.onfinish = () => {
      if (mine !== token) return;
      running?.cancel();
      leaving.hidden = true;
      entering.hidden = false;
      running = fade(entering, "translateY(15px)", "translateY(0)", [0, 1]);
      running.onfinish = () => {
        running?.cancel();
        running = null;
      };
    };
  };

  buttons.forEach((btn, idx) => btn.addEventListener("click", () => show(idx)));
  dots.forEach((dot, idx) => dot.addEventListener("click", () => show(idx)));
  next?.addEventListener("click", () => show(active + 1));
  paint(0);
}
