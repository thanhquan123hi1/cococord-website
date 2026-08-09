import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_PROXY_TARGET ?? "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": backendUrl,
        "/css": backendUrl,
        "/ws": {
          target: backendUrl,
          ws: true,
        },
      },
    },
  };
});
