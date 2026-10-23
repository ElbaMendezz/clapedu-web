/**
 * Helpers compartidos por los scripts de /presupuestos.
 *
 * El original en React alternaba conjuntos completos de clases de Tailwind
 * según el estado (`isSelected ? '…' : '…'`). Acá cada elemento declara sus
 * conjuntos en `data-on` / `data-off` (y `data-alt` para un tercer estado) en
 * el .astro, para que Tailwind los vea, y `setState` / `setVariant` los
 * intercambian.
 */

type Variant = "on" | "off" | "alt";

const VARIANTS: Variant[] = ["on", "off", "alt"];

const tokens = (value: string | undefined): string[] =>
  value ? value.split(/\s+/).filter(Boolean) : [];

/** Aplica el conjunto de clases `data-<variant>` y retira el de las demás variantes. */
export function setVariant(el: Element, variant: Variant): void {
  const html = el as HTMLElement;
  const add = tokens(html.dataset[variant]);
  VARIANTS.filter((v) => v !== variant).forEach((v) => {
    const drop = tokens(html.dataset[v]).filter((t) => !add.includes(t));
    html.classList.remove(...drop);
  });
  html.classList.add(...add);
}

/** Variante binaria: activo (`data-on`) / inactivo (`data-off`). */
export function setState(el: Element, on: boolean): void {
  setVariant(el, on ? "on" : "off");
}

/** Scroll suave hacia un id, igual que `scrollIntoView({ behavior: 'smooth' })` del original. */
export function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
