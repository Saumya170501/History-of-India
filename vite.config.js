import { defineConfig } from "vite";

function shareMeta() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";
  const image = host ? `https://${host}/share-card.png` : "./share-card.png";
  return {
    name: "share-meta",
    transformIndexHtml(html) {
      return html.replaceAll("__SHARE_IMAGE__", image);
    },
  };
}

export default defineConfig({ base: "./", plugins: [shareMeta()] });
