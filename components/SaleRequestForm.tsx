"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEuro, saleTitle, VAT_LABEL, type SaleVehicle } from "@/lib/types";

export default function SaleRequestForm({ vehicle }: { vehicle: SaleVehicle }) {
  const [financing, setFinancing] = useState(false);
  const [tradeIn, setTradeIn] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="booking-success">
        <h3>Anfrage eingegangen ✓</h3>
        <p>
          Vielen Dank für Ihr Interesse am {saleTitle(vehicle)}. Wir melden uns
          mit allen Details und stimmen bei Bedarf einen Termin für die
          Probefahrt ab. Den Status sehen Sie unter{" "}
          <Link href="/konto">Mein Konto</Link>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/kauf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sale_vehicle_id: vehicle.id,
        financing,
        trade_in: tradeIn,
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
        <label className="field-label">Interessiert Sie zusätzlich?</label>
        <div className="choice-pills">
          <button
            type="button"
            className={`pill ${financing ? "pill-active" : ""}`}
            aria-pressed={financing}
            onClick={() => setFinancing((v) => !v)}
          >
            Finanzierung
          </button>
          <button
            type="button"
            className={`pill ${tradeIn ? "pill-active" : ""}`}
            aria-pressed={tradeIn}
            onClick={() => setTradeIn((v) => !v)}
          >
            Inzahlungnahme
          </button>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sale-note">
          Ihre Nachricht <span className="hint">optional</span>
        </label>
        <textarea
          id="sale-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Wunschtermin für die Probefahrt, Fragen zur Historie, Ihr Fahrzeug für die Inzahlungnahme …"
        />
      </div>

      {vehicle.price !== null && !vehicle.price_on_request ? (
        <p className="booking-total">
          Kaufpreis: <strong>{formatEuro(vehicle.price)}</strong>
          {vehicle.vat_note && <span> {VAT_LABEL[vehicle.vat_note]}</span>}
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
        Die Anfrage ist unverbindlich. Der Kaufvertrag kommt erst nach
        beiderseitiger Unterschrift zustande.
      </p>
    </form>
  );
}
