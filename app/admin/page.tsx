import { createClient } from "@/lib/supabase/server";
import { formatDate, type Booking } from "@/lib/types";
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
  return (
    <>
      <strong>{c?.company_name ?? c?.name ?? "–"}</strong>
      <br />
      <span className="muted">
        {c?.company_name ? `${c.name ?? ""} · ` : ""}
        {c?.email}
        {c?.phone ? ` · ${c.phone}` : ""}
        {c?.billing_street
          ? ` · ${c.billing_street}, ${c.billing_zip ?? ""} ${c.billing_city ?? ""}`
          : ""}
      </span>
    </>
  );
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const [{ data }, { data: prebookData }, { data: requestData }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*, vehicles(name), profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)")
        .order("created_at", { ascending: false }),
      supabase
        .from("prebookings")
        .select("*, profiles(name, email, phone, company_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("general_requests")
        .select("*, profiles(name, email, phone, company_name, billing_street, billing_zip, billing_city)")
        .order("created_at", { ascending: false }),
    ]);

  const bookings = (data ?? []) as Booking[];
  const prebookings = (prebookData ?? []) as Prebooking[];
  const generalRequests = (requestData ?? []) as GeneralRequest[];
  const open = bookings.filter((b) => b.status === "neu").length;

  return (
    <>
      <div className="admin-page-header">
        <h1>Anfragen</h1>
        <p>
          {bookings.length} gesamt · {open} offen
        </p>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{formatDate(b.created_at)}</td>
                  <td>
                    <CustomerCell c={b.profiles as CustomerRef | null} />
                  </td>
                  <td>{b.vehicles?.name ?? "–"}</td>
                  <td>
                    ab {formatDate(b.start_date)}
                    <br />
                    <span className="muted">
                      {b.duration_months}{" "}
                      {b.duration_months === 1 ? "Monat" : "Monate"}
                    </span>
                  </td>
                  <td>
                    {b.km_package}
                    <br />
                    <span className="muted">{b.handover ?? "Abholung"}</span>
                  </td>
                  <td className="note-cell">{b.note ?? "–"}</td>
                  <td>
                    <BookingStatusSelect id={b.id} status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-page-header" style={{ marginTop: "2rem" }}>
        <h1>Allgemeine Anfragen</h1>
        <p>{generalRequests.length} gesamt</p>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {generalRequests.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.created_at)}</td>
                  <td>
                    <CustomerCell c={r.profiles} />
                  </td>
                  <td>
                    <strong>{describeVehicles(r)}</strong>
                  </td>
                  <td className="muted">
                    {[r.km_per_month, r.fuel_type, r.start_from, r.handover]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td className="note-cell">{r.note ?? "–"}</td>
                  <td>
                    <span className="status status-neu">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-page-header" style={{ marginTop: "2rem" }}>
        <h1>Vormerkungen</h1>
        <p>{prebookings.length} gesamt</p>
      </div>

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
                  <td>{formatDate(pb.created_at)}</td>
                  <td>
                    <CustomerCell c={pb.profiles as CustomerRef | null} />
                  </td>
                  <td>{pb.model}</td>
                  <td className="note-cell">{pb.note ?? "–"}</td>
                  <td>
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
