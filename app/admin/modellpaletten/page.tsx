import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type ModelCatalog } from "@/lib/types";
import CatalogUploadForm from "@/components/admin/CatalogUploadForm";

const SERVICE_LABEL: Record<string, string> = {
  abo: "Auto-Abo",
  miete: "Miete",
  beides: "Abo und Miete",
};

export default async function AdminCatalogsPage() {
  const supabase = await createClient();

  const [{ data: catalogData }, { data: counts }] = await Promise.all([
    supabase
      .from("model_catalogs")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("catalog_vehicles").select("catalog_id, active"),
  ]);

  const catalogs = (catalogData ?? []) as ModelCatalog[];
  const rows = (counts ?? []) as { catalog_id: string | null; active: boolean }[];

  function stats(id: string) {
    const mine = rows.filter((r) => r.catalog_id === id);
    return { total: mine.length, live: mine.filter((r) => r.active).length };
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Modellpaletten</h1>
        <Link href="/admin/fahrzeuge" className="back-link">
          ← Fahrzeuge
        </Link>
      </div>

      {catalogs.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Modellpalette angelegt.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="customer-list">
            {catalogs.map((c) => {
              const s = stats(c.id);
              return (
                <li key={c.id}>
                  <Link href={`/admin/modellpaletten/${c.id}`}>
                    <span className="customer-name">{c.title}</span>
                    <span className="customer-meta">
                      {s.total} Modelle · {s.live} live ·{" "}
                      {SERVICE_LABEL[c.service_type] ?? c.service_type} ·{" "}
                      {formatDate(c.created_at)}
                    </span>
                    <span className="customer-chevron" aria-hidden>
                      ›
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <CatalogUploadForm />
    </>
  );
}
