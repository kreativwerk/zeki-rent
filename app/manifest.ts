import type { MetadataRoute } from "next";

/** Damit die Seite als App auf dem Startbildschirm landet. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zeki Rent – Transporter Langzeitmiete",
    short_name: "Zeki Rent",
    description:
      "Transporter und Pkw ab einem Monat mieten, Auto-Abo, Kauf und Ankauf.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0e",
    theme_color: "#0c0c0e",
    lang: "de",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
