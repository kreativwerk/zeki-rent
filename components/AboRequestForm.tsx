"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ABO_TERMS,
  aboPriceFor,
  formatEuro,
  type CatalogVehicle,
} from "@/lib/types";

const KM_OPTIONS = [
  "bis 10.000 km",
  "bis 15.000 km",
  "bis 20.000 km",
  "bis 30.000 km",
  "mehr / individuell",
];

const START_OPTIONS = ["Sofort", "In 1 Monat", "In 2-3 Monaten", "Flexibel"];
const HANDOVER_OPTIONS = ["Abholung", "Lieferung"];

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="choice-pills">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`pill ${value === o ? "pill-active" : ""}`}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function AboRequestForm({
  vehicle,
  service,
}: {
  vehicle: CatalogVehicle;
  service: "abo" | "miete";
}) {
  const [term, setTerm] = useState<number>(12);
  const [km, setKm] = useState(KM_OPTIONS[1]);
  const [start, setStart] = useState(START_OPTIONS[0]);
  const [handover, setHandover] = useState(HANDOVER_OPTIONS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = aboPriceFor(vehicle, term);

  if (done) {
    return (
      <div className="booking-success">
        <h3>Anfrage eingegangen ✓</h3>
        <p>
          Vielen Dank! Wir prüfen die Verfügbarkeit und melden uns mit Ihrem
          Angebot. Den Status sehen Sie jederzeit unter{" "}
          <Link href="/konto">Mein Konto</Link>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/abo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalog_vehicle_id: vehicle.id,
        service,
        term_months: term,
        km_per_year: km,
        start_from: start,
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
          {ABO_TERMS.map((m) => {
            const p = aboPriceFor(vehicle, m);
            return (
              <button
                key={m}
                type="button"
                className={`pill ${term === m ? "pill-active" : ""}`}
                onClick={() => setTerm(m)}
              >
                {m} Monate
                {p !== null && <span>{formatEuro(p)}/M.</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Kilometer pro Jahr</label>
        <PillGroup options={KM_OPTIONS} value={km} onChange={setKm} />
      </div>

      <div className="field">
        <label className="field-label">Ab wann</label>
        <PillGroup options={START_OPTIONS} value={start} onChange={setStart} />
      </div>

      <div className="field">
        <label className="field-label">Abholung oder Lieferung?</label>
        <PillGroup
          options={HANDOVER_OPTIONS}
          value={handover}
          onChange={setHandover}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="abo-note">
          Anmerkung <span className="hint">optional</span>
        </label>
        <textarea
          id="abo-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Farbwunsch, Anhängerkupplung, Fragen …"
        />
      </div>

      {price !== null ? (
        <p className="booking-total">
          Monatsrate: <strong>{formatEuro(price)}</strong>
          <span> alles inklusive außer Kraftstoff und Strom</span>
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
        Die Anfrage ist unverbindlich. Der Vertrag kommt erst nach unserer
        Bestätigung zustande.
      </p>
    </form>
  );
}
