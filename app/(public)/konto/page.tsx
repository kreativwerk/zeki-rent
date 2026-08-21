import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  formatDate,
  type Booking,
  type Profile,
  type SellOffer,
} from "@/lib/types";
import { isCompanyComplete } from "@/lib/company";
import AdminIcon, { type AdminIconName } from "@/components/admin/AdminIcon";

export const metadata = { title: "Mein Konto – Zeki Rent" };

interface Entry {
  id: string;
  label: string;
  date: string;
  status: string;
}

function Tile({
  href,
  icon,
  label,
  value,
  hint,
  alert,
}: {
  href: string;
  icon: AdminIconName;
  label: string;
  value?: string;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className="dash-tile">
      <span className="dash-icon">
        <AdminIcon name={icon} size={20} />
      </span>
      {value && <span className="dash-value">{value}</span>}
      <span className="dash-label">{label}</span>
      {hint && (
        <span className={alert ? "dash-hint dash-hint-alert" : "dash-hint"}>
          {hint}
        </span>
      )}
    </Link>
  );
}

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
  const bookingList = (bookings ?? []) as Booking[];
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
    status: string;
    created_at: string;
  }>;

  const requestCount =
    bookingList.length + requestList.length + prebookList.length;
  const openCount = [...bookingList, ...requestList, ...prebookList].filter(
    (r) => r.status === "neu",
  ).length;
  const dataComplete = isCompanyComplete(p);
  const firstName = p?.name?.trim().split(/\s+/)[0] ?? null;

  // Die fünf jüngsten Vorgänge quer über alle Arten
  const recent: Entry[] = [
    ...bookingList.map((b) => ({
      id: `b-${b.id}`,
      label: b.vehicles?.name ?? "Fahrzeuganfrage",
      date: b.created_at,
      status: b.status,
    })),
    ...requestList.map((r) => ({
      id: `r-${r.id}`,
      label: r.vehicle_wish || "Wunschfahrzeug",
      date: r.created_at,
      status: r.status,
    })),
    ...offerList.map((o) => ({
      id: `o-${o.id}`,
      label: `${o.brand} ${o.model} verkaufen`,
      date: o.created_at,
      status: o.status,
    })),
    ...prebookList.map((pb) => ({
      id: `p-${pb.id}`,
      label: `${pb.model} vorgemerkt`,
      date: pb.created_at,
      status: pb.status,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="page-narrow page-wide">
      <div className="account-header">
        <div>
          <h1>{firstName ? `Hallo, ${firstName}` : "Mein Konto"}</h1>
          <p className="muted">
            {openCount > 0
              ? `${openCount} ${openCount === 1 ? "Vorgang ist" : "Vorgänge sind"} bei uns in Arbeit.`
              : "Schön, dass Sie da sind. Womit können wir helfen?"}
          </p>
        </div>
      </div>

      {!dataComplete && (
        <div className="card account-todo">
          <p>
            <strong>Noch eine Kleinigkeit:</strong> Für Angebote und Verträge
            brauchen wir einmalig Ihre Rechnungsdaten.
          </p>
          <Link href="/konto/profil" className="btn-primary btn-link">
            Jetzt vervollständigen
          </Link>
        </div>
      )}

      <div className="dash-grid">
        <Tile
          href="/konto/anfragen"
          icon="anfragen"
          label="Meine Anfragen"
          value={String(requestCount)}
          hint={openCount > 0 ? `${openCount} offen` : "alle bearbeitet"}
          alert={openCount > 0}
        />
        <Tile
          href="/#fahrzeuge"
          icon="fahrzeuge"
          label="Fahrzeug mieten"
          hint="Transporter und Pkw ab 1 Monat"
        />
        <Tile
          href="/abo"
          icon="abo"
          label="Auto-Abo"
          hint="6, 12 Monate oder länger"
        />
        <Tile
          href="/kaufen"
          icon="buchungen"
          label="Fahrzeug kaufen"
          hint="Gebraucht- und Neuwagen"
        />
        <Tile
          href="/verkaufen"
          icon="verkauf"
          label="Fahrzeug verkaufen"
          value={offerList.length > 0 ? String(offerList.length) : undefined}
          hint={
            offerList.length > 0
              ? "Ihre Angebote ansehen"
              : "Eckdaten und Fotos hochladen"
          }
        />
        <Tile
          href="/konto/profil"
          icon="profil"
          label="Profil"
          hint={dataComplete ? "Daten sind vollständig" : "Daten ergänzen"}
          alert={!dataComplete}
        />
      </div>

      <div className="card">
        <h2>Zuletzt</h2>
        {recent.length === 0 ? (
          <p className="empty-state">
            Hier ist noch nichts passiert.{" "}
            <Link href="/#fahrzeuge">Jetzt Fahrzeug auswählen →</Link>
          </p>
        ) : (
          <>
            <ul className="recent-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <div className="cell-stack">
                    <strong>{e.label}</strong>
                    <span className="muted">{formatDate(e.date)}</span>
                  </div>
                  <span className={`status status-${e.status}`}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/konto/anfragen" className="btn-secondary btn-link">
              Alle Anfragen ansehen
            </Link>
          </>
        )}
      </div>

      <div className="card">
        <h2>Fragen?</h2>
        <p className="step-intro">
          Rufen Sie uns an oder schreiben Sie kurz, wir melden uns zeitnah.
        </p>
        <div className="abo-contact">
          <a href="tel:+491639574116" className="btn-secondary btn-link">
            0163 9574116
          </a>
          <a
            href="mailto:info@zeki-rent.com"
            className="btn-secondary btn-link"
          >
            info@zeki-rent.com
          </a>
        </div>
      </div>
    </div>
  );
}
