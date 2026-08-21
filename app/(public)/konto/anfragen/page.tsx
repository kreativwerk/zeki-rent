import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  formatDate,
  formatEuro,
  formatKm,
  formatPeriod,
  type Booking,
  type SellOffer,
} from "@/lib/types";

export const metadata = { title: "Meine Anfragen – Zeki Rent" };

export default async function AccountRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konto/anfragen");

  const [
    { data: bookings },
    { data: prebookings },
    { data: generalRequests },
    { data: sellOffers },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, vehicles(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("prebookings")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("general_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("sell_offers")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const list = (bookings ?? []) as Booking[];
  const offerList = (sellOffers ?? []) as SellOffer[];
  const prebookList = (prebookings ?? []) as Array<{
    id: string;
    model: string;
    status: string;
    created_at: string;
  }>;
  const requestList = (generalRequests ?? []) as Array<{
    id: string;
    vehicle_wish: string | null;
    large_vans: Record<string, number> | null;
    small_vans: number | null;
    km_per_month: string | null;
    fuel_type: string | null;
    start_from: string | null;
    handover: string | null;
    status: string;
    created_at: string;
  }>;

  const nothing =
    list.length === 0 &&
    offerList.length === 0 &&
    prebookList.length === 0 &&
    requestList.length === 0;

  return (
    <div className="page-narrow page-wide">
      <Link href="/konto" className="back-link">
        ← Übersicht
      </Link>
      <div className="account-header">
        <h1>Meine Anfragen</h1>
      </div>

      {nothing && (
        <div className="card">
          <p className="empty-state">
            Noch keine Anfragen.{" "}
            <Link href="/#fahrzeuge">Jetzt Fahrzeug auswählen →</Link>
          </p>
        </div>
      )}

      {list.length > 0 && (
        <div className="card table-card">
          <h2>Mietanfragen</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeug</th>
                <th>Zeitraum</th>
                <th>Laufzeit</th>
                <th>Kilometer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td data-label="Fahrzeug">
                    <strong>{b.vehicles?.name ?? "–"}</strong>
                  </td>
                  <td data-label="Zeitraum">
                    {formatPeriod(b.start_date, b.duration_months)}
                  </td>
                  <td data-label="Laufzeit">
                    {b.duration_months}{" "}
                    {b.duration_months === 1 ? "Monat" : "Monate"}
                  </td>
                  <td data-label="Kilometer">
                    <div className="cell-stack">
                      <span>{b.km_package}</span>
                      <span className="muted">
                        {b.handover ?? "Abholung"}
                        {b.monthly_price != null &&
                          ` · ${formatEuro(Number(b.monthly_price))}/Monat`}
                      </span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <span className={`status status-${b.status}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fine-print">
            Der Zeitraum ergibt sich aus dem gewünschten Start und der
            gewählten Laufzeit. Verlängern ist jederzeit möglich, sprechen Sie
            uns einfach an.
          </p>
        </div>
      )}

      {requestList.length > 0 && (
        <div className="card table-card">
          <h2>Wunschfahrzeug-Anfragen</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeuge</th>
                <th>Zeitraum</th>
                <th>Details</th>
                <th>Angefragt am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requestList.map((r) => (
                <tr key={r.id}>
                  <td data-label="Fahrzeuge">
                    <strong>
                      {[
                        ...Object.entries(r.large_vans ?? {})
                          .filter(([, n]) => n > 0)
                          .map(([size, n]) => `${n}× ${size}`),
                        ...(r.small_vans
                          ? [`${r.small_vans}× Kleintransporter`]
                          : []),
                      ].join(", ") ||
                        r.vehicle_wish ||
                        "–"}
                    </strong>
                  </td>
                  <td data-label="Zeitraum">
                    {r.start_from ? `ab ${r.start_from}` : "noch offen"}
                  </td>
                  <td data-label="Details" className="muted">
                    {[r.km_per_month, r.fuel_type, r.handover]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td data-label="Angefragt am">{formatDate(r.created_at)}</td>
                  <td data-label="Status">
                    <span className={`status status-${r.status}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {offerList.length > 0 && (
        <div className="card table-card">
          <h2>Meine Verkaufsangebote</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeug</th>
                <th>Eckdaten</th>
                <th>Angeboten am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {offerList.map((o) => (
                <tr key={o.id}>
                  <td data-label="Fahrzeug">
                    <strong>
                      {o.brand} {o.model}
                    </strong>
                  </td>
                  <td data-label="Eckdaten" className="muted">
                    {[
                      o.build_year && `BJ ${o.build_year}`,
                      formatKm(o.mileage_km),
                      o.power,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td data-label="Angeboten am">{formatDate(o.created_at)}</td>
                  <td data-label="Status">
                    <span className={`status status-${o.status}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fine-print">
            Wir sehen uns Ihr Fahrzeug an und melden uns mit einer
            Einschätzung.
          </p>
        </div>
      )}

      {prebookList.length > 0 && (
        <div className="card table-card">
          <h2>Meine Vormerkungen</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeug</th>
                <th>Vorgemerkt am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {prebookList.map((pb) => (
                <tr key={pb.id}>
                  <td data-label="Fahrzeug">
                    <strong>{pb.model}</strong>
                  </td>
                  <td data-label="Vorgemerkt am">
                    {formatDate(pb.created_at)}
                  </td>
                  <td data-label="Status">
                    <span className={`status status-${pb.status}`}>
                      {pb.status === "neu"
                        ? "vorgemerkt"
                        : (STATUS_LABEL[pb.status] ?? pb.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fine-print">
            Wir melden uns, sobald das Fahrzeug verfügbar ist.
          </p>
        </div>
      )}
    </div>
  );
}
