import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatEuro,
  formatKm,
  saleTitle,
  type PartnerFeed,
  type PartnerSource,
  type SaleVehicle,
} from "@/lib/types";
import PartnerFeedSettings from "@/components/admin/PartnerFeedSettings";
import PartnerHideToggle from "@/components/admin/PartnerHideToggle";

const FEED = "kaufmann";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusOf(v: SaleVehicle): { label: string; cls: string } {
  if (v.active) return { label: "online", cls: "status-bestätigt" };
  if (v.listed === false) return { label: "verkauft", cls: "status-beendet" };
  if (v.hidden) return { label: "ausgeblendet", cls: "status-beendet" };
  return { label: "nicht sichtbar", cls: "status-beendet" };
}

export default async function AdminPartnerPage() {
  const supabase = await createClient();
  const [{ data: feedData }, { data: vehicleData }, { data: sourceData }] =
    await Promise.all([
      supabase.from("partner_feeds").select("*").eq("id", FEED).maybeSingle(),
      supabase
        .from("sale_vehicles")
        .select("*")
        .eq("is_partner", true)
        .order("listed", { ascending: false })
        .order("brand")
        .order("model"),
      supabase.from("partner_vehicles").select("*").eq("feed", FEED),
    ]);

  const feed = feedData as PartnerFeed | null;
  const vehicles = (vehicleData ?? []) as SaleVehicle[];
  const sources = new Map(
    ((sourceData ?? []) as PartnerSource[]).map((s) => [s.sale_vehicle_id, s]),
  );

  if (!feed) {
    return (
      <div className="card">
        <p className="empty-state">Partner-Abgleich ist noch nicht eingerichtet.</p>
      </div>
    );
  }

  const online = vehicles.filter((v) => v.active).length;
  const listed = vehicles.filter((v) => v.listed !== false).length;

  return (
    <>
      <div className="admin-page-header">
        <h1>Partnerfahrzeuge · {feed.name}</h1>
        <p>
          {listed} beim Partner gelistet · {online} auf der Website
        </p>
      </div>

      <div className="card">
        <h2>Letzter Abgleich</h2>
        {feed.last_run_at ? (
          <p>
            {formatDateTime(feed.last_run_at)} ·{" "}
            <strong>
              {feed.last_status === "ok"
                ? `erfolgreich, ${feed.last_count ?? 0} Fahrzeuge`
                : feed.last_status === "läuft"
                  ? "läuft gerade"
                  : "fehlgeschlagen"}
            </strong>
          </p>
        ) : (
          <p className="muted">Noch kein Abgleich gelaufen.</p>
        )}
        {feed.last_status === "fehler" && feed.last_error && (
          <p className="muted">{feed.last_error}</p>
        )}
        <p className="fine-print">
          Der Abgleich läuft automatisch jede Nacht. Neue Fahrzeuge kommen
          hinzu, verkaufte verschwinden, Preisänderungen werden übernommen. Im
          angezeigten Preis steckt der Aufschlag inkl. MwSt.; der Link zum
          Originalangebot ist nur hier im Admin sichtbar.
        </p>
      </div>

      <PartnerFeedSettings feed={feed} />

      <h2 className="admin-section-title">
        Fahrzeuge
        <span className="admin-count">{vehicles.length}</span>
      </h2>
      {vehicles.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Fahrzeuge abgeglichen.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeug</th>
                <th>Eckdaten</th>
                <th>Einkauf</th>
                <th>Unser Preis</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const src = sources.get(v.id);
                const st = statusOf(v);
                return (
                  <tr key={v.id}>
                    <td data-label="Fahrzeug">
                      <div className="cell-stack">
                        <strong>{saleTitle(v)}</strong>
                        <span className="muted">
                          {[v.source_status, v.body_type, src?.source_location]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    </td>
                    <td data-label="Eckdaten" className="muted">
                      {[
                        v.first_registration && `EZ ${v.first_registration}`,
                        formatKm(v.mileage_km),
                        v.fuel,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "–"}
                    </td>
                    <td data-label="Einkauf">
                      {src?.source_price != null
                        ? formatEuro(Number(src.source_price))
                        : "–"}
                    </td>
                    <td data-label="Unser Preis">
                      {v.price !== null ? formatEuro(Number(v.price)) : "–"}
                    </td>
                    <td data-label="Status">
                      <span className={`status ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="action-cell">
                      {v.active && (
                        <Link href={`/kaufen/${v.id}`} className="btn-small">
                          Ansehen
                        </Link>
                      )}
                      {src?.source_url && (
                        <a
                          href={src.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-small"
                        >
                          Original
                        </a>
                      )}
                      {v.listed !== false && (
                        <PartnerHideToggle
                          id={v.id}
                          feed={FEED}
                          hidden={Boolean(v.hidden)}
                        />
                      )}
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
