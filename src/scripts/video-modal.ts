/**
 * Lightbox de video de YouTube: click en el CTA abre el modal e inyecta el
 * iframe (con autoplay); cerrar (botón/click-fuera/Escape) limpia el src
 * para detener la reproducción. Réplica de setupVideo(), ver
 * INVENTARIO.md.
 */
export function attachVideoModal(root: HTMLElement): void {
  const modal = root.querySelector<HTMLElement>("[data-videomodal]");
  const cta = root.querySelector<HTMLElement>("[data-videocta]");
  const frame = modal?.querySelector<HTMLIFrameElement>("[data-videoframe]");
  const closeBtn = modal?.querySelector<HTMLElement>("[data-videoclose]");
  if (!modal || !cta || !frame) return;

  const open = (e: Event) => {
    e.preventDefault();
    const id = cta.dataset.videocta || "IFOMXVOGk4A";
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const hide = () => {
    modal.classList.remove("is-open");
    frame.src = "";
    document.body.style.overflow = "";
  };

  cta.addEventListener("click", open);
  closeBtn?.addEventListener("click", hide);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) hide();
  });
}
