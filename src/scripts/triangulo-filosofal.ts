/**
 * Triángulo de 4 nodos (PROPÓSITO al centro + 3 vértices). Click/hover
 * selecciona un nodo y su tarjeta. Al entrar en el viewport, el triángulo
 * "se arma" punto por punto (LIDERAZGO→SOCIEDAD→INNOVACIÓN→PROPÓSITO,
 * 880ms entre cada uno) previsualizando cada nodo según se revela, y se
 * asienta en reposo (todos en contorno, tarjeta de PROPÓSITO visible por
 * defecto); se re-arma cada vez que se sale y se vuelve a entrar. Si el
 * usuario interactúa antes de que termine, el armado se cancela y el
 * triángulo se revela por completo al instante. Réplica de setupTri()/
 * setTri()/setupTriIntro(), ver INVENTARIO.md.
 */
export function attachTriangulo(root: HTMLElement): void {
  const diagram = root.querySelector<HTMLElement>("[data-tri-diagram]");
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-tri-node]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-tri-panel]"));
  const hint = root.querySelector<HTMLElement>("[data-tri-hint]");
  if (!diagram || !nodes.length || !panels.length) return;

  let timers: ReturnType<typeof setTimeout>[] = [];
  let cancelIntro: (() => void) | null = null;

  const setTri = (key: string, rest = false) => {
    nodes.forEach((n) => {
      const active = !rest && n.dataset.triNode === key;
      n.classList.toggle("is-active", active);
    });
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.triPanel === key));
  };

  const finish = () => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelIntro = null;
    diagram.classList.add("is-visible");
    nodes.forEach((n) => n.classList.add("is-visible"));
  };

  const hideAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelIntro = null;
    diagram.classList.remove("is-visible");
    nodes.forEach((n) => n.classList.remove("is-visible", "is-active"));
    panels.forEach((p) => p.classList.remove("is-active"));
    hint?.classList.remove("is-hidden");
  };

  const run = () => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelIntro = finish;
    diagram.classList.add("is-visible");
    const seq = ["LIDERAZGO", "SOCIEDAD", "INNOVACIÓN", "PROPÓSITO"];
    let t = 260;
    seq.forEach((key) => {
      timers.push(
        setTimeout(() => {
          const n = nodes.find((x) => x.dataset.triNode === key);
          n?.classList.add("is-visible");
          setTri(key);
        }, t),
      );
      t += 880;
    });
    timers.push(
      setTimeout(() => {
        cancelIntro = null;
        setTri("PROPÓSITO", true);
      }, t + 240),
    );
  };

  nodes.forEach((n) => {
    const go = () => {
      cancelIntro?.();
      hint?.classList.add("is-hidden");
      setTri(n.dataset.triNode ?? "");
    };
    n.addEventListener("click", go);
    n.addEventListener("mouseenter", go);
  });

  hideAll();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) run();
        else hideAll();
      });
    },
    { threshold: 0.4 },
  );
  io.observe(diagram);
}
