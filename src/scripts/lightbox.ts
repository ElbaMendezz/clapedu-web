/**
 * Lightbox de imágenes, solo activo en móvil/tablet (<1100px, igual que
 * el original — en desktop el hover ya es suficiente). Navegación
 * prev/next, cierre por click-fuera/Escape/botón, flechas de teclado.
 * Réplica de setupEspLightbox(), ver INVENTARIO.md.
 *
 * Marcado esperado:
 *   root: elementos [data-lightbox-item] con un <img> y un <figcaption>-like
 *         nodo de texto (`data-lightbox-caption-source`) dentro.
 *   lightbox: [data-lightbox] conteniendo [data-lightbox-img],
 *             [data-lightbox-cap], [data-lightbox-close/prev/next].
 */
export function attachLightbox(root: HTMLElement, lightbox: HTMLElement, maxWidth = 1100): void {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-lightbox-item]"));
  if (!items.length) return;

  const data = items.map((item) => {
    const img = item.querySelector("img");
    const caption = item.querySelector<HTMLElement>("[data-lightbox-caption-source]");
    return { src: img?.getAttribute("src") ?? "", caption: caption?.textContent ?? "" };
  });

  const lbImg = lightbox.querySelector<HTMLImageElement>("[data-lightbox-img]");
  const lbCap = lightbox.querySelector<HTMLElement>("[data-lightbox-cap]");
  let current = 0;

  const show = (i: number) => {
    const n = data.length;
    current = ((i % n) + n) % n;
    if (lbImg) {
      lbImg.src = data[current].src;
      lbImg.alt = data[current].caption;
    }
    if (lbCap) lbCap.textContent = data[current].caption;
  };

  const open = (i: number) => {
    show(i);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  items.forEach((item, i) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < maxWidth) open(i);
    });
  });

  lightbox.querySelector("[data-lightbox-close]")?.addEventListener("click", close);
  lightbox.querySelector("[data-lightbox-prev]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    show(current - 1);
  });
  lightbox.querySelector("[data-lightbox-next]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    show(current + 1);
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
  });
}
