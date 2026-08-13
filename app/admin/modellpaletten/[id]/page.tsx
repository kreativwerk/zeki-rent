import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  cheapestAboPrice,
  formatEuro,
  type CatalogVehicle,
  type ModelCatalog,
} from "@/lib/types";
import CatalogModelToggle from "@/components/admin/CatalogModelToggle";
import CatalogBulkAdd from "@/components/admin/CatalogBulkAdd";

const SERVICE_LABEL: Record<string, string> = {
  abo: "Auto-Abo",
  miete: "Miete",
  beides: "Abo und Miete",
};

export default async function AdminCatalogDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: catalogData } = await supabase
    .from("model_catalogs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!catalogData) notFound();
  const catalog = catalogData as ModelCatalog;

  const { data: vehicleData } = await supabase
    .from("catalog_vehicles")
    .select("*")
    .eq("catalog_id", id)
    .order("sort_order");

  const vehicles = (vehicleData ?? []) as CatalogVehicle[];
  const live = vehicles.filter((v) => v.active).length;
  const maxOrder = vehicles.reduce((m, v) => Math.max(m, v.sort_order), 0);

  let pdfUrl: string | null = null;
  if (catalog.pdf_path) {
    const { data } = await supabase.storage
      .from("catalogs")
      .createSignedUrl(catalog.pdf_path, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <Link href="/admin/modellpaletten" className="back-link">
        ← Alle Modellpaletten
      </Link>

      <div className="admin-page-header">
        <h1>{catalog.title}</h1>
        <p>
          {vehicles.length} Modelle · {live} live ·{" "}
          {SERVICE_LABEL[catalog.service_type] ?? catalog.service_type}
        </p>
      </div>

      {(catalog.note || pdfUrl) && (
        <div className="card context-card">
          {catalog.note && <p>{catalog.note}</p>}
          {pdfUrl && (
            <p style={{ marginTop: catalog.note ? "0.5rem" : 0 }}>
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                Hochgeladene Modellpalette als PDF öffnen
              </a>
            </p>
          )}
        </div>
      )}

      <h2 className="admin-section-title">Modelle</h2>
      {vehicles.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            Noch keine Modelle erfasst. Unten können Sie mehrere auf einmal
            anlegen.
          </p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Modell</th>
                <th>Segment</th>
                <th>Antrieb</th>
                <th>Reichweite / Verbrauch</th>
                <th>Aborate</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const from = cheapestAboPrice(v);
                const ready = v.price_on_request || from !== null;
                return (
                  <tr key={v.id}>
                    <td data-label="Modell">
                      <strong>{v.model}</strong>
                    </td>
                    <td data-label="Segment">{v.segment ?? "–"}</td>
                    <td data-label="Antrieb">{v.drivetrain ?? "–"}</td>
                    <td data-label="Reichweite / Verbrauch" className="muted">
                      {v.range_text ?? "–"}
                    </td>
                    <td data-label="Aborate">
                      {v.price_on_request
                        ? "auf Anfrage"
                        : from !== null
                          ? `ab ${formatEuro(from)}/Monat`
                          : "offen"}
                    </td>
                    <td data-label="Status">
                      <CatalogModelToggle
                        id={v.id}
                        active={v.active}
                        ready={ready}
                      />
                    </td>
                    <td className="action-cell">
                      <Link
                        href={`/admin/modellpaletten/modell/${v.id}`}
                        className="btn-small"
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CatalogBulkAdd
        catalogId={catalog.id}
        brand={catalog.brand}
        serviceType={catalog.service_type}
        startOrder={maxOrder}
      />
    </>
  );
}
