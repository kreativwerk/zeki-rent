import { createClient } from "@/lib/supabase/server";
import { formatDate, type Booking } from "@/lib/types";
import BookingStatusSelect from "@/components/admin/BookingStatusSelect";

interface Prebooking {
  id: string;
  model: string;
  note: string | null;
  status: string;
  created_at: string;
  profiles?: { name: string | null; email: string | null; phone: string | null } | null;
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const [{ data }, { data: prebookData }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, vehicles(name), profiles(name, email, phone)")
      .order("created_at", { ascending: false }),
    supabase
      .from("prebookings")
      .select("*, profiles(name, email, phone)")
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (data ?? []) as Booking[];
  const prebookings = (prebookData ?? []) as Prebooking[];
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
                    <strong>{b.profiles?.name ?? "–"}</strong>
                    <br />
                    <span className="muted">
                      {b.profiles?.email}
                      {b.profiles?.phone ? ` · ${b.profiles.phone}` : ""}
                    </span>
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
                  <td>{b.km_package}</td>
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
                    <strong>{pb.profiles?.name ?? "–"}</strong>
                    <br />
                    <span className="muted">
                      {pb.profiles?.email}
                      {pb.profiles?.phone ? ` · ${pb.profiles.phone}` : ""}
                    </span>
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
