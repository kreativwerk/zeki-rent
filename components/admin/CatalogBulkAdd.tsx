"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Schnelles Erfassen mehrerer Modelle aus einer Modellpalette. Eine Zeile
 * pro Fahrzeug, Felder mit Semikolon getrennt:
 * Modell; Segment; Antrieb; Leistung; Länge; Reichweite oder Verbrauch; Listenpreis
 */
export default function CatalogBulkAdd({
  catalogId,
  brand,
  serviceType,
  startOrder,
}: {
  catalogId: string;
  brand: string;
  serviceType: string;
  startOrder: number;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const rows = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line, i) => {
        const [model, segment, drivetrain, power, length, range_text, price] =
          line.split(";").map((p) => p.trim());
        const listPrice = Number(
          (price ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")
        );
        return {
          catalog_id: catalogId,
          brand,
          model,
          segment: segment || null,
          drivetrain: drivetrain || null,
          power: power || null,
          length: length || null,
          range_text: range_text || null,
          list_price: Number.isFinite(listPrice) && listPrice > 0 ? listPrice : null,
          service_type: serviceType,
          sort_order: startOrder + (i + 1) * 10,
        };
      })
      .filter((r) => r.model);

    if (rows.length === 0) {
      setError("Bitte mindestens eine Zeile mit einem Modellnamen eingeben.");
      return;
    }

    setSaving(true);
    const { error: dbError } = await createClient()
      .from("catalog_vehicles")
      .insert(rows);
    if (dbError) {
      console.error(dbError);
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      setSaving(false);
      return;
    }
    setText("");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Modelle hinzufügen</h2>
      <p className="step-intro">
        Eine Zeile pro Fahrzeug, Felder mit Semikolon getrennt. Nur das Modell
        ist Pflicht, alles Weitere können Sie später ergänzen.
      </p>
      <p className="fine-print">
        Modell; Segment; Antrieb; Leistung; Länge; Reichweite oder Verbrauch;
        Listenpreis
      </p>
      <div className="field">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: "8rem", fontFamily: "ui-monospace, monospace" }}
          placeholder={"EV3; Kompakt-SUV; Elektro; 204 PS; 4,30 m; bis 605 km WLTP; 35990\nEV6; Crossover; Elektro; 170-325 PS; 4,70 m; bis 582 km WLTP; 44990"}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Wird gespeichert …" : "Modelle anlegen"}
      </button>
    </form>
  );
}
