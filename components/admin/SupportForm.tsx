"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SupportForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    });
    if (dbError) {
      setError("Senden fehlgeschlagen. Bitte erneut versuchen.");
      setSubmitting(false);
      return;
    }
    setSubject("");
    setMessage("");
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
