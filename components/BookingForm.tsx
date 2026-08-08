"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DURATIONS,
  KM_PACKAGES,
  formatEuro,
  priceFor,
  type Vehicle,
} from "@/lib/types";

export default function BookingForm({
  vehicle,
  loggedIn,
}: {
  vehicle: Vehicle;
  loggedIn: boolean;
}) {
  const [duration, setDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [kmPackage, setKmPackage] = useState(KM_PACKAGES[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = priceFor(vehicle, duration);
  const today = new Date().toISOString().slice(0, 10);

  if (!loggedIn) {
    return (
      <div className="booking-login-hint">
        <p>
          Zum Buchen benötigen Sie ein Kundenkonto. So können Sie Ihre
          Anfragen jederzeit einsehen.
        </p>
        <Link
          href={`/login?next=/fahrzeuge/${vehicle.id}`}
          className="btn-primary btn-link btn-block"
        >
          Anmelden
        </Link>
        <Link
          href={`/registrieren?next=/fahrzeuge/${vehicle.id}`}
          className="btn-secondary btn-link btn-block"
        >
          Konto erstellen
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="booking-success">
        <h3>Anfrage eingegangen ✓</h3>
        <p>
          Vielen Dank! Wir prüfen die Verfügbarkeit und melden uns
          schnellstmöglich bei Ihnen. Den Status sehen Sie jederzeit unter{" "}
          <Link href="/konto">Mein Konto</Link>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError("Bitte wählen Sie ein Startdatum.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: vehicle.id,
        start_date: startDate,
        duration_months: duration,
        km_package: kmPackage,
        note: note.trim() || null,
      }),
    }).catch(() => null);
    if (!res?.ok) {
      setError(
        res?.status === 401
          ? "Bitte melden Sie sich erneut an."
          : "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut."
      );
      setSubmitting(false);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="field-label">Laufzeit</label>
        <div className="duration-pills">
          {DURATIONS.map((m) => {
            const p = priceFor(vehicle, m);
            if (p === null) return null;
            return (
              <button
                key={m}
                type="button"
                className={`pill ${duration === m ? "pill-active" : ""}`}
                onClick={() => setDuration(m)}
              >
                {m} {m === 1 ? "Monat" : "Monate"}
                <span>{formatEuro(p)}/M.</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="start">
          Gewünschter Start
        </label>
        <input
          id="start"
          type="date"
          min={today}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="km">
          Kilometerpaket
        </label>
        <select
          id="km"
          value={kmPackage}
          onChange={(e) => setKmPackage(e.target.value)}
        >
          {KM_PACKAGES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="note">
          Anmerkung <span className="hint">optional</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Lieferung gewünscht, Fragen …"
        />
      </div>

      {price !== null && (
        <p className="booking-total">
          Monatsrate: <strong>{formatEuro(price)}</strong>
          <span> zzgl. Kilometerpaket</span>
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      <button
        type="submit"
        className="btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Wird gesendet …" : "Unverbindlich anfragen"}
      </button>
      <p className="fine-print">
        Die Anfrage ist unverbindlich. Der Mietvertrag kommt erst nach unserer
        Bestätigung zustande.
      </p>
    </form>
  );
}
