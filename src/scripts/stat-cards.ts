/**
 * Tarjetas de estadística (2, en "Importancia" de /metodologia): al entrar
 * en viewport, cada tarjeta se revela (fade+slide, con 0.18s de delay
 * extra en la segunda vía CSS `nth-child`) y 300ms después su número
 * cuenta de 0 al valor final en 900ms (ease-out cúbico) — distinto del
 * count-up genérico (1500ms/threshold 0.4), por eso es su propio módulo.
 * Réplica de setupStatCards(), ver INVENTARIO.md.
 */
export function attachStatCards(root: ParentNode): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-stat-card]"));
  if (!cards.length) return;

  const animateCount = (el: HTMLElement, target: number, duration: number) => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const reveal = (card: HTMLElement) => {
    card.classList.add("is-visible");
    const numEl = card.querySelector<HTMLElement>("[data-stat-num]");
    if (numEl) {
      const target = Number(numEl.dataset.statNum ?? "0");
      setTimeout(() => animateCount(numEl, target, 900), 300);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  cards.forEach((c) => observer.observe(c));
}
