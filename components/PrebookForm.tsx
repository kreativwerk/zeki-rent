"use client";

import { useState } from "react";
import Link from "next/link";

export default function PrebookForm({
  alreadyListed,
}: {
  alreadyListed: boolean;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyListed);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="booking-success">
        <h3>Sie stehen auf der Liste ✓</h3>
        <p>
          Sobald der Togg T10X verfügbar ist, melden wir uns als Erstes bei
          Ihnen. Den Status sehen Sie jederzeit unter{" "}
          <Link href="/konto">Mein Konto</Link>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/prebookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() || null }),
    }).catch(() => null);
    if (!res?.ok) {
      setError("Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.");
      setSubmitting(false);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="pb-note">
          Anmerkung <span className="hint">optional</span>
        </label>
        <textarea
          id="pb-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. gewünschter Zeitraum, Fragen zum Fahrzeug …"
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button
        type="submit"
        className="btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Wird eingetragen …" : "Unverbindlich vormerken"}
      </button>
      <p className="fine-print">
        Die Vormerkung ist kostenlos und unverbindlich. Wir informieren Sie,
        sobald der Togg T10X verfügbar ist.
      </p>
    </form>
  );
}
