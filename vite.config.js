// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VITE_API_DOMAIN } from "./src/config/env"; // Adjust the import path as needed

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/backend": {
        target: VITE_API_DOMAIN,
        changeOrigin: true,
        // if your PHP is really at http://localhost:8000/backend/..., keep as-is
        // if it's at http://localhost:8000/talent_submit.php, use: rewrite: p => p.replace(/^\/backend/, '')
        rewrite: (path) => path,
      },
    },
    watch: {
      ignored: [
        "**/backend/uploads/**",
        "**/backend/submissions/**",
        // add any other PHP write locations
      ],
    },
  },
});
