/**
 * Formulario de contacto: envía los datos a /api/contact (Resend en el
 * servidor) y muestra el estado de confirmación solo si el envío fue
 * exitoso. Si el servidor responde con error, lo muestra en línea sin
 * perder lo que la persona ya escribió.
 */
export function attachContactForm(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>("[data-contact-form]");
  const formState = root.querySelector<HTMLElement>("[data-contact-form-state]");
  const successState = root.querySelector<HTMLElement>("[data-contact-success-state]");
  const errorEl = root.querySelector<HTMLElement>("[data-contact-error]");
  const submitBtn = form?.querySelector<HTMLButtonElement>("button[type='submit']");
  if (!form || !formState || !successState || !errorEl || !submitBtn) return;

  const idleLabel = submitBtn.textContent ?? "Enviar mensaje";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = "";

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      company: String(data.get("company") ?? ""),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || "No se pudo enviar el mensaje. Intenta de nuevo.");
      }

      form.reset();
      formState.style.display = "none";
      successState.style.display = "block";
    } catch (err) {
      errorEl.textContent =
        err instanceof Error ? err.message : "No se pudo enviar el mensaje. Intenta de nuevo.";
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = idleLabel;
    }
  });
}
