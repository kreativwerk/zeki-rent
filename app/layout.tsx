import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeki Rent – Fragebogen Transporter-Vermietung",
  description:
    "Fragebogen zur Vorbereitung Ihrer neuen Webapp für die Transporter-Vermietung.",
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
