// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://clapedu.org",
  output: "server",
  integrations: [sitemap()],
  adapter: node({ mode: "standalone" }),
});
