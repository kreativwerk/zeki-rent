import { createClient } from "@/lib/supabase/server";
import { formatDate, type Profile } from "@/lib/types";

type ProfileRow = Profile & { bookings: { count: number }[] };

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, bookings(count)")
    .order("created_at", { ascending: false });

  const profiles = (data ?? []) as ProfileRow[];

  return (
    <>
      <div className="admin-page-header">
        <h1>Kunden</h1>
        <p>{profiles.length} registriert</p>
      </div>

      {profiles.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine registrierten Kunden.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Telefon</th>
                <th>Registriert</th>
                <th>Anfragen</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name ?? "–"}</strong>
                  </td>
                  <td>{p.email ?? "–"}</td>
                  <td>{p.phone ?? "–"}</td>
                  <td>{formatDate(p.created_at)}</td>
                  <td>{p.bookings?.[0]?.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
