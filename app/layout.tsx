import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeki Rent – Transporter Langzeitmiete",
  description:
    "Transporter und Fahrzeuge monatlich mieten: flexibel ab 1 Monat, 24/7-Übergabe, Bring- & Abholservice.",
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
