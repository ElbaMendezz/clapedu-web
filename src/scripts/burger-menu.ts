/**
 * Toggle del menú móvil full-screen y animación del ícono hamburguesa.
 * Réplica del comportamiento original (openMenu/closeMenu/setBurger),
 * ver INVENTARIO.md §2.4.
 */
export function attachBurgerMenu(root: HTMLElement): void {
  const burger = root.querySelector<HTMLButtonElement>("[data-burger]");
  const menu = root.querySelector<HTMLElement>("[data-mobile-menu]");
  if (!burger || !menu) return;

  const spans = burger.querySelectorAll<HTMLSpanElement>("span");
  const [line1, line2, line3] = spans;

  let open = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const setIcon = (isOpen: boolean) => {
    if (line1) line1.style.transform = isOpen ? "translateY(7px) rotate(45deg)" : "none";
    if (line2) {
      line2.style.opacity = isOpen ? "0" : "1";
      line2.style.transform = isOpen ? "scaleX(.3)" : "none";
    }
    if (line3) line3.style.transform = isOpen ? "translateY(-7px) rotate(-45deg)" : "none";
  };

  const collapseSubmenus = () => {
    menu.querySelectorAll<HTMLElement>("[data-msub]").forEach((panel) => {
      panel.style.maxHeight = "0px";
    });
    menu.querySelectorAll<HTMLElement>("[data-msub-chev]").forEach((chev) => {
      chev.style.transform = "rotate(0deg)";
    });
  };

  const openMenu = () => {
    clearTimeout(closeTimer);
    menu.style.display = "flex";
    void menu.offsetHeight; // reflow para que la transición corra
    menu.style.opacity = "1";
    menu.style.transform = "translateY(0)";
    open = true;
    setIcon(true);
    burger.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    menu.style.opacity = "0";
    menu.style.transform = "translateY(-8px)";
    open = false;
    setIcon(false);
    burger.setAttribute("aria-expanded", "false");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!open) menu.style.display = "none";
    }, 300);
    collapseSubmenus();
  };

  burger.addEventListener("click", () => (open ? closeMenu() : openMenu()));
  menu.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  const desktopQuery = window.matchMedia("(min-width: 1100px)");
  desktopQuery.addEventListener("change", (e) => {
    if (e.matches && open) closeMenu();
  });
}
