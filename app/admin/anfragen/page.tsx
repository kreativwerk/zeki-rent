import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  aboOfferSummary,
  formatDate,
  formatEuro,
  formatKm,
  type AboInterest,
  type Booking,
} from "@/lib/types";
import RequestStatusSelect from "@/components/admin/RequestStatusSelect";
import ArchiveButton from "@/components/admin/ArchiveButton";
import PublishOfferButton from "@/components/admin/PublishOfferButton";

interface Prebooking {
  id: string;
  model: string;
  note: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  profiles?: CustomerRef | null;
}

interface GeneralRequest {
  id: string;
  vehicle_wish: string | null;
  large_vans: Record<string, number> | null;
  small_vans: number | null;
  km_per_month: string | null;
  fuel_type: string | null;
  start_from: string | null;
  handover: string | null;
  note: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  profiles?: CustomerRef | null;
}

interface SaleRequest {
  id: string;
  financing: boolean;
  trade_in: boolean;
  note: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  sale_vehicles?: {
    brand: string;
    model: string;
    variant: string | null;
    condition: string;
  } | null;
  profiles?: CustomerRef | null;
}

interface AboRequest {
  id: string;
  service: string;
  term_months: number;
  km_per_year: string | null;
  start_from: string | null;
  handover: string | null;
  note: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  catalog_vehicles?: { brand: string; model: string } | null;
  profiles?: CustomerRef | null;
}

interface SellOfferRow {
  id: string;
  vehicle_type: string;
  brand: string;
  model: string;
  build_year: number | null;
  mileage_km: number | null;
  condition: string | null;
  power: string | null;
  fuel: string | null;
  transmission: string | null;
  hu_until: string | null;
  location: string | null;
  location_type: string;
  price_expectation: number | null;
  note: string | null;
  photo_urls: string[];
  abo_interest: AboInterest;
  abo_terms: number[];
  abo_price_net: number | null;
  abo_km: string | null;
  abo_deductible: string | null;
  sale_vehicle_id: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  profiles?: CustomerRef | null;
}

interface CustomerRef {
  name: string | null;
  email: string | null;
  phone: string | null;
  company_name?: string | null;
  billing_street?: string | null;
  billing_zip?: string | null;
  billing_city?: string | null;
}

function describeVehicles(r: GeneralRequest): string {
  const parts: string[] = [];
  for (const [size, count] of Object.entries(r.large_vans ?? {})) {
    if (count > 0) parts.push(`${count}× ${size}`);
  }
  if (r.small_vans) parts.push(`${r.small_vans}× Kleintransporter`);
  return parts.join(", ") || r.vehicle_wish || "–";
}

function CustomerCell({ c }: { c?: CustomerRef | null }) {
  const address = c?.billing_street
    ? `${c.billing_street}, ${c.billing_zip ?? ""} ${c.billing_city ?? ""}`.trim()
    : null;
  return (
    <div className="customer-cell">
      <strong>{c?.company_name ?? c?.name ?? "–"}</strong>
      <span className="muted">
        {c?.company_name && c?.name ? `${c.name}` : ""}
        {c?.company_name && c?.name && c?.email ? " · " : ""}
        {c?.email}
      </span>
      {(c?.phone || address) && (
        <span className="muted">
          {c?.phone ?? ""}
          {c?.phone && address ? " · " : ""}
          {address ?? ""}
        </span>
      )}
    </div>
  );
}

