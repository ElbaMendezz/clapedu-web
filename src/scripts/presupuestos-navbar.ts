import { setState } from "./presupuestos-ui";

/** Umbral de `window.scrollY > 40` del original. */
const SCROLLED_AFTER = 40;

/**
 * Navbar de /presupuestos-participativos: alterna el estilo de la barra al hacer scroll y
 * maneja el menú móvil (`isScrolled` / `mobileMenuOpen` del original).
 */
export function attachNavbar(header: HTMLElement): void {
  const nav = header.querySelector<HTMLElement>("[data-pps-nav]");
  const burger = header.querySelector<HTMLElement>("[data-pps-burger]");
  const menu = header.querySelector<HTMLElement>("[data-pps-menu]");
  const iconOpen = header.querySelector<HTMLElement>("[data-pps-burger-open]");
  const iconClose = header.querySelector<HTMLElement>("[data-pps-burger-close]");
  if (!nav || !burger || !menu) return;

  const onScroll = (): void => setState(nav, window.scrollY > SCROLLED_AFTER);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenu = (open: boolean): void => {
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    // Los iconos son <svg>: no tienen la propiedad `hidden`, solo el atributo.
    iconOpen?.toggleAttribute("hidden", open);
    iconClose?.toggleAttribute("hidden", !open);
  };

  burger.addEventListener("click", () => setMenu(Boolean(menu.hidden)));
  // Los enlaces del menú móvil lo cierran al navegar.
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
}
