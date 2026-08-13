"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import { formatEuro, type CatalogVehicle } from "@/lib/types";

function num(v: string): number | null {
  const n = Number(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const SERVICES = [
  { v: "abo", l: "Auto-Abo" },
  { v: "miete", l: "Miete" },
  { v: "beides", l: "Beides" },
];

export default function CatalogVehicleForm({ vehicle }: { vehicle: CatalogVehicle }) {
  const router = useRouter();
  const [f, setF] = useState({
    brand: vehicle.brand,
    model: vehicle.model,
    segment: vehicle.segment ?? "",
    drivetrain: vehicle.drivetrain ?? "",
    power: vehicle.power ?? "",
    length: vehicle.length ?? "",
    range_text: vehicle.range_text ?? "",
    seats: vehicle.seats?.toString() ?? "",
    highlights: vehicle.highlights ?? "",
    notes: vehicle.notes ?? "",
    list_price: vehicle.list_price?.toString() ?? "",
    service_type: vehicle.service_type as string,
    price_6m: vehicle.price_6m?.toString() ?? "",
    price_12m: vehicle.price_12m?.toString() ?? "",
    price_18m: vehicle.price_18m?.toString() ?? "",
    price_24m: vehicle.price_24m?.toString() ?? "",
    price_on_request: vehicle.price_on_request,
    photo_url: vehicle.photo_url ?? "",
    active: vehicle.active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  const hasRate =
    num(f.price_6m) !== null ||
    num(f.price_12m) !== null ||
    num(f.price_18m) !== null ||
    num(f.price_24m) !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (f.active && !f.price_on_request && !hasRate) {
      setError(
        "Zum Freischalten bitte mindestens eine Rate eintragen oder „Preis auf Anfrage“ setzen."
      );
      return;
    }
    setSaving(true);
    const seats = Number(f.seats);
    const { error: dbError } = await createClient()
      .from("catalog_vehicles")
      .update({
        brand: f.brand.trim(),
        model: f.model.trim(),
        segment: f.segment.trim() || null,
        drivetrain: f.drivetrain.trim() || null,
        power: f.power.trim() || null,
        length: f.length.trim() || null,
        range_text: f.range_text.trim() || null,
        seats: Number.isFinite(seats) && seats > 0 ? Math.round(seats) : null,
        highlights: f.highlights.trim() || null,
        notes: f.notes.trim() || null,
        list_price: num(f.list_price),
        service_type: f.service_type,
        price_6m: num(f.price_6m),
        price_12m: num(f.price_12m),
        price_18m: num(f.price_18m),
        price_24m: num(f.price_24m),
        price_on_request: f.price_on_request,
        photo_url: f.photo_url.trim() || null,
        active: f.active,
      })
      .eq("id", vehicle.id);

    if (dbError) {
      console.error(dbError);
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      setSaving(false);
      return;
    }
    router.push(
      vehicle.catalog_id
        ? `/admin/modellpaletten/${vehicle.catalog_id}`
        : "/admin/modellpaletten"
    );
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="m-brand">
            Marke
          </label>
          <input
            id="m-brand"
            type="text"
            value={f.brand}
            onChange={(e) => set("brand", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="m-model">
            Modell
          </label>
          <input
            id="m-model"
            type="text"
            value={f.model}
            onChange={(e) => set("model", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="m-segment">
            Segment
          </label>
          <input
            id="m-segment"
            type="text"
            value={f.segment}
            onChange={(e) => set("segment", e.target.value)}
            placeholder="z. B. Kompakt-SUV"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="m-drive">
            Antrieb
          </label>
          <input
            id="m-drive"
            type="text"
            value={f.drivetrain}
            onChange={(e) => set("drivetrain", e.target.value)}
            placeholder="z. B. Elektro"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="m-power">
            Leistung
          </label>
          <input
            id="m-power"
            type="text"
            value={f.power}
            onChange={(e) => set("power", e.target.value)}
            placeholder="z. B. 204 PS"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="m-length">
            Länge
          </label>
          <input
            id="m-length"
            type="text"
            value={f.length}
            onChange={(e) => set("length", e.target.value)}
            placeholder="z. B. 4,30 m"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="m-range">
            Reichweite oder Verbrauch
          </label>
          <input
            id="m-range"
            type="text"
            value={f.range_text}
            onChange={(e) => set("range_text", e.target.value)}
            placeholder="z. B. bis 605 km WLTP"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="m-seats">
            Sitzplätze
          </label>
          <input
            id="m-seats"
            type="text"
            inputMode="numeric"
            value={f.seats}
            onChange={(e) => set("seats", e.target.value)}
            placeholder="5"
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="m-high">
          Highlights <span className="hint">erscheint auf der Fahrzeugseite</span>
        </label>
        <textarea
          id="m-high"
          value={f.highlights}
          onChange={(e) => set("highlights", e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Service</label>
        <div className="choice-pills">
          {SERVICES.map((o) => (
            <button
              key={o.v}
              type="button"
              className={`pill ${f.service_type === o.v ? "pill-active" : ""}`}
              onClick={() => set("service_type", o.v)}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="m-list">
          Listenpreis des Herstellers{" "}
          <span className="hint">nur intern, wird nie öffentlich gezeigt</span>
        </label>
        <input
          id="m-list"
          type="text"
          inputMode="decimal"
          value={f.list_price}
          onChange={(e) => set("list_price", e.target.value)}
          placeholder="35990"
        />
        {vehicle.list_price !== null && (
          <p className="fine-print">
            Aus der Modellpalette übernommen: {formatEuro(vehicle.list_price)}
          </p>
        )}
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={f.price_on_request}
          onChange={(e) => set("price_on_request", e.target.checked)}
        />
        <span>
          Preis auf Anfrage – auf der Website wird keine Rate gezeigt
        </span>
      </label>

      <div className="field">
        <label className="field-label">
          Monatsraten in €
          {f.price_on_request && (
            <span className="hint">
              nur intern, wird auf der Website nicht angezeigt
            </span>
          )}
        </label>
        <div className="price-inputs">
          {(
            [
              ["price_6m", "6 Monate"],
              ["price_12m", "12 Monate"],
              ["price_18m", "18 Monate"],
              ["price_24m", "24 Monate"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="price-input">
              <span>{label}</span>
              <input
                type="text"
                inputMode="decimal"
                value={f[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder="–"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="m-photo">
          Foto <span className="hint">Link einfügen oder Bild hochladen</span>
        </label>
        <input
          id="m-photo"
          type="text"
          value={f.photo_url}
          onChange={(e) => set("photo_url", e.target.value)}
          placeholder="https://…"
        />
        <div className="photo-actions">
          <ImageUpload
            bucket="vehicle-photos"
            folder="modelle"
            returnPublicUrl
            label="Bild hochladen"
            onUploaded={(urls) => set("photo_url", urls[0] ?? "")}
          />
          {f.photo_url && (
            <button
              type="button"
              className="btn-text-danger"
              onClick={() => set("photo_url", "")}
            >
              Foto entfernen
            </button>
          )}
        </div>
        {f.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.photo_url} alt="Vorschau" className="photo-preview" />
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="m-notes">
          Interne Notiz <span className="hint">optional</span>
        </label>
        <textarea
          id="m-notes"
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={f.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        <span>Auf der Website sichtbar</span>
      </label>

      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Wird gespeichert …" : "Speichern"}
      </button>
    </form>
  );
}