const CONTACT_FIELDS =
  "profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ archiv?: string }>;
}) {
  const params = await searchParams;
  const showArchive = params.archiv === "1";

  const supabase = await createClient();
  const [
    { data },
    { data: prebookData },
    { data: requestData },
    { data: aboData },
    { data: saleData },
    { data: sellData },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(`*, vehicles(name), ${CONTACT_FIELDS}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("prebookings")
      .select("*, profiles(name, email, phone, company_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("general_requests")
      .select(`*, ${CONTACT_FIELDS}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("abo_requests")
      .select(`*, catalog_vehicles(brand, model), ${CONTACT_FIELDS}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("sale_requests")
      .select(
        `*, sale_vehicles(brand, model, variant, condition), ${CONTACT_FIELDS}`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("sell_offers")
      .select(`*, ${CONTACT_FIELDS}`)
      .order("created_at", { ascending: false }),
  ]);

  // Archivierte Anfragen bleiben erhalten, sie werden nur ausgeblendet.
  const scoped = <T extends { archived_at: string | null }>(rows: T[]): T[] =>
    rows.filter((r) =>
      showArchive ? r.archived_at !== null : r.archived_at === null,
    );

  const bookings = scoped((data ?? []) as Booking[]);
  const prebookings = scoped((prebookData ?? []) as Prebooking[]);
  const generalRequests = scoped((requestData ?? []) as GeneralRequest[]);
  const aboRequests = scoped((aboData ?? []) as unknown as AboRequest[]);
  const saleRequests = scoped((saleData ?? []) as unknown as SaleRequest[]);
  const sellOffers = scoped((sellData ?? []) as unknown as SellOfferRow[]);
  const open = bookings.filter((b) => b.status === "neu").length;
  const total =
    bookings.length +
    prebookings.length +
    generalRequests.length +
    aboRequests.length +
    saleRequests.length +
    sellOffers.length;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>{showArchive ? "Archiv" : "Anfragen"}</h1>
          <p>
            {showArchive
              ? `${total} archivierte Anfragen`
              : `${bookings.length} Fahrzeuganfragen · ${open} offen`}
          </p>
        </div>
        <Link
          href={showArchive ? "/admin/anfragen" : "/admin/anfragen?archiv=1"}
          className="btn-primary btn-link"
        >
          {showArchive ? "Zurück zu den Anfragen" : "Archiv ansehen"}
        </Link>
      </div>

      {showArchive && total === 0 && (
        <div className="card">
          <p className="empty-state">
            Das Archiv ist leer. Erledigte Anfragen legen Sie über
            „Archivieren“ hier ab, gelöscht wird dabei nichts.
          </p>
        </div>
      )}

      <h2 className="admin-section-title">
        Fahrzeuganfragen
        <span className="admin-count">{bookings.length}</span>
      </h2>
      {bookings.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Anfragen eingegangen.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Eingang</th>
                <th>Kunde</th>
                <th>Fahrzeug</th>
                <th>Zeitraum</th>
                <th>Kilometer</th>
                <th>Anmerkung</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td data-label="Eingang">{formatDate(b.created_at)}</td>
                  <td data-label="Kunde">
                    <CustomerCell c={b.profiles as CustomerRef | null} />
                  </td>
                  <td data-label="Fahrzeug">{b.vehicles?.name ?? "–"}</td>
                  <td data-label="Zeitraum">
                    <div className="cell-stack">
                      <span>ab {formatDate(b.start_date)}</span>
                      <span className="muted">
                        {b.duration_months}{" "}
                        {b.duration_months === 1 ? "Monat" : "Monate"}
                      </span>
                    </div>
                  </td>
                  <td data-label="Kilometer">
                    <div className="cell-stack">
                      <span>{b.km_package}</span>
                      <span className="muted">
                        {b.handover ?? "Abholung"}
                        {b.monthly_price != null &&
                          ` · ${formatEuro(Number(b.monthly_price))}/Monat`}
                      </span>
                    </div>
                  </td>
                  <td data-label="Anmerkung" className="note-cell">
                    {b.note ?? "–"}
                  </td>
                  <td data-label="Status">
                    <RequestStatusSelect
                      kind="buchung"
                      id={b.id}
                      status={b.status}
                    />
                  </td>
                  <td className="action-cell">
                    {!showArchive && (
                      <Link
                        href={`/admin/buchungen/neu?booking=${b.id}`}
                        className="btn-small"
                      >
                        Einplanen
                      </Link>
                    )}
                    <ArchiveButton
                      kind="buchung"
                      id={b.id}
                      archived={showArchive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="admin-section-title">
        Verkaufsangebote von Kunden
        <span className="admin-count">{sellOffers.length}</span>
      </h2>
      {sellOffers.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            Noch keine Fahrzeuge angeboten. Kundinnen und Kunden stellen ihr
            Fahrzeug unter <code>/verkaufen</code> selbst ein.
          </p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Anbieter</th>
                <th>Fahrzeug</th>
                <th>Eckdaten</th>
                <th>Ort</th>
                <th>Abo möglich</th>
                <th>Anmerkung</th>
                <th>Fotos</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sellOffers.map((o) => (
                <tr key={o.id}>
                  <td data-label="Datum">{formatDate(o.created_at)}</td>
                  <td data-label="Anbieter">
                    <CustomerCell c={o.profiles} />
                  </td>
                  <td data-label="Fahrzeug">
                    <div className="cell-stack">
                      <strong>
                        {o.brand} {o.model}
                      </strong>
                      <span className="muted">
                        {o.vehicle_type === "transporter"
                          ? "Transporter"
                          : "Pkw"}
                        {o.price_expectation != null &&
                          ` · Vorstellung ${formatEuro(Number(o.price_expectation))}`}
                      </span>
                    </div>
                  </td>
                  <td data-label="Eckdaten" className="muted">
                    {[
                      o.build_year && `BJ ${o.build_year}`,
                      formatKm(o.mileage_km),
                      o.power,
                      o.fuel,
                      o.transmission,
                      o.condition,
                      o.hu_until && `TÜV ${o.hu_until}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td data-label="Ort">
                    <div className="cell-stack">
                      <span>{o.location ?? "–"}</span>
                      <span className="muted">
                        {o.location_type === "abholung"
                          ? "Abholort"
                          : "Besichtigung"}
                      </span>
                    </div>
                  </td>
                  <td data-label="Abo möglich" className="note-cell">
                    {o.abo_interest === "nein" ? (
                      <span className="muted">nein</span>
                    ) : (
                      aboOfferSummary(o)
                    )}
                  </td>
                  <td data-label="Anmerkung" className="note-cell">
                    {o.note ?? "–"}
                  </td>
                  <td data-label="Fotos">
                    {o.photo_urls.length === 0 ? (
                      <span className="muted">keine</span>
                    ) : (
                      <div className="thumb-row">
                        {o.photo_urls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="Status">
                    <RequestStatusSelect
                      kind="verkauf"
                      id={o.id}
                      status={o.status}
                    />
                  </td>
                  <td className="action-cell">
                    <PublishOfferButton
                      id={o.id}
                      saleVehicleId={o.sale_vehicle_id}
                    />
                    <ArchiveButton
                      kind="verkauf"
                      id={o.id}
                      archived={showArchive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 className="admin-section-title">
        Kaufanfragen
        <span className="admin-count">{saleRequests.length}</span>
      </h2>
      {saleRequests.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Kaufanfragen.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kunde</th>
                <th>Fahrzeug</th>
                <th>Wünsche</th>
                <th>Nachricht</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {saleRequests.map((r) => (
                <tr key={r.id}>
                  <td data-label="Datum">{formatDate(r.created_at)}</td>
                  <td data-label="Kunde">
                    <CustomerCell c={r.profiles} />
                  </td>
                  <td data-label="Fahrzeug">
                    <div className="cell-stack">
                      <strong>
                        {r.sale_vehicles
                          ? [
                              r.sale_vehicles.brand,
                              r.sale_vehicles.model,
                              r.sale_vehicles.variant,
                            ]
                              .filter(Boolean)
                              .join(" ")
                          : "Fahrzeug entfernt"}
                      </strong>
                      <span className="muted">
                        {r.sale_vehicles?.condition === "neu"
                          ? "Neuwagen"
                          : "Gebrauchtwagen"}
                      </span>
                    </div>
                  </td>
                  <td data-label="Wünsche" className="muted">
                    {[
                      r.financing && "Finanzierung",
                      r.trade_in && "Inzahlungnahme",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td data-label="Nachricht" className="note-cell">
                    {r.note ?? "–"}
                  </td>
                  <td data-label="Status">
                    <RequestStatusSelect
                      kind="kauf"
                      id={r.id}
                      status={r.status}
                    />
                  </td>
                  <td className="action-cell">
                    <ArchiveButton
                      kind="kauf"
                      id={r.id}
                      archived={showArchive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="admin-section-title">
        Abo-Anfragen
        <span className="admin-count">{aboRequests.length}</span>
      </h2>
      {aboRequests.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Abo-Anfragen.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kunde</th>
                <th>Fahrzeug</th>
                <th>Laufzeit</th>
                <th>Details</th>
                <th>Anmerkung</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {aboRequests.map((r) => (
                <tr key={r.id}>
                  <td data-label="Datum">{formatDate(r.created_at)}</td>
                  <td data-label="Kunde">
                    <CustomerCell c={r.profiles} />
                  </td>
                  <td data-label="Fahrzeug">
                    <div className="cell-stack">
                      <strong>
                        {r.catalog_vehicles
                          ? `${r.catalog_vehicles.brand} ${r.catalog_vehicles.model}`
                          : "Modell entfernt"}
                      </strong>
                      <span className="muted">
                        {r.service === "miete" ? "Miete" : "Auto-Abo"}
                      </span>
                    </div>
                  </td>
                  <td data-label="Laufzeit">{r.term_months} Monate</td>
                  <td data-label="Details" className="muted">
                    {[r.km_per_year, r.start_from, r.handover]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td data-label="Anmerkung" className="note-cell">
                    {r.note ?? "–"}
                  </td>
                  <td data-label="Status">
                    <RequestStatusSelect
                      kind="abo"
                      id={r.id}
                      status={r.status}
                    />
                  </td>
                  <td className="action-cell">
                    <ArchiveButton kind="abo" id={r.id} archived={showArchive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="admin-section-title">
        Wunschfahrzeug-Anfragen
        <span className="admin-count">{generalRequests.length}</span>
      </h2>
      {generalRequests.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine allgemeinen Anfragen.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kunde</th>
                <th>Fahrzeuge</th>
                <th>Details</th>
                <th>Anmerkung</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {generalRequests.map((r) => (
                <tr key={r.id}>
                  <td data-label="Datum">{formatDate(r.created_at)}</td>
                  <td data-label="Kunde">
                    <CustomerCell c={r.profiles} />
                  </td>
                  <td data-label="Fahrzeuge">
                    <strong>{describeVehicles(r)}</strong>
                  </td>
                  <td data-label="Details" className="muted">
                    {[r.km_per_month, r.fuel_type, r.start_from, r.handover]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td data-label="Anmerkung" className="note-cell">
                    {r.note ?? "–"}
                  </td>
                  <td data-label="Status">
                    <RequestStatusSelect
                      kind="wunsch"
                      id={r.id}
                      status={r.status}
                    />
                  </td>
                  <td className="action-cell">
                    {!showArchive && (
                      <Link
                        href={`/admin/buchungen/neu?request=${r.id}`}
                        className="btn-small"
                      >
                        Einplanen
                      </Link>
                    )}
                    <ArchiveButton
                      kind="wunsch"
                      id={r.id}
                      archived={showArchive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="admin-section-title">
        Togg Vormerkungen
        <span className="admin-count">{prebookings.length}</span>
      </h2>
      {prebookings.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Vormerkungen.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kunde</th>
                <th>Fahrzeug</th>
                <th>Anmerkung</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prebookings.map((pb) => (
                <tr key={pb.id}>
                  <td data-label="Datum">{formatDate(pb.created_at)}</td>
                  <td data-label="Kunde">
                    <CustomerCell c={pb.profiles as CustomerRef | null} />
                  </td>
                  <td data-label="Fahrzeug">{pb.model}</td>
                  <td data-label="Anmerkung" className="note-cell">
                    {pb.note ?? "–"}
                  </td>
                  <td data-label="Status">
                    <RequestStatusSelect
                      kind="togg"
                      id={pb.id}
                      status={pb.status}
                    />
                  </td>
                  <td className="action-cell">
                    <ArchiveButton
                      kind="togg"
                      id={pb.id}
                      archived={showArchive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
