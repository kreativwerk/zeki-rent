import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cheapestPrice, formatEuro, type Vehicle } from "@/lib/types";

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

export default async function Home() {
  const vehicles = await getVehicles();
  const hero = vehicles[0] ?? null;

  return (
    <>
      <section className="hero-split">
        <span className="hero-watermark" aria-hidden>
          ZEKI
        </span>
        <div className="hero-split-inner">
          <div className="hero-split-copy">
            <h1>
              Transporter mieten.
              <br />
              <span>Monatlich.</span>
            </h1>
            <p>
              Langzeitmiete ab einem Monat mit fairen Staffelpreisen und
              Übergabe rund um die Uhr.
            </p>
            <div className="hero-actions">
              <Link href="/#fahrzeuge" className="btn-primary btn-link">
                Fahrzeuge ansehen
              </Link>
              <a href="tel:+491639574116" className="btn-secondary btn-link">
                0163 9574116
              </a>
            </div>
          </div>
          <div className="hero-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero?.photo_url ?? "/fahrzeuge/crafter.png"}
              alt={hero?.name ?? "VW Crafter, weiß"}
            />
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <ul>
          <li>Ab 1 Monat Laufzeit</li>
          <li>24/7-Übergabe</li>
          <li>Bring- &amp; Abholservice</li>
          <li>Führerschein B genügt</li>
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
                    {from !== null && (
                      <span className="fleet-tile-price">
                        ab <strong>{formatEuro(from)}</strong>/Monat
                      </span>
                    )}
                    <span className="fleet-tile-cta">Jetzt anfragen</span>
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="fleet-tile fleet-tile-soon">
            <div className="fleet-tile-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fahrzeuge/togg-t10x.webp" alt="Togg T10X, blau" />
            </div>
            <div className="fleet-tile-body">
              <span className="badge-soon">Coming soon</span>
              <h3>Togg T10X</h3>
              <p className="fleet-tile-specs">
                Vollelektrisches SUV · Exklusiv bei Zeki Mobility
              </p>
              <div className="fleet-tile-foot">
                <a href="tel:+491639574116" className="fleet-tile-cta">
                  Jetzt vormerken
                </a>
              </div>
            </div>
          </div>
        </div>
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
