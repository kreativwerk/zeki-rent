import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  formatDate,
  formatKm,
  type Booking,
  type Profile,
  type SellOffer,
} from "@/lib/types";
import { LogoutButton } from "@/components/AuthForms";
import CompanyForm from "@/components/CompanyForm";

export const metadata = { title: "Mein Konto – Zeki Rent" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konto");

  const [
    { data: profile },
    { data: bookings },
    { data: prebookings },
    { data: generalRequests },
    { data: sellOffers },
  ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
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

  const p = profile as Profile | null;
  const list = (bookings ?? []) as Booking[];
  const prebookList = (prebookings ?? []) as Array<{
    id: string;
    model: string;
    status: string;
    created_at: string;
  }>;
  const offerList = (sellOffers ?? []) as SellOffer[];
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

  return (
    <div className="page-narrow">
      <div className="account-header">
        <h1>Mein Konto</h1>
        <LogoutButton />
      </div>

      <div className="card">
        <h2>Meine Anfragen</h2>
        {list.length === 0 ? (
          <p className="empty-state">
            Noch keine Anfragen.{" "}
            <Link href="/#fahrzeuge">Jetzt Fahrzeug auswählen →</Link>
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeug</th>
                <th>Start</th>
                <th>Laufzeit</th>
                <th>Kilometer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td>{b.vehicles?.name ?? "–"}</td>
                  <td>{formatDate(b.start_date)}</td>
                  <td>
                    {b.duration_months}{" "}
                    {b.duration_months === 1 ? "Monat" : "Monate"}
                  </td>
                  <td>
                    {b.km_package}
                    <br />
                    <span className="muted">{b.handover ?? "Abholung"}</span>
                  </td>
                  <td>
                    <span className={`status status-${b.status}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {requestList.length > 0 && (
        <div className="card">
          <h2>Meine Fahrzeug-Anfragen</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fahrzeuge</th>
                <th>Details</th>
                <th>Angefragt am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requestList.map((r) => (
                <tr key={r.id}>
                  <td>
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
                  <td className="muted">
                    {[r.km_per_month, r.fuel_type, r.start_from, r.handover]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td>{formatDate(r.created_at)}</td>
                  <td>
                    <span className="status status-neu">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {offerList.length > 0 && (
        <div className="card">
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
                  <td>
                    <strong>
                      {o.brand} {o.model}
                    </strong>
                  </td>
                  <td className="muted">
                    {[
                      o.build_year && `BJ ${o.build_year}`,
                      formatKm(o.mileage_km),
                      o.power,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>
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
        <div className="card">
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
                  <td>
                    <strong>{pb.model}</strong>
                  </td>
                  <td>{formatDate(pb.created_at)}</td>
                  <td>
                    <span className="status status-neu">
                      {pb.status === "neu" ? "vorgemerkt" : pb.status}
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

      <div className="card">
        <h2>Firmen- &amp; Rechnungsdaten</h2>
        <p className="step-intro">
          Diese Angaben verwenden wir für Angebote, Verträge und Rechnungen.
        </p>
        <CompanyForm initial={p} />
      </div>

      <div className="card">
        <h2>Meine Daten</h2>
        <dl className="data-list">
          <dt>Name</dt>
          <dd>{p?.name ?? "–"}</dd>
          <dt>E-Mail</dt>
          <dd>{p?.email ?? user.email}</dd>
          <dt>Telefon</dt>
          <dd>{p?.phone ?? "–"}</dd>
          <dt>Einwilligung erteilt</dt>
          <dd>{p?.consent_at ? formatDate(p.consent_at) : "–"}</dd>
        </dl>
        <p className="fine-print">
          Sie können jederzeit Auskunft, Berichtigung oder Löschung Ihrer
          Daten verlangen. Eine kurze E-Mail an{" "}
          <a href="mailto:info@zeki-rent.com">
            info@zeki-rent.com
          </a>{" "}
          genügt.
        </p>
      </div>
    </div>
  );
}
