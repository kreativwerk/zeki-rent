import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cheapestPrice, formatEuro, type Vehicle } from "@/lib/types";

export default async function AdminVehiclesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at");

  const vehicles = (data ?? []) as Vehicle[];

  return (
    <>
      <div className="admin-page-header">
        <h1>Fahrzeuge</h1>
        <Link href="/admin/fahrzeuge/neu" className="btn-primary btn-link">
          + Fahrzeug anlegen
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Fahrzeuge angelegt.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeug</th>
                <th>Kategorie</th>
                <th>ab Preis</th>
                <th>Sichtbar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const from = cheapestPrice(v);
                return (
                  <tr key={v.id}>
                    <td data-label="Fahrzeug">
                      <strong>{v.name}</strong>
                    </td>
                    <td data-label="Kategorie">{v.category}</td>
                    <td data-label="ab Preis">
                      {v.price_on_request
                        ? "auf Anfrage"
                        : from !== null
                          ? `${formatEuro(from)}/Monat`
                          : "–"}
                    </td>
                    <td data-label="Sichtbar">
                      <span
                        className={`status ${v.active ? "status-bestätigt" : "status-beendet"}`}
                      >
                        {v.active ? "online" : "versteckt"}
                      </span>
                    </td>
                    <td className="action-cell">
                      <Link
                        href={`/admin/fahrzeuge/${v.id}`}
                        className="btn-small"
                      >
                        Bearbeiten &amp; verplanen
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
