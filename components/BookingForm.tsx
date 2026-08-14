"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DURATIONS,
  formatEuro,
  kmLabel,
  kmPackages,
  priceFor,
  priceForKm,
  type Vehicle,
} from "@/lib/types";

export default function BookingForm({
  vehicle,
  loggedIn,
}: {
  vehicle: Vehicle;
  loggedIn: boolean;
}) {
  const packages = kmPackages(vehicle);
  const [duration, setDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [km, setKm] = useState<number>(packages[0].km);
  const [handover, setHandover] = useState("Abholung");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = priceForKm(vehicle, duration, km);
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
        km_per_month: km,
        km_package: kmLabel(km),
        handover,
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
            // Ohne Preisangabe alle Laufzeiten anbieten, sonst nur die mit Rate
            if (p === null && !vehicle.price_on_request) return null;
            return (
              <button
                key={m}
                type="button"
                className={`pill ${duration === m ? "pill-active" : ""}`}
                onClick={() => setDuration(m)}
              >
                {m} {m === 1 ? "Monat" : "Monate"}
                {p !== null && <span>{formatEuro(p)}/M.</span>}
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
        <label className="field-label">Kilometerpaket</label>
        <div className="duration-pills">
          {packages.map((p) => {
            const base = priceFor(vehicle, duration);
            return (
              <button
                key={p.km}
                type="button"
                className={`pill ${km === p.km ? "pill-active" : ""}`}
                aria-pressed={km === p.km}
                onClick={() => setKm(p.km)}
              >
                {new Intl.NumberFormat("de-DE").format(p.km)} km
                {base !== null && (
                  <span>
                    {p.surcharge > 0
                      ? `+${formatEuro(p.surcharge)}/M.`
                      : "inklusive"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Abholung oder Lieferung?</label>
        <div className="choice-pills">
          {["Abholung", "Lieferung"].map((o) => (
            <button
              key={o}
              type="button"
              className={`pill ${handover === o ? "pill-active" : ""}`}
              onClick={() => setHandover(o)}
            >
              {o}
            </button>
          ))}
        </div>
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

      {price !== null ? (
        <p className="booking-total">
          Monatsrate: <strong>{formatEuro(price)}</strong>
          <span>
            {kmLabel(km)} inklusive, {duration}{" "}
            {duration === 1 ? "Monat" : "Monate"} Laufzeit
          </span>
        </p>
      ) : (
        <p className="booking-total">
          <strong>Preis auf Anfrage</strong>
          <span> Wir melden uns mit Ihrem persönlichen Angebot</span>
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
