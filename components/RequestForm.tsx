"use client";

import { useState } from "react";
import Link from "next/link";

const LARGE_SIZES = [
  { code: "L1H1", hint: "kurz, flach" },
  { code: "L1H2", hint: "kurz, hoch" },
  { code: "L2H1", hint: "mittel, flach" },
  { code: "L2H2", hint: "mittel, hoch" },
  { code: "L2H3", hint: "mittel, superhoch" },
  { code: "L3H2", hint: "lang, hoch" },
  { code: "L3H3", hint: "lang, superhoch" },
  { code: "L4H3", hint: "extralang, superhoch" },
];

const KM_OPTIONS = [
  "bis 1.000 km",
  "bis 2.000 km",
  "bis 3.000 km",
  "bis 5.000 km",
  "über 5.000 km",
];
const FUEL_OPTIONS = ["Diesel", "Elektro", "Egal"];
const START_OPTIONS = ["Sofort", "In 1 Monat", "In 2–3 Monaten", "Flexibel"];
const HANDOVER_OPTIONS = ["Abholung", "Lieferung"];

function Stepper({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className={`stepper ${value > 0 ? "stepper-active" : ""}`}>
      <div className="stepper-label">
        <strong>{label}</strong>
        {hint && <span>{hint}</span>}
      </div>
      <div className="stepper-controls">
        <button
          type="button"
          aria-label={`${label} verringern`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button
          type="button"
          aria-label={`${label} erhöhen`}
          onClick={() => onChange(Math.min(20, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function PillGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="choice-pills">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`pill ${value === o ? "pill-active" : ""}`}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RequestForm() {
  const [largeVans, setLargeVans] = useState<Record<string, number>>({});
  const [smallVans, setSmallVans] = useState(0);
  const [km, setKm] = useState(KM_OPTIONS[1]);
  const [fuel, setFuel] = useState(FUEL_OPTIONS[2]);
  const [startFrom, setStartFrom] = useState(START_OPTIONS[0]);
  const [handover, setHandover] = useState(HANDOVER_OPTIONS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalVehicles =
    smallVans + Object.values(largeVans).reduce((sum, n) => sum + n, 0);

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
    if (totalVehicles === 0) {
      setError("Bitte wählen Sie mindestens ein Fahrzeug aus.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        large_vans: Object.fromEntries(
          Object.entries(largeVans).filter(([, n]) => n > 0)
        ),
        small_vans: smallVans,
        km_per_month: km,
        fuel_type: fuel,
        start_from: startFrom,
        handover,
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
        <label className="field-label">
          Große Transporter
          <span className="hint">Größe wählen und Anzahl einstellen</span>
        </label>
        <div className="stepper-list">
          {LARGE_SIZES.map((s) => (
            <Stepper
              key={s.code}
              label={s.code}
              hint={s.hint}
              value={largeVans[s.code] ?? 0}
              onChange={(n) =>
                setLargeVans((prev) => ({ ...prev, [s.code]: n }))
              }
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">
          Kleine Transporter
          <span className="hint">Vito-Größe, z. B. Vito oder Transporter</span>
        </label>
        <div className="stepper-list">
          <Stepper
            label="Kleintransporter"
            hint="bis ca. 6 m³"
            value={smallVans}
            onChange={setSmallVans}
          />
        </div>
      </div>

      <PillGroup
        label="Kilometer pro Monat"
        options={KM_OPTIONS}
        value={km}
        onChange={setKm}
      />
      <PillGroup
        label="Antrieb"
        options={FUEL_OPTIONS}
        value={fuel}
        onChange={setFuel}
      />
      <PillGroup
        label="Ab wann benötigt?"
        options={START_OPTIONS}
        value={startFrom}
        onChange={setStartFrom}
      />
      <PillGroup
        label="Abholung oder Lieferung?"
        options={HANDOVER_OPTIONS}
        value={handover}
        onChange={setHandover}
      />

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

      {totalVehicles > 0 && (
        <p className="booking-total">
          Ausgewählt: <strong>{totalVehicles}</strong>
          <span> {totalVehicles === 1 ? "Fahrzeug" : "Fahrzeuge"}</span>
        </p>
      )}
      {error && <p className="error-text">{error}</p>}

      <button
        type="submit"
        className="btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Wird gesendet …" : "Anfrage senden"}
      </button>
      <p className="fine-print">
        Unverbindlich und kostenfrei. Wir melden uns mit einem Angebot aus
        unserem Partnernetzwerk.
      </p>
    </form>
  );
}
