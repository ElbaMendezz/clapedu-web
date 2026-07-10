/**
 * Carrusel horizontal genérico: solo activo en móvil (scroll-snap + drag +
 * autoplay con pausa tras interacción); en escritorio/tablet el contenedor
 * es una grilla CSS estática y este módulo no hace nada.
 * Réplica de setupDestCarousel()/setupEventCarousel() + enable*Carousel(),
 * ver INVENTARIO.md §2.4 y §3.1 (carousel-destacados / carousel-eventos).
 *
 * Marcado esperado dentro de `root`:
 *   [data-carousel-track]        contenedor scrolleable con las tarjetas como hijos directos
 *   [data-carousel-arrow="prev"] [data-carousel-arrow="next"]
 *   [data-carousel-dots] > [data-carousel-dot] (uno por tarjeta, en orden)
 */
export interface CarouselOptions {
  autoplayInterval?: number;
  pauseDuration?: number;
  mobileBreakpoint?: number;
}

export function attachCarousel(root: HTMLElement, options: CarouselOptions = {}): void {
  const { autoplayInterval = 4500, pauseDuration = 8000, mobileBreakpoint = 768 } = options;

  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  if (!track) return;

  const arrows = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-carousel-arrow]"));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-carousel-dot]"));

  const cardWidth = () => {
    const card = track.querySelector<HTMLElement>(":scope > *");
    return card ? card.getBoundingClientRect().width + 14 : track.clientWidth;
  };

  const count = track.children.length;
  let active = false;
  let paused = false;
  let pauseTimer: ReturnType<typeof setTimeout> | undefined;
  let autoplayTimer: ReturnType<typeof setInterval> | undefined;

  const goTo = (i: number) => {
    const idx = ((i % count) + count) % count;
    track.scrollTo({ left: idx * cardWidth(), behavior: "smooth" });
  };

  const pauseAutoplay = () => {
    paused = true;
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => (paused = false), pauseDuration);
  };

  const updateDots = () => {
    const current = Math.round(track.scrollLeft / cardWidth());
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
  };

  arrows.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const current = Math.round(track.scrollLeft / cardWidth());
      goTo(btn.dataset.carouselArrow === "next" ? current + 1 : current - 1);
      pauseAutoplay();
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(i);
      pauseAutoplay();
    });
  });

  let raf: number;
  track.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateDots);
    },
    { passive: true },
  );

  ["pointerdown", "touchstart", "wheel"].forEach((ev) =>
    track.addEventListener(ev, () => pauseAutoplay(), { passive: true }),
  );

  // Arrastre con puntero (mouse) — el táctil usa scroll nativo con scroll-snap.
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  track.addEventListener("pointerdown", (e) => {
    if (!active || e.pointerType === "touch") return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.style.scrollSnapType = "none";
    track.style.cursor = "grabbing";
    pauseAutoplay();
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  });

  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    track.style.cursor = "grab";
    track.style.scrollSnapType = "x mandatory";
    goTo(Math.round(track.scrollLeft / cardWidth()));
  });

  track.addEventListener(
    "click",
    (e) => {
      if (active && moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true,
  );

  const setActive = (on: boolean) => {
    active = on;

    clearInterval(autoplayTimer);
    if (on) {
      autoplayTimer = setInterval(() => {
        if (paused) return;
        const current = Math.round(track.scrollLeft / cardWidth());
        goTo(current + 1);
      }, autoplayInterval);
    }
    updateDots();
  };

  const mq = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
  setActive(mq.matches);
  mq.addEventListener("change", (e) => setActive(e.matches));
}
