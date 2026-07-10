/**
 * Entrada especial de la sección Espacios — distinta del reveal genérico
 * (reveal.ts): columna izquierda con fade+slide escalonado (100ms por
 * elemento), columna derecha con "bounce" alternando de lado escalonado
 * (120ms). Réplica de setupEspacios(), ver INVENTARIO.md. Se repite cada
 * vez que la sección entra en viewport (threshold 0.2), sin ocultarse al
 * salir (los `@keyframes` mantienen el estado final vía `both`).
 */
export function attachEspaciosReveal(
  section: HTMLElement,
  leftItems: HTMLElement[],
  rightItems: HTMLElement[],
): void {
  const bounceDirections = ["clap-bounce-in-left", "clap-bounce-in-right"];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        leftItems.forEach((el, i) => {
          el.style.animation = "none";
          void el.offsetHeight;
          el.style.animation = `clap-fade-in-up 0.9s cubic-bezier(.25,.46,.45,.94) ${i * 100}ms both`;
        });

        rightItems.forEach((el, i) => {
          el.style.animation = "none";
          void el.offsetHeight;
          const direction = bounceDirections[i % bounceDirections.length];
          el.style.animation = `${direction} 1.1s cubic-bezier(.68,.55,.265,1.55) ${i * 120}ms both`;
        });
      });
    },
    { threshold: 0.2 },
  );
  observer.observe(section);
}
