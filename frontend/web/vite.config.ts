import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl =
    env.VITE_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const ogImagePath = env.VITE_OG_IMAGE_PATH || "/images/countries/vietnam_image1.jpg";

  return {
    plugins: [
      react(),
      {
        name: "travelplan-link-preview-meta",
        transformIndexHtml(html: string) {
          if (!siteUrl) {
            return html
              .replace(/\s*<meta property="og:url"[^>]*\/>\s*/g, "")
              .replace(/\s*<meta property="og:image"[^>]*\/>\s*/g, "")
              .replace(/\s*<meta name="twitter:image"[^>]*\/>\s*/g, "");
          }
          const pathPart = ogImagePath.startsWith("/")
            ? ogImagePath
            : `/${ogImagePath}`;
          const ogImage = `${siteUrl}${pathPart}`;
          return html
            .replaceAll("__META_OG_URL__", siteUrl)
            .replaceAll("__META_OG_IMAGE__", ogImage);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
