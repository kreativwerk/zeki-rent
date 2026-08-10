"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface VehicleOption {
  id: string;
  name: string;
  active: boolean;
}

export interface CustomerOption {
  id: string;
  label: string;
}

export interface AssignmentPrefill {
  vehicle_id?: string | null;
  user_id?: string | null;
  booking_id?: string | null;
  request_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  note?: string | null;
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const DURATION_SHORTCUTS = [1, 3, 6, 12, 24];

export default function AssignmentForm({
  vehicles,
  customers,
  prefill,
}: {
  vehicles: VehicleOption[];
  customers: CustomerOption[];
  prefill: AssignmentPrefill;
}) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(prefill.vehicle_id ?? "");
  const [userId, setUserId] = useState(prefill.user_id ?? "");
  const [start, setStart] = useState(prefill.start_date ?? "");
  const [end, setEnd] = useState(prefill.end_date ?? "");
  const [note, setNote] = useState(prefill.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const invalidPeriod = useMemo(
    () => Boolean(start && end && end < start),
    [start, end]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vehicleId || !userId || !start || !end) {
      setError("Bitte Fahrzeug, Kunde und Zeitraum angeben.");
      return;
    }
    if (end < start) {
      setError("Das Enddatum liegt vor dem Startdatum.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    // Doppelbelegung pruefen: Ueberschneidung im selben Fahrzeug
    const { data: clashes } = await supabase
      .from("assignments")
      .select("id, start_date, end_date")
      .eq("vehicle_id", vehicleId)
      .neq("status", "storniert")
      .lte("start_date", end)
      .gte("end_date", start);

    if (clashes && clashes.length > 0 && !conflict) {
      const list = clashes
        .map((c) => `${c.start_date} bis ${c.end_date}`)
        .join(", ");
      setConflict(list);
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from("assignments").insert({
      vehicle_id: vehicleId,
      user_id: userId,
      booking_id: prefill.booking_id ?? null,
      request_id: prefill.request_id ?? null,
      start_date: start,
      end_date: end,
      note: note.trim() || null,
    });

    if (dbError) {
      console.error(dbError);
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      setSaving(false);
      return;
    }

    // Zugehoerige Anfrage als bearbeitet markieren
    if (prefill.booking_id) {
      await supabase
        .from("bookings")
        .update({ status: "bestätigt" })
        .eq("id", prefill.booking_id);
    }
    if (prefill.request_id) {
      await supabase
        .from("general_requests")
        .update({ status: "in_bearbeitung" })
        .eq("id", prefill.request_id);
    }

    router.push("/admin/buchungen");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="field">
        <label className="field-label" htmlFor="a-vehicle">
          Fahrzeug
        </label>
        <select
          id="a-vehicle"
          value={vehicleId}
          onChange={(e) => {
            setVehicleId(e.target.value);
            setConflict(null);
          }}
          required
        >
          <option value="">Bitte wählen …</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
              {v.active ? "" : " (versteckt)"}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="a-customer">
          Kunde
        </label>
        <select
          id="a-customer"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        >
          <option value="">Bitte wählen …</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="a-start">
            Von
          </label>
          <input
            id="a-start"
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setConflict(null);
            }}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="a-end">
            Bis
          </label>
          <input
            id="a-end"
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => {
              setEnd(e.target.value);
              setConflict(null);
            }}
            required
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label">Laufzeit übernehmen</span>
        <div className="choice-pills">
          {DURATION_SHORTCUTS.map((m) => (
            <button
              key={m}
              type="button"
              className="pill"
              disabled={!start}
              onClick={() => {
                setEnd(addMonths(start, m));
                setConflict(null);
              }}
            >
              {m} {m === 1 ? "Monat" : "Monate"}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="a-note">
          Notiz <span className="hint">optional, nur intern</span>
        </label>
        <textarea
          id="a-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Übergabe 8 Uhr am Hof, Winterreifen montiert"
        />
      </div>

      {invalidPeriod && (
        <p className="error-text">Das Enddatum liegt vor dem Startdatum.</p>
      )}
      {conflict && (
        <p className="error-text">
          Achtung: Dieses Fahrzeug ist im Zeitraum bereits belegt ({conflict}).
          Zum Speichern erneut auf „Einplanen“ tippen.
        </p>
      )}
      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary btn-block" disabled={saving}>
        {saving ? "Wird gespeichert …" : conflict ? "Trotzdem einplanen" : "Einplanen"}
      </button>
    </form>
  );
}
