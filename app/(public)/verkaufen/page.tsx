import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SellOfferForm from "@/components/SellOfferForm";

export const metadata = {
  title: "Fahrzeug verkaufen – Zeki Rent kauft Ihren Pkw oder Transporter",
  description:
    "Gebrauchtwagen oder Transporter verkaufen: Fahrzeugdaten und Fotos selbst hochladen, wir melden uns mit einer Einschätzung.",
};

export default async function SellPage() {
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    console.error("Profil konnte nicht geladen werden:", err);
  }

  return (
    <div className="page-narrow page-wide">
      <Link href="/kaufen" className="back-link">
        ← Fahrzeuge kaufen
      </Link>
      <div className="vehicle-detail">
        <div>
          <h1>Fahrzeug verkaufen</h1>
          <p className="vehicle-notes">
            Sie möchten Ihren Pkw oder Transporter abgeben? Tragen Sie die
            Eckdaten ein und laden Sie Fotos hoch. Wir sehen uns das Fahrzeug an
            und melden uns mit einer Einschätzung – ohne Inseratskosten und ohne
            Anrufe fremder Händler.
          </p>
          <ul className="spec-list">
            <li>Ankauf und Vermittlung von Pkw und Transportern</li>
            <li>Bewertung durch uns, keine automatische Schätzung</li>
            <li>Abholung nach Absprache möglich</li>
            <li>
              Ihre Kontaktdaten bleiben bei uns und werden nicht veröffentlicht
            </li>
          </ul>
          <h2 className="sell-subhead">Was wir brauchen</h2>
          <ul className="abo-included">
            <li>Marke, Modell und Baujahr</li>
            <li>Kilometerstand und Leistung</li>
            <li>Zustand und TÜV bis wann</li>
            <li>Besichtigungs- oder Abholort</li>
            <li>Ein paar Fotos, gern außen und innen</li>
          </ul>
        </div>

        <div className="booking-panel">
          <h2>Fahrzeugdaten</h2>
          {userId ? (
            <SellOfferForm userId={userId} />
          ) : (
            <div className="booking-login-hint">
              <p>
                Für Ihr Angebot benötigen Sie ein Kundenkonto. So sehen Sie den
                Status jederzeit und wir haben Ihre Kontaktdaten für die
                Rückmeldung.
              </p>
              <Link
                href="/registrieren?next=/verkaufen"
                className="btn-primary btn-link btn-block"
              >
                Konto erstellen
              </Link>
              <Link
                href="/login?next=/verkaufen"
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
