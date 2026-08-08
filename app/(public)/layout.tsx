import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <footer className="site-footer" id="kontakt">
        <div className="site-footer-inner">
          <div>
            <div className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-light.png" alt="ZEKI" />
            </div>
            <p>
              Transporter-Langzeitmiete ab 1 Monat.
              <br />
              Übergabe rund um die Uhr, Bring- &amp; Abholservice.
            </p>
          </div>
          <div>
            <h3>Kontakt</h3>
            <p>
              <a href="tel:+491639574116">0163 9574116</a>
              <br />
              <a href="mailto:info@zeki-rent.com">
                info@zeki-rent.com
              </a>
            </p>
          </div>
          <div>
            <h3>Rechtliches</h3>
            <p>
              <Link href="/impressum">Impressum</Link>
              <br />
              <Link href="/datenschutz">Datenschutz</Link>
            </p>
          </div>
        </div>
        <p className="site-footer-note">
          © {new Date().getFullYear()} Zeki Rent GmbH
        </p>
      </footer>
    </>
  );
}
