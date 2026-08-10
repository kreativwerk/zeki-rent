import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type Profile } from "@/lib/types";
import { formatAddress } from "@/lib/company";

interface BookingRow {
  id: string;
  start_date: string;
  duration_months: number;
  km_package: string;
  handover: string | null;
  status: string;
  note: string | null;
  created_at: string;
  vehicles?: { name: string | null } | null;
}

interface RequestRow {
  id: string;
  vehicle_wish: string | null;
  km_per_month: string | null;
  fuel_type: string | null;
  start_from: string | null;
  handover: string | null;
  status: string;
  created_at: string;
}

interface PrebookingRow {
  id: string;
  model: string;
  status: string;
  created_at: string;
}

interface AssignmentRow {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  vehicles?: { name: string | null } | null;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value?.trim() ? value : "–"}</dd>
    </div>
  );
}

export default async function AdminCustomerDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();
  const p = profile as Profile;

  const [{ data: bookingData }, { data: requestData }, { data: prebookData }, { data: assignData }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*, vehicles(name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("general_requests")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("prebookings")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assignments")
        .select("*, vehicles(name)")
        .eq("user_id", id)
        .order("start_date", { ascending: false }),
    ]);

  const bookings = (bookingData ?? []) as unknown as BookingRow[];
  const requests = (requestData ?? []) as RequestRow[];
  const prebookings = (prebookData ?? []) as PrebookingRow[];
  const assignments = (assignData ?? []) as unknown as AssignmentRow[];

  const business = p.customer_type === "gewerblich";
  const title = business && p.company_name ? p.company_name : p.name ?? "Kunde";

  return (
    <>
      <Link href="/admin/kunden" className="back-link">
        ← Alle Kunden
      </Link>

      <div className="admin-page-header">
        <h1>{title}</h1>
        <p>
          <span className="status status-neu">
            {business ? "Gewerblich" : "Privat"}
          </span>
        </p>
      </div>

      <div className="card">
        <h2 className="admin-section-title">Kontakt</h2>
        <dl className="detail-list">
          <Row label="Ansprechpartner" value={p.name} />
          <Row label="E-Mail" value={p.email} />
          <Row label="Telefon" value={p.phone} />
          <Row label="Registriert" value={formatDate(p.created_at)} />
          <Row
            label="Einwilligung"
            value={p.consent_at ? formatDate(p.consent_at) : null}
          />
        </dl>
      </div>

      <div className="card">
        <h2 className="admin-section-title">Rechnungsdaten</h2>
        <dl className="detail-list">
          {business && <Row label="Firmenname" value={p.company_name} />}
          {business && <Row label="USt-IdNr." value={p.vat_id} />}
          <Row
            label="Rechnungsanschrift"
            value={formatAddress(p.billing_street, p.billing_zip, p.billing_city)}
          />
          <Row
            label="Lieferadresse"
            value={
              p.delivery_same === false
                ? formatAddress(p.delivery_street, p.delivery_zip, p.delivery_city)
                : "Wie Rechnungsadresse"
            }
          />
        </dl>
      </div>

      <h2 className="admin-section-title">
        Fahrzeuganfragen
        <span className="admin-count">{bookings.length}</span>
      </h2>
      {bookings.length === 0 ? (
        <div className="card">
          <p className="empty-state">Keine Fahrzeuganfragen.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="recent-list">
            {bookings.map((b) => (
              <li key={b.id}>
                <div className="recent-main">
                  <strong>{b.vehicles?.name ?? "Fahrzeug entfernt"}</strong>
                  <span className="muted">
                    ab {formatDate(b.start_date)} · {b.duration_months}{" "}
                    {b.duration_months === 1 ? "Monat" : "Monate"} ·{" "}
                    {b.km_package}
                  </span>
                </div>
                <div className="recent-actions">
                  <span className={`status status-${b.status}`}>{b.status}</span>
                  <Link
                    href={`/admin/buchungen/neu?booking=${b.id}`}
                    className="btn-small"
                  >
                    Einplanen
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="admin-section-title">
        Wunschfahrzeug-Anfragen
        <span className="admin-count">{requests.length}</span>
      </h2>
      {requests.length === 0 ? (
        <div className="card">
          <p className="empty-state">Keine allgemeinen Anfragen.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="recent-list">
            {requests.map((r) => (
              <li key={r.id}>
                <div className="recent-main">
                  <strong>{r.vehicle_wish ?? "Wunschfahrzeug"}</strong>
                  <span className="muted">
                    {[r.km_per_month, r.fuel_type, r.start_from, r.handover]
                      .filter(Boolean)
                      .join(" · ") || formatDate(r.created_at)}
                  </span>
                </div>
                <div className="recent-actions">
                  <span className="status status-neu">{r.status}</span>
                  <Link
                    href={`/admin/buchungen/neu?request=${r.id}`}
                    className="btn-small"
                  >
                    Einplanen
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="admin-section-title">
        Einplanungen
        <span className="admin-count">{assignments.length}</span>
      </h2>
      {assignments.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch nichts eingeplant.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="recent-list">
            {assignments.map((a) => (
              <li key={a.id}>
                <div className="recent-main">
                  <strong>{a.vehicles?.name ?? "Fahrzeug entfernt"}</strong>
                  <span className="muted">
                    {formatDate(a.start_date)} bis {formatDate(a.end_date)}
                  </span>
                </div>
                <span className="status status-neu">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prebookings.length > 0 && (
        <>
          <h2 className="admin-section-title">
            Vormerkungen
            <span className="admin-count">{prebookings.length}</span>
          </h2>
          <div className="card">
            <ul className="recent-list">
              {prebookings.map((pb) => (
                <li key={pb.id}>
                  <div className="recent-main">
                    <strong>{pb.model}</strong>
                    <span className="muted">{formatDate(pb.created_at)}</span>
                  </div>
                  <span className="status status-neu">{pb.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
