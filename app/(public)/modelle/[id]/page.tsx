import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ABO_TERMS,
  aboPriceFor,
  formatEuro,
  vehicleTitle,
  type CatalogVehicle,
} from "@/lib/types";
import AboRequestForm from "@/components/AboRequestForm";
import CompanyGate from "@/components/CompanyGate";
import { isCompanyComplete, type CompanyData } from "@/lib/company";

export default async function CatalogVehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let vehicle: CatalogVehicle | null = null;
  let loggedIn = false;
  let companyComplete = false;
  let company: CompanyData | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("catalog_vehicles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    vehicle = data as CatalogVehicle | null;
  } catch (err) {
    console.error("Modell konnte nicht geladen werden:", err);
  }

  // Entwuerfe sind per RLS nur fuer Admins sichtbar, die so eine Vorschau haben
  if (!vehicle) notFound();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = !!user;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "customer_type, company_name, billing_street, billing_zip, billing_city, vat_id, delivery_same, delivery_street, delivery_zip, delivery_city"
        )
        .eq("id", user.id)
        .maybeSingle();
      company = profile;
      companyComplete = isCompanyComplete(profile);
    }
  } catch (err) {
    console.error("Profil konnte nicht geladen werden:", err);
  }

  const service = vehicle.service_type === "miete" ? "miete" : "abo";
  const backHref = service === "miete" ? "/#fahrzeuge" : "/abo#modelle";
  const specs = [
    ["Segment", vehicle.segment],
    ["Antrieb", vehicle.drivetrain],
    ["Leistung", vehicle.power],
    ["Länge", vehicle.length],
    ["Reichweite / Verbrauch", vehicle.range_text],
    ["Sitzplätze", vehicle.seats ? `${vehicle.seats}` : null],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  const hasRates = ABO_TERMS.some((m) => aboPriceFor(vehicle!, m) !== null);

  return (
    <div className="page-narrow">
      <Link href={backHref} className="back-link">
        ← {service === "miete" ? "Alle Fahrzeuge" : "Alle Abo-Modelle"}
      </Link>
      <div className="vehicle-detail">
        <div>
          <span className="vehicle-category">
            {service === "miete" ? "Miete" : "Auto-Abo"}
            {!vehicle.active && " · Entwurf, nur für Admins sichtbar"}
          </span>
          <h1>{vehicleTitle(vehicle)}</h1>

          {vehicle.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.photo_url}
              alt={vehicleTitle(vehicle)}
              style={{ width: "100%", borderRadius: "1rem", margin: "1rem 0" }}
            />
          )}

          <ul className="spec-list">
            {specs.map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>

          {vehicle.highlights && (
            <p className="vehicle-notes">{vehicle.highlights}</p>
          )}

          {hasRates ? (
            <>
              <h2>Monatsraten</h2>
              <table className="price-table">
                <tbody>
                  {ABO_TERMS.map((m) => {
                    const p = aboPriceFor(vehicle!, m);
                    if (p === null) return null;
                    return (
                      <tr key={m}>
                        <td>{m} Monate</td>
                        <td>
                          <strong>{formatEuro(p)}</strong>/Monat
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="fine-print">
                Versicherung mit Vollkasko, Wartung, Steuer und Reifen sind
                enthalten. Kraftstoff oder Strom zahlen Sie selbst.
              </p>
            </>
          ) : (
            <>
              <h2>Konditionen</h2>
              <p className="vehicle-notes">
                Die Monatsrate stimmen wir individuell mit Ihnen ab, passend zu
                Laufzeit und Kilometerleistung. Senden Sie uns eine
                unverbindliche Anfrage, wir melden uns mit Ihrem Angebot.
              </p>
            </>
          )}
        </div>

        <div className="booking-panel">
          <h2>Jetzt anfragen</h2>
          {loggedIn ? (
            <CompanyGate complete={companyComplete} initial={company}>
              <AboRequestForm vehicle={vehicle} service={service} />
            </CompanyGate>
          ) : (
            <div className="booking-login-hint">
              <p>
                Für Ihre Anfrage benötigen Sie ein Kundenkonto. So können wir
                Ihnen ein Angebot zusenden und Sie sehen den Status jederzeit.
              </p>
              <Link
                href={`/registrieren?next=/modelle/${vehicle.id}`}
                className="btn-primary btn-link btn-block"
              >
                Konto erstellen
              </Link>
              <Link
                href={`/login?next=/modelle/${vehicle.id}`}
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
