import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RequestForm from "@/components/RequestForm";

export const metadata = { title: "Wunschfahrzeug anfragen – Zeki Rent" };

export default async function GeneralRequestPage() {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = !!user;
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
          <h1>Wunschfahrzeug anfragen</h1>
          <p className="vehicle-notes">
            Groß oder klein: Wir haben ein breites Netzwerk an Partnerfirmen,
            über das wir dir dein Wunschfahrzeug zu unseren Bestpreisen
            vermieten können.
          </p>
          <ul className="spec-list">
            <li>Vom Kleinwagen bis zum 7,5-Tonner</li>
            <li>Bestpreise über unser Partnernetzwerk</li>
            <li>Unverbindlich anfragen, wir melden uns mit einem Angebot</li>
          </ul>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://d8j0ntlcm91z4.cloudfront.net/user_3EApQM9b8e9WVJaVhjLHajMjyj2/hf_20260808_205457_f669bfdb-f449-4197-8292-a0b92c742223_min.webp"
            alt="VW Transporter und Crafter mit ZEKI RENT Kennzeichenhaltern"
            style={{ width: "100%", borderRadius: "1rem", marginTop: "1rem" }}
          />
        </div>

        <div className="booking-panel">
          <h2>Jetzt anfragen</h2>
          {loggedIn ? (
            <RequestForm />
          ) : (
            <div className="booking-login-hint">
              <p>
                Für Ihre Anfrage benötigen Sie ein Kundenkonto. So können wir
                Ihnen Angebote zusenden und Sie sehen den Status jederzeit.
              </p>
              <Link
                href="/registrieren?next=/anfrage"
                className="btn-primary btn-link btn-block"
              >
                Konto erstellen
              </Link>
              <Link
                href="/login?next=/anfrage"
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
