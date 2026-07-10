/**
 * "Ver más/Ver menos" de la sección "Aprender haciendo" (/programas): solo
 * existe en mobile (<560px, el botón está oculto por CSS en desktop). El
 * bloque de párrafos empieza colapsado (`maxHeight:0`); el `maxHeight`
 * real se mide con `scrollHeight` (valor continuo, no un estado
 * enumerable) así que se sigue mutando por JS, pero el estado
 * abierto/cerrado en sí (opacidad, rotación del chevron, texto del botón)
 * se resuelve con `classList`. Réplica de toggleManif()/
 * applyManifCollapse(), ver INVENTARIO.md.
 */
export function attachManifCollapse(root: HTMLElement): void {
  const wrap = root.querySelector<HTMLElement>("[data-manifcollapse]");
  const btn = root.querySelector<HTMLButtonElement>("[data-maniftoggle]");
  const label = root.querySelector<HTMLElement>("[data-maniftogglelabel]");
  if (!wrap || !btn) return;

  let open = false;

  const apply = () => {
    const mobile = window.innerWidth < 560;
    if (mobile) {
      wrap.style.maxHeight = open ? `${wrap.scrollHeight}px` : "0px";
      wrap.classList.toggle("is-open", open);
      btn.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Ver menos" : "Ver más";
    } else {
      wrap.style.maxHeight = "";
      wrap.classList.remove("is-open");
      btn.classList.remove("is-open");
    }
  };

  btn.addEventListener("click", () => {
    open = !open;
    apply();
  });

  apply();
  window.addEventListener("resize", apply);
}
