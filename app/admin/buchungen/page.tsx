import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type AssignmentStatus } from "@/lib/types";
import AssignmentActions from "@/components/admin/AssignmentActions";

interface AssignmentRow {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  note: string | null;
  status: AssignmentStatus;
  vehicles?: { name: string | null } | null;
  profiles?: {
    name: string | null;
    company_name: string | null;
    customer_type: string | null;
    phone: string | null;
  } | null;
}

interface VehicleRow {
  id: string;
  name: string;
  active: boolean;
}

function customerLabel(p: AssignmentRow["profiles"]): string {
  if (!p) return "Kunde entfernt";
  if (p.customer_type === "gewerblich" && p.company_name) return p.company_name;
  return p.name ?? "Ohne Namen";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminBookingPlanPage() {
  const supabase = await createClient();

  const [{ data: assignData }, { data: vehicleData }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "*, vehicles(name), profiles(name, company_name, customer_type, phone)"
      )
      .order("start_date", { ascending: true }),
    supabase.from("vehicles").select("id, name, active").order("name"),
  ]);

  const assignments = (assignData ?? []) as unknown as AssignmentRow[];
  const vehicles = (vehicleData ?? []) as VehicleRow[];
  const now = today();

  const active = assignments.filter(
    (a) => a.status !== "storniert" && a.start_date <= now && a.end_date >= now
  );
  const upcoming = assignments.filter(
    (a) => a.status !== "storniert" && a.start_date > now
  );
  const past = assignments.filter(
    (a) => a.status === "storniert" || a.end_date < now
  );

  const busyVehicleIds = new Set(active.map((a) => a.vehicle_id));
  const freeVehicles = vehicles.filter(
    (v) => v.active && !busyVehicleIds.has(v.id)
  );

  function Group({
    title,
    rows,
    empty,
  }: {
    title: string;
    rows: AssignmentRow[];
    empty: string;
  }) {
    return (
      <>
        <h2 className="admin-section-title">
          {title}
          <span className="admin-count">{rows.length}</span>
        </h2>
        {rows.length === 0 ? (
          <div className="card">
            <p className="empty-state">{empty}</p>
          </div>
        ) : (
          <div className="card">
            <ul className="plan-list">
              {rows.map((a) => (
                <li key={a.id}>
                  <div className="plan-main">
                    <strong>{a.vehicles?.name ?? "Fahrzeug entfernt"}</strong>
                    <span className="plan-period">
                      {formatDate(a.start_date)} bis {formatDate(a.end_date)}
                    </span>
                    <span className="muted">
                      {customerLabel(a.profiles)}
                      {a.profiles?.phone ? ` · ${a.profiles.phone}` : ""}
                    </span>
                    {a.note && <span className="muted">{a.note}</span>}
                  </div>
                  <AssignmentActions id={a.id} status={a.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Buchungsplan</h1>
        <Link href="/admin/buchungen/neu" className="btn-primary btn-link">
          + Fahrzeug einplanen
        </Link>
      </div>

      <div className="card">
        <h2 className="admin-section-title">Heute verfügbar</h2>
        {vehicles.length === 0 ? (
          <p className="empty-state">
            Noch keine Fahrzeuge angelegt.{" "}
            <Link href="/admin/fahrzeuge/neu">Jetzt anlegen</Link>
          </p>
        ) : freeVehicles.length === 0 ? (
          <p className="empty-state">Alle sichtbaren Fahrzeuge sind belegt.</p>
        ) : (
          <ul className="free-list">
            {freeVehicles.map((v) => (
              <li key={v.id}>
                <span>{v.name}</span>
                <Link
                  href={`/admin/buchungen/neu?vehicle=${v.id}`}
                  className="btn-small"
                >
                  Einplanen
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Group title="Aktuell unterwegs" rows={active} empty="Aktuell nichts unterwegs." />
      <Group title="Geplant" rows={upcoming} empty="Nichts vorgemerkt." />
      <Group title="Erledigt" rows={past} empty="Noch nichts abgeschlossen." />
    </>
  );
}
