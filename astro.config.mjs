// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://clapedu.org',
  integrations: [sitemap()],
  // El sitio sigue siendo estático por defecto (todas las páginas se
  // prerenderizan). El adaptador solo habilita rutas on-demand puntuales,
  // como src/pages/api/contact.ts, que necesitan ejecutar código de
  // servidor (llamar a Resend) en cada request. Modo "standalone": genera
  // un servidor Node autocontenido (dist/server/entry.mjs), compatible con
  // el hosting Node.js de Hostinger Cloud.
  adapter: node({ mode: 'standalone' }),
});
