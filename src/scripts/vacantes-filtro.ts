/**
 * Filtro por área de /vacantes. El servidor ya renderiza todas las tarjetas
 * (cada una con `data-area`); esto solo las oculta/muestra, centra la tarjeta
 * cuando queda una sola y cambia el estado sin vacantes. Sin JS se ven todas.
 */
const TODAS = "todas";
const TITULO_SIN_CONVOCATORIAS = "En este momento no tenemos convocatorias abiertas";

export function attachFiltroVacantes(root: HTMLElement): void {
  const tabs = root.querySelectorAll<HTMLButtonElement>("[data-filtro] [role='tab']");
  const tarjetas = root.querySelectorAll<HTMLElement>("[data-tarjeta]");
  const grilla = root.querySelector<HTMLElement>("[data-grilla]");
  const vacio = root.querySelector<HTMLElement>("[data-vacio]");
  if (!grilla || !vacio || tabs.length === 0) return;

  const etiqueta = vacio.querySelector<HTMLElement>("[data-vacio-etiqueta]");
  const titulo = vacio.querySelector<HTMLElement>("[data-vacio-titulo]");
  const verTodas = vacio.querySelector<HTMLButtonElement>("[data-ver-todas]");

  const seleccionar = (area: string) => {
    const esTodas = area === TODAS;
    let visibles = 0;

    tarjetas.forEach((tarjeta) => {
      const oculta = !esTodas && tarjeta.dataset.area !== area;
      tarjeta.hidden = oculta;
      if (!oculta) visibles++;
    });

    tabs.forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.area === area));
    });

    grilla.hidden = visibles === 0;
    grilla.dataset.unica = String(!esTodas && visibles === 1);
    vacio.hidden = visibles !== 0;

    if (etiqueta) etiqueta.textContent = esTodas ? "Convocatorias" : area;
    if (titulo) {
      titulo.textContent = esTodas
        ? TITULO_SIN_CONVOCATORIAS
        : `Actualmente no tenemos vacantes abiertas en ${area}`;
    }
    if (verTodas) verTodas.hidden = esTodas;
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => seleccionar(tab.dataset.area ?? TODAS));
  });

  verTodas?.addEventListener("click", () => {
    seleccionar(TODAS);
    // El botón queda oculto: se devuelve el foco al filtro para no perderlo.
    tabs[0]?.focus();
  });
}
