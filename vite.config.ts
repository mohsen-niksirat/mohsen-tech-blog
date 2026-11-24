import { defineConfig, type Plugin } from "vite";

function spaRouteRewrite(): Plugin {
  const spaPrefixes = ["/fa", "/essays", "/projects", "/notes", "/about", "/archive", "/search"];
  return {
    name: "spa-route-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url || "").split("?")[0];
        if (
          url !== "/" &&
          !url.startsWith("/src/") &&
          !url.startsWith("/assets/") &&
          !url.startsWith("/@") &&
          !url.startsWith("/node_modules/") &&
          spaPrefixes.some((p) => url === p || url.startsWith(`${p}/`))
        ) {
          req.url = "/index.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: ".",
  publicDir: false,
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
