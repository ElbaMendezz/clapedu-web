/**
 * Diagrama orbital de 4 competencias (#competencias en /metodologia): hover
 * o click en un nodo selecciona su tarjeta de detalle (sin restricción de
 * ancho de pantalla, a diferencia del stepper de fases). Auto-tour de una
 * sola pasada completa (analizar→articular→gestionar→intervenir→analizar)
 * al entrar la sección en viewport por primera vez (threshold 0.45);
 * cualquier hover o click del usuario lo cancela para siempre en esta carga
 * de página — a diferencia de Círculo dorado/Filosofía, aquí NO se reinicia
 * al salir y reingresar a la sección (el observer se desconecta tras el
 * primer disparo). El hub central "Liderar" muestra, solo con hover, un
 * popup fijo con el diagrama completo de la metodología.
 * Réplica de setupComp()/setComp()/startCompAuto()/setupDiagramPill(), ver
 * INVENTARIO.md.
 */
export function attachCompOrbit(root: HTMLElement): void {
  const nodes = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-comp-node]"));
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-comp-panel]"));
  if (!nodes.length || !cards.length) return;

  let userStopped = false;
  let autoDone = false;
  let autoTimer: ReturnType<typeof setInterval> | null = null;

  const setComp = (i: number) => {
    nodes.forEach((n, idx) => n.classList.toggle("is-active", idx === i));
    cards.forEach((c, idx) => {
      if (idx === i) {
        c.classList.add("is-active");
        requestAnimationFrame(() => c.classList.add("is-visible"));
      } else {
        c.classList.remove("is-active", "is-visible");
      }
    });
  };

  const stopAuto = () => {
    userStopped = true;
    autoDone = true;
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  };

  const startAuto = () => {
    if (autoDone || userStopped) return;
    autoDone = true;
    const n = nodes.length;
    let step = 0;
    setComp(0);
    autoTimer = setInterval(() => {
      if (userStopped) {
        stopAuto();
        return;
      }
      step += 1;
      if (step > n) {
        stopAuto();
        return;
      }
      setComp(step % n);
    }, 1400);
  };

  nodes.forEach((node, idx) => {
    node.addEventListener("mouseenter", () => {
      stopAuto();
      setComp(idx);
    });
    node.addEventListener("click", () => {
      stopAuto();
      setComp(idx);
    });
  });

  setComp(0);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !autoDone) {
          startAuto();
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 },
  );
  io.observe(root);

  const hub = root.querySelector<HTMLElement>("[data-comp-hub]");
  const popup = root.querySelector<HTMLElement>("[data-comp-popup]");
  if (hub && popup) {
    hub.addEventListener("mouseenter", () => popup.classList.add("is-open"));
    hub.addEventListener("mouseleave", () => popup.classList.remove("is-open"));
  }
}
