import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  cheapestAboPrice,
  cheapestPrice,
  formatEuro,
  vehicleTitle,
  type CatalogVehicle,
  type Vehicle,
} from "@/lib/types";
import ToggSlider from "@/components/ToggSlider";

const PARTNER_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EApQM9b8e9WVJaVhjLHajMjyj2/hf_20260808_205457_f669bfdb-f449-4197-8292-a0b92c742223_min.webp";

const HERO_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EApQM9b8e9WVJaVhjLHajMjyj2/hf_20260808_202348_50c51be0-1e29-4bef-9113-56c3c98e6d50_min.webp";

async function getVehicles(): Promise<Vehicle[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("active", true)
      .order("created_at");
    return data ?? [];
  } catch {
    return [];
  }
}

async function getCatalogRentals(): Promise<CatalogVehicle[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("catalog_vehicles")
      .select("*")
      .eq("active", true)
      .in("service_type", ["miete", "beides"])
      .order("sort_order");
    return (data ?? []) as CatalogVehicle[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [vehicles, catalogRentals] = await Promise.all([
    getVehicles(),
    getCatalogRentals(),
  ]);

  return (
    <>
      <section className="hero-split">
        <div className="hero-split-inner hero-media-left">
          <div className="hero-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG} alt="VW Crafter mit ZEKI RENT Branding" />
          </div>
          <div className="hero-split-copy">
            <h1>
              Langzeitmiete.
              <br />
              Unkompliziert.
              <br />
              <span>Fair.</span>
            </h1>
            <p>
              Transporter ab einem Monat mieten, mit Übergabe rund um die Uhr
              und Lieferung auf Wunsch.
            </p>
            <div className="hero-actions">
              <Link href="/#fahrzeuge" className="btn-primary btn-link">
                Fahrzeuge ansehen
              </Link>
              <a href="tel:+491639574116" className="btn-secondary btn-link">
                Jetzt anrufen
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <ul>
          {[
            "Ab 1 Monat Laufzeit",
            "24/7 Übergabe / Abholung",
            "Bring- & Abholservice",
          ].map((usp) => (
            <li key={usp}>
              <TaskAltIcon />
              {usp}
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="fahrzeuge">
        <h2 className="display-title">Unsere Fahrzeuge</h2>
        <div className="fleet-duo">
          {vehicles.map((v) => {
            const from = cheapestPrice(v);
            return (
              <Link
                key={v.id}
                href={`/fahrzeuge/${v.id}`}
                className="fleet-tile"
              >
                <div className="fleet-tile-media">
                  {v.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photo_url} alt={v.name} />
                  )}
                </div>
                <div className="fleet-tile-body">
                  <h3>{v.name}</h3>
                  <p className="fleet-tile-specs">
                    {[v.transmission, v.load_volume].filter(Boolean).join(" · ")}
                  </p>
                  <div className="fleet-tile-foot">
                    {from !== null ? (
                      <span className="fleet-tile-price">
                        ab <strong>{formatEuro(from)}</strong>/Monat
                      </span>
                    ) : (
                      <span className="fleet-tile-price">
                        <strong>Preis auf Anfrage</strong>
                      </span>
                    )}
                    <span className="fleet-tile-cta">Jetzt anfragen</span>
                    <p className="fleet-tile-sub">Unverbindlich &amp; kostenfrei</p>
                  </div>
                </div>
              </Link>
            );
          })}

          {catalogRentals.map((v) => {
            const from = cheapestAboPrice(v);
            return (
              <Link
                key={v.id}
                href={`/modelle/${v.id}`}
                className="fleet-tile"
              >
                <div className="fleet-tile-media">
                  {v.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photo_url} alt={vehicleTitle(v)} />
                  )}
                </div>
                <div className="fleet-tile-body">
                  <h3>{vehicleTitle(v)}</h3>
                  <p className="fleet-tile-specs">
                    {[v.segment, v.drivetrain, v.power]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="fleet-tile-foot">
                    <span className="fleet-tile-price">
                      {from !== null ? (
                        <>
                          ab <strong>{formatEuro(from)}</strong>/Monat
                        </>
                      ) : (
                        <strong>Preis auf Anfrage</strong>
                      )}
                    </span>
                    <span className="fleet-tile-cta">Jetzt anfragen</span>
                    <p className="fleet-tile-sub">Unverbindlich &amp; kostenfrei</p>
                  </div>
                </div>
              </Link>
            );
          })}

          <Link href="/anfrage" className="fleet-tile">
            <div className="fleet-tile-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PARTNER_IMG}
                alt="VW Transporter und Crafter mit ZEKI RENT Kennzeichenhaltern"
              />
            </div>
            <div className="fleet-tile-body">
              <h3>Wunschfahrzeug anfragen</h3>
              <p className="fleet-tile-specs">
                Groß oder klein: Über unser breites Netzwerk an Partnerfirmen
                vermieten wir dir dein Wunschfahrzeug zu unseren Bestpreisen.
              </p>
              <div className="fleet-tile-foot">
                <span className="fleet-tile-cta">Anfrage stellen</span>
                <p className="fleet-tile-sub">Unverbindlich &amp; kostenfrei</p>
              </div>
            </div>
          </Link>

          <Link
            href="/vormerken"
            className="fleet-tile fleet-tile-soon fleet-tile-exclusive"
          >
            <span className="exclusive-tag">Exklusiv bei uns!</span>
            <div className="fleet-tile-media">
              <ToggSlider />
            </div>
            <div className="fleet-tile-body">
              <span className="badge-soon">Coming soon</span>
              <h3>Togg T10X &amp; T10F</h3>
              <p className="fleet-tile-specs">
                Vollelektrisch · bis zu 623 km Reichweite
              </p>
              <div className="fleet-tile-foot">
                <span className="fleet-tile-cta">Jetzt vormerken</span>
                <p className="fleet-tile-sub">Unverbindlich &amp; kostenfrei</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="section" id="abo">
        <Link href="/abo" className="abo-banner">
          <div>
            <span className="badge-soon">Neu bei Zeki Rent</span>
            <h2>Auto-Abo ab 6 Monaten</h2>
            <p>
              Ein Preis für alles: Fahrzeug, Versicherung, Wartung, Steuer und
              Reifen. Laufzeit 6, 12, 18 oder 24 Monate. Vom Kleinwagen bis zum
              Elektro-Transporter.
            </p>
          </div>
          <span className="fleet-tile-cta">Abo entdecken</span>
        </Link>
      </section>

      <section className="section section-alt" id="ablauf">
        <div className="how-split">
          <h2 className="display-title">
            So einfach
            <br />
            geht&apos;s
          </h2>
          <ol className="how-steps">
            <li>
              <strong>Fahrzeug anfragen</strong>
              Laufzeit und Kilometerpaket wählen, unverbindlich anfragen.
            </li>
            <li>
              <strong>Bestätigung erhalten</strong>
              Wir melden uns kurzfristig und klären alle Details.
            </li>
            <li>
              <strong>Losfahren</strong>
              Vertrag digital unterschreiben, Fahrzeug rund um die Uhr
              übernehmen. Auf Wunsch bringen wir es dir.
            </li>
          </ol>
        </div>
      </section>

      <section className="section" id="konditionen">
        <h2 className="display-title">Konditionen</h2>
        <div className="terms-clusters">
          <div>
            <h3>Mieten</h3>
            <p>
              Kaution 1.000 € per Überweisung, zurück nach der Rückgabe.
              Mindestalter 21 Jahre, Ausweis und Wohnsitznachweis genügen.
            </p>
          </div>
          <div>
            <h3>Fahren</h3>
            <p>
              Kilometerpakete ab 1.000 km pro Monat, flexibel zubuchbar.
              Tankregelung: voll übernehmen, voll zurückgeben.
            </p>
          </div>
          <div>
            <h3>Versichert</h3>
            <p>
              Haftpflicht und Vollkasko mit 1.000 € Selbstbeteiligung sind
              immer dabei. Auslandsfahrten nach Absprache.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/* Google Material Symbols "task_alt" (Apache 2.0) */
function TaskAltIcon() {
  return (
    <svg
      className="usp-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="currentColor"
      aria-hidden
    >
      <path d="M22 5.18 10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18Zm-2.21 5.04c.13.57.21 1.17.21 1.78 0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8c1.58 0 3.04.46 4.28 1.25l1.44-1.44C16.1 2.67 14.13 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39l-1.61 1.61Z" />
    </svg>
  );
}
