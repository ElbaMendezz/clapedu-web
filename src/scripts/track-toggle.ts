/**
 * Selector "Para personas" / "Para empresas" de /programas: alterna qué
 * bloque completo de secciones se muestra (`[data-track]`), qué variante
 * del propio hero (`[data-herovar]`) y el botón activo (`[data-trackbtn]`,
 * con estilo de pestaña). Cualquier elemento con `[data-go]` dispara el
 * cambio de track — no solo los 2 botones del hero: el banner "¿Representas
 * una empresa?" (sección "Para empresas", CTA) reutiliza el mismo `data-go`
 * sobre un link plano, sin la pinta de pestaña activa/inactiva. Al cambiar
 * de track (no en la carga inicial) hace scroll al top. No se reimplementó
 * el "catch-up" manual de reveals que hace el original al cambiar de
 * track: el `IntersectionObserver` de `reveal.ts` (con `repeat:true` en
 * esta página) ya vuelve a evaluar la intersección automáticamente en
 * cuanto un elemento oculto por `display:none` se vuelve visible, sin
 * necesidad de recalcular a mano.
 * También soporta el deep-link `/programas#empresas` (enlazado desde
 * "Programas Especializados Empresas" en el footer y el menú mobile de
 * TODAS las páginas del sitio): al cargar con ese hash, o al cambiar el
 * hash en caliente, activa el track "empresas". Réplica de
 * setTrack()/selectTrack()/el chequeo de location.hash en
 * componentDidMount(), ver INVENTARIO.md.
 */
export function attachTrackToggle(root: ParentNode = document): void {
  const trackButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-trackbtn]"));
  const goTriggers = Array.from(root.querySelectorAll<HTMLElement>("[data-go]"));
  const tracks = Array.from(root.querySelectorAll<HTMLElement>("[data-track]"));
  const heroVars = Array.from(root.querySelectorAll<HTMLElement>("[data-herovar]"));
  if (!goTriggers.length) return;

  const setTrack = (name: string, initial: boolean) => {
    tracks.forEach((el) => el.classList.toggle("is-track-hidden", el.dataset.track !== name));
    heroVars.forEach((el) => el.classList.toggle("is-track-hidden", el.dataset.herovar !== name));
    trackButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.trackbtn === name));

    document.dispatchEvent(new CustomEvent("programas:track-change", { detail: { track: name } }));

    if (!initial) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  goTriggers.forEach((el) => {
    el.addEventListener("click", (e) => {
      const go = el.dataset.go;
      if (!go) return;
      if (el.tagName === "A") e.preventDefault();
      setTrack(go, false);
    });
  });

  setTrack("personas", true);
  if (location.hash === "#empresas") setTrack("empresas", false);

  window.addEventListener("hashchange", () => {
    if (location.hash === "#empresas") setTrack("empresas", false);
  });
}
