import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tailwind v4 solo se usa en el panel del prestador. Su hoja se importa con "?inline"
// y se inyecta únicamente mientras ese panel está montado (ver hooks/useEstilos.js),
// por eso su Preflight no afecta a las demás páginas que usan Bootstrap.
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
