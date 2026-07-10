/**
 * Efecto cortina sobre la foto de "Importancia" (/metodologia): al entrar
 * la sección en viewport (threshold 0.22, una sola vez), tras 260ms el
 * overlay degradado se contrae (`scaleX` desde el borde derecho) mientras
 * la imagen, que arranca ligeramente ampliada, vuelve a su escala normal.
 * Réplica de setupImgReveal(), ver INVENTARIO.md.
 */
export function attachImgWipe(root: HTMLElement): void {
  const media = root.querySelector<HTMLElement>("[data-img-wipe-root]");
  if (!media) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setTimeout(() => media.classList.add("is-open"), 260);
      });
    },
    { threshold: 0.22 },
  );
  io.observe(root);
}
