import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PrebookForm from "@/components/PrebookForm";

export const metadata = { title: "Togg T10X vormerken – Zeki Rent" };

export default async function PrebookPage() {
  let loggedIn = false;
  let alreadyListed = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = !!user;
    if (user) {
      const { data } = await supabase
        .from("prebookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("model", "Togg T10X")
        .maybeSingle();
      alreadyListed = !!data;
    }
  } catch {
    loggedIn = false;
  }

  return (
    <div className="page-narrow">
      <Link href="/#fahrzeuge" className="back-link">
        ← Alle Fahrzeuge
      </Link>
      <div className="vehicle-detail">
        <div>
          <span className="badge-soon">Coming soon</span>
          <h1>Togg T10X</h1>
          <ul className="spec-list">
            <li>Vollelektrisches SUV</li>
            <li>Exklusiv bei Zeki Mobility</li>
            <li>Vormerken kostenlos und unverbindlich</li>
          </ul>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fahrzeuge/togg-t10x.webp"
            alt="Togg T10X, blau"
            style={{ width: "100%", borderRadius: "1rem", marginTop: "1rem" }}
          />
        </div>

        <div className="booking-panel">
          <h2>Jetzt vormerken</h2>
          {loggedIn ? (
            <PrebookForm alreadyListed={alreadyListed} />
          ) : (
            <div className="booking-login-hint">
              <p>
                Zum Vormerken benötigen Sie ein Kundenkonto. So halten wir Sie
                auf dem Laufenden und Sie sehen Ihre Vormerkung jederzeit im
                Kundenkonto.
              </p>
              <Link
                href="/registrieren?next=/vormerken"
                className="btn-primary btn-link btn-block"
              >
                Konto erstellen
              </Link>
              <Link
                href="/login?next=/vormerken"
                className="btn-secondary btn-link btn-block"
              >
                Anmelden
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
