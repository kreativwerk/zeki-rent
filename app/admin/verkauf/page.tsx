import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuro, formatKm, saleTitle, type SaleVehicle } from "@/lib/types";

export default async function AdminSalePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sale_vehicles")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });

  const vehicles = (data ?? []) as SaleVehicle[];
  const used = vehicles.filter((v) => v.condition === "gebraucht");
  const fresh = vehicles.filter((v) => v.condition === "neu");

  function Table({ rows, empty }: { rows: SaleVehicle[]; empty: string }) {
    if (rows.length === 0) {
      return (
        <div className="card">
          <p className="empty-state">{empty}</p>
        </div>
      );
    }
    return (
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fahrzeug</th>
              <th>Eckdaten</th>
              <th>Preis</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td data-label="Fahrzeug">
                  <strong>{saleTitle(v)}</strong>
                </td>
                <td data-label="Eckdaten" className="muted">
                  {[
                    v.first_registration && `EZ ${v.first_registration}`,
                    formatKm(v.mileage_km),
                    v.power,
                    v.fuel,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "–"}
                </td>
                <td data-label="Preis">
                  {v.price_on_request
                    ? "auf Anfrage"
                    : v.price !== null
                      ? formatEuro(v.price)
                      : "offen"}
                </td>
                <td data-label="Status">
                  <span
                    className={`status ${v.active ? "status-bestätigt" : "status-beendet"}`}
                  >
                    {v.active ? "online" : "Entwurf"}
                  </span>
                </td>
                <td className="action-cell">
                  <Link href={`/admin/verkauf/${v.id}`} className="btn-small">
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Verkauf</h1>
        <Link href="/admin/verkauf/neu" className="btn-primary btn-link">
          + Fahrzeug anlegen
        </Link>
      </div>

      <h2 className="admin-section-title">
        Gebrauchtwagen
        <span className="admin-count">{used.length}</span>
      </h2>
      <Table rows={used} empty="Noch keine Gebrauchtwagen im Angebot." />

      <h2 className="admin-section-title">
        Neuwagen
        <span className="admin-count">{fresh.length}</span>
      </h2>
      <Table rows={fresh} empty="Noch keine Neuwagen im Angebot." />
    </>
  );
}
