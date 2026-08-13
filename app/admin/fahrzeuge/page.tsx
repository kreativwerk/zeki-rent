import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cheapestPrice, formatEuro, type Vehicle } from "@/lib/types";

export default async function AdminVehiclesPage() {
  const supabase = await createClient();
  const [{ data }, { data: catalogData }, { data: catalogVehicles }] =
    await Promise.all([
      supabase.from("vehicles").select("*").order("created_at"),
      supabase
        .from("model_catalogs")
        .select("id, title, service_type")
        .order("created_at", { ascending: false }),
      supabase.from("catalog_vehicles").select("catalog_id, active"),
    ]);

  const vehicles = (data ?? []) as Vehicle[];
  const catalogs = (catalogData ?? []) as {
    id: string;
    title: string;
    service_type: string;
  }[];
  const rows = (catalogVehicles ?? []) as {
    catalog_id: string | null;
    active: boolean;
  }[];

  return (
    <>
      <div className="admin-page-header">
        <h1>Fahrzeuge</h1>
        <Link href="/admin/fahrzeuge/neu" className="btn-primary btn-link">
          + Fahrzeug anlegen
        </Link>
      </div>

      <h2 className="admin-section-title">Eigene Mietfahrzeuge</h2>

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

      <h2 className="admin-section-title">
        Modellpaletten
        <span className="admin-count">{catalogs.length}</span>
      </h2>
      <div className="card">
        <p className="step-intro">
          Modellpaletten der Hersteller als PDF hochladen und die Fahrzeuge
          daraus erfassen. Sie bleiben ohne Preise und unsichtbar, bis Sie
          Raten eintragen und das Modell freischalten.
        </p>
        {catalogs.length > 0 && (
          <ul className="customer-list">
            {catalogs.map((c) => {
              const mine = rows.filter((r) => r.catalog_id === c.id);
              return (
                <li key={c.id}>
                  <Link href={`/admin/modellpaletten/${c.id}`}>
                    <span className="customer-name">{c.title}</span>
                    <span className="customer-meta">
                      {mine.length} Modelle ·{" "}
                      {mine.filter((r) => r.active).length} live
                    </span>
                    <span className="customer-chevron" aria-hidden>
                      ›
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/admin/modellpaletten"
          className="btn-primary btn-link"
          style={{ marginTop: "1rem" }}
        >
          Modellpaletten verwalten
        </Link>
      </div>
    </>
  );
}
