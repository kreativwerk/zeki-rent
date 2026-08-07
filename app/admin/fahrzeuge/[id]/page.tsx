import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type Booking, type Vehicle } from "@/lib/types";
import VehicleForm from "@/components/admin/VehicleForm";
import BookingStatusSelect from "@/components/admin/BookingStatusSelect";

function endDate(start: string, months: number): string {
  const d = new Date(start);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export default async function EditVehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: vehicle }, { data: bookings }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", id).single(),
    supabase
      .from("bookings")
      .select("*, profiles(name, email, phone)")
      .eq("vehicle_id", id)
      .order("start_date"),
  ]);

  if (!vehicle) notFound();
  const v = vehicle as Vehicle;
  const list = (bookings ?? []) as Booking[];
  const planned = list.filter(
    (b) => b.status === "neu" || b.status === "bestätigt"
  );

  return (
    <>
      <div className="admin-page-header">
        <h1>{v.name}</h1>
      </div>

      <div className="card">
        <h2>Verplanung</h2>
        {planned.length === 0 ? (
          <p className="empty-state">
            Keine offenen oder bestätigten Buchungen. Das Fahrzeug ist frei.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Zeitraum</th>
                <th>Kunde</th>
                <th>Kilometer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {planned.map((b) => (
                <tr key={b.id}>
                  <td>
                    {formatDate(b.start_date)} –{" "}
                    {formatDate(endDate(b.start_date, b.duration_months))}
                    <br />
                    <span className="muted">
                      {b.duration_months}{" "}
                      {b.duration_months === 1 ? "Monat" : "Monate"}
                    </span>
                  </td>
                  <td>
                    <strong>{b.profiles?.name ?? "–"}</strong>
                    <br />
                    <span className="muted">
                      {b.profiles?.email}
                      {b.profiles?.phone ? ` · ${b.profiles.phone}` : ""}
                    </span>
                  </td>
                  <td>{b.km_package}</td>
                  <td>
                    <BookingStatusSelect id={b.id} status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <VehicleForm vehicle={v} />
    </>
  );
}
