/**
 * Si la URL trae un #hash al cargar, hace scroll hasta ese elemento con
 * compensación por el nav fijo. Réplica del comportamiento en
 * componentDidMount() del original, ver INVENTARIO.md §2.4.
 */
export function scrollToAnchorOnLoad(navHeight: number): void {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;

  const target = document.getElementById(hash.slice(1));
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
  window.scrollTo({ top, behavior: "smooth" });
}
