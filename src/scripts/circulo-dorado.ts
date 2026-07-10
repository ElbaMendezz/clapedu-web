/**
 * Diagrama de 3 anillos anidados ("por qué / cómo / qué"). Hover (solo
 * ≥1100px) o click selecciona un nivel; al salir del grid (desktop, sin
 * auto-tour corriendo) los anillos vuelven a su estado plano blanco, pero
 * la tarjeta seleccionada se mantiene expandida. Auto-tour de una pasada
 * al entrar en viewport (si el usuario no interactuó), se puede repetir
 * si sales de la sección y vuelves a entrar. Réplica de setupCirc()/
 * setCirc()/restRings()/setupCircAuto()/circBurst(), ver INVENTARIO.md.
 */
export function attachCirculoDorado(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>("[data-circ-grid]");
  const diagram = root.querySelector<HTMLElement>("[data-circ-diagram]");
  const hint = root.querySelector<HTMLElement>("[data-circ-hint]");
  const rings = Array.from(root.querySelectorAll<HTMLElement>("[data-circring]"));
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-circitem]"));
  if (!grid || !rings.length || !items.length) return;

  let prev = -1;
  let userActed = false;
  let autoRunning = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const burst = () => {
    if (!diagram) return;
    const ring = document.createElement("div");
    ring.className = "circ-burst";
    diagram.appendChild(ring);
    setTimeout(() => ring.remove(), 1600);
  };

  const setCirc = (i: number) => {
    items.forEach((item, idx) => item.classList.toggle("is-active", idx === i));
    rings.forEach((ring) => {
      const idx = Number(ring.dataset.circring);
      ring.classList.toggle("is-filled", idx <= i);
      ring.classList.toggle("is-active", idx === i);
    });
    if (i === 2 && prev !== 2) burst();
    prev = i;
  };

  const restRings = () => {
    rings.forEach((ring) => ring.classList.remove("is-filled", "is-active"));
  };

  const stopAuto = (silent: boolean) => {
    timers.forEach(clearTimeout);
    timers = [];
    autoRunning = false;
    if (!silent) {
      userActed = true;
      hint?.classList.add("is-hidden");
    }
  };

  const startAuto = () => {
    stopAuto(true);
    autoRunning = true;
    let t = 700;
    [0, 1, 2].forEach((idx) => {
      timers.push(
        setTimeout(() => {
          if (!userActed) setCirc(idx);
        }, t),
      );
      t += 1350;
    });
    timers.push(
      setTimeout(() => {
        autoRunning = false;
        if (!userActed) {
          setCirc(0);
          restRings();
        }
      }, t),
    );
  };

  const pick = (e: Event) => {
    const target = e.target as HTMLElement;
    const ring = target.closest<HTMLElement>("[data-circring]");
    const item = target.closest<HTMLElement>("[data-circitem]");
    stopAuto(false);
    if (ring) setCirc(Number(ring.dataset.circring));
    else if (item) setCirc(Number(item.dataset.circitem));
  };

  grid.addEventListener("mouseover", (e) => {
    if (window.innerWidth < 1100) return;
    pick(e);
  });
  grid.addEventListener("click", pick);
  grid.addEventListener("mouseleave", () => {
    if (window.innerWidth >= 1100 && !autoRunning) restRings();
  });

  setCirc(0);
  restRings();

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
    { threshold: 0.5 },
  );
  io.observe(root);
}
