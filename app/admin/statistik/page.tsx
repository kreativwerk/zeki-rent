import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface DayRow {
  day: string;
  views: number;
  sessions: number;
}

interface Stats {
  days: number;
  views: number;
  views_prev: number;
  sessions: number;
  sessions_prev: number;
  views_total: number;
  customers: number;
  customers_new: number;
  bookings: number;
  bookings_new: number;
  requests: number;
  requests_new: number;
  prebookings: number;
  prebookings_new: number;
  assignments_active: number;
  by_day: DayRow[];
  top_paths: { path: string; views: number; sessions: number }[];
  devices: { device: string; views: number }[];
  referrers: { source: string; views: number }[];
}

const RANGES = [7, 30, 90] as const;

function trend(now: number, before: number): { label: string; up: boolean } | null {
  if (before === 0) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return null;
  // Geschuetztes Leerzeichen, damit "+18 %" nicht umbricht
  return { label: `${pct > 0 ? "+" : ""}${pct} %`, up: pct > 0 };
}

function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function Kpi({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: number | string;
  hint?: string;
  delta?: { label: string; up: boolean } | null;
}) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-hint">
        {delta ? (
          <>
            <span className={delta.up ? "stat-up" : "stat-down"}>
              {delta.label}
            </span>{" "}
            zum Vorzeitraum
          </>
        ) : (
          hint
        )}
      </span>
    </div>
  );
}

export default async function AdminStatsPage(props: {
  searchParams: Promise<{ tage?: string }>;
}) {
  const params = await props.searchParams;
  const parsed = Number(params.tage);
  const days = RANGES.includes(parsed as (typeof RANGES)[number]) ? parsed : 30;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("site_stats", { days });

  if (error || !data) {
    return (
      <>
        <div className="admin-page-header">
          <h1>Statistik</h1>
        </div>
        <div className="card">
          <p className="empty-state">
            Die Kennzahlen konnten nicht geladen werden. Bitte Seite neu laden.
          </p>
        </div>
      </>
    );
  }

  const s = data as Stats;
  const maxViews = Math.max(1, ...s.by_day.map((d) => d.views));
  const totalDeviceViews = Math.max(
    1,
    s.devices.reduce((sum, d) => sum + Number(d.views), 0)
  );
  const anfragenGesamt = s.bookings_new + s.requests_new;
  const conversion =
    s.sessions > 0 ? ((anfragenGesamt / s.sessions) * 100).toFixed(1) : "0,0";

  return (
    <>
      <div className="admin-page-header">
        <h1>Statistik</h1>
        <div className="range-pills">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/statistik?tage=${r}`}
              className={`pill ${r === days ? "pill-active" : ""}`}
            >
              {r} Tage
            </Link>
          ))}
        </div>
      </div>

      <h2 className="admin-section-title">Reichweite</h2>
      <div className="stat-grid">
        <Kpi
          label="Seitenaufrufe"
          value={s.views}
          hint={`letzte ${days} Tage`}
          delta={trend(s.views, s.views_prev)}
        />
        <Kpi
          label="Besuche"
          value={s.sessions}
          hint={`letzte ${days} Tage`}
          delta={trend(s.sessions, s.sessions_prev)}
        />
        <Kpi
          label="Seiten pro Besuch"
          value={s.sessions > 0 ? (s.views / s.sessions).toFixed(1) : "0,0"}
          hint="Durchschnitt"
        />
        <Kpi
          label="Anfragequote"
          value={`${conversion} %`}
          hint="Anfragen je Besuch"
        />
      </div>

      <h2 className="admin-section-title">Verlauf</h2>
      <div className="card">
        {s.views === 0 ? (
          <p className="empty-state">
            Noch keine Aufrufe gemessen. Die Zählung startet mit dem nächsten
            Besuch auf der Website.
          </p>
        ) : (
          <>
            <div className="chart">
              {s.by_day.map((d) => (
                <div key={d.day} className="chart-col">
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max(2, (Number(d.views) / maxViews) * 100)}%`,
                      }}
                      title={`${shortDay(d.day)}: ${d.views} Aufrufe, ${d.sessions} Besuche`}
                    />
                  </div>
                  <span className="chart-label">{shortDay(d.day)}</span>
                </div>
              ))}
            </div>
            <p className="chart-caption">
              <span>{shortDay(s.by_day[0]?.day ?? "")}</span>
              <span>Spitzenwert {maxViews} Aufrufe</span>
              <span>{shortDay(s.by_day[s.by_day.length - 1]?.day ?? "")}</span>
            </p>
          </>
        )}
      </div>

      <h2 className="admin-section-title">Geschäft</h2>
      <div className="stat-grid">
        <Kpi
          label="Kunden"
          value={s.customers}
          hint={`${s.customers_new} neu in ${days} Tagen`}
        />
        <Kpi
          label="Fahrzeuganfragen"
          value={s.bookings}
          hint={`${s.bookings_new} neu in ${days} Tagen`}
        />
        <Kpi
          label="Wunschfahrzeuge"
          value={s.requests}
          hint={`${s.requests_new} neu in ${days} Tagen`}
        />
        <Kpi
          label="Vormerkungen"
          value={s.prebookings}
          hint={`${s.prebookings_new} neu in ${days} Tagen`}
        />
        <Kpi
          label="Aktuell vermietet"
          value={s.assignments_active}
          hint="laufende Einplanungen"
        />
        <Kpi
          label="Aufrufe insgesamt"
          value={s.views_total}
          hint="seit Beginn der Messung"
        />
      </div>

      <h2 className="admin-section-title">Meistbesuchte Seiten</h2>
      {s.top_paths.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine Daten.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="rank-list">
            {s.top_paths.map((p) => (
              <li key={p.path}>
                <span className="rank-name">{p.path}</span>
                <span className="rank-value">
                  {p.views}
                  <span className="muted"> Aufrufe</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="stat-two-col">
        <div>
          <h2 className="admin-section-title">Geräte</h2>
          <div className="card">
            {s.devices.length === 0 ? (
              <p className="empty-state">Noch keine Daten.</p>
            ) : (
              <ul className="rank-list">
                {s.devices.map((d) => (
                  <li key={d.device}>
                    <span className="rank-name">{d.device}</span>
                    <span className="rank-value">
                      {Math.round((Number(d.views) / totalDeviceViews) * 100)} %
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="admin-section-title">Herkunft</h2>
          <div className="card">
            {s.referrers.length === 0 ? (
              <p className="empty-state">Noch keine Daten.</p>
            ) : (
              <ul className="rank-list">
                {s.referrers.map((r) => (
                  <li key={r.source}>
                    <span className="rank-name">{r.source}</span>
                    <span className="rank-value">{r.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="fine-print">
        Die Messung läuft ohne Cookies und ohne IP-Speicherung. Besuche werden
        über eine Zufalls-ID gezählt, die beim Schließen des Browsertabs
        verfällt. Aufrufe im Adminbereich zählen nicht mit.
      </p>
    </>
  );
}
