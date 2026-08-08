"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MODELS = ["Togg T10X", "Togg T10F"];

export default function PrebookForm({
  listedModels,
}: {
  listedModels: string[];
}) {
  const router = useRouter();
  const available = MODELS.filter((m) => !listedModels.includes(m));
  const [model, setModel] = useState(available[0] ?? MODELS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(available.length === 0);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="booking-success">
        <h3>Sie stehen auf der Liste ✓</h3>
        <p>
          Sobald das Fahrzeug verfügbar ist, melden wir uns als Erstes bei
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
      body: JSON.stringify({ model, note: note.trim() || null }),
    }).catch(() => null);
    if (!res?.ok) {
      setError("Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.");
      setSubmitting(false);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="field-label">Modell</label>
        <div className="duration-pills">
          {MODELS.map((m) => {
            const already = listedModels.includes(m);
            return (
              <button
                key={m}
                type="button"
                disabled={already}
                className={`pill ${model === m ? "pill-active" : ""}`}
                onClick={() => setModel(m)}
              >
                {m.replace("Togg ", "")}
                <span>{already ? "vorgemerkt ✓" : m === "Togg T10X" ? "SUV" : "Limousine"}</span>
              </button>
            );
          })}
        </div>
      </div>

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
        sobald das Fahrzeug verfügbar ist.
      </p>
    </form>
  );
}
