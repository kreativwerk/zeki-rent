"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";

export default function SupportForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(paths: string[]) {
    setAttachments((a) => [...a, ...paths]);
    // Vorschau ueber kurzlebige Links, der Bucket ist nicht oeffentlich
    const supabase = createClient();
    const next: Record<string, string> = {};
    for (const p of paths) {
      const { data } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(p, 3600);
      if (data?.signedUrl) next[p] = data.signedUrl;
    }
    setPreviews((prev) => ({ ...prev, ...next }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { error: dbError } = await supabase.from("support_tickets").insert({
      created_by_email: auth.user?.email ?? "unbekannt",
      subject: subject.trim(),
      message: message.trim(),
      attachments,
    });
    if (dbError) {
      setError("Senden fehlgeschlagen. Bitte erneut versuchen.");
      setSubmitting(false);
      return;
    }
    setSubject("");
    setMessage("");
    setAttachments([]);
    setPreviews({});
    setSubmitting(false);
    setSent(true);
    router.refresh();
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Neues Ticket</h2>
      <p className="step-intro">
        Beschreiben Sie Ihr Anliegen: Änderungswunsch, Fehler oder Frage. Die
        Tickets werden automatisiert bearbeitet.
      </p>
      <div className="field">
        <label className="field-label" htmlFor="t-subject">
          Betreff
        </label>
        <input
          id="t-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="z. B. Preis beim Sprinter ändern"
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="t-message">
          Nachricht
        </label>
        <textarea
          id="t-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Beschreiben Sie so konkret wie möglich, was geändert oder geklärt werden soll …"
          required
          style={{ minHeight: "8rem" }}
        />
      </div>

      <div className="field">
        <label className="field-label">
          Bilder <span className="hint">optional, z. B. Screenshot oder Foto</span>
        </label>
        <ImageUpload
          bucket="ticket-attachments"
          folder="tickets"
          multiple
          label="Bilder auswählen"
          onUploaded={addFiles}
        />
        {attachments.length > 0 && (
          <div className="attachment-grid">
            {attachments.map((p) => (
              <div key={p} className="attachment">
                {previews[p] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[p]} alt="Angehängtes Bild" />
                ) : (
                  <span className="muted">Bild</span>
                )}
                <button
                  type="button"
                  className="attachment-remove"
                  aria-label="Bild aus dem Ticket nehmen"
                  onClick={() =>
                    setAttachments((a) => a.filter((x) => x !== p))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {sent && (
        <p className="success-text">
          Ticket erstellt. Es erscheint unten in der Liste.
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Wird gesendet …" : "Ticket absenden"}
      </button>
    </form>
  );
}
