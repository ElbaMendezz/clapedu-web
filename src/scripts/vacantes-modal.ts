/**
 * Modal de la pieza gráfica oficial del detalle de una vacante. Usa el
 * <dialog> nativo (ver ModalPieza.astro): Escape y el foco los maneja el
 * navegador; aquí solo se abre/cierra y se cierra al hacer clic en el fondo.
 */
export function attachModalPieza(root: HTMLElement): void {
  const dialogo = root.querySelector<HTMLDialogElement>("[data-pieza]");
  const abrir = root.querySelector<HTMLButtonElement>("[data-abrir-pieza]");
  if (!dialogo || !abrir) return;

  abrir.addEventListener("click", () => dialogo.showModal());

  dialogo.querySelector("[data-cerrar-pieza]")?.addEventListener("click", () => dialogo.close());

  // Un clic directo sobre el <dialog> (y no sobre su caja) es un clic en el fondo.
  dialogo.addEventListener("click", (evento) => {
    if (evento.target === dialogo) dialogo.close();
  });

  // Si la imagen (remota, viene de la hoja) no carga, se retira la opción.
  dialogo.querySelector("img")?.addEventListener("error", () => {
    dialogo.close();
    abrir.hidden = true;
  });
}
