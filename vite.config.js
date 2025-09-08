// // vite.config.ts
// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig(({ mode }) => {
//   // Load env file based on `mode` in the current working directory
//   const env = loadEnv(mode, process.cwd(), '');
  
//   return {
//     plugins: [react()],
//     server: {
//       proxy: {
//         "/backend": {
//           target: env.VITE_API_DOMAIN || "http://localhost:8000",
//           changeOrigin: true,
//           // if your PHP is really at http://localhost:8000/backend/..., keep as-is
//           // if it's at http://localhost:8000/talent_submit.php, use: rewrite: p => p.replace(/^\/backend/, '')
//           rewrite: (path) => path,
//         },
//       },
//       watch: {
//         ignored: [
//           "**/backend/uploads/**",
//           "**/backend/submissions/**",
//           // add any other PHP write locations
//         ],
//       },
//     },
//   };
// });

// vite.config.ts
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
