import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the built site work from any folder, including GitHub Pages
// project sites (https://<user>.github.io/<repo>/), with no repo name hard-coded.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
