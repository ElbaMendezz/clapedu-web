/**
 * Checklist animado (Hub Creativo, sección Espacios): al entrar en
 * viewport, marca cada fila secuencialmente + llena la barra de progreso;
 * al salir, se resetea (se repite cada vez que se re-visita). Réplica
 * exacta de setupHubChecklist() — 350ms + 520ms por fila, ver
 * INVENTARIO.md.
 */
export function attachHubChecklist(root: HTMLElement): void {
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-hubrow]"));
  const bar = root.querySelector<HTMLElement>("[data-hubbar]");
  const done = root.querySelector<HTMLElement>("[data-hubdone]");
  if (!rows.length) return;

  const timers: ReturnType<typeof setTimeout>[] = [];

  const run = () => {
    rows.forEach((row, i) => {
      const timer = setTimeout(() => {
        row.classList.add("is-checked");
        if (bar) bar.style.width = `${((i + 1) / rows.length) * 100}%`;
        if (i === rows.length - 1) done?.classList.add("is-visible");
      }, 350 + i * 520);
      timers.push(timer);
    });
  };

  const reset = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    rows.forEach((row) => row.classList.remove("is-checked"));
    if (bar) bar.style.width = "0";
    done?.classList.remove("is-visible");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? run() : reset()));
    },
    { threshold: 0.5 },
  );
  observer.observe(root);
}
