import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type Booking, type Profile } from "@/lib/types";
import { LogoutButton } from "@/components/AuthForms";

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
    ]);

  const p = profile as Profile | null;
  const list = (bookings ?? []) as Booking[];
  const prebookList = (prebookings ?? []) as Array<{
    id: string;
    model: string;
    status: string;
    created_at: string;
  }>;
  const requestList = (generalRequests ?? []) as Array<{
    id: string;
    vehicle_wish: string;
    period: string | null;
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
                  <td>{b.km_package}</td>
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
                <th>Wunschfahrzeug</th>
                <th>Zeitraum</th>
                <th>Angefragt am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requestList.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.vehicle_wish}</strong>
                  </td>
                  <td>{r.period ?? "–"}</td>
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
          genügt. Details in der{" "}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      </div>
    </div>
  );
}
