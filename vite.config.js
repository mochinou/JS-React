import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the production build work on any static host,
// including GitHub Pages project subpaths (user.github.io/repo/).
export default defineConfig({
  plugins: [react()],
  base: "./",
  preview: {
    allowedHosts: true, // allow the sandbox/live-preview proxy host
  },
});
