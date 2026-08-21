import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ZekiLogo from "@/components/Logo";
import AccountMenu from "@/components/AccountMenu";

export default async function SiteHeader() {
  let user = null;
  let isAdmin = false;
  let profileName: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: admin } = await supabase.rpc("is_admin");
      isAdmin = admin === true;
      if (!isAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();
        profileName = profile?.name ?? null;
      }
    }
  } catch {
    // Ohne Verbindung: öffentliche Navigation anzeigen
  }

  return (
    <div className="topbar">
      <div className="topbar-inner site-nav">
        <Link href="/" className="logo">
          <ZekiLogo />
        </Link>
        <nav className="nav-links">
          <Link href="/#fahrzeuge">Fahrzeuge</Link>
          <Link href="/abo">Auto-Abo</Link>
          <Link href="/kaufen">Kaufen</Link>
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
            !isAdmin && (
              <AccountMenu name={profileName} email={user.email ?? null} />
            )
          ) : (
            <>
              <Link href="/login" className="btn-small btn-small-secondary">
                Anmelden
              </Link>
              <Link href="/registrieren" className="btn-small btn-cta">
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
