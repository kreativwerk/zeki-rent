import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatEuro,
  formatKm,
  saleTitle,
  VAT_LABEL,
  type SaleVehicle,
} from "@/lib/types";
import SaleRequestForm from "@/components/SaleRequestForm";
import CompanyGate from "@/components/CompanyGate";
import { isCompanyComplete, type CompanyData } from "@/lib/company";

export default async function SaleVehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let vehicle: SaleVehicle | null = null;
  let loggedIn = false;
  let companyComplete = false;
  let company: CompanyData | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sale_vehicles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    vehicle = data as SaleVehicle | null;
  } catch (err) {
    console.error("Fahrzeug konnte nicht geladen werden:", err);
  }

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

  // Hauptfoto steht schon oben, hier nur die weiteren Bilder
  const gallery = (vehicle.photo_urls ?? []).filter(
    (u) => u && u !== vehicle!.photo_url,
  );

  const rows = [
    ["Erstzulassung", vehicle.first_registration],
    ["Kilometerstand", formatKm(vehicle.mileage_km)],
    ["Leistung", vehicle.power],
    ["Kraftstoff", vehicle.fuel],
    ["Getriebe", vehicle.transmission],
    ["HU gültig bis", vehicle.hu_until],
    [
      "Vorbesitzer",
      vehicle.previous_owners !== null ? `${vehicle.previous_owners}` : null,
    ],
    [
      "Unfallfrei",
      vehicle.accident_free === null
        ? null
        : vehicle.accident_free
          ? "Ja"
          : "Nein, Details auf Anfrage",
    ],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="page-narrow">
      <Link href="/kaufen#bestand" className="back-link">
        ← Alle Fahrzeuge zum Kauf
      </Link>
      <div className="vehicle-detail">
        <div>
          <span className="vehicle-category">
            {vehicle.condition === "neu" ? "Neuwagen" : "Gebrauchtwagen"}
            {!vehicle.active && " · Entwurf, nur für Admins sichtbar"}
          </span>
          <h1>{saleTitle(vehicle)}</h1>

          {vehicle.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.photo_url}
              alt={saleTitle(vehicle)}
              style={{ width: "100%", borderRadius: "1rem", margin: "1rem 0" }}
            />
          )}

          {gallery.length > 0 && (
            <div className="sale-gallery">
              {gallery.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`${saleTitle(vehicle)}, Foto ${i + 2}`}
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {vehicle.description && (
            <p className="vehicle-notes">{vehicle.description}</p>
          )}

          <h2>Fahrzeugdaten</h2>
          {rows.length === 0 ? (
            <p className="vehicle-notes">
              Die Eckdaten schicken wir Ihnen gern auf Anfrage zu.
            </p>
          ) : (
            <table className="price-table">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>
                      <strong>{v}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Preis</h2>
          {vehicle.price !== null && !vehicle.price_on_request ? (
            <>
              <p className="sale-price">{formatEuro(vehicle.price)}</p>
              {vehicle.vat_note && (
                <p className="fine-print">{VAT_LABEL[vehicle.vat_note]}</p>
              )}
            </>
          ) : (
            <p className="vehicle-notes">
              Den Preis stimmen wir individuell mit Ihnen ab. Senden Sie uns
              eine unverbindliche Anfrage, wir melden uns mit dem Angebot.
            </p>
          )}
          <p className="fine-print">
            Angaben zu Verbrauch, Emissionen und Effizienzklasse teilen wir
            Ihnen fahrzeugbezogen vor Vertragsschluss mit. Gesetzliche
            Gewährleistung nach den Regeln des BGB.
          </p>
        </div>

        <div className="booking-panel">
          <h2>Interesse?</h2>
          {loggedIn ? (
            <CompanyGate complete={companyComplete} initial={company}>
              <SaleRequestForm vehicle={vehicle} />
            </CompanyGate>
          ) : (
            <div className="booking-login-hint">
              <p>
                Für Ihre Anfrage benötigen Sie ein Kundenkonto. So können wir
                Ihnen ein Angebot zusenden und Sie sehen den Status jederzeit.
              </p>
              <Link
                href={`/registrieren?next=/kaufen/${vehicle.id}`}
                className="btn-primary btn-link btn-block"
              >
                Konto erstellen
              </Link>
              <Link
                href={`/login?next=/kaufen/${vehicle.id}`}
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
