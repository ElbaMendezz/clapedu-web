/**
 * Cuenta regresiva del hero de /programas hasta el 1 de agosto de 2026,
 * 23:59:59 (hora Colombia, UTC-5). Pinta ceros, espera 350ms y hace un
 * "roll-up" de 1.1s desde 0 hasta el valor real (ease-out cúbico) antes de
 * arrancar el conteo en vivo cada 1s. Réplica de setupCountdown(), ver
 * INVENTARIO.md.
 */
export function attachCountdown(root: ParentNode): void {
  const wrap = root.querySelector<HTMLElement>("[data-countdown]");
  if (!wrap) return;

  const target = new Date("2026-08-01T23:59:59-05:00").getTime();
  const els = {
    days: root.querySelector<HTMLElement>('[data-cd="days"]'),
    hours: root.querySelector<HTMLElement>('[data-cd="hours"]'),
    mins: root.querySelector<HTMLElement>('[data-cd="mins"]'),
    secs: root.querySelector<HTMLElement>('[data-cd="secs"]'),
  };
  const keys = ["days", "hours", "mins", "secs"] as const;
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

  const parts = () => {
    const diff = target - Date.now();
    return {
      days: Math.max(0, Math.floor(diff / 86400000)),
      hours: Math.floor((Math.max(0, diff) % 86400000) / 3600000),
      mins: Math.floor((Math.max(0, diff) % 3600000) / 60000),
      secs: Math.floor((Math.max(0, diff) % 60000) / 1000),
    };
  };

  const tick = () => {
    const p = parts();
    keys.forEach((k) => {
      const el = els[k];
      if (el) el.textContent = pad(p[k]);
    });
  };

  const startLive = () => {
    tick();
    setInterval(tick, 1000);
  };

  const runIntro = () => {
    const finals = parts();
    const duration = 1100;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      keys.forEach((k) => {
        const el = els[k];
        if (el) el.textContent = pad(Math.round(ease * finals[k]));
      });
      if (t < 1) requestAnimationFrame(step);
      else startLive();
    };
    requestAnimationFrame(step);
  };

  keys.forEach((k) => {
    const el = els[k];
    if (el) el.textContent = "00";
  });
  setTimeout(runIntro, 350);
}
