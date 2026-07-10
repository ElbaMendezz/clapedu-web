declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/** Resuelve un token de reCAPTCHA v3 (invisible) para la acción "contact". */
function getRecaptchaToken(siteKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("reCAPTCHA no cargó."));
      return;
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha!.execute(siteKey, { action: "contact" }).then(resolve).catch(reject);
    });
  });
}

/**
 * Formulario de contacto: envía los datos a /api/contact (Resend +
 * verificación de reCAPTCHA v3 en el servidor) y muestra el estado de
 * confirmación solo si el envío fue exitoso. Si el servidor responde con
 * error, lo muestra en línea sin perder lo que la persona ya escribió.
 */
export function attachContactForm(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>("[data-contact-form]");
  const formState = root.querySelector<HTMLElement>("[data-contact-form-state]");
  const successState = root.querySelector<HTMLElement>("[data-contact-success-state]");
  const errorEl = root.querySelector<HTMLElement>("[data-contact-error]");
  const submitBtn = form?.querySelector<HTMLButtonElement>("button[type='submit']");
  const siteKey = root.dataset.recaptchaSiteKey;
  if (!form || !formState || !successState || !errorEl || !submitBtn || !siteKey) return;

  const idleLabel = submitBtn.textContent ?? "Enviar mensaje";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = "";

    const data = new FormData(form);
    const fields = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      company: String(data.get("company") ?? ""),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      let recaptchaToken: string;
      try {
        recaptchaToken = await getRecaptchaToken(siteKey);
      } catch {
        throw new Error(
          "No se pudo verificar que el envío sea humano. Recarga la página e intenta de nuevo.",
        );
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, recaptchaToken }),
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
