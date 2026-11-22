import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// BUG-14 fix: viteSingleFile() inlines all assets into one HTML file,
// which breaks streaming SSE fetch calls in development because the browser
// sees them as same-origin blob: requests with no CORS allowance.
// Only enable singleFile for production builds (not in dev server mode).
// import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    // Conditionally apply singleFile ONLY for `vite build`, not `vite dev`
    // Uncomment if you need a single-file build output:
    // ...(command === 'build' ? [viteSingleFile()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    // Proxy API calls to the Python backend in dev to avoid CORS issues
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (p) => p,
      },
    },
  },
}));
