import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  let user = null;
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: admin } = await supabase.rpc("is_admin");
      isAdmin = admin === true;
    }
  } catch {
    // Ohne Verbindung: öffentliche Navigation anzeigen
  }

  return (
    <div className="topbar">
      <div className="topbar-inner site-nav">
        <Link href="/" className="logo">
          ZEKI <span>RENT</span>
        </Link>
        <nav className="nav-links">
          <Link href="/#fahrzeuge">Fahrzeuge</Link>
          <Link href="/#ablauf">So funktioniert&apos;s</Link>
          <Link href="/#kontakt">Kontakt</Link>
        </nav>
        <div className="nav-actions">
          {isAdmin && (
            <Link href="/admin" className="nav-admin-link">
              Admin
            </Link>
          )}
          {user ? (
            <Link href="/konto" className="btn-small btn-small-secondary">
              Mein Konto
            </Link>
          ) : (
            <Link href="/login" className="btn-small btn-small-secondary">
              Anmelden
            </Link>
          )}
          <Link href="/#fahrzeuge" className="btn-small btn-cta">
            Jetzt mieten
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden
            >
              <path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
