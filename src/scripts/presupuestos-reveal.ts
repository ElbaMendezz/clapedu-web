/**
 * Scroll reveal de /presupuestos-participativos. Reemplaza los `whileInView` de framer-motion
 * del original (`viewport={{ once: false, amount }}`): al entrar en el viewport
 * el elemento anima a su estado final y, al salir, vuelve al inicial, de modo
 * que se reanima cada vez que reaparece.
 *
 * Cada elemento declara su configuración en atributos `data-*`:
 *   data-reveal            marca el elemento
 *   data-x / data-y        desplazamiento inicial en px      (default 0)
 *   data-scale             escala inicial                    (default 1)
 *   data-amount            fracción visible para entrar      (default 0.2)
 *   data-duration          segundos                          (default 0.5)
 *   data-delay             segundos                          (default 0)
 *   data-ease              "out" | "inout"                   (default "inout")
 *
 * "inout" es el easing por defecto de framer cuando la transición define
 * `duration` pero no `ease`; "out" corresponde a `ease: 'easeOut'`.
 *
 * Se usa Web Animations API (no transiciones CSS) para que `.neo-box`, que
 * fuerza `transition: all`, no interfiera con la duración ni el retraso. Como
 * framer, el estado final queda como estilo inline.
 */

const EASINGS: Record<string, string> = {
  out: "cubic-bezier(0, 0, 0.58, 1)",
  inout: "cubic-bezier(0.42, 0, 0.58, 1)",
};

interface Config {
  transform: string;
  amount: number;
  delay: number;
  duration: number;
  easing: string;
}

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isNaN(parsed) ? fallback : parsed;
};

/** Se lee en cada animación: Oferta.astro actualiza `data-delay` al filtrar. */
function readConfig(el: HTMLElement): Config {
  const { x, y, scale, amount, delay, duration, ease } = el.dataset;
  return {
    transform: `translate(${num(x, 0)}px, ${num(y, 0)}px) scale(${num(scale, 1)})`,
    amount: num(amount, 0.2),
    delay: num(delay, 0) * 1000,
    duration: num(duration, 0.5) * 1000,
    easing: EASINGS[ease ?? "inout"] ?? EASINGS.inout,
  };
}

const SHOWN_TRANSFORM = "translate(0px, 0px) scale(1)";
const running = new WeakMap<HTMLElement, Animation>();

function play(el: HTMLElement, show: boolean): void {
  const config = readConfig(el);
  const style = getComputedStyle(el);
  const from = { opacity: style.opacity, transform: style.transform === "none" ? SHOWN_TRANSFORM : style.transform };
  const to = show
    ? { opacity: "1", transform: SHOWN_TRANSFORM }
    : { opacity: "0", transform: config.transform };

  running.get(el)?.cancel();
  const animation = el.animate([from, to], {
    duration: config.duration,
    delay: config.delay,
    easing: config.easing,
    fill: "both",
  });
  running.set(el, animation);
  animation.onfinish = () => {
    // Estado final inline (como framer) y se libera la animación para que el
    // `:hover` de CSS pueda volver a controlar el transform.
    el.style.opacity = to.opacity;
    el.style.transform = show ? "" : config.transform;
    animation.cancel();
    running.delete(el);
  };
}

export function attachReveal(root: ParentNode = document): void {
  const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (!elements.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((el) => {
      el.style.opacity = "1";
    });
    return;
  }

  const active = new WeakSet<HTMLElement>();
  const observers = new Map<number, IntersectionObserver>();

  const observerFor = (amount: number): IntersectionObserver => {
    let observer = observers.get(amount);
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            // Igual que `inView` de framer: solo cuenta el cambio de isIntersecting.
            if (entry.isIntersecting === active.has(el)) return;
            if (entry.isIntersecting) active.add(el);
            else active.delete(el);
            play(el, entry.isIntersecting);
          });
        },
        { threshold: amount },
      );
      observers.set(amount, observer);
    }
    return observer;
  };

  elements.forEach((el) => {
    // Estado inicial (`initial` de framer): oculto y desplazado.
    el.style.transform = readConfig(el).transform;
    observerFor(readConfig(el).amount).observe(el);
  });
}
