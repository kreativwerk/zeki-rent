import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEuro, type Booking } from "@/lib/types";
import BookingStatusSelect from "@/components/admin/BookingStatusSelect";

interface Prebooking {
  id: string;
  model: string;
  note: string | null;
  status: string;
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
  created_at: string;
  profiles?: CustomerRef | null;
}

interface SaleRequest {
  id: string;
  financing: boolean;
  trade_in: boolean;
  note: string | null;
  status: string;
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
  created_at: string;
  catalog_vehicles?: { brand: string; model: string } | null;
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

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const [
    { data },
    { data: prebookData },
    { data: requestData },
    { data: aboData },
    { data: saleData },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "*, vehicles(name), profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("prebookings")
      .select("*, profiles(name, email, phone, company_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("general_requests")
      .select(
        "*, profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("abo_requests")
      .select(
        "*, catalog_vehicles(brand, model), profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("sale_requests")
      .select(
        "*, sale_vehicles(brand, model, variant, condition), profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (data ?? []) as Booking[];
  const prebookings = (prebookData ?? []) as Prebooking[];
  const generalRequests = (requestData ?? []) as GeneralRequest[];
  const aboRequests = (aboData ?? []) as unknown as AboRequest[];
  const saleRequests = (saleData ?? []) as unknown as SaleRequest[];
  const open = bookings.filter((b) => b.status === "neu").length;

  return (
    <>
      <div className="admin-page-header">
        <h1>Anfragen</h1>
        <p>
          {bookings.length} Fahrzeuganfragen · {open} offen
        </p>
      </div>

      <h2 className="admin-section-title">Fahrzeuganfragen</h2>
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
                    <BookingStatusSelect id={b.id} status={b.status} />
                  </td>
                  <td className="action-cell">
                    <Link
                      href={`/admin/buchungen/neu?booking=${b.id}`}
                      className="btn-small"
                    >
                      Einplanen
                    </Link>
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
                    <span className="status status-neu">{r.status}</span>
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
                    <span className="status status-neu">{r.status}</span>
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
                    <span className="status status-neu">{r.status}</span>
                  </td>
                  <td className="action-cell">
                    <Link
                      href={`/admin/buchungen/neu?request=${r.id}`}
                      className="btn-small"
                    >
                      Einplanen
                    </Link>
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
                    <span className="status status-neu">{pb.status}</span>
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
