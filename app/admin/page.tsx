import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/types";
import AdminIcon, { type AdminIconName } from "@/components/admin/AdminIcon";

interface RecentRow {
  id: string;
  created_at: string;
  status: string;
  vehicles?: { name: string | null } | null;
  profiles?: { name: string | null; company_name: string | null } | null;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const countOf = (
    table: string,
    filter?: { column: string; value: string; negate?: boolean }
  ) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) {
      q = filter.negate
        ? q.neq(filter.column, filter.value)
        : q.eq(filter.column, filter.value);
    }
    return q;
  };

  const [
    bookings,
    bookingsOpen,
    requests,
    prebookings,
    vehicles,
    vehiclesActive,
    customers,
    tickets,
    ticketsOpen,
    recent,
  ] = await Promise.all([
    countOf("bookings"),
    countOf("bookings", { column: "status", value: "neu" }),
    countOf("general_requests"),
    countOf("prebookings"),
    countOf("vehicles"),
    countOf("vehicles", { column: "active", value: "true" }),
    countOf("profiles"),
    countOf("support_tickets"),
    countOf("support_tickets", {
      column: "status",
      value: "erledigt",
      negate: true,
    }),
    supabase
      .from("bookings")
      .select("id, created_at, status, vehicles(name), profiles(name, company_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const tiles: {
    href: string;
    icon: AdminIconName;
    label: string;
    value: number;
    hint: string;
    alert?: boolean;
  }[] = [
    {
      href: "/admin/anfragen",
      icon: "anfragen",
      label: "Fahrzeuganfragen",
      value: bookings.count ?? 0,
      hint: `${bookingsOpen.count ?? 0} offen`,
      alert: (bookingsOpen.count ?? 0) > 0,
    },
    {
      href: "/admin/anfragen",
      icon: "wunsch",
      label: "Wunschfahrzeuge",
      value: requests.count ?? 0,
      hint: "Partnernetzwerk",
    },
    {
      href: "/admin/anfragen",
      icon: "vormerkung",
      label: "Vormerkungen",
      value: prebookings.count ?? 0,
      hint: "Togg T10X & T10F",
    },
    {
      href: "/admin/fahrzeuge",
      icon: "fahrzeuge",
      label: "Fahrzeuge",
      value: vehicles.count ?? 0,
      hint: `${vehiclesActive.count ?? 0} online`,
    },
    {
      href: "/admin/kunden",
      icon: "kunden",
      label: "Kunden",
      value: customers.count ?? 0,
      hint: "registriert",
    },
    {
      href: "/admin/support",
      icon: "support",
      label: "Support",
      value: tickets.count ?? 0,
      hint: `${ticketsOpen.count ?? 0} offen`,
      alert: (ticketsOpen.count ?? 0) > 0,
    },
  ];

  const recentRows = (recent.data ?? []) as unknown as RecentRow[];

  return (
    <>
      <div className="admin-page-header">
        <h1>Übersicht</h1>
        <p>Alles Wichtige auf einen Blick</p>
      </div>

      <div className="dash-grid">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="dash-tile">
            <span className="dash-icon">
              <AdminIcon name={t.icon} />
            </span>
            <span className="dash-value">{t.value}</span>
            <span className="dash-label">{t.label}</span>
            <span className={`dash-hint${t.alert ? " dash-hint-alert" : ""}`}>
              {t.hint}
            </span>
          </Link>
        ))}
      </div>

      <h2 className="admin-section-title">Zuletzt eingegangen</h2>
      {recentRows.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Anfragen eingegangen.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="recent-list">
            {recentRows.map((r) => (
              <li key={r.id}>
                <div className="recent-main">
                  <strong>
                    {r.profiles?.company_name ?? r.profiles?.name ?? "Kunde"}
                  </strong>
                  <span className="muted">
                    {r.vehicles?.name ?? "Fahrzeug"} ·{" "}
                    {formatDate(r.created_at)}
                  </span>
                </div>
                <span className={`status status-${r.status}`}>{r.status}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/anfragen" className="recent-more">
            Alle Anfragen ansehen →
          </Link>
        </div>
      )}
    </>
  );
}
