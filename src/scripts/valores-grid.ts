/**
 * Grid de 4 valores en cruz (icono central 2x2 + etiquetas a los lados).
 * Desktop (≥1000px): hover en celda o etiqueta resalta ambas a la vez;
 * "ensamblado" de las 4 piezas al entrar en viewport (se repite al
 * salir/entrar). Mobile/tablet (<1000px): solo se ve el icono 2x2 +
 * una tarjeta con el valor activo; tap para cambiar; recorrido
 * automático de una pasada la primera vez que la sección entra en
 * viewport. Réplica de setupValores()/setupValCard(), ver
 * INVENTARIO.md.
 */
export function attachValoresGrid(root: HTMLElement): void {
  const wrap = root.querySelector<HTMLElement>("[data-val-wrap]");
  const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-valcell]"));
  const labels = Array.from(root.querySelectorAll<HTMLElement>("[data-vallabel]"));
  const card = root.querySelector<HTMLElement>("[data-valcard]");
  if (!wrap || !cells.length || !labels.length) return;

  const mq = window.matchMedia("(max-width: 999.98px)");
  const byVi = (list: HTMLElement[], vi: number) => list.find((el) => Number(el.dataset.vi) === vi);

  // ---- hover highlight (par celda + etiqueta) ----
  const setHi = (vi: number, on: boolean) => {
    byVi(cells, vi)?.classList.toggle("is-hi", on);
    byVi(labels, vi)?.classList.toggle("is-hi", on);
  };
  [...cells, ...labels].forEach((el) => {
    const vi = Number(el.dataset.vi);
    el.addEventListener("mouseenter", () => setHi(vi, true));
    el.addEventListener("mouseleave", () => setHi(vi, false));
  });

  // ---- ensamblado al entrar en viewport (se repite) ----
  const assembleIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => wrap.classList.toggle("is-assembled", entry.isIntersecting));
    },
    { threshold: 0.4 },
  );
  assembleIO.observe(wrap);

  // ---- tarjeta móvil + tap + auto-tour (una pasada por visita) ----
  let autoTimer: ReturnType<typeof setInterval> | undefined;
  let autoDone = false;

  const setActive = (vi: number) => {
    cells.forEach((c) => c.classList.toggle("is-selected", Number(c.dataset.vi) === vi));
    const label = byVi(labels, vi);
    if (card && label) {
      const title = label.querySelector("h3")?.textContent ?? "";
      const desc = label.querySelector("p")?.textContent ?? "";
      const color = label.dataset.color ?? "";
      const cardTitle = card.querySelector("[data-valcard-title]");
      const cardDesc = card.querySelector("[data-valcard-desc]");
      const cardDot = card.querySelector<HTMLElement>("[data-valcard-dot]");
      if (cardTitle) cardTitle.textContent = title;
      if (cardDesc) cardDesc.textContent = desc;
      if (cardDot) cardDot.style.background = color;
    }
  };

  const stopAuto = () => {
    clearInterval(autoTimer);
  };

  const startAuto = () => {
    if (!mq.matches) return;
    stopAuto();
    let k = 0;
    setActive(k);
    autoTimer = setInterval(() => {
      k += 1;
      if (k > 3) {
        stopAuto();
        return;
      }
      setActive(k);
    }, 1100);
  };

  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      if (!mq.matches) return;
      stopAuto();
      setActive(Number(cell.dataset.vi));
    });
  });

  const autoIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && mq.matches && !autoDone) {
          autoDone = true;
          startAuto();
        }
        if (!entry.isIntersecting) autoDone = false;
      });
    },
    { threshold: 0.35 },
  );
  autoIO.observe(root);

  setActive(0);
}
