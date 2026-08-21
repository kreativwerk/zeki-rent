import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type Profile } from "@/lib/types";
import { LogoutButton } from "@/components/AuthForms";
import CompanyForm from "@/components/CompanyForm";

export const metadata = { title: "Profil – Zeki Rent" };

export default async function AccountProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konto/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const p = profile as Profile | null;

  return (
    <div className="page-narrow">
      <Link href="/konto" className="back-link">
        ← Übersicht
      </Link>
      <div className="account-header">
        <h1>Profil</h1>
        <LogoutButton />
      </div>

      <div className="card">
        <h2>Firmen- &amp; Rechnungsdaten</h2>
        <p className="step-intro">
          Diese Angaben verwenden wir für Angebote, Verträge und Rechnungen.
        </p>
        <CompanyForm initial={p} />
      </div>

      <div className="card">
        <h2>Meine Daten</h2>
        <dl className="data-list">
          <dt>Name</dt>
          <dd>{p?.name ?? "–"}</dd>
          <dt>E-Mail</dt>
          <dd>{p?.email ?? user.email}</dd>
          <dt>Telefon</dt>
          <dd>{p?.phone ?? "–"}</dd>
          <dt>Einwilligung erteilt</dt>
          <dd>{p?.consent_at ? formatDate(p.consent_at) : "–"}</dd>
        </dl>
        <p className="fine-print">
          Sie können jederzeit Auskunft, Berichtigung oder Löschung Ihrer Daten
          verlangen. Eine kurze E-Mail an{" "}
          <a href="mailto:info@zeki-rent.com">info@zeki-rent.com</a> genügt.
        </p>
      </div>

      <div className="card">
        <h2>Passwort</h2>
        <p className="step-intro">
          Passwort ändern? Wir schicken Ihnen einen Link an Ihre E-Mail-Adresse.
        </p>
        <Link href="/passwort-vergessen" className="btn-secondary btn-link">
          Passwort ändern
        </Link>
      </div>
    </div>
  );
}
