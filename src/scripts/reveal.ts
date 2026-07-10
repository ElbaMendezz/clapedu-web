/**
 * Fade + translate al entrar en viewport. Réplica de setupReveal(), que NO
 * es idéntica entre páginas — verificado en cada script fuente:
 *   - index.html (home): se repite (vuelve a ocultarse al salir del
 *     viewport), threshold 0.12, rootMargin -10%, duración 0.8s, distancia 34/36px.
 *   - sobre-nosotros.html: una sola vez (unobserve tras revelar), threshold
 *     0.12, rootMargin -8%, duración 0.8s, distancia 34/36px.
 *   - metodologia.html / equipo.html: una sola vez, duración 0.7s (distinta
 *     de las dos anteriores — verificado en ambos scripts fuente, no es la
 *     misma duración solo porque ambas páginas se ven similares), distancia 34/36px.
 *   - programas.html: se repite (como home), pero con threshold 0.15,
 *     rootMargin -12%, duración 0.95s, easing cubic-bezier(.16,.8,.3,1)
 *     (distinto del cubic-bezier(.2,.7,.2,1) de las demás páginas) y
 *     distancia mayor: 46px vertical / 58px horizontal.
 * Ver INVENTARIO.md §2.4/§3.2/§4c/§6a (correcciones post Checkpoint 4 y 6).
 *
 * Marcado esperado: elementos con `data-reveal` (valor "left"/"right"/vacío
 * = translateY) y opcionalmente `data-delay` (ms). El atributo
 * `data-reveal-variant="drop"` activa una entrada alternativa (caída con
 * rebote translateY(-26px) scale(.94)) usada por las tarjetas de Expertise
 * en sobre-nosotros.html — es una excepción real del script original, no
 * una licencia creativa.
 */
export interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  /** true = se repite al salir/entrar (home, programas). false = una sola vez (sobre-nosotros, metodologia, equipo). */
  repeat?: boolean;
  /** Duración en ms de la transición opacity/transform. Verificar por página: no es igual en todas. */
  duration?: number;
  /** Distancia en px del translateY (vertical). Default 34, verificar por página. */
  distanceY?: number;
  /** Distancia en px del translateX (izquierda/derecha). Default 36, verificar por página. */
  distanceX?: number;
  /** Curva de easing de la transición. Default cubic-bezier(.2,.7,.2,1), verificar por página. */
  easing?: string;
}

export function attachReveal(root: ParentNode, options: RevealOptions = {}): void {
  const {
    threshold = 0.12,
    rootMargin = "0px 0px -10% 0px",
    repeat = true,
    duration = 800,
    distanceY = 34,
    distanceX = 36,
    easing = "cubic-bezier(.2,.7,.2,1)",
  } = options;

  const hiddenTransform = (el: HTMLElement) => {
    if (el.dataset.revealVariant === "drop") return "translateY(-26px) scale(.94)";
    const dir = el.getAttribute("data-reveal");
    return dir === "left" ? `translateX(-${distanceX}px)` : dir === "right" ? `translateX(${distanceX}px)` : `translateY(${distanceY}px)`;
  };

  const transitionFor = (el: HTMLElement) =>
    el.dataset.revealVariant === "drop"
      ? "opacity .55s ease, transform .7s cubic-bezier(.34,1.45,.5,1)"
      : `opacity ${duration / 1000}s ${easing}, transform ${duration / 1000}s ${easing}`;

  const reveals = root.querySelectorAll<HTMLElement>("[data-reveal]");

  reveals.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = hiddenTransform(el);
    el.style.transition = transitionFor(el);
    el.style.willChange = "opacity, transform";
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          const delay = parseFloat(el.getAttribute("data-delay") ?? "0");
          el.style.transitionDelay = `${delay / 1000}s`;
          el.style.opacity = "1";
          el.style.transform = "none";
          // Una vez terminada la entrada, se resetea el delay: si no, queda
          // pegado como estilo inline y se filtra a cualquier transición
          // posterior del mismo elemento (ej. un :hover con transform/
          // box-shadow), sumando ese retraso donde no corresponde. Mismo
          // bug ya visto y corregido en Valores (sobre-nosotros).
          window.setTimeout(() => {
            el.style.transitionDelay = "0s";
          }, delay + duration);
          if (!repeat) observer.unobserve(el);
        } else if (repeat) {
          el.style.transitionDelay = "0s";
          el.style.opacity = "0";
          el.style.transform = hiddenTransform(el);
        }
      });
    },
    { threshold, rootMargin },
  );

  reveals.forEach((el) => observer.observe(el));
}
