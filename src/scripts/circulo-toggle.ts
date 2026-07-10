import { attachProgSelector } from "./prog-selector";

/**
 * Alterna entre la vista "mis beneficios" (tarjeta de costos + grid de
 * beneficios) y la vista "programas especializados" (tabs/acordeón de
 * Círculo Empresas que Lideran). Réplica de toggleCirculoProgs(): el
 * selector de programas solo se conecta la primera vez que se abre esa
 * vista (setupEProg perezoso en el original).
 */
export function attachCirculoToggle(root: HTMLElement): void {
  const main = root.querySelector<HTMLElement>("[data-circulo-main]");
  const progs = root.querySelector<HTMLElement>("[data-circulo-progs]");
  const btn = root.querySelector<HTMLAnchorElement>("[data-circulo-toggle]");
  const label = root.querySelector<HTMLElement>("[data-circulo-toggle-label]");
  const icon = root.querySelector<HTMLElement>("[data-circulo-toggle-icon]");
  if (!main || !progs || !btn) return;

  let progsInit = false;
  let showingProgs = false;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (showingProgs) {
      progs.classList.remove("is-open");
      main.classList.remove("is-hidden");
      if (label) label.textContent = "Conoce los programas especializados";
      if (icon) icon.style.transform = "none";
      showingProgs = false;
    } else {
      main.classList.add("is-hidden");
      progs.classList.add("is-open");
      if (!progsInit) {
        attachProgSelector(progs, {
          tabSelector: "[data-progtab]",
          panelSelector: "[data-progpanel]",
          tabsContainerSelector: "[data-progtabs]",
        });
        progsInit = true;
      }
      if (label) label.textContent = "Regresar a mis beneficios";
      if (icon) icon.style.transform = "rotate(180deg)";
      showingProgs = true;
    }
  });
}
