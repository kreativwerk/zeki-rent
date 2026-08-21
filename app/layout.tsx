import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeki Rent – Transporter Langzeitmiete",
  description:
    "Transporter und Fahrzeuge monatlich mieten: flexibel ab 1 Monat, 24/7-Übergabe, Bring- & Abholservice.",
  // Auf dem Startbildschirm erscheint das Z aus dem Logo
  appleWebApp: {
    capable: true,
    title: "Zeki Rent",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
