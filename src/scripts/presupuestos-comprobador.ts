import { setState } from "./presupuestos-ui";

type AgeGroup = "under16" | "16-17" | "18plus";

interface Eligibility {
  eligible: boolean;
  message: string;
}

/** Misma lógica de `getEligibilityStatus` del original (SeccionRequisitos.tsx). */
function getEligibilityStatus(
  isColombian: boolean | null,
  ageGroup: AgeGroup | null,
  livesInBarrio: boolean | null,
): Eligibility | null {
  if (isColombian === null || ageGroup === null || livesInBarrio === null) return null;
  if (!isColombian)
    return { eligible: false, message: "Debe ser ciudadano colombiano para acceder a los Presupuestos Participativos de Bucaramanga." };
  if (ageGroup === "under16")
    return { eligible: false, message: "La edad mínima requerida es 16 años a la fecha de inicio del programa." };
  if (!livesInBarrio)
    return { eligible: false, message: "Debe residir en uno de los barrios convocados y contar con certificado de residencia de la Alcaldía." };
  if (ageGroup === "16-17")
    return {
      eligible: true,
      message:
        "¡Cumple con los requisitos generales! (Recuerde que requerirá autorización escrita y firmada por su padre/madre o acudiente legal, y Primera Infancia requiere ser mayor de 18).",
    };
  return { eligible: true, message: "¡Cumple con el 100% de los requisitos generales para postularse!" };
}

/** Comprobador de elegibilidad de "¿Quién puede participar?". */
export function attachComprobador(root: HTMLElement): void {
  const toggle = root.querySelector<HTMLElement>("[data-check-toggle]");
  const panel = root.querySelector<HTMLElement>("[data-check-panel]");
  const result = root.querySelector<HTMLElement>("[data-check-result]");
  const ok = root.querySelector<HTMLElement>("[data-check-ok]");
  const fail = root.querySelector<HTMLElement>("[data-check-fail]");
  const message = root.querySelector<HTMLElement>("[data-check-message]");
  if (!toggle || !panel || !result || !ok || !fail || !message) return;

  let isColombian: boolean | null = null;
  let ageGroup: AgeGroup | null = null;
  let livesInBarrio: boolean | null = null;

  const render = (): void => {
    root.querySelectorAll<HTMLElement>("[data-check-opt]").forEach((btn) => {
      const value = btn.dataset.value;
      const selected =
        btn.dataset.checkOpt === "colombian"
          ? isColombian === (value === "yes") && isColombian !== null
          : btn.dataset.checkOpt === "age"
            ? ageGroup === value
            : livesInBarrio === (value === "yes") && livesInBarrio !== null;
      setState(btn, selected);
    });

    const status = getEligibilityStatus(isColombian, ageGroup, livesInBarrio);
    result.hidden = status === null;
    if (!status) return;
    setState(result, status.eligible);
    ok.hidden = !status.eligible;
    fail.hidden = status.eligible;
    message.textContent = status.message;
  };

  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.textContent = panel.hidden ? "Probar comprobador" : "Ocultar comprobador";
  });

  root.querySelectorAll<HTMLElement>("[data-check-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.value;
      if (btn.dataset.checkOpt === "colombian") isColombian = value === "yes";
      else if (btn.dataset.checkOpt === "age") ageGroup = value as AgeGroup;
      else livesInBarrio = value === "yes";
      render();
    });
  });
}
