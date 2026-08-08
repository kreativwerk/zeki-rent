"use client";

import { useState } from "react";
import Link from "next/link";

export default function RequestForm() {
  const [vehicleWish, setVehicleWish] = useState("");
  const [period, setPeriod] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="booking-success">
        <h3>Anfrage eingegangen ✓</h3>
        <p>
          Vielen Dank! Wir prüfen unser Partnernetzwerk und melden uns
          schnellstmöglich mit einem Angebot. Den Status sehen Sie jederzeit
          unter <Link href="/konto">Mein Konto</Link>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_wish: vehicleWish.trim(),
        period: period.trim() || null,
        note: note.trim() || null,
      }),
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
        <label className="field-label" htmlFor="gr-wish">
          Welches Fahrzeug suchen Sie?
        </label>
        <input
          id="gr-wish"
          type="text"
          value={vehicleWish}
          onChange={(e) => setVehicleWish(e.target.value)}
          placeholder="z. B. Kühltransporter, 7,5-Tonner, Kleinwagen …"
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="gr-period">
          Gewünschter Zeitraum <span className="hint">optional</span>
        </label>
        <input
          id="gr-period"
          type="text"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="z. B. ab September für 6 Monate"
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="gr-note">
          Anmerkung <span className="hint">optional</span>
        </label>
        <textarea
          id="gr-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Ausstattung, Budget, Einsatzzweck …"
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button
        type="submit"
        className="btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Wird gesendet …" : "Anfrage senden"}
      </button>
      <p className="fine-print">
        Die Anfrage ist unverbindlich. Wir melden uns mit einem Angebot aus
        unserem Partnernetzwerk.
      </p>
    </form>
  );
}
