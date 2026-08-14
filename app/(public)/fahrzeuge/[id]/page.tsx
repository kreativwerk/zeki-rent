import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DURATIONS,
  formatEuro,
  kmLabel,
  kmPackages,
  priceFor,
  type Vehicle,
} from "@/lib/types";
import BookingForm from "@/components/BookingForm";
import CompanyGate from "@/components/CompanyGate";
import { isCompanyComplete, type CompanyData } from "@/lib/company";

export default async function VehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let vehicle: Vehicle | null = null;
  let loggedIn = false;
  let companyComplete = false;
  let company: CompanyData | null = null;

  // The vehicle decides 404 — everything else must never take the page down
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    vehicle = data;
  } catch (err) {
    console.error("Fahrzeug konnte nicht geladen werden:", err);
  }

  if (!vehicle) notFound();

  const packages = kmPackages(vehicle);

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

  return (
    <div className="page-narrow">
      <Link href="/#fahrzeuge" className="back-link">
        ← Alle Fahrzeuge
      </Link>
      <div className="vehicle-detail">
        <div>
          <span className="vehicle-category">{vehicle.category}</span>
          <h1>{vehicle.name}</h1>
          <ul className="spec-list">
            <li>{vehicle.transmission}</li>
            {vehicle.load_volume && <li>{vehicle.load_volume}</li>}
            {vehicle.license_b && <li>Führerschein Klasse B ausreichend</li>}
          </ul>
          {vehicle.notes && <p className="vehicle-notes">{vehicle.notes}</p>}

          {vehicle.price_on_request ? (
            <>
              <h2>Konditionen</h2>
              <p className="vehicle-notes">
                Die Monatsrate stimmen wir individuell mit Ihnen ab, passend zu
                Laufzeit und Kilometerpaket. Senden Sie uns einfach eine
                unverbindliche Anfrage, wir melden uns mit Ihrem Angebot.
              </p>
              <p className="fine-print">
                Kaution 1.000 €, Vollkasko mit 1.000 € Selbstbeteiligung
                inklusive.
              </p>
            </>
          ) : (
            <>
              <h2>Monatsraten</h2>
              <table className="price-table">
                <tbody>
                  {DURATIONS.map((m) => {
                    const p = priceFor(vehicle, m);
                    if (p === null) return null;
                    return (
                      <tr key={m}>
                        <td>
                          {m} {m === 1 ? "Monat" : "Monate"}
                        </td>
                        <td>
                          <strong>{formatEuro(p)}</strong>/Monat
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="fine-print">
                Die Raten gelten für {kmLabel(packages[0].km)}.
                {packages.length > 1 && " Mehr Kilometer kosten Aufpreis:"}
              </p>
              {packages.length > 1 && (
                <table className="price-table">
                  <tbody>
                    {packages.map((p) => (
                      <tr key={p.km}>
                        <td>{kmLabel(p.km)}</td>
                        <td>
                          {p.surcharge > 0 ? (
                            <>
                              <strong>+{formatEuro(p.surcharge)}</strong>/Monat
                            </>
                          ) : (
                            <strong>inklusive</strong>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="fine-print">
                Kaution 1.000 €, Vollkasko mit 1.000 € Selbstbeteiligung
                inklusive.
              </p>
            </>
          )}
        </div>

        <div className="booking-panel">
          <h2>Jetzt anfragen</h2>
          {loggedIn ? (
            <CompanyGate complete={companyComplete} initial={company}>
              <BookingForm vehicle={vehicle} loggedIn />
            </CompanyGate>
          ) : (
            <BookingForm vehicle={vehicle} loggedIn={false} />
          )}
        </div>
      </div>
    </div>
  );
}
