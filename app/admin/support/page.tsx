import { createClient } from "@/lib/supabase/server";
import SupportForm from "@/components/admin/SupportForm";

interface Ticket {
  id: string;
  created_by_email: string;
  subject: string;
  message: string;
  status: "offen" | "in_bearbeitung" | "erledigt";
  agent_response: string | null;
  attachments: string[] | null;
  created_at: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  const tickets = (data ?? []) as Ticket[];
  const open = tickets.filter((t) => t.status !== "erledigt").length;

  // Der Bucket ist nicht oeffentlich, Anhaenge brauchen kurzlebige Links
  const paths = tickets.flatMap((t) => t.attachments ?? []);
  const links: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("ticket-attachments")
      .createSignedUrls(paths, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) links[s.path] = s.signedUrl;
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Support</h1>
        <p>
          {tickets.length} Tickets · {open} offen
        </p>
      </div>

      <SupportForm />

      {tickets.length > 0 && (
        <div className="ticket-list">
          {tickets.map((t) => (
            <div key={t.id} className="card ticket">
              <div className="ticket-head">
                <h3>{t.subject}</h3>
                <span className={`status ticket-${t.status}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
              <p className="muted">
                {formatDateTime(t.created_at)} · {t.created_by_email}
              </p>
              <p className="ticket-message">{t.message}</p>
              {(t.attachments?.length ?? 0) > 0 && (
                <div className="attachment-grid">
                  {t.attachments!.map((p) =>
                    links[p] ? (
                      <a
                        key={p}
                        href={links[p]}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={links[p]} alt="Anhang zum Ticket" />
                      </a>
                    ) : (
                      <span key={p} className="attachment">
                        <span className="muted">Bild nicht verfügbar</span>
                      </span>
                    )
                  )}
                </div>
              )}
              {t.agent_response && (
                <div className="ticket-response">
                  <strong>Antwort</strong>
                  <p>{t.agent_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
