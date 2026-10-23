// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://clapedu.org',
  integrations: [sitemap()],
  // Tailwind v4 solo lo usa /presupuestos (src/styles/presupuestos.css,
  // importado únicamente desde PresupuestosLayout). El resto del sitio sigue
  // con CSS scoped + global.css: el plugin solo procesa los CSS que
  // declaran `@import "tailwindcss"`.
  vite: { plugins: [tailwindcss()] },
  // Solo afecta a `astro dev`: permite abrir el servidor de desarrollo a
  // través de un túnel rápido de Cloudflare (cada túnel usa un subdominio
  // aleatorio de trycloudflare.com; el punto inicial los admite todos).
  server: { allowedHosts: ['.trycloudflare.com'] },
  // El sitio sigue siendo estático por defecto (todas las páginas se
  // prerenderizan). El adaptador solo habilita rutas on-demand puntuales,
  // como src/pages/api/contact.ts, que necesitan ejecutar código de
  // servidor (llamar a Resend) en cada request. Modo "standalone": genera
  // un servidor Node autocontenido (dist/server/entry.mjs), compatible con
  // el hosting Node.js de Hostinger Cloud.
  adapter: node({ mode: 'standalone' }),
  // A partir de astro@7.3.6 / @astrojs/node@11.1.7, el adapter valida el
  // header Host contra security.allowedDomains; sin esto configurado, cae
  // a "localhost" en vez de clapedu.org detrás del proxy de Hostinger.
  security: {
    allowedDomains: [
      { hostname: 'clapedu.org', protocol: 'https' },
      { hostname: 'www.clapedu.org', protocol: 'https' },
    ],
  },
});
