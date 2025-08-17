import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/cdp": {
        target: "https://api.cdp.coinbase.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cdp/, ""),
      },
    },
  },
});
