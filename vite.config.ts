import { defineConfig, type Plugin } from "vite";

const BASE = "/mohsen-tech-blog/";

function spaRouteRewrite(): Plugin {
  const spaPrefixes = ["/fa", "/essays", "/projects", "/notes", "/about", "/archive", "/search"];
  return {
    name: "spa-route-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rawUrl = (req.url || "").split("?")[0];
        const sub = rawUrl.startsWith(BASE) ? `/${rawUrl.slice(BASE.length)}` : rawUrl;
        if (
          sub !== "/" &&
          !sub.startsWith("/src/") &&
          !sub.startsWith("/assets/") &&
          !sub.startsWith("/@") &&
          !sub.startsWith("/node_modules/") &&
          spaPrefixes.some((p) => sub === p || sub.startsWith(`${p}/`))
        ) {
          req.url = `${BASE}index.html`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  root: ".",
  publicDir: "public",
  plugins: [spaRouteRewrite()],
  server: {
    port: 5173,
    strictPort: false,
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
