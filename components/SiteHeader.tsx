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
            <Link href="/konto" className="btn-small">
              Mein Konto
            </Link>
          ) : (
            <Link href="/login" className="btn-small">
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
