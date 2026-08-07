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

  return (
    <>
      <section className="hero">
        <h1>
          Transporter mieten.
          <br />
          Monatlich. Unkompliziert.
        </h1>
        <p>
          Langzeitmiete ab 1 Monat mit fairen Staffelpreisen — Übergabe rund um
          die Uhr, auf Wunsch bringen wir das Fahrzeug direkt zu Ihnen.
        </p>
        <div className="hero-actions">
          <Link href="/#fahrzeuge" className="btn-primary btn-link">
            Fahrzeuge ansehen
          </Link>
          <a href="tel:+491639574116" className="btn-secondary btn-link">
            0163 9574116
          </a>
        </div>
        <ul className="usp-row">
          <li>Ab 1 Monat Laufzeit</li>
          <li>24/7-Übergabe</li>
          <li>Bring- &amp; Abholservice</li>
          <li>Führerschein B genügt</li>
        </ul>
      </section>

      <section className="section" id="fahrzeuge">
        <h2>Unsere Fahrzeuge</h2>
        <p className="section-intro">
          Alle Preise sind Monatsraten — je länger die Laufzeit, desto
          günstiger.
        </p>
        {vehicles.length === 0 ? (
          <p className="empty-state">
            Die Fahrzeugliste wird gerade aktualisiert. Rufen Sie uns gern an:{" "}
            <a href="tel:+491639574116">0163 9574116</a>
          </p>
        ) : (
          <div className="vehicle-grid">
            {vehicles.map((v) => {
              const from = cheapestPrice(v);
              return (
                <Link
                  key={v.id}
                  href={`/fahrzeuge/${v.id}`}
                  className="vehicle-card"
                >
                  {v.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photo_url} alt={v.name} />
                  ) : (
                    <div className="vehicle-placeholder" aria-hidden>
                      <VanIcon />
                    </div>
                  )}
                  <div className="vehicle-card-body">
                    <span className="vehicle-category">{v.category}</span>
                    <h3>{v.name}</h3>
                    <p className="vehicle-specs">
                      {[v.transmission, v.load_volume]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="vehicle-price">
                      {from !== null && (
                        <>
                          ab <strong>{formatEuro(from)}</strong>/Monat
                        </>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="section section-alt" id="ablauf">
        <h2>So funktioniert&apos;s</h2>
        <ol className="steps">
          <li>
            <strong>Fahrzeug wählen</strong>
            Laufzeit und Kilometerpaket auswählen und unverbindlich anfragen.
          </li>
          <li>
            <strong>Bestätigung erhalten</strong>
            Wir melden uns kurzfristig und klären die Details.
          </li>
          <li>
            <strong>Vertrag &amp; Übergabe</strong>
            Vertrag digital unterschreiben, Fahrzeug 24/7 übernehmen — oder wir
            bringen es Ihnen.
          </li>
        </ol>
      </section>

      <section className="section" id="konditionen">
        <h2>Konditionen auf einen Blick</h2>
        <div className="terms-grid">
          <div>
            <strong>Kaution</strong>
            <p>1.000 € per Überweisung, zurück nach Rückgabe</p>
          </div>
          <div>
            <strong>Versicherung</strong>
            <p>Haftpflicht + Vollkasko, Selbstbeteiligung 1.000 €</p>
          </div>
          <div>
            <strong>Kilometer</strong>
            <p>Pakete ab 1.000 km/Monat, flexibel zubuchbar</p>
          </div>
          <div>
            <strong>Tankregelung</strong>
            <p>Voll übernehmen, voll zurückgeben</p>
          </div>
          <div>
            <strong>Voraussetzungen</strong>
            <p>Mindestalter 21, Ausweis &amp; Wohnsitznachweis</p>
          </div>
          <div>
            <strong>Ausland</strong>
            <p>Fahrten in ausgewählte Länder nach Absprache</p>
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <h2>Bereit loszufahren?</h2>
        <p>
          Fahrzeug auswählen und in zwei Minuten anfragen — wir melden uns
          umgehend.
        </p>
        <Link href="/#fahrzeuge" className="btn-primary btn-link">
          Jetzt Fahrzeug wählen
        </Link>
      </section>
    </>
  );
}

function VanIcon() {
  return (
    <svg viewBox="0 0 64 40" fill="none" width="64" height="40">
      <path
        d="M4 28V14a4 4 0 0 1 4-4h28l10 8h8a6 6 0 0 1 6 6v4a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 28h14m12 0h13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="22" cy="30" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="49" cy="30" r="5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M36 10v8h10" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
