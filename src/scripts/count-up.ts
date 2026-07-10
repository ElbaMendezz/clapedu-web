/**
 * Anima números de 0 al valor final cuando el elemento entra en viewport.
 * Réplica exacta de countUp() (duración 1500ms, ease-out cúbico, formato
 * 'de-DE' para el separador de miles), disparada por IntersectionObserver
 * threshold 0.4. Ver INVENTARIO.md §2.4 / §3.1.
 */
export function attachCountUp(root: ParentNode): void {
  const DURATION = 1500;
  const THRESHOLD = 0.4;

  const animate = (el: HTMLElement) => {
    const target = parseFloat(el.dataset.count ?? "0");
    const prefix = el.dataset.prefix ?? "";
    const suffix = el.dataset.suffix ?? "";
    const start = performance.now();
    const format = (n: number) => Math.round(n).toLocaleString("de-DE");

    const tick = (t: number) => {
      let p = Math.min((t - start) / DURATION, 1);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + format(target * p) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counters = root.querySelectorAll<HTMLElement>("[data-count]");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: THRESHOLD });

  counters.forEach((el) => observer.observe(el));
}
