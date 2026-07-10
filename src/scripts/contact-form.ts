/**
 * Formulario de contacto: al enviar, muestra el estado de confirmación.
 * Réplica de submitForm() del original — que tampoco envía a ningún
 * backend/API real, solo cambia de estado local (`sent:true`). Se deja
 * igual aquí; si se necesita envío real hay que decidir el destino
 * (email, API propia, servicio de formularios) — no es parte de esta
 * migración, ver INVENTARIO.md.
 */
export function attachContactForm(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>("[data-contact-form]");
  const formState = root.querySelector<HTMLElement>("[data-contact-form-state]");
  const successState = root.querySelector<HTMLElement>("[data-contact-success-state]");
  if (!form || !formState || !successState) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formState.style.display = "none";
    successState.style.display = "block";
  });
}
