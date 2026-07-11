import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Louange Connect 360",
    short_name: "Louange 360",
    description:
      "Plateforme de gestion des cellules, activités, finances et patrimoine de l'Église La Louange.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#210b5c",
    theme_color: "#3b169b",
    orientation: "portrait",
    icons: [
      {
        src: "/logo-louange.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-louange.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}