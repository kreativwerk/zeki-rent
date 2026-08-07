import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cheapestPrice, formatEuro, type Vehicle } from "@/lib/types";

const CRAFTER_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EApQM9b8e9WVJaVhjLHajMjyj2/hf_20260807_215455_8634ad20-8d5a-48fb-965b-9fa5ad27dd9a_min.webp";

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
  const categories = [
    {
      label: "Transporter",
      sub: "Kastenwagen für Umzug & Gewerbe",
      img: vehicles.find((v) => v.category.includes("Kastenwagen"))?.photo_url,
    },
    {
      label: "Hochdach & Lang",
      sub: "Maximales Ladevolumen",
      img: vehicles.find((v) => v.category.includes("Hochdach"))?.photo_url,
    },
    {
      label: "PKW",
      sub: "Flexibel unterwegs",
      img: vehicles.find((v) => v.category.includes("PKW"))?.photo_url,
    },
  ];

  return (
    <>
      <section className="hero hero-visual">
        <span className="hero-watermark" aria-hidden>
          ZEKI
        </span>
        <div className="hero-copy">
          <h1>
            Transporter mieten.
            <br />
            <span>Monatlich. Unkompliziert.</span>
          </h1>
          <p>
            Langzeitmiete ab 1 Monat mit fairen Staffelpreisen — Übergabe rund
            um die Uhr, auf Wunsch bringen wir das Fahrzeug direkt zu Ihnen.
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-vehicle"
          src={CRAFTER_IMG}
          alt="VW Crafter Transporter in Weiß"
        />
        <ul className="usp-row">
          <li>Ab 1 Monat Laufzeit</li>
          <li>24/7-Übergabe</li>
          <li>Bring- &amp; Abholservice</li>
          <li>Führerschein B genügt</li>
        </ul>
      </section>

      <section className="section">
        <div className="category-tiles">
          {categories.map((c) => (
            <Link key={c.label} href="/#fahrzeuge" className="category-tile">
              {c.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.img} alt="" />
              ) : (
                <div className="tile-placeholder" />
              )}
              <div className="category-tile-text">
                <strong>{c.label}</strong>
                <span>{c.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="fahrzeuge">
        <h2 className="display-title">Unsere Fahrzeuge</h2>
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
                    <div className="vehicle-placeholder" aria-hidden />
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

      <section className="coming-soon">
        <div className="coming-soon-inner">
          <div className="coming-soon-copy">
            <span className="badge-soon">Coming soon</span>
            <h2 className="display-title">
              Exklusiv bei
              <br />
              Zeki Mobility
            </h2>
            <p>
              Unsere Flotte wächst: der neue VW Crafter L4 und der
              vollelektrische Togg T10X — bald bei uns mietbar. Jetzt
              vormerken lassen:{" "}
              <a href="tel:+491639574116">0163 9574116</a>
            </p>
          </div>
          <div className="coming-soon-tiles">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CRAFTER_IMG} alt="VW Crafter L4, weiß" />
              <figcaption>
                <strong>VW Crafter L4</strong>
                <span>Das neueste Modell · 2026</span>
              </figcaption>
            </figure>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fahrzeuge/togg-t10x.webp" alt="Togg T10X, blau" />
              <figcaption>
                <strong>Togg T10X</strong>
                <span>Vollelektrisches SUV</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="ablauf">
        <h2 className="display-title">So funktioniert&apos;s</h2>
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
        <h2 className="display-title">Konditionen auf einen Blick</h2>
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
        <h2 className="display-title">Bereit loszufahren?</h2>
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
