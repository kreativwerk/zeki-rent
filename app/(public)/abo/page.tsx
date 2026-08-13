import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  cheapestAboPrice,
  formatEuro,
  vehicleTitle,
  type CatalogVehicle,
} from "@/lib/types";

export const metadata = {
  title: "Auto-Abo ab 6 Monaten – Zeki Rent",
  description:
    "Auto-Abo mit Laufzeiten ab 6 Monaten. Ein Preis für alles: Fahrzeug, Versicherung, Wartung und Steuer.",
};

const INCLUDED = [
  "Versicherung mit Vollkasko",
  "Wartung, Verschleiß und HU",
  "Kfz-Steuer und Zulassung",
  "Reifen inklusive Wechsel",
  "Übergabe rund um die Uhr",
  "Monatlich eine Rechnung",
];

export default async function AboPage() {
  let vehicles: CatalogVehicle[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("catalog_vehicles")
      .select("*")
      .eq("active", true)
      .in("service_type", ["abo", "beides"])
      .order("brand")
      .order("sort_order");
    vehicles = (data ?? []) as CatalogVehicle[];
  } catch (err) {
    console.error("Abo-Fahrzeuge konnten nicht geladen werden:", err);
  }

  const brands = Array.from(new Set(vehicles.map((v) => v.brand)));

  return (
    <div className="page-narrow page-wide">
      <section className="abo-hero">
        <span className="badge-soon">Neu bei Zeki Rent</span>
        <h1 className="display-title">Auto-Abo</h1>
        <p className="abo-lead">
          Ein Auto, ein Preis, keine Überraschungen. Laufzeit ab 6 Monaten,
          12 Monate oder länger. Versicherung, Wartung, Steuer und Reifen sind
          drin. Sie tanken oder laden, den Rest übernehmen wir.
        </p>
        <div className="abo-terms">
          <span className="abo-term">6 Monate</span>
          <span className="abo-term">12 Monate</span>
          <span className="abo-term">18 Monate</span>
          <span className="abo-term">24 Monate</span>
        </div>
      </section>

      <section className="section">
        <h2 className="display-title">Was drin ist</h2>
        <ul className="abo-included">
          {INCLUDED.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>

      <section className="section" id="modelle">
        <h2 className="display-title">Verfügbare Modelle</h2>
        {vehicles.length === 0 ? (
          <div className="card">
            <p className="empty-state">
              Wir stellen gerade unsere Abo-Modelle zusammen. Melden Sie sich
              gern direkt, dann finden wir Ihr Fahrzeug.
            </p>
            <Link href="/anfrage" className="btn-primary btn-link">
              Wunschfahrzeug anfragen
            </Link>
          </div>
        ) : (
          brands.map((brand) => (
            <div key={brand} className="abo-brand">
              <h3 className="abo-brand-title">{brand}</h3>
              <div className="model-grid">
                {vehicles
                  .filter((v) => v.brand === brand)
                  .map((v) => {
                    const from = cheapestAboPrice(v);
                    return (
                      <Link
                        key={v.id}
                        href={`/modelle/${v.id}`}
                        className="model-card"
                      >
                        {v.photo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.photo_url} alt={vehicleTitle(v)} />
                        )}
                        <div className="model-card-body">
                          <h4>{v.model}</h4>
                          <p className="model-card-specs">
                            {[v.segment, v.drivetrain, v.power]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {v.range_text && (
                            <p className="model-card-range">{v.range_text}</p>
                          )}
                          <span className="model-card-price">
                            {from !== null ? (
                              <>
                                ab <strong>{formatEuro(from)}</strong>/Monat
                              </>
                            ) : (
                              <strong>Preis auf Anfrage</strong>
                            )}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="section">
        <h2 className="display-title">So läuft es ab</h2>
        <ol className="steps-list">
          <li>
            <strong>Modell wählen</strong>
            <span>
              Sie suchen sich ein Fahrzeug aus und sagen uns Laufzeit und
              Kilometer.
            </span>
          </li>
          <li>
            <strong>Angebot erhalten</strong>
            <span>
              Wir melden uns mit Ihrer Rate und der Verfügbarkeit, meist noch am
              selben Werktag.
            </span>
          </li>
          <li>
            <strong>Losfahren</strong>
            <span>
              Übergabe bei uns oder Lieferung zu Ihnen. Danach zahlen Sie eine
              feste Rate im Monat.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
