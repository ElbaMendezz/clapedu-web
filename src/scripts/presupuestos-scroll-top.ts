/** Resorte de entrada/salida del original (stiffness 300, damping 22) expresado como easing `linear()`. */
const SPRING =
  "linear(0, 0.0531, 0.1807, 0.3433, 0.5122, 0.6685, 0.8012, 0.9057, 0.9819, 1.0324, 1.0615, 1.074, 1.0747, 1.0677, 1.0566, 1.0439, 1.0314, 1.0203, 1.0112, 1.0043, 0.9995, 0.9964, 0.9948, 0.9943, 0.9945, 0.9952, 0.9961, 0.9971, 1)";
const DURATION = 569;
const HIDDEN = { opacity: 0, transform: "translateY(20px) scale(0.5)" };
const SHOWN = { opacity: 1, transform: "translateY(0) scale(1)" };

/** Muestra el botón "subir" pasado `scrollY > 320` y vuelve al inicio con scroll suave. */
export function attachScrollTop(button: HTMLElement): void {
  let visible = false;
  let running: Animation | null = null;

  const animate = (from: Keyframe, to: Keyframe, onFinish?: () => void): void => {
    running?.cancel();
    running = button.animate([from, to], { duration: DURATION, easing: SPRING });
    running.onfinish = () => {
      running = null;
      onFinish?.();
    };
  };

  const update = (): void => {
    const next = window.scrollY > 320;
    if (next === visible) return;
    visible = next;
    if (next) {
      button.hidden = false;
      animate(HIDDEN, SHOWN);
    } else {
      animate(SHOWN, HIDDEN, () => {
        if (!visible) button.hidden = true;
      });
    }
  };

  window.addEventListener("scroll", update, { passive: true });
  update();

  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
