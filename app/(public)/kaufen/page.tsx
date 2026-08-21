import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatEuro,
  formatKm,
  saleTitle,
  VAT_LABEL,
  type SaleVehicle,
} from "@/lib/types";
import { SALE_IMG } from "@/lib/media";

export const metadata = {
  title: "Fahrzeuge kaufen – Gebrauchtwagen und Neuwagen bei Zeki Rent",
  description:
    "Gebrauchtwagen und Neuwagen kaufen bei Zeki Rent. Geprüfte Fahrzeuge, Finanzierung und Inzahlungnahme auf Wunsch.",
};

function Card({ v }: { v: SaleVehicle }) {
  const specs = [
    v.first_registration && `EZ ${v.first_registration}`,
    formatKm(v.mileage_km),
    v.power,
    v.fuel,
    v.transmission,
  ].filter(Boolean);

  return (
    <Link href={`/kaufen/${v.id}`} className="model-card">
      {v.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.photo_url} alt={saleTitle(v)} />
      )}
      <div className="model-card-body">
        <h4>{saleTitle(v)}</h4>
        <p className="model-card-specs">{specs.join(" · ")}</p>
        <span className="model-card-price">
          {v.price !== null && !v.price_on_request ? (
            <strong>{formatEuro(v.price)}</strong>
          ) : (
            <strong>Preis auf Anfrage</strong>
          )}
        </span>
        {v.vat_note && !v.price_on_request && (
          <span className="model-card-vat">{VAT_LABEL[v.vat_note]}</span>
        )}
      </div>
    </Link>
  );
}

function Section({
  title, intro, vehicles,
}: {
  title: string;
  intro: string;
  vehicles: SaleVehicle[];
}) {
  return (
    <div className="abo-brand">
      <h3 className="abo-brand-title">{title}</h3>
      <p className="sale-section-intro">{intro}</p>
      {vehicles.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            Aktuell steht hier nichts im Bestand. Sagen Sie uns, was Sie suchen,
            wir finden es über unser Händlernetzwerk.
          </p>
          <div className="abo-contact">
            <a href="tel:+491639574116" className="btn-secondary btn-link">
              Jetzt anrufen
            </a>
            <a
              href="mailto:info@zeki-rent.com?subject=Kaufanfrage"
              className="btn-secondary btn-link"
            >
              E-Mail schreiben
            </a>
          </div>
        </div>
      ) : (
        <div className="model-grid">
          {vehicles.map((v) => (
            <Card key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function SalePage() {
  let vehicles: SaleVehicle[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sale_vehicles")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    vehicles = (data ?? []) as SaleVehicle[];
  } catch (err) {
    console.error("Verkaufsfahrzeuge konnten nicht geladen werden:", err);
  }

  const used = vehicles.filter((v) => v.condition === "gebraucht");
  const fresh = vehicles.filter((v) => v.condition === "neu");

  return (
    <div className="page-narrow page-wide">
      <section className="abo-hero">
        <h1 className="display-title">Fahrzeuge kaufen</h1>
        <p className="abo-lead">
          Neben Miete und Abo verkaufen wir auch. Gebrauchtwagen aus unserem
          Bestand und Neuwagen über unser Händlernetzwerk. Auf Wunsch mit
          Finanzierung und Inzahlungnahme Ihres bisherigen Fahrzeugs.
        </p>
        <div className="sale-hero-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SALE_IMG} alt="Transporter und Pkw zum Verkauf" />
        </div>
      </section>

      <section className="section" id="bestand">
        <h2 className="display-title">Unser Angebot</h2>
        <Section
          title="Gebrauchtwagen"
          intro="Geprüfte Fahrzeuge aus unserem eigenen Bestand und von Partnern. Historie und Zustand besprechen wir offen mit Ihnen."
          vehicles={used}
        />
        <Section
          title="Neuwagen"
          intro="Konfiguration nach Ihren Wünschen über unser Händlernetzwerk, inklusive Zulassung und Übergabe."
          vehicles={fresh}
        />
      </section>

      <section className="section" id="verkaufen">
        <h2 className="display-title">Fahrzeug verkaufen</h2>
        <div className="card">
          <p className="sale-section-intro">
            Sie möchten Ihren Pkw oder Transporter abgeben? Tragen Sie Modell,
            Baujahr, Kilometerstand, Zustand, Leistung und TÜV ein, laden Sie
            Fotos hoch und nennen Sie uns den Besichtigungs- oder Abholort. Wir
            melden uns mit einer Einschätzung. Ihre Kontaktdaten bleiben bei
            uns.
          </p>
          <div className="abo-contact">
            <Link href="/verkaufen" className="btn-primary btn-link">
              Fahrzeug anbieten
            </Link>
            <a href="tel:+491639574116" className="btn-secondary btn-link">
              Lieber anrufen
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="display-title">Gut zu wissen</h2>
        <ul className="abo-included">
          <li>Verkauf an Gewerbe und Privat</li>
          <li>Finanzierung auf Wunsch vermittelbar</li>
          <li>Inzahlungnahme Ihres Fahrzeugs möglich</li>
          <li>Probefahrt nach Terminvereinbarung</li>
          <li>Zulassung und Übergabe übernehmen wir</li>
          <li>Beratung persönlich, kein Callcenter</li>
        </ul>
        <p className="fine-print">
          Gesetzliche Gewährleistung nach den Regeln des BGB. Bei
          Gebrauchtfahrzeugen kann die Frist gegenüber Verbrauchern auf ein Jahr
          verkürzt sein, gegenüber Unternehmern gilt der jeweilige
          Kaufvertrag. Angaben zu Verbrauch, Emissionen und Effizienzklasse
          teilen wir Ihnen fahrzeugbezogen vor Vertragsschluss mit. Alle Preise
          verstehen sich, sofern nicht anders angegeben, inklusive der
          gesetzlichen Mehrwertsteuer.
        </p>
      </section>
    </div>
  );
}
