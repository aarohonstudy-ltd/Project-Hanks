import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "আরোহণ",
    short_name: "আরোহণ",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    icons: [
      { src: "/push-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/push-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
