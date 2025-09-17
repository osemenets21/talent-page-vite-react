import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/backend": {
          target: env.VITE_API_DOMAIN || "http://localhost:8000",
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
      watch: {
        ignored: [
          "**/backend/uploads/**",
          "**/backend/submissions/**",
        ],
      },
    },
  };
});
